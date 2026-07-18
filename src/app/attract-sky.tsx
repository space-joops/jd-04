"use client";

// ============================================================================
// attract-sky.tsx — 랜딩 페이지의 어트랙트 모드 배경 (§16에서 승격)
//
// 오락실 대기 화면처럼, 아무도 조작하지 않아도 마스코트가 혼자 돌아다니며
// 떨어지는 쓰레기를 받아먹는다. 게임 본체(joops-game)의 축소판이지만
// 점수·하트·소리·입력이 전부 없다 — 순수한 구경거리.
//
// 게임 본체와 같은 규칙을 지킨다 (§12): 상태는 클로저 지역 변수,
// update/draw 분리, ×dt 이동, 역순 순회 + splice, 정리 함수에서 해제.
// ============================================================================

import { useEffect, useRef } from "react";
import { fitCanvas } from "@/lib/canvas";
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
import { EAT_WORDS } from "@/lib/constants";

/** 어트랙트 모드 튜닝 — 타이틀 데모(§9)와 같은 값: 느긋하게, 가시 없이. */
const DEMO = {
  spawnInterval: 1.4, // 스폰 간격(초)
  speedScale: 0.6, // 낙하 속도 배율
  chaseSpeed: 1.6, // 마스코트가 먹이를 쫓는 감쇠 계수 — 굼뜬 게 귀엽다
  mascotR: 26, // 데모 마스코트 반지름 (게임 시작값보다 살짝 크게)
  eatAnimTime: 0.16, // "꿀꺽" 연출 시간 (§7과 동일)
  maxDt: 0.05, // dt 상한 (§12)
} as const;

export function AttractSky() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let { w, h } = fitCanvas(canvas);

    let junks: Junk[] = [];
    const popups: Popup[] = [];
    let elapsed = 0;
    let spawnTimer = 0;
    const mascot = { x: w / 2, y: h * 0.7 };

    // 생명력 연출 상태 (§6-3) — 게임 본체와 같은 구조의 미니 버전
    let gazeX = 0;
    let gazeY = 0;
    let mouthOpen = 0;
    let blinkIn = 3;
    let blinkLeft = 0;

    const update = (dt: number) => {
      elapsed += dt;

      // 스폰 — 가시 없음(allowHazard=false): 대기 화면에서 아픈 일은 없다 (§4)
      spawnTimer -= dt;
      if (spawnTimer <= 0) {
        junks.push(makeJunk(pickKind(0, false), w, DEMO.speedScale));
        spawnTimer = DEMO.spawnInterval;
      }

      // 가장 가까운 먹이 — 시선·입벌림·추적이 전부 이 하나를 본다
      let nearDist = Infinity;
      let nearX = 0;
      let nearY = 0;
      for (const j of junks) {
        if (j.eatT >= 0) continue;
        const d = Math.hypot(j.x - mascot.x, j.y - mascot.y);
        if (d < nearDist) {
          nearDist = d;
          nearX = j.x;
          nearY = j.y;
        }
      }
      const hasTarget = Number.isFinite(nearDist);

      // 마스코트: 좌우로만 먹이를 쫓고, 상하는 sin으로 둥둥 (§6-1 데모 규칙)
      if (hasTarget) {
        mascot.x += (nearX - mascot.x) * Math.min(1, dt * DEMO.chaseSpeed);
      }
      mascot.x = Math.max(DEMO.mascotR, Math.min(w - DEMO.mascotR, mascot.x));
      mascot.y = h * 0.7 + Math.sin(elapsed * 1.6) * 12;

      // 표정 (§6-3) — 게임 본체와 같은 수식
      const gtx = hasTarget ? (nearX - mascot.x) / (nearDist || 1) : 0;
      const gty = hasTarget ? (nearY - mascot.y) / (nearDist || 1) : 0;
      const ease = Math.min(1, dt * 8);
      gazeX += (gtx - gazeX) * ease;
      gazeY += (gty - gazeY) * ease;
      const wantOpen = hasTarget && nearDist < DEMO.mascotR + 120 ? 1 : 0;
      mouthOpen += (wantOpen - mouthOpen) * Math.min(1, dt * 10);
      if (blinkLeft > 0) {
        blinkLeft -= dt;
      } else {
        blinkIn -= dt;
        if (blinkIn <= 0) {
          blinkLeft = 0.13;
          blinkIn = 2.2 + Math.random() * 2.5;
        }
      }

      // 낙하물 — 역순 순회 + splice (§12)
      for (let i = junks.length - 1; i >= 0; i--) {
        const j = junks[i];
        if (j.eatT >= 0) {
          // "꿀꺽" — 게임 본체(§7)와 같은 연출
          j.eatT += dt;
          const suck = Math.min(1, dt * 18);
          j.x0 += (mascot.x - j.x0) * suck;
          j.x = j.x0;
          j.y += (mascot.y - j.y) * suck;
          j.rot += 25 * dt;
          if (j.eatT >= DEMO.eatAnimTime) junks.splice(i, 1);
          continue;
        }
        stepJunk(j, dt);
        // 닿으면 먹는다 — 판정은 게임과 동일한 0.65 배율 (§7)
        if (isFood(j)) {
          const d = Math.hypot(mascot.x - j.x, mascot.y - j.y);
          if (d < DEMO.mascotR + j.size * 0.65) {
            j.eatT = 0;
            popups.push(
              makePopup(
                EAT_WORDS[Math.floor(Math.random() * EAT_WORDS.length)],
                j.x,
                j.y,
              ),
            );
          }
        }
        if (j.y > h + 70) junks.splice(i, 1);
      }

      for (let i = popups.length - 1; i >= 0; i--) {
        const p = popups[i];
        stepPopup(p, dt);
        if (p.age >= p.life) popups.splice(i, 1);
      }
    };

    const draw = () => {
      drawBackdrop(ctx, w, h, elapsed); // t: 별 반짝임·달 잠꼬대의 시계 (§11)
      for (const j of junks) {
        const scale =
          j.eatT >= 0 ? Math.max(0, 1 - j.eatT / DEMO.eatAnimTime) : 1;
        drawJunk(ctx, j, scale);
      }
      drawMascot(ctx, mascot.x, mascot.y, DEMO.mascotR, 1, {
        gazeX,
        gazeY,
        blink: blinkLeft > 0,
        mouthOpen,
      });
      for (const p of popups) drawPopup(ctx, p);
    };

    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(DEMO.maxDt, (now - last) / 1000);
      last = now;
      update(dt);
      draw();
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    const onResize = () => {
      ({ w, h } = fitCanvas(canvas));
      junks = junks.filter((j) => j.x0 < w); // 좁아진 화면 밖 낙하물 정리
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      // 장식일 뿐이므로 스크린리더에서 숨기고, 터치도 콘텐츠로 통과시킨다
      aria-hidden
      className="pointer-events-none fixed inset-0 h-full w-full"
    />
  );
}
