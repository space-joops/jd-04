"use client";

// ============================================================================
// story-scene.tsx — 스토리 인트로 뒤에 깔리는 삽화 애니메이션 (§4)
//
// 크롤 텍스트가 흐르는 동안 이야기를 그림으로 거든다 — 3막 몽타주:
//   A막) 케슬러 신드롬: 파편이 하나에서 둘로 쪼개지며 쓰레기 구름이 불어난다
//   B막) 발사: 지상에서 키운 생체 위성(마스코트)이 분사 불꽃과 함께 솟아오른다
//   C막) 청소: 궤도에 오른 마스코트가 떨어지는 쓰레기를 받아먹는다
//
// 그림은 전부 기존 코드로 (에셋 0개 §11): 배경/별은 drawBackdrop, 쓰레기는
// drawJunk, 주인공은 drawMascot, 반짝임은 makeSparks/drawSpark. 텍스트 뒤라
// 은은하게(낮은 알파) 깔고, 막 사이는 알파로 크로스페이드한다.
// 게임 규칙(§12): 상태는 클로저 지역 변수, update/draw 분리, ×dt, rAF 해제.
// prefers-reduced-motion이면 정지 프레임 하나만.
// ============================================================================

import { useEffect, useRef } from "react";
import { fitCanvas } from "@/lib/canvas";
import { drawBackdrop } from "@/lib/backdrop";
import { drawMascot } from "@/lib/mascot";
import { type Junk, drawJunk } from "@/lib/debris";
import { type Spark, drawSpark, makeSparks, stepSpark } from "@/lib/effects";
import { COLORS, JUNK_COLORS, JUNK_FOOD_KINDS, type MascotVariantId } from "@/lib/constants";
import { loadSettings } from "@/lib/storage";

/** 막 경계(초). 총 길이는 크롤(20s)과 대략 맞춘다. */
const ACT_A_END = 7;
const ACT_B_END = 13;
const TOTAL = 20;
const FADE = 0.7; // 막 크로스페이드 시간(초)

/** drawJunk가 읽는 필드만 채운 가벼운 파편 하나. 물리는 여기서 직접 몬다. */
type Debris = Junk & { vx: number };

function makeDebris(x: number, y: number, vx: number, vy: number): Debris {
  const kind = JUNK_FOOD_KINDS[Math.floor(Math.random() * JUNK_FOOD_KINDS.length)];
  return {
    kind,
    x,
    x0: x,
    y,
    vx,
    vy,
    size: 13 + Math.random() * 6,
    sway: 0,
    swayT: 0,
    swaySpeed: 0,
    rot: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() * 2 - 1) * 1.6,
    eatT: -1,
  };
}

export function StoryScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let { w, h } = fitCanvas(canvas);
    const variant: MascotVariantId = loadSettings().character;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    // ---- 상태 ----
    let elapsed = 0;
    // A막: 파편 몇 개로 시작 → 쪼개지며 불어난다
    let debris: Debris[] = Array.from({ length: 4 }, () =>
      makeDebris(
        w * (0.3 + Math.random() * 0.4),
        h * (0.2 + Math.random() * 0.4),
        (Math.random() * 2 - 1) * 40,
        (Math.random() * 2 - 1) * 40,
      ),
    );
    let splitTimer = 1.1;
    // B/C막 마스코트
    const mascot = { x: w / 2, y: h * 0.95, r: 24 };
    let gazeX = 0;
    let gazeY = 0;
    // C막 낙하 쓰레기 + 스파크
    let falling: Debris[] = [];
    let fallTimer = 0;
    const sparks: Spark[] = [];

    /** 막별 알파 (경계에서 0.7초 크로스페이드). */
    const actAlpha = (start: number, end: number): number => {
      if (elapsed < start - FADE || elapsed > end + FADE) return 0;
      const up = Math.min(1, (elapsed - (start - FADE)) / FADE);
      const down = Math.min(1, (end + FADE - elapsed) / FADE);
      return Math.max(0, Math.min(up, down, 1));
    };

    const update = (dt: number) => {
      elapsed += dt;

      // A막 — 파편 이동(가장자리 반사) + 주기적 분열
      for (const d of debris) {
        d.x += d.vx * dt;
        d.y += d.vy * dt;
        d.x0 = d.x;
        d.rot += d.rotSpeed * dt;
        if (d.x < 20 || d.x > w - 20) d.vx *= -1;
        if (d.y < 20 || d.y > h * 0.7) d.vy *= -1;
      }
      if (elapsed < ACT_A_END) {
        splitTimer -= dt;
        if (splitTimer <= 0 && debris.length < 26) {
          splitTimer = 1.1;
          const src = debris[Math.floor(Math.random() * debris.length)];
          // 하나가 둘을 낳는다 — 반대 방향으로 튕겨 나가는 새 파편
          const ang = Math.random() * Math.PI * 2;
          const sp = 40 + Math.random() * 40;
          debris.push(makeDebris(src.x, src.y, Math.cos(ang) * sp, Math.sin(ang) * sp));
          src.vx = -Math.cos(ang) * sp;
          src.vy = -Math.sin(ang) * sp;
          sparks.push(...makeSparks(src.x, src.y, JUNK_COLORS[src.kind], 5));
        }
      }

      // B막 — 마스코트가 지상에서 궤도로 솟아오른다
      if (elapsed >= ACT_A_END - FADE) {
        const t = Math.min(1, Math.max(0, (elapsed - (ACT_A_END - FADE)) / (ACT_B_END - ACT_A_END)));
        const targetY = h * 0.95 - (h * 0.55) * t; // 아래→중앙 위
        mascot.y += (targetY - mascot.y) * Math.min(1, dt * 3);
        mascot.x = w / 2;
      }

      // C막 — 궤도 청소: 쓰레기 낙하 + 받아먹기
      if (elapsed >= ACT_B_END - FADE) {
        mascot.y = h * 0.4 + Math.sin(elapsed * 1.6) * 12;
        fallTimer -= dt;
        if (fallTimer <= 0) {
          fallTimer = 1.0;
          falling.push(makeDebris(w * (0.2 + Math.random() * 0.6), -30, 0, 60));
        }
        for (let i = falling.length - 1; i >= 0; i--) {
          const f = falling[i];
          f.y += f.vy * dt;
          f.x0 = f.x;
          f.rot += f.rotSpeed * dt;
          if (Math.hypot(f.x - mascot.x, f.y - mascot.y) < mascot.r + f.size * 0.7) {
            sparks.push(...makeSparks(f.x, f.y, JUNK_COLORS[f.kind], 6));
            falling.splice(i, 1);
          } else if (f.y > h + 40) {
            falling.splice(i, 1);
          }
        }
        // 시선: 가장 가까운 낙하물을 본다
        let best = Infinity;
        let tx = 0;
        let ty = -1;
        for (const f of falling) {
          const d = Math.hypot(f.x - mascot.x, f.y - mascot.y);
          if (d < best) {
            best = d;
            tx = (f.x - mascot.x) / (d || 1);
            ty = (f.y - mascot.y) / (d || 1);
          }
        }
        gazeX += (tx - gazeX) * Math.min(1, dt * 8);
        gazeY += (ty - gazeY) * Math.min(1, dt * 8);
      }

      for (let i = sparks.length - 1; i >= 0; i--) {
        stepSpark(sparks[i], dt);
        if (sparks[i].age >= sparks[i].life) sparks.splice(i, 1);
      }
    };

    const drawEarthHorizon = () => {
      // 발사대 지평선 — 배경 저궤도 지구와 같은 색 (§11)
      const gy = h - 18;
      ctx.save();
      ctx.fillStyle = COLORS.earth;
      ctx.fillRect(0, gy, w, 18);
      ctx.fillStyle = COLORS.land;
      for (let i = 0; i < 7; i++) {
        ctx.fillRect((i * 61) % w, gy + 4 + ((i * 7) % 6), 20 + (i % 3) * 8, 4);
      }
      ctx.restore();
    };

    const drawThrust = () => {
      // 분사 불꽃 — 마스코트 아래 깜빡이는 도트 (하늘→노랑→빨강)
      const fx = mascot.x;
      const fy = mascot.y + mascot.r;
      const len = 14 + Math.random() * 10;
      ctx.save();
      ctx.fillStyle = COLORS.accent;
      ctx.fillRect(fx - 3, fy, 6, len * 0.6);
      ctx.fillStyle = COLORS.danger;
      ctx.fillRect(fx - 2, fy + len * 0.5, 4, len * 0.5);
      ctx.restore();
    };

    const draw = () => {
      // 배경·별만 (지평선·달은 각 막이 직접 관리) — 텍스트 뒤라 이게 무대
      drawBackdrop(ctx, w, h, elapsed, 0, false, false);

      // A막: 파편 구름
      const aA = actAlpha(0, ACT_A_END);
      if (aA > 0) {
        ctx.save();
        ctx.globalAlpha *= aA * 0.6;
        for (const d of debris) drawJunk(ctx, d, 1);
        ctx.restore();
      }

      // B막: 발사
      const aB = actAlpha(ACT_A_END, ACT_B_END);
      if (aB > 0) {
        ctx.save();
        ctx.globalAlpha *= aB * 0.7;
        drawEarthHorizon();
        drawThrust();
        drawMascot(ctx, mascot.x, mascot.y, mascot.r, 1, { gazeX: 0, gazeY: -1, blink: false, mouthOpen: 0 }, variant);
        ctx.restore();
      }

      // C막: 청소
      const aC = actAlpha(ACT_B_END, TOTAL + 4);
      if (aC > 0) {
        ctx.save();
        ctx.globalAlpha *= aC * 0.7;
        for (const f of falling) drawJunk(ctx, f, 1);
        drawMascot(ctx, mascot.x, mascot.y, mascot.r, 1, { gazeX, gazeY, blink: false, mouthOpen: 1 }, variant);
        ctx.restore();
      }

      // 스파크는 막 무관하게 (은은하게)
      ctx.save();
      ctx.globalAlpha *= 0.7;
      for (const s of sparks) drawSpark(ctx, s);
      ctx.restore();
    };

    if (reduce) {
      // 움직임을 줄인 사용자: 대표 정지 프레임 하나 (파편 구름 + 마스코트)
      elapsed = ACT_B_END + 1;
      mascot.y = h * 0.4;
      draw();
      return;
    }

    let raf = 0;
    let lastT = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - lastT) / 1000);
      lastT = now;
      update(dt);
      draw();
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    const onResize = () => {
      ({ w, h } = fitCanvas(canvas));
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      debris = [];
      falling = [];
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
