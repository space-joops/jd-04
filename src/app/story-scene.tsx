"use client";

// ============================================================================
// story-scene.tsx — 스토리 인트로 뒤 시네마틱 삽화 몽타주 (§4)
//
// 참고 영상의 "느낌"을 에셋 없이(§11/§12) 코드로 재현한다 — 3막 우주 몽타주:
//   A막) 케슬러 신드롬: 파편이 하나에서 둘로 쪼개지며 붉게 번지는 쓰레기 구름
//   B막) 발사: 생체 위성(마스코트)이 밝은 분사 트레일과 속도선을 남기며 솟아오름
//   C막) 청소: 대기광 두른 지구 위를 유영하며 쓰레기를 받아먹는 잔잔한 마무리
//
// 시네마틱 장치(전부 픽셀 문법 §11): 2층 패럴랙스 별(원경/근경 드리프트),
// 막별 색보정 틴트, 카메라가 위로 따라가는 발사감, 계단식 블록 지구.
// 막 경계에서 사운드 큐를 얹는다(sound.ts, 파일 0개). 텍스트가 주인공이라
// 전체 알파는 낮게. rAF·리스너는 cleanup에서 해제. reduced-motion이면 정지 프레임.
// ============================================================================

import { useEffect, useRef } from "react";
import { fitCanvas } from "@/lib/canvas";
import { drawMascot } from "@/lib/mascot";
import { type Junk, drawJunk } from "@/lib/debris";
import { type Spark, drawSpark, makeSparks, stepSpark } from "@/lib/effects";
import { COLORS, JUNK_COLORS, JUNK_FOOD_KINDS, type MascotVariantId } from "@/lib/constants";
import { loadSettings } from "@/lib/storage";
import { playEat, playPowerup, playStar, playStoryRumble } from "@/lib/sound";

/** 막 경계(초). 총 길이는 크롤(globals.css sw-crawl 32s)과 맞춘다. */
const ACT_A_END = 11;
const ACT_B_END = 21;
const TOTAL = 32;
const FADE = 1.1; // 막 크로스페이드(초) — 영화처럼 느긋하게

/** drawJunk가 읽는 필드만 채운 가벼운 파편. 물리는 직접 몬다. */
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

/** 0~1 결정론적 해시 (backdrop.ts와 같은 공식) — 별자리를 고정한다. */
function hash(i: number): number {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
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
    let camY = 0; // 카메라 세로 오프셋(발사 때 위로 따라간다)
    const cueFired = { a: false, b: false, c: false };

    let debris: Debris[] = Array.from({ length: 5 }, () =>
      makeDebris(
        w * (0.25 + Math.random() * 0.5),
        h * (0.2 + Math.random() * 0.4),
        (Math.random() * 2 - 1) * 36,
        (Math.random() * 2 - 1) * 36,
      ),
    );
    let splitTimer = 1.2;
    const mascot = { x: w / 2, y: h * 1.05, r: 26 };
    let gazeX = 0;
    let gazeY = 0;
    let falling: Debris[] = [];
    let fallTimer = 0;
    const sparks: Spark[] = [];

    const actAlpha = (start: number, end: number): number => {
      if (elapsed < start - FADE || elapsed > end + FADE) return 0;
      const up = Math.min(1, (elapsed - (start - FADE)) / FADE);
      const down = Math.min(1, (end + FADE - elapsed) / FADE);
      return Math.max(0, Math.min(up, down, 1));
    };

    // ---- 그리기 헬퍼 ----
    /** 2층 패럴랙스 별 — 느리게 아래로 흐르며 "카메라가 뜨는" 느낌. */
    const drawStars = () => {
      for (let layer = 0; layer < 2; layer++) {
        const count = layer === 0 ? 40 : 22;
        const speed = layer === 0 ? 6 : 16; // 근경이 더 빨리 흐른다
        const sz = layer === 0 ? 2 : 3;
        ctx.save();
        ctx.fillStyle = COLORS.ink;
        for (let i = 0; i < count; i++) {
          const bx = Math.floor(hash(i * 2 + layer * 99) * w);
          const drift = (hash(i * 3 + layer * 7) * h + (elapsed * speed + camY * (layer + 1))) % (h + 40);
          const by = Math.floor(drift) - 20;
          const tw = 0.4 + 0.6 * Math.abs(Math.sin(elapsed * (0.6 + hash(i) * 1.4) + i));
          ctx.globalAlpha = (layer === 0 ? 0.35 : 0.6) * tw;
          ctx.fillRect(bx, by, sz, sz);
        }
        ctx.restore();
      }
    };

    /** 막별 색보정 — 전체를 은은한 색으로 덮는다(스크린 느낌). */
    const grade = (color: string, a: number) => {
      if (a <= 0) return;
      ctx.save();
      ctx.globalAlpha *= a;
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    };

    /** 계단식 블록 지구 — 화면 아래에 크게, 대기광 한 줄 (globe.ts 문법). */
    const drawBigEarth = (cx: number, cy: number, r: number) => {
      ctx.save();
      // 대기광 — 지구보다 살짝 큰 하늘색 링
      ctx.globalAlpha *= 0.25;
      ctx.fillStyle = JUNK_COLORS.satellite;
      for (let a = 0; a < Math.PI; a += 0.06) {
        const x = cx + Math.cos(Math.PI + a) * (r + 5);
        const y = cy - Math.sin(a) * (r + 5);
        ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, 3, 3);
      }
      ctx.restore();
      // 지구 본체 (행 스캔 블록)
      ctx.fillStyle = COLORS.earth;
      const rr = Math.round(r);
      for (let y = -rr; y <= 0; y++) {
        const half = Math.round(Math.sqrt(Math.max(0, rr * rr - y * y)));
        if (half > 0) ctx.fillRect(cx - half, cy + y, half * 2, 1);
      }
      // 대륙 얼룩
      ctx.fillStyle = COLORS.land;
      for (let i = 0; i < 9; i++) {
        const a = hash(i * 5 + 3) * Math.PI + Math.PI;
        const rad = hash(i * 5 + 4) * r * 0.8;
        const lx = cx + Math.cos(a) * rad;
        const ly = cy - Math.abs(Math.sin(a)) * rad;
        const s = 3 + Math.floor(hash(i * 5 + 5) * 3) * 2;
        ctx.fillRect(Math.round(lx - s / 2), Math.round(ly - s / 2), s, s);
      }
    };

    /** 분사 트레일 — 마스코트 아래로 길게, 하늘→노랑→빨강, 매 프레임 떨림. */
    const drawTrail = () => {
      const fx = mascot.x;
      const fy = mascot.y + mascot.r;
      const len = 40 + Math.random() * 24;
      ctx.save();
      ctx.globalAlpha *= 0.9;
      const grad = ctx.createLinearGradient(fx, fy, fx, fy + len);
      grad.addColorStop(0, COLORS.ink);
      grad.addColorStop(0.4, COLORS.accent);
      grad.addColorStop(1, COLORS.danger);
      ctx.fillStyle = grad;
      const wob = (Math.random() * 2 - 1) * 2;
      ctx.fillRect(fx - 3 + wob, fy, 6, len);
      ctx.restore();
    };

    // ---- 업데이트 ----
    const update = (dt: number) => {
      elapsed += dt;

      // A막 파편 이동 + 분열
      for (const d of debris) {
        d.x += d.vx * dt;
        d.y += d.vy * dt;
        d.x0 = d.x;
        d.rot += d.rotSpeed * dt;
        if (d.x < 20 || d.x > w - 20) d.vx *= -1;
        if (d.y < 20 || d.y > h * 0.72) d.vy *= -1;
      }
      if (elapsed < ACT_A_END && !reduce) {
        splitTimer -= dt;
        if (splitTimer <= 0 && debris.length < 30) {
          splitTimer = 1.0;
          const src = debris[Math.floor(Math.random() * debris.length)];
          const ang = Math.random() * Math.PI * 2;
          const sp = 36 + Math.random() * 40;
          debris.push(makeDebris(src.x, src.y, Math.cos(ang) * sp, Math.sin(ang) * sp));
          src.vx = -Math.cos(ang) * sp;
          src.vy = -Math.sin(ang) * sp;
          sparks.push(...makeSparks(src.x, src.y, COLORS.danger, 5));
        }
      }

      // B막 발사 — 마스코트 상승 + 카메라 팬업
      if (elapsed >= ACT_A_END - FADE) {
        const t = Math.min(1, Math.max(0, (elapsed - (ACT_A_END - FADE)) / (ACT_B_END - ACT_A_END)));
        const targetY = h * 1.05 - h * 0.65 * t;
        mascot.x = w / 2;
        mascot.y += (targetY - mascot.y) * Math.min(1, dt * 2.4);
        camY = t * 40; // 별이 더 빨리 흐르며 "따라 올라가는" 느낌
      }

      // C막 청소 — 유영 + 받아먹기
      if (elapsed >= ACT_B_END - FADE) {
        mascot.y = h * 0.4 + Math.sin(elapsed * 1.4) * 14;
        camY = 40;
        if (!reduce) {
          fallTimer -= dt;
          if (fallTimer <= 0) {
            fallTimer = 1.1;
            falling.push(makeDebris(w * (0.2 + Math.random() * 0.6), -30, 0, 55));
          }
        }
        for (let i = falling.length - 1; i >= 0; i--) {
          const f = falling[i];
          f.y += f.vy * dt;
          f.x0 = f.x;
          f.rot += f.rotSpeed * dt;
          if (Math.hypot(f.x - mascot.x, f.y - mascot.y) < mascot.r + f.size * 0.7) {
            sparks.push(...makeSparks(f.x, f.y, COLORS.accent, 7));
            falling.splice(i, 1);
            playEat(); // 잔잔한 "냠" (오디오 잠겨 있으면 조용히)
          } else if (f.y > h + 40) {
            falling.splice(i, 1);
          }
        }
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

      // 사운드 큐 — 막이 열리는 순간 한 번씩 (오디오 잠겨 있으면 조용히)
      if (!reduce) {
        if (!cueFired.a && elapsed > 0.3) {
          cueFired.a = true;
          playStoryRumble();
        }
        if (!cueFired.b && elapsed >= ACT_A_END) {
          cueFired.b = true;
          playPowerup();
        }
        if (!cueFired.c && elapsed >= ACT_B_END) {
          cueFired.c = true;
          playStar();
        }
      }

      for (let i = sparks.length - 1; i >= 0; i--) {
        stepSpark(sparks[i], dt);
        if (sparks[i].age >= sparks[i].life) sparks.splice(i, 1);
      }
    };

    // ---- 그리기 ----
    const draw = () => {
      ctx.fillStyle = COLORS.space;
      ctx.fillRect(0, 0, w, h);
      drawStars();

      const aA = actAlpha(0, ACT_A_END);
      const aB = actAlpha(ACT_A_END, ACT_B_END);
      const aC = actAlpha(ACT_B_END, TOTAL + 6);

      // A막: 파편 구름 + 붉은 경고 색보정
      if (aA > 0) {
        grade(COLORS.danger, aA * 0.1 * (0.6 + 0.4 * Math.sin(elapsed * 2)));
        ctx.save();
        ctx.globalAlpha *= aA * 0.6;
        for (const d of debris) drawJunk(ctx, d, 1);
        ctx.restore();
      }

      // B막: 발사 — 트레일 + 속도선 + 마스코트
      if (aB > 0) {
        grade(COLORS.accent, aB * 0.06);
        ctx.save();
        ctx.globalAlpha *= aB;
        // 속도선 — 위로 흐르는 짧은 흰 선
        ctx.fillStyle = COLORS.ink;
        for (let i = 0; i < 16; i++) {
          const sx = Math.floor(hash(i * 9 + 1) * w);
          const sy = (h - ((elapsed * 260 + hash(i * 4) * h) % (h + 30))) - 15;
          ctx.globalAlpha = aB * 0.25;
          ctx.fillRect(sx, sy, 2, 12);
        }
        ctx.restore();
        ctx.save();
        ctx.globalAlpha *= aB;
        drawTrail();
        drawMascot(ctx, mascot.x, mascot.y, mascot.r, 1, { gazeX: 0, gazeY: -1, blink: false, mouthOpen: 0 }, variant);
        ctx.restore();
      }

      // C막: 청소 — 대기광 지구 + 유영 + 반짝임 + 푸른 색보정
      if (aC > 0) {
        grade(COLORS.earth, aC * 0.08);
        ctx.save();
        ctx.globalAlpha *= aC;
        drawBigEarth(w / 2, h + h * 0.34, h * 0.42);
        ctx.restore();
        ctx.save();
        ctx.globalAlpha *= aC * 0.8;
        for (const f of falling) drawJunk(ctx, f, 1);
        drawMascot(ctx, mascot.x, mascot.y, mascot.r, 1, { gazeX, gazeY, blink: false, mouthOpen: 1 }, variant);
        ctx.restore();
      }

      ctx.save();
      ctx.globalAlpha *= 0.75;
      for (const s of sparks) drawSpark(ctx, s);
      ctx.restore();
    };

    if (reduce) {
      // 움직임 최소화: C막(궤도 청소) 정지 프레임 하나만
      elapsed = ACT_B_END + 1;
      mascot.y = h * 0.4;
      camY = 40;
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
