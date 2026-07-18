"use client";

// ============================================================================
// joops-game.tsx — ★ 게임 본체
//
// 대원칙 (§12): "초당 60번 변하는 것은 캔버스에, 가끔 변하는 것만 React에."
// - 게임 상태(주인공 위치, 낙하물 배열…)는 전부 useEffect 클로저의 지역 변수.
// - React state는 `ui` 객체 하나뿐이고, 점수/하트/phase가 실제로 바뀔 때만
//   pushUi()로 알린다. 매 프레임 setState는 금지 — 60fps로 리렌더가 돌면
//   게임이 아니라 벤치마크가 된다.
// - update(dt)는 상태만 바꾸고, draw()는 읽기만 한다. 섞이는 순간 디버깅 지옥.
// ============================================================================

import { useEffect, useRef, useState } from "react";
import { fitCanvas } from "@/lib/canvas";
import { EAT_WORDS, HIT_WORDS, COLORS } from "@/lib/constants";
import { drawBackdrop } from "@/lib/backdrop";
import { drawMascot } from "@/lib/mascot";
import {
  type Junk,
  drawJunk,
  isFood,
  makeJunk,
  pickKind,
  stepJunk,
} from "@/lib/debris";
import { type Popup, drawPopup, makePopup, stepPopup } from "@/lib/effects";
import { loadBest, saveBest } from "@/lib/storage";
import {
  disposeAudio,
  ensureAudio,
  playEat,
  playGameOver,
  playHit,
} from "@/lib/sound";
import { GameUi, type GameUiState } from "./game-ui";

// ----------------------------------------------------------------------------
// TUNE — 손맛·판정·성장의 튜닝 상수 (숫자의 최종 원본, CLAUDE.md §15)
// 밸런스를 바꿀 때는 로직이 아니라 여기부터 만진다.
// ----------------------------------------------------------------------------
const TUNE = {
  followSpeed: 7, // 포인터 추적 감쇠 계수 — 클수록 즉각, 작을수록 미끄덩 (§6-1)
  touchOffsetY: 72, // 터치일 때 목표점을 위로 올리는 양 — 손가락이 캐릭터를 가리니까
  hudClearance: 64, // 상단 HUD 영역 침범 금지선 (y < r + 이 값 불가)

  startR: 24, // 시작 반지름 (§6-2)
  maxR: 38, // 성장 상한 — 무한히 쉬워지지 않게
  growPerEat: 0.45, // 하나 먹을 때 커지는 양
  shrinkOnHit: 3, // 가시 맞으면 작아지는 양 ("아프면 살짝 작아진다")

  eatJudge: 0.65, // 획득 판정 배율 — 보이는 것보다 크게 (§7 황금률)
  hitJudge: 0.75, // 피격 판정 배율 — 보이는 것(1.5)보다 작게
  magnetRange: 70, // 자석 발동 범위 (주인공 반지름 + 이 값)
  magnetPull: 80, // 자석 끌어당김 속도(px/s) — 눈치 못 챌 강도로
  eatAnimTime: 0.16, // "꿀꺽" 연출 시간 (§7)

  hearts: 3, // 시작 하트 (§8)
  invincibleTime: 1.4, // 피격 후 무적 — 없으면 하트가 연달아 증발한다
  blinkHz: 8, // 무적 중 초당 깜빡임 횟수

  shakeTime: 0.35, // 피격 화면 흔들림 지속 (§10)
  shakeAmp: 7, // 흔들림 최대 진폭(px)

  restartDebounce: 0.6, // 게임오버 후 재시작 입력 무시 시간 (§4)
  demoSpeed: 0.6, // 타이틀 데모 낙하 속도 배율 (§9)
  demoInterval: 1.5, // 타이틀 데모 스폰 간격(초) — 지터 없음
  maxDt: 0.05, // dt 상한 — 백그라운드 탭 복귀 시 순간이동 방지 (§12)
} as const;

type Phase = "title" | "playing" | "over";

export default function JoopsGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // React가 아는 유일한 게임 상태. HUD·오버레이가 이걸 그린다.
  const [ui, setUi] = useState<GameUiState>({
    phase: "title",
    score: 0,
    hearts: TUNE.hearts,
    eaten: 0,
    best: 0,
    newBest: false,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let { w, h } = fitCanvas(canvas);

    // ---- 게임 상태 (전부 클로저 지역 변수 — React는 모른다) ----
    let phase: Phase = "title";
    let score = 0;
    let eaten = 0;
    let hearts = TUNE.hearts;
    let best = loadBest();
    let newBest = false;

    // 타입을 명시하는 이유: TUNE은 as const라 startR이 리터럴 타입(24)이 되는데,
    // 그대로 두면 r에 다른 숫자를 대입할 수 없게 된다.
    const mascot: { x: number; y: number; r: number; tx: number; ty: number } = {
      x: w / 2,
      y: h * 0.72,
      r: TUNE.startR,
      tx: w / 2, // 목표점(포인터 위치)
      ty: h * 0.72,
    };
    let junks: Junk[] = [];
    const popups: Popup[] = [];

    let elapsed = 0; // 누적 시간(초) — 둥둥 떠다니기·깜빡임의 시계
    let spawnTimer = 0; // 다음 스폰까지 남은 시간
    let invincible = 0; // 남은 무적 시간
    let shake = 0; // 남은 화면 흔들림 시간
    let overAt = 0; // 게임오버 시각 — 재시작 디바운스용

    /** React에 "지금 보여줄 값이 바뀌었어"라고 알린다. 바뀔 때만 부를 것. */
    const pushUi = () => setUi({ phase, score, hearts, eaten, best, newBest });

    // ------------------------------------------------------------------
    // 사건들
    // ------------------------------------------------------------------

    /**
     * 새 판 시작. 떠 있던 먹이는 그대로 둬서 화면이 이어지게 하되,
     * 가시만은 치운다 — 재도전하자마자 이전 판의 가시에 찔리면 억울하다 (§7).
     */
    const start = () => {
      junks = junks.filter(isFood);
      phase = "playing";
      score = 0;
      eaten = 0;
      hearts = TUNE.hearts;
      newBest = false;
      mascot.r = TUNE.startR;
      mascot.tx = mascot.x;
      mascot.ty = mascot.y;
      invincible = 0;
      shake = 0;
      spawnTimer = 0;
      pushUi();
    };

    const gameOver = () => {
      phase = "over";
      overAt = elapsed;
      newBest = score > best;
      if (newBest) {
        best = score;
        saveBest(best);
      }
      playGameOver();
      pushUi();
    };

    /** 먹이 획득: 점수 + 성장 + "꿀꺽" 시작 + 팝업 + 소리 (§10 다중 피드백). */
    const eat = (j: Junk) => {
      j.eatT = 0; // 이제부터 update가 입으로 빨아들인다
      score += 10;
      eaten += 1;
      mascot.r = Math.min(TUNE.maxR, mascot.r + TUNE.growPerEat);
      popups.push(
        makePopup(EAT_WORDS[Math.floor(Math.random() * EAT_WORDS.length)], j.x, j.y),
      );
      playEat();
      pushUi();
    };

    /** 가시 피격: 하트 -1 + 무적 + 흔들림 + 축소 + 팝업 + 소리. */
    const hit = () => {
      hearts -= 1;
      invincible = TUNE.invincibleTime;
      shake = TUNE.shakeTime;
      mascot.r = Math.max(TUNE.startR, mascot.r - TUNE.shrinkOnHit);
      popups.push(
        makePopup(
          HIT_WORDS[Math.floor(Math.random() * HIT_WORDS.length)],
          mascot.x,
          mascot.y - mascot.r - 14,
          COLORS.danger,
        ),
      );
      playHit();
      if (hearts <= 0) gameOver();
      else pushUi();
    };

    /** 낙하물 하나 스폰 (§9). 데모(title)는 가시 없음 + 60% 속도. */
    const spawn = () => {
      const demo = phase === "title";
      const difficulty = Math.min(1, score / 400);
      const kind = pickKind(difficulty, !demo);
      const speedScale = (1 + difficulty * 1.1) * (demo ? TUNE.demoSpeed : 1);
      junks.push(makeJunk(kind, w, speedScale));
    };

    // ------------------------------------------------------------------
    // update — 상태만 바꾼다. 캔버스는 절대 건드리지 않는다.
    // ------------------------------------------------------------------
    const update = (dt: number) => {
      elapsed += dt;
      if (invincible > 0) invincible -= dt;
      if (shake > 0) shake -= dt;

      // --- 스폰 (over에서는 새로 안 뿌리고, 남은 것만 마저 떨어진다) ---
      if (phase !== "over") {
        spawnTimer -= dt;
        if (spawnTimer <= 0) {
          spawn();
          if (phase === "title") {
            spawnTimer = TUNE.demoInterval; // 데모는 느긋하게 일정 간격
          } else {
            // 점수 비례로 좁아지되 바닥 0.42초, ±30% 지터 — 리듬이 외워지면
            // 지루해지므로 불규칙성도 설계다 (§9)
            const base = Math.max(0.42, 1.05 - score / 900);
            spawnTimer = base * (0.7 + Math.random() * 0.6);
          }
        }
      }

      // --- 주인공 이동 ---
      if (phase === "playing") {
        // 지수 감쇠 추적: 남은 거리의 일부씩 다가간다 — "살짝 미끄러지는 손맛"
        const k = Math.min(1, dt * TUNE.followSpeed);
        mascot.x += (mascot.tx - mascot.x) * k;
        mascot.y += (mascot.ty - mascot.y) * k;
        // 화면 밖·HUD 영역 침범 금지 (§6-1)
        mascot.x = Math.max(mascot.r, Math.min(w - mascot.r, mascot.x));
        mascot.y = Math.max(
          mascot.r + TUNE.hudClearance,
          Math.min(h - mascot.r, mascot.y),
        );
      } else {
        // 타이틀/게임오버: 화면 중앙 아래에서 sin 곡선으로 둥둥 (§6-1)
        mascot.x += (w / 2 - mascot.x) * Math.min(1, dt * 2);
        mascot.y = h * 0.72 + Math.sin(elapsed * 1.6) * 10;
      }

      // --- 낙하물: 역순 순회 + splice (§12 — 정방향 순회 중 삭제는 건너뛰기 버그) ---
      for (let i = junks.length - 1; i >= 0; i--) {
        const j = junks[i];

        // "꿀꺽" 중: 입을 향해 빨려 들어가며 시간이 다 되면 소멸
        if (j.eatT >= 0) {
          j.eatT += dt;
          const suck = Math.min(1, dt * 18);
          j.x0 += (mascot.x - j.x0) * suck;
          j.x = j.x0;
          j.y += (mascot.y - j.y) * suck;
          j.rot += 25 * dt; // 고속 회전 (§7)
          if (j.eatT >= TUNE.eatAnimTime) junks.splice(i, 1);
          continue;
        }

        stepJunk(j, dt);

        // 자석 (§7): 먹이가 가까우면 슬쩍 끌려온다.
        // 반드시 흔들림 중심축 x0를 옮긴다 — x는 매 프레임 재계산되는 파생값.
        if (phase === "playing" && isFood(j)) {
          const dx = mascot.x - j.x;
          const dy = mascot.y - j.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 1 && dist < mascot.r + TUNE.magnetRange) {
            const pull = (TUNE.magnetPull * dt) / dist;
            j.x0 += dx * pull;
            j.y += dy * pull;
          }
        }

        // 충돌 판정은 playing에서만 (§4)
        if (phase === "playing") {
          const dist = Math.hypot(mascot.x - j.x, mascot.y - j.y);
          if (isFood(j)) {
            // 획득 판정은 후하게 — "아슬아슬하게 먹었다"로 느껴져야 (§7)
            if (dist < mascot.r + j.size * TUNE.eatJudge) eat(j);
          } else if (invincible <= 0 && dist < mascot.r + j.size * TUNE.hitJudge) {
            junks.splice(i, 1); // 찌른 가시는 소멸 — 무적 끝나자마자 또 찌르는 억울함 방지
            hit();
            continue;
          }
        }

        // 화면 밖 제거 — 배열이 무한히 쌓이면 성능이 샌다 (§13).
        // 놓친 먹이 페널티는 없다 (캐주얼 지향, §5).
        if (j.y > h + 70) junks.splice(i, 1);
      }

      // --- 팝업 글자 ---
      for (let i = popups.length - 1; i >= 0; i--) {
        const p = popups[i];
        stepPopup(p, dt);
        if (p.age >= p.life) popups.splice(i, 1);
      }
    };

    // ------------------------------------------------------------------
    // draw — 읽기만 한다. 상태는 절대 바꾸지 않는다.
    // ------------------------------------------------------------------
    const draw = () => {
      ctx.save();

      // 화면 흔들림: 개별 오브젝트가 아니라 좌표계 전체를 흔들고,
      // 남은 시간에 비례해 잦아든다 (§10)
      if (shake > 0) {
        const power = (shake / TUNE.shakeTime) * TUNE.shakeAmp;
        ctx.translate(
          (Math.random() * 2 - 1) * power,
          (Math.random() * 2 - 1) * power,
        );
      }

      drawBackdrop(ctx, w, h);

      for (const j of junks) {
        // "꿀꺽" 진행도만큼 축소 — 입으로 사라지는 연출
        const scale = j.eatT >= 0 ? Math.max(0, 1 - j.eatT / TUNE.eatAnimTime) : 1;
        drawJunk(ctx, j, scale);
      }

      // 무적 중 초당 8회 반투명 깜빡임 — "지금은 안 맞아요"의 시각적 전달 (§8)
      const blinking =
        invincible > 0 && Math.floor(elapsed * TUNE.blinkHz * 2) % 2 === 1;
      drawMascot(ctx, mascot.x, mascot.y, mascot.r, blinking ? 0.3 : 1);

      for (const p of popups) drawPopup(ctx, p);

      ctx.restore();
    };

    // ------------------------------------------------------------------
    // 게임 루프 (requestAnimationFrame)
    // ------------------------------------------------------------------
    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      // dt 상한: 백그라운드 탭에 다녀오면 dt가 수십 초가 되어
      // 낙하물이 화면을 뚫고 순간이동한다(터널링). 0.05초로 자른다 (§12).
      const dt = Math.min(TUNE.maxDt, (now - last) / 1000);
      last = now;
      update(dt);
      draw();
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    // ------------------------------------------------------------------
    // 입력 (포인터 하나가 조작의 전부 — §1)
    // ------------------------------------------------------------------
    const setTarget = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mascot.tx = e.clientX - rect.left;
      // 터치일 때만 위로 보정 — 손가락이 캐릭터를 가리면 안 되니까.
      // 마우스는 커서가 작으니 보정 없음 (§6-1).
      mascot.ty =
        e.clientY -
        rect.top -
        (e.pointerType === "touch" ? TUNE.touchOffsetY : 0);
    };

    const onPointerDown = (e: PointerEvent) => {
      // 오디오는 반드시 사용자 제스처 안에서 깨운다 (브라우저 자동재생 정책, §12)
      ensureAudio();
      if (phase === "title") {
        start();
        setTarget(e);
      } else if (phase === "over") {
        // 죽는 순간 누르고 있던 손가락이 결과 화면을 스킵하는 사고 방지 (§4)
        if (elapsed - overAt >= TUNE.restartDebounce) {
          start();
          setTarget(e);
        }
      } else {
        setTarget(e);
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (phase === "playing") setTarget(e);
    };

    /** 길게 누르기/우클릭 메뉴가 게임을 끊지 않게 (§13). */
    const onContextMenu = (e: Event) => e.preventDefault();

    const onResize = () => {
      ({ w, h } = fitCanvas(canvas));
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("contextmenu", onContextMenu);
    window.addEventListener("resize", onResize);

    // 정리: rAF·리스너·오디오를 전부 해제 (§12) — 안 하면 페이지를 떠나도
    // 유령 게임 루프가 계속 돈다.
    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("contextmenu", onContextMenu);
      window.removeEventListener("resize", onResize);
      disposeAudio();
    };
  }, []);

  return (
    <div className="fixed inset-0">
      {/* touch-none 필수: 없으면 드래그를 브라우저가 스크롤로 가로챈다 (§12) */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full touch-none"
        aria-label="스페이스 죽스 게임 화면"
      />
      <GameUi {...ui} />
    </div>
  );
}
