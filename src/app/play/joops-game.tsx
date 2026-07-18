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
import {
  COLORS,
  EAT_WORDS,
  HIT_WORDS,
  JUNK_COLORS,
  JUNK_FOOD_KINDS,
} from "@/lib/constants";
import { type SkyStage, drawBackdrop } from "@/lib/backdrop";
import { drawMascot } from "@/lib/mascot";
import {
  type Junk,
  drawJunk,
  isFood,
  makeJunk,
  pickKind,
  stepJunk,
} from "@/lib/debris";
import {
  type Popup,
  type Spark,
  drawPopup,
  drawSpark,
  makePopup,
  makeSparks,
  stepPopup,
  stepSpark,
} from "@/lib/effects";
import { vibrate } from "@/lib/haptics";
import {
  type StoredPet,
  addToInventory,
  loadBest,
  loadMuted,
  loadPet,
  saveBest,
  saveMuted,
  savePet,
} from "@/lib/storage";
import { PetNameGate } from "./pet-name";
import {
  disposeAudio,
  ensureAudio,
  playBlock,
  playCombo,
  playEat,
  playGameOver,
  playHit,
  playPowerup,
  playStar,
  setMuted,
} from "@/lib/sound";
import { GameUi, type GameUiState } from "./game-ui";

// ----------------------------------------------------------------------------
// TUNE — 손맛·판정·성장의 튜닝 상수 (숫자의 최종 원본, CLAUDE.md §15)
// 밸런스를 바꿀 때는 로직이 아니라 여기부터 만진다.
// ----------------------------------------------------------------------------
const TUNE = {
  hudClearance: 64, // 상단 HUD 영역 침범 금지선 (y < r + 이 값 불가)

  startR: 24, // 시작 반지름 (§6-2)
  maxR: 38, // 성장 상한 — 무한히 쉬워지지 않게
  growPerEat: 0.45, // 하나 먹을 때 커지는 양
  shrinkOnHit: 3, // 가시 맞으면 작아지는 양 ("아프면 살짝 작아진다")

  eatJudge: 0.65, // 획득 판정 배율 — 보이는 것보다 크게 (§7 황금률)
  hitJudge: 0.75, // 피격 판정 배율 — 보이는 것보다 작게

  // --- 생명력 연출 (§6-3) ---
  mouthRange: 120, // 입벌림 사정거리 — 먹이가 (r + 이 값) 안에 오면 입을 벌린다
  mouthJudgeBonus: 10, // 입 벌린 만큼 획득 판정 보너스(px) — 연출과 판정의 일치 (§7)
  blinkEvery: [2.2, 4.7], // 다음 깜빡임까지 간격(초) — 이 범위에서 랜덤
  blinkTime: 0.13, // 눈 감고 있는 시간
  magnetRange: 70, // 자석 발동 범위 (주인공 반지름 + 이 값)
  magnetPull: 80, // 자석 끌어당김 속도(px/s) — 눈치 못 챌 강도로
  eatAnimTime: 0.16, // "꿀꺽" 연출 시간 (§7)

  hearts: 3, // 시작 하트 (§8)
  invincibleTime: 1.4, // 피격 후 무적 — 없으면 하트가 연달아 증발한다
  blinkHz: 8, // 무적 중 초당 깜빡임 횟수

  // --- 콤보 배율 (§5-1) ---
  comboStep: 5, // 쓰레기 연속 몇 개마다 배율이 오르는가 (5, 10, 15…)
  comboMaxMult: 5, // 배율 상한 ×5 — 무한히 커지면 한 번의 실수가 너무 아프다

  // --- 파워업 (§5-2) ---
  powerupTime: 8, // 자석·슬로모 지속 시간(초)
  magnetBoost: 3, // 자석 강화 중 범위·당기는 힘 배율
  slowFactor: 0.45, // 슬로모 중 낙하물 시간 배율 — 주인공은 평소 속도라 강해진 기분
  shieldGrace: 0.8, // 방패로 막은 직후의 짧은 무적 — 같은 가시에 연타당하지 않게

  shakeTime: 0.35, // 피격 화면 흔들림 지속 (§10)
  shakeAmp: 7, // 흔들림 최대 진폭(px)

  restartDebounce: 0.6, // 게임오버 후 재시작 입력 무시 시간 (§4)
  demoSpeed: 0.6, // 타이틀 데모 낙하 속도 배율 (§9)
  demoInterval: 1.5, // 타이틀 데모 스폰 간격(초) — 지터 없음
  maxDt: 0.05, // dt 상한 — 백그라운드 탭 복귀 시 순간이동 방지 (§12)

  // --- 버추얼 조이스틱 & 추진 (§6-1) ---
  // 누른 지점이 조이스틱 원점이 되고, 끈 거리(기울기)에 따라 추진 3단계가 정해진다.
  joystickMaxRadius: 60, // 손잡이가 원점에서 벗어날 수 있는 최대 반경(px)
  maxFuel: 3000, // 연료 최대치 — 끝까지 기울이면 30초, 살살 쓰면 5분
  fuelRegen: 600, // 조이스틱을 놓고 있을 때의 초당 연료 회복량
  thrustSpeeds: [100, 250, 450], // 단계별 가속량(px/s²) — 기울기 약/중/강
  thrustCosts: [10, 40, 100], // 단계별 초당 연료 소모 — 세게 밀수록 기하급수로 비싸다
  friction: 1.2, // 우주 관성: 추진을 멈춰도 바로 서지 않고 지수 감쇠로 미끄러진다
  minSpeed: 30, // 최소 유지 속도(px/s) — 완전히 멈추지 않고 늘 둥둥 떠다니는 부유감
} as const;

type Phase = "title" | "playing" | "over";

/**
 * 펫 게이트 (§8-1): 등록된 펫이 없으면 이름 등록 화면을 먼저 보여주고,
 * 이름이 생긴 뒤에야 게임(GameCore)을 마운트한다. 게이트를 통과하면
 * GameCore의 자동 시작(?start=1)이 평소처럼 동작한다.
 */
export default function JoopsGame() {
  // undefined = 아직 localStorage를 못 읽음(첫 렌더 — SSR과 HTML을 맞추기 위해)
  const [pet, setPet] = useState<StoredPet | null | undefined>(undefined);
  useEffect(() => {
    setPet(loadPet());
  }, []);

  if (pet === undefined) {
    // 판정 전 한 프레임 — 우주색 빈 화면 (깜빡임 방지)
    return <div className="fixed inset-0" style={{ backgroundColor: COLORS.space }} />;
  }
  if (pet === null) {
    return (
      <PetNameGate
        onDone={(p) => {
          savePet(p);
          setPet(p);
        }}
      />
    );
  }
  return <GameCore pet={pet} />;
}

function GameCore({ pet }: { pet: StoredPet }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // React가 아는 유일한 게임 상태. HUD·오버레이가 이걸 그린다.
  const [ui, setUi] = useState<GameUiState>({
    phase: "title",
    score: 0,
    hearts: TUNE.hearts,
    eaten: 0,
    best: 0,
    newBest: false,
    combo: 1,
    paused: false,
  });

  // --- 소리 토글 (§10): 설정은 localStorage에 기억, 실제 음소거는 sound.ts ---
  // GameCore는 펫 게이트 통과 후 클라이언트에서만 마운트되므로
  // lazy 초기화로 localStorage를 읽어도 SSR과 어긋나지 않는다.
  const [soundOn, setSoundOn] = useState(() => {
    const m = loadMuted();
    setMuted(m);
    return !m;
  });
  const toggleSound = () => {
    setSoundOn((prev) => {
      const next = !prev;
      setMuted(!next);
      saveMuted(!next);
      return next;
    });
  };

  // --- 일시정지 (§4): 실제 상태는 게임 클로저 안 — ref로 토글 함수만 받는다 ---
  const pauseRef = useRef<(() => void) | null>(null);

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

    // --- 콤보 (§5-1): 쓰레기를 놓치지 않고 연속으로 먹은 개수 ---
    let combo = 0;
    /** 현재 점수 배율: 5개마다 ×2, ×3… 최대 ×5. */
    const comboMult = () =>
      Math.min(TUNE.comboMaxMult, 1 + Math.floor(combo / TUNE.comboStep));

    // --- 파워업 상태 (§5-2) ---
    let magnetT = 0; // 자석 강화 남은 시간
    let slowT = 0; // 시간 느려짐 남은 시간
    let shield = false; // 방패 보유 (시간제가 아니라 1회 방어)

    // --- 배경 고도 (§11): 점수가 오르면 저궤도 → 정지궤도 → 달 근처 ---
    let stage: SkyStage = 0;
    const skyStage = (): SkyStage => (score >= 500 ? 2 : score >= 200 ? 1 : 0);

    // --- 조이스틱 상태 ---
    // 원점(Ox,Oy)은 "누른 지점", 손잡이(Cx,Cy)는 "지금 손가락 위치".
    // 둘의 차이 벡터가 추진 방향·세기가 된다 (§6-1).
    let joyActive = false;
    let joyOx = 0;
    let joyOy = 0;
    let joyCx = 0;
    let joyCy = 0;
    let thrustLevel = 0; // 추진 단계 0~2 — 기울기(끈 거리)로 결정
    // number 명시: as const 리터럴 타입(3000)이 그대로 옮으면 재대입이 막힌다
    let fuel: number = TUNE.maxFuel;
    let vx = 0;
    let vy = 0;

    // 타입을 명시하는 이유: TUNE은 as const라 startR이 리터럴 타입(24)이 되는데,
    // 그대로 두면 r에 다른 숫자를 대입할 수 없게 된다.
    const mascot: { x: number; y: number; r: number } = {
      x: w / 2,
      y: h * 0.72,
      r: TUNE.startR,
    };
    let junks: Junk[] = [];
    const popups: Popup[] = [];
    const sparks: Spark[] = [];

    let elapsed = 0; // 누적 시간(초) — 둥둥 떠다니기·깜빡임의 시계
    let spawnTimer = 0; // 다음 스폰까지 남은 시간
    let invincible = 0; // 남은 무적 시간
    let shake = 0; // 남은 화면 흔들림 시간
    let overAt = 0; // 게임오버 시각 — 재시작 디바운스용
    let paused = false; // 일시정지 (§4) — update만 멈추고 draw는 계속

    // --- 생명력 연출 상태 (§6-3) — 모든 phase에서 돈다 (타이틀 데모도 살아있게) ---
    let gazeX = 0; // 시선 방향 (지수 감쇠로 부드럽게 — 눈알이 튀지 않게)
    let gazeY = 0;
    let mouthOpen = 0; // 입벌림 0~1 (판정 보너스 계산에도 쓰는 값)
    let blinkIn = 3; // 다음 깜빡임까지 남은 시간
    let blinkLeft = 0; // 눈 감고 있는 남은 시간

    /** React에 "지금 보여줄 값이 바뀌었어"라고 알린다. 바뀔 때만 부를 것. */
    const pushUi = () =>
      setUi({ phase, score, hearts, eaten, best, newBest, combo: comboMult(), paused });

    /** 일시정지 토글 (§4). 멈출 때 조이스틱도 놓는다 — 재개 순간 폭주 방지. */
    const setPaused = (p: boolean) => {
      if (paused === p || phase !== "playing") return;
      paused = p;
      if (p) joyActive = false;
      pushUi();
    };
    pauseRef.current = () => setPaused(!paused); // HUD ⏸ 버튼이 이걸 부른다

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
      paused = false;
      score = 0;
      eaten = 0;
      hearts = TUNE.hearts;
      newBest = false;
      combo = 0;
      magnetT = 0;
      slowT = 0;
      shield = false;
      stage = 0; // 새 판은 다시 저궤도부터
      mascot.r = TUNE.startR;
      vx = 0;
      vy = 0;
      fuel = TUNE.maxFuel;
      joyActive = false;
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

    /** 먹이 획득: 점수 + 성장 + "꿀꺽" + 팝업 + 스파크 + 소리 + 진동 (§10). */
    const eat = (j: Junk) => {
      j.eatT = 0; // 이제부터 update가 입으로 빨아들인다
      addToInventory(j.kind); // 로컬 도감에 +1 (§8-2) — 종류 불문, 먹으면 기록
      sparks.push(...makeSparks(j.x, j.y, JUNK_COLORS[j.kind], 7)); // 먹이색 7개
      vibrate(12); // 손끝에도 "냠" (§10) — 미지원 환경은 조용히 생략
      if (j.kind === "fuel") {
        fuel = Math.min(TUNE.maxFuel, fuel + 800);
        popups.push(makePopup("FUEL UP!", j.x, j.y, COLORS.mascot));
        playEat();
      } else if (j.kind === "star") {
        // 별 보너스 (§5): 하트가 닳아 있으면 점수 대신 하트 +1 —
        // 위기의 플레이어에게는 40점보다 하트 하나가 훨씬 절실하다.
        // 별은 콤보를 올리지도 끊지도 않지만, 점수엔 배율이 실린다 (§5-1).
        if (hearts < TUNE.hearts) {
          hearts += 1;
          popups.push(makePopup("+♥", j.x, j.y, COLORS.heart));
        } else {
          const gain = 40 * comboMult();
          score += gain;
          popups.push(makePopup(`+${gain}!`, j.x, j.y, COLORS.accent));
        }
        playStar();
      } else if (j.kind === "magnet") {
        // 자석 강화 (§5-2): 한동안 먹이가 훨씬 멀리서도 끌려온다
        magnetT = TUNE.powerupTime;
        popups.push(makePopup("MAGNET!", j.x, j.y, JUNK_COLORS.magnet));
        playPowerup();
      } else if (j.kind === "slowmo") {
        // 시간 느려짐 (§5-2): 낙하물만 느려진다 — 주인공은 평소 속도
        slowT = TUNE.powerupTime;
        popups.push(makePopup("SLOW-MO!", j.x, j.y, JUNK_COLORS.slowmo));
        playPowerup();
      } else if (j.kind === "shield") {
        // 방패 (§5-2): 다음 가시 한 방을 대신 맞아 준다 — 콤보 지킴이
        shield = true;
        popups.push(makePopup("SHIELD!", j.x, j.y, JUNK_COLORS.shield));
        playPowerup();
      } else {
        // 콤보 (§5-1): 쓰레기 연속 획득마다 +1, 5개마다 배율이 오른다
        const prevMult = comboMult();
        combo += 1;
        const mult = comboMult();
        if (mult > prevMult) {
          // 배율 상승의 순간 — 팝업 + 팡파레로 확실하게 축하 (§10)
          popups.push(
            makePopup(`COMBO x${mult}!`, mascot.x, mascot.y - mascot.r - 34, COLORS.accent),
          );
          playCombo();
        }
        score += 10 * mult;
        eaten += 1;
        mascot.r = Math.min(TUNE.maxR, mascot.r + TUNE.growPerEat);
        popups.push(
          makePopup(EAT_WORDS[Math.floor(Math.random() * EAT_WORDS.length)], j.x, j.y),
        );
        playEat();
      }

      // 배경 고도 상승 체크 (§11) — 점수는 eat에서만 오르므로 여기서 본다
      const next = skyStage();
      if (next > stage) {
        stage = next;
        popups.push(
          makePopup(next === 1 ? "GEO ORBIT!" : "MOON ZONE!", w / 2, h * 0.3, COLORS.accent),
        );
        playStar(); // 고도 도달은 별을 먹은 만큼의 경사
      }
      pushUi();
    };

    /** 가시 피격: 하트 -1 + 무적 + 흔들림 + 축소 + 팝업 + 스파크 + 소리 + 진동. */
    const hit = () => {
      hearts -= 1;
      combo = 0; // 아픈 날은 콤보도 끝 (§5-1)
      invincible = TUNE.invincibleTime;
      shake = TUNE.shakeTime;
      mascot.r = Math.max(TUNE.startR, mascot.r - TUNE.shrinkOnHit);
      sparks.push(...makeSparks(mascot.x, mascot.y, COLORS.danger, 10)); // 빨강 10개
      vibrate(90); // 아픈 일은 길게 — 먹기(12ms)와 확실히 구분 (§10)
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
      if (magnetT > 0) magnetT -= dt;
      if (slowT > 0) slowT -= dt;

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

      // --- 주인공 이동: 조이스틱 추진 + 우주 관성 (§6-1) ---
      if (phase === "playing") {
        if (joyActive && fuel > 0) {
          const dx = joyCx - joyOx;
          const dy = joyCy - joyOy;
          const dist = Math.hypot(dx, dy);

          // 5px 미만은 데드존 — 손떨림으로 연료가 새는 것 방지
          if (dist > 5) {
            // 기울기(끈 거리)를 3단계로 양자화 — 아날로그보다 "밟는 맛"이 분명하다
            if (dist < 25) thrustLevel = 0;
            else if (dist < 45) thrustLevel = 1;
            else thrustLevel = 2;

            const cost = TUNE.thrustCosts[thrustLevel] * dt;
            if (fuel >= cost) {
              fuel -= cost;
              // 속도에 "더한다"(가속) — 위치를 직접 옮기면 관성이 사라진다
              const speed = TUNE.thrustSpeeds[thrustLevel];
              vx += (dx / dist) * speed * dt;
              vy += (dy / dist) * speed * dt;
            } else {
              fuel = 0; // 잔량이 소모량보다 적으면 바닥 — 음수 방지
            }
          }
        } else {
          // 조이스틱을 놓고 있어야 연료가 찬다 — "쉬어 가는" 리듬을 만드는 장치
          fuel = Math.min(TUNE.maxFuel, fuel + TUNE.fuelRegen * dt);
        }

        // 지수 감쇠 마찰 — 진공이지만 게임적으로는 살짝 저항이 있어야 조작 가능
        vx -= vx * TUNE.friction * dt;
        vy -= vy * TUNE.friction * dt;

        // 최소 유지 속도 보정 — 완전히 멈추지 않고 항상 우주를 떠다니게
        const currentSpeed = Math.hypot(vx, vy);
        if (currentSpeed > 0 && currentSpeed < TUNE.minSpeed) {
          vx = (vx / currentSpeed) * TUNE.minSpeed;
          vy = (vy / currentSpeed) * TUNE.minSpeed;
        }

        mascot.x += vx * dt;
        mascot.y += vy * dt;

        // 화면 밖·HUD 영역 침범 금지 — 벽에 반발 계수 0.8로 튕긴다 (통통 튀는 손맛)
        if (mascot.x < mascot.r) { mascot.x = mascot.r; vx *= -0.8; }
        if (mascot.x > w - mascot.r) { mascot.x = w - mascot.r; vx *= -0.8; }
        if (mascot.y < mascot.r + TUNE.hudClearance) { mascot.y = mascot.r + TUNE.hudClearance; vy *= -0.8; }
        if (mascot.y > h - mascot.r) { mascot.y = h - mascot.r; vy *= -0.8; }
      } else {
        // 타이틀/게임오버: 화면 중앙 아래에서 sin 곡선으로 둥둥 (§6-1)
        mascot.x += (w / 2 - mascot.x) * Math.min(1, dt * 2);
        mascot.y = h * 0.72 + Math.sin(elapsed * 1.6) * 10;
      }

      // --- 생명력 연출 (§6-3): 시선·입벌림·깜빡임 ---
      // 가장 가까운 먹이 찾기 — 상태 계산이므로 draw가 아니라 update에서 (§12)
      let nearDist = Infinity;
      let nearX = 0;
      let nearY = 0;
      for (const j of junks) {
        if (!isFood(j) || j.eatT >= 0) continue; // 꿀꺽 중인 건 이미 입안
        const d = Math.hypot(j.x - mascot.x, j.y - mascot.y);
        if (d < nearDist) {
          nearDist = d;
          nearX = j.x;
          nearY = j.y;
        }
      }
      // 시선: 먹이 방향 단위 벡터를 지수 감쇠로 따라간다. 그리기 쪽에서
      // 픽셀 단위로 반올림하므로, 여기서 부드러워야 눈이 덜컥거리지 않는다.
      const hasTarget = Number.isFinite(nearDist);
      const gtx = hasTarget ? (nearX - mascot.x) / (nearDist || 1) : 0;
      const gty = hasTarget ? (nearY - mascot.y) / (nearDist || 1) : 0;
      const gazeEase = Math.min(1, dt * 8);
      gazeX += (gtx - gazeX) * gazeEase;
      gazeY += (gty - gazeY) * gazeEase;
      // 입벌림: 사정거리(r+120px) 안에 먹이가 있으면 벌린다. 벌린 만큼
      // 획득 판정도 커진다(아래 충돌 판정) — 연출과 판정의 일치 (§7)
      const wantOpen = hasTarget && nearDist < mascot.r + TUNE.mouthRange ? 1 : 0;
      mouthOpen += (wantOpen - mouthOpen) * Math.min(1, dt * 10);
      // 깜빡임: 2.2~4.7초마다 0.13초. 간격이 랜덤이어야 로봇 같지 않다.
      if (blinkLeft > 0) {
        blinkLeft -= dt;
      } else {
        blinkIn -= dt;
        if (blinkIn <= 0) {
          blinkLeft = TUNE.blinkTime;
          blinkIn =
            TUNE.blinkEvery[0] +
            Math.random() * (TUNE.blinkEvery[1] - TUNE.blinkEvery[0]);
        }
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

        // 슬로모 (§5-2): 낙하물의 시간만 느리게 흐른다
        stepJunk(j, slowT > 0 ? dt * TUNE.slowFactor : dt);

        // 자석 (§7): 먹이가 가까우면 슬쩍 끌려온다.
        // 자석 강화(§5-2) 중에는 범위·힘이 배로 — 이때만은 티가 나도 좋다.
        // 반드시 흔들림 중심축 x0를 옮긴다 — x는 매 프레임 재계산되는 파생값.
        if (phase === "playing" && isFood(j)) {
          const boost = magnetT > 0 ? TUNE.magnetBoost : 1;
          const dx = mascot.x - j.x;
          const dy = mascot.y - j.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 1 && dist < mascot.r + TUNE.magnetRange * boost) {
            const pull = (TUNE.magnetPull * boost * dt) / dist;
            j.x0 += dx * pull;
            j.y += dy * pull;
          }
        }

        // 충돌 판정은 playing에서만 (§4)
        if (phase === "playing") {
          const dist = Math.hypot(mascot.x - j.x, mascot.y - j.y);
          if (isFood(j)) {
            // 획득 판정은 후하게 — "아슬아슬하게 먹었다"로 느껴져야 (§7).
            // 입을 벌린 만큼 판정도 커진다 — 벌린 입에 들어가는 게 보이면
            // 판정도 그래야 억울하지 않다 (연출과 판정의 일치, §6-3)
            const bonus = TUNE.mouthJudgeBonus * mouthOpen;
            if (dist < mascot.r + j.size * TUNE.eatJudge + bonus) eat(j);
          } else if (invincible <= 0 && dist < mascot.r + j.size * TUNE.hitJudge) {
            junks.splice(i, 1); // 찌른 가시는 소멸 — 무적 끝나자마자 또 찌르는 억울함 방지
            if (shield) {
              // 방패가 대신 맞는다 (§5-2) — 하트도 콤보도 무사하다
              shield = false;
              invincible = TUNE.shieldGrace;
              popups.push(
                makePopup("BLOCKED!", mascot.x, mascot.y - mascot.r - 14, JUNK_COLORS.shield),
              );
              sparks.push(...makeSparks(mascot.x, mascot.y, JUNK_COLORS.shield, 7));
              playBlock();
              vibrate(30); // 피격(90ms)보다 짧게 — "막았다"는 다른 감각
            } else {
              hit();
            }
            continue;
          }
        }

        // 화면 밖 제거 — 배열이 무한히 쌓이면 성능이 샌다 (§13).
        // 놓친 먹이에 하트·점수 페널티는 없지만(캐주얼 지향, §5),
        // 쓰레기를 놓치면 콤보는 끊긴다 (§5-1 — "안 놓치고 먹으면"의 정의).
        // 별·연료·파워업은 보너스라 놓쳐도 콤보를 건드리지 않는다.
        if (j.y > h + 70) {
          if (
            phase === "playing" &&
            (JUNK_FOOD_KINDS as readonly string[]).includes(j.kind) &&
            combo > 0
          ) {
            combo = 0;
            pushUi(); // HUD의 xN 표시를 지운다
          }
          junks.splice(i, 1);
        }
      }

      // --- 팝업 글자 ---
      for (let i = popups.length - 1; i >= 0; i--) {
        const p = popups[i];
        stepPopup(p, dt);
        if (p.age >= p.life) popups.splice(i, 1);
      }

      // --- 스파크 입자 ---
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        stepSpark(s, dt);
        if (s.age >= s.life) sparks.splice(i, 1);
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

      // t: 별 반짝임·달 잠꼬대의 시계, stage: 점수 고도 (§11)
      drawBackdrop(ctx, w, h, elapsed, stage);

      // 슬로모 (§5-2): 화면 전체에 라벤더 기운 — 끝나기 1초 전부터 옅어진다
      if (slowT > 0) {
        ctx.save();
        ctx.globalAlpha *= 0.07 * Math.min(1, slowT);
        ctx.fillStyle = JUNK_COLORS.slowmo;
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
      }

      // 자석 강화 (§5-2): 커진 흡입 범위를 링으로 — 평소 자석은 몰래(§7),
      // 파워업만은 티를 내야 "지금 강하다"가 전달된다
      if (magnetT > 0 && phase === "playing") {
        ctx.save();
        ctx.globalAlpha *= 0.14 * Math.min(1, magnetT);
        ctx.strokeStyle = JUNK_COLORS.magnet;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(
          mascot.x,
          mascot.y,
          mascot.r + TUNE.magnetRange * TUNE.magnetBoost,
          0,
          Math.PI * 2,
        );
        ctx.stroke();
        ctx.restore();
      }

      for (const j of junks) {
        // "꿀꺽" 진행도만큼 축소 — 입으로 사라지는 연출
        const scale = j.eatT >= 0 ? Math.max(0, 1 - j.eatT / TUNE.eatAnimTime) : 1;
        drawJunk(ctx, j, scale);
      }

      // --- 추진 분사 불꽃 — "지금 연료를 태우고 있다"의 시각적 전달 ---
      if (joyActive && phase === "playing" && fuel > 0) {
        const dx = joyCx - joyOx;
        const dy = joyCy - joyOy;
        const dist = Math.hypot(dx, dy);
        if (dist > 5) {
          ctx.save();
          ctx.translate(mascot.x, mascot.y);
          ctx.rotate(Math.atan2(dy, dx)); // 이동 방향을 바라보게 회전

          // 단계가 셀수록 불꽃이 길고 넓다 — 연료 소모량을 몸으로 느끼게
          const flameLengths = [mascot.r * 1.5, mascot.r * 2.2, mascot.r * 3.5];
          const flameWidths = [mascot.r * 0.5, mascot.r * 0.8, mascot.r * 1.3];
          // 매 프레임 길이를 ±30% 흔든다 — 일정하면 스티커처럼 죽어 보인다
          const len = flameLengths[thrustLevel] * (0.7 + Math.random() * 0.6);
          const wid = flameWidths[thrustLevel];

          ctx.beginPath();
          ctx.moveTo(-mascot.r + 5, wid / 2);
          ctx.lineTo(-mascot.r - len, 0); // 꼬리(불꽃 끝)
          ctx.lineTo(-mascot.r + 5, -wid / 2);
          ctx.closePath();

          // 단계 색: 약(하늘)→중(노랑)→강(빨강) — 신호등처럼 직관적으로 (§11 팔레트)
          const thrustColors = [JUNK_COLORS.satellite, COLORS.accent, COLORS.danger];
          ctx.fillStyle = thrustColors[thrustLevel];
          ctx.globalAlpha *= 0.8;
          ctx.fill();
          ctx.restore();
        }
      }

      // 무적 중 초당 8회 반투명 깜빡임 — "지금은 안 맞아요"의 시각적 전달 (§8)
      const blinking =
        invincible > 0 && Math.floor(elapsed * TUNE.blinkHz * 2) % 2 === 1;
      drawMascot(ctx, mascot.x, mascot.y, mascot.r, blinking ? 0.3 : 1, {
        gazeX,
        gazeY,
        blink: blinkLeft > 0, // 눈 깜빡임 (§6-3) — 무적 투명 깜빡임과는 별개
        mouthOpen,
      });

      // 방패 (§5-2): 몸 주위를 도는 민트 도트 6개 — "한 방은 막아준다"
      if (shield) {
        ctx.save();
        ctx.fillStyle = JUNK_COLORS.shield;
        for (let k = 0; k < 6; k++) {
          const a = elapsed * 2.2 + (k * Math.PI) / 3;
          const px = mascot.x + Math.cos(a) * (mascot.r + 10);
          const py = mascot.y + Math.sin(a) * (mascot.r + 10);
          ctx.fillRect(Math.floor(px) - 2, Math.floor(py) - 2, 4, 4);
        }
        ctx.restore();
      }

      // 스파크는 마스코트 위, 팝업 글자 아래 — 글자 가독이 항상 우선 (§10)
      for (const s of sparks) drawSpark(ctx, s);
      for (const p of popups) drawPopup(ctx, p);

      // --- 버추얼 조이스틱 — 원점(큰 원)과 손잡이(작은 원) ---
      // 누르는 동안만 그린다: 고정 조이스틱보다 화면이 깨끗하고,
      // "아무 데나 눌러도 된다"는 것을 스스로 설명한다.
      if (joyActive && phase === "playing") {
        ctx.save();
        ctx.globalAlpha *= 0.2; // 배경 판은 연하게 — 게임 화면을 가리면 안 된다
        ctx.beginPath();
        ctx.arc(joyOx, joyOy, TUNE.joystickMaxRadius, 0, Math.PI * 2);
        ctx.fillStyle = "#fff";
        ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.globalAlpha *= 0.8;
        ctx.beginPath();
        ctx.arc(joyCx, joyCy, 15, 0, Math.PI * 2);
        // 손잡이 색 = 분사 불꽃과 같은 단계 색 — 연료가 없으면 회색으로 죽는다
        const thrustColors = [JUNK_COLORS.satellite, COLORS.accent, COLORS.danger];
        ctx.fillStyle = fuel > 0 ? thrustColors[thrustLevel] : "#555";
        ctx.fill();
        ctx.restore();
      }

      // --- 연료 게이지 — 상단 중앙, HUD 침범 금지선 바로 아래 ---
      if (phase === "playing") {
        ctx.save();
        const barW = 100;
        const barH = 8;
        const barX = w / 2 - barW / 2;
        const barY = TUNE.hudClearance - 15;

        ctx.fillStyle = "rgba(0,0,0,0.5)"; // 빈 칸 배경 — 잔량이 줄어든 게 보이게
        ctx.fillRect(barX, barY, barW, barH);

        // 20% 이하면 빨강 경고 — 숫자 없이 색만으로 "위험"을 전달
        ctx.fillStyle = fuel > (TUNE.maxFuel * 0.2) ? JUNK_COLORS.fuel : COLORS.danger;
        ctx.fillRect(barX, barY, barW * (fuel / TUNE.maxFuel), barH);

        ctx.strokeStyle = "rgba(255,255,255,0.8)";
        ctx.lineWidth = 2;
        ctx.strokeRect(barX, barY, barW, barH);

        // 파워업 남은 시간 미니바 (§5-2) — 연료 게이지 바로 아래, 버프 색 그대로
        let buffY = barY + barH + 4;
        for (const buff of [
          { t: magnetT, color: JUNK_COLORS.magnet },
          { t: slowT, color: JUNK_COLORS.slowmo },
        ]) {
          if (buff.t <= 0) continue;
          ctx.fillStyle = buff.color;
          ctx.fillRect(barX, buffY, barW * (buff.t / TUNE.powerupTime), 3);
          buffY += 5;
        }
        ctx.restore();
      }

      ctx.restore();
    };

    // ------------------------------------------------------------------
    // 자동 시작 (§4): 랜딩에서 TAP TO START를 이미 눌렀다면(?start=1)
    // 타이틀에서 또 탭하게 하지 않고 바로 게임을 시작한다.
    // 직접 /play로 들어온 경우엔 평소처럼 타이틀 데모를 보여준다.
    // 오디오는 여기서 깨우지 않는다 — 페이지가 바뀌면 제스처 맥락이 끊기므로,
    // 게임 중 첫 터치의 ensureAudio()가 깨운다 (§12 자동재생 정책).
    // ------------------------------------------------------------------
    if (new URLSearchParams(window.location.search).has("start")) start();

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
      if (!paused) update(dt); // 일시정지: 세계는 멈추고 화면은 남는다 (§4)
      draw();
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    // ------------------------------------------------------------------
    // 입력 (버추얼 조이스틱)
    // ------------------------------------------------------------------
    const onPointerDown = (e: PointerEvent) => {
      // 오디오는 반드시 사용자 제스처 안에서 깨운다 (브라우저 자동재생 정책, §12)
      ensureAudio();
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (phase === "title") {
        start();
      } else if (phase === "over") {
        // 죽는 순간 누르고 있던 손가락이 결과 화면을 스킵하는 사고 방지 (§4)
        if (elapsed - overAt >= TUNE.restartDebounce) {
          start();
        }
      } else {
        // 일시정지 중의 탭은 조작이 아니라 "재개" (§4)
        if (paused) {
          setPaused(false);
          return;
        }
        // 조이스틱 활성화
        joyOx = x;
        joyOy = y;
        joyCx = x;
        joyCy = y;
        joyActive = true;
      }
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (phase === "playing" && joyActive) {
        const rect = canvas.getBoundingClientRect();
        let cx = e.clientX - rect.left;
        let cy = e.clientY - rect.top;
        
        const dx = cx - joyOx;
        const dy = cy - joyOy;
        const dist = Math.hypot(dx, dy);
        
        // 반경 제한
        if (dist > TUNE.joystickMaxRadius) {
          cx = joyOx + (dx / dist) * TUNE.joystickMaxRadius;
          cy = joyOy + (dy / dist) * TUNE.joystickMaxRadius;
        }
        joyCx = cx;
        joyCy = cy;
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      joyActive = false;
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    };

    /** 길게 누르기/우클릭 메뉴가 게임을 끊지 않게 (§13). */
    const onContextMenu = (e: Event) => e.preventDefault();

    const onResize = () => {
      ({ w, h } = fitCanvas(canvas));
    };

    // 백그라운드로 가면 자동 일시정지 (§4) — 전화·알림에 억울하게 죽지 않게.
    // 복귀 시 자동 재개는 하지 않는다: 준비된 건 화면이지 사람이 아니다.
    const onVisibility = () => {
      if (document.hidden) setPaused(true);
    };
    document.addEventListener("visibilitychange", onVisibility);

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    canvas.addEventListener("contextmenu", onContextMenu);
    window.addEventListener("resize", onResize);

    // 정리: rAF·리스너·오디오를 전부 해제 (§12) — 안 하면 페이지를 떠나도
    // 유령 게임 루프가 계속 돈다.
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
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
      <GameUi
        {...ui}
        pet={pet}
        soundOn={soundOn}
        onToggleSound={toggleSound}
        onTogglePause={() => pauseRef.current?.()}
      />
    </div>
  );
}
