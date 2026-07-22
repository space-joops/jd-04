"use client";

// ============================================================================
// orbit-explainer.tsx — "궤도역학이 뭐야?" 쉽고 재미난 설명 모달 (§8-3 기능 5)
//
// story-intro.tsx와 같은 오버레이 패턴: 평소엔 작은 링크만, 누르면 전체화면
// 다이얼로그. 우리 톤(귀엽고 낙천적, §2)으로 궤도역학을 3장에 나눠 설명하고,
// 각 장에 미니 캔버스 픽셀 그림을 곁들인다(게임의 drawMascot·픽셀 지구 재사용,
// 에셋 0개 원칙 §11). 탭/ESC로 닫는다.
// ============================================================================

import { useCallback, useEffect, useRef, useState } from "react";
import { COLORS } from "@/lib/constants";
import { drawGlobeDisc } from "@/lib/globe";
import { drawMascot } from "@/lib/mascot";
import type { DictKey } from "@/lib/i18n";
import { useT } from "../i18n-provider";

/** 설명 3장 — 그림 함수 + 제목/본문 사전 키(§2 i18n). */
type Panel = {
  titleKey: DictKey;
  bodyKey: DictKey;
  draw: (ctx: CanvasRenderingContext2D, s: number) => void;
};

/** 미니 지구를 화면 아래쪽에 크게 깔고 그 위에 궤도 곡선/줍스를 얹는 헬퍼. */
function earthAt(ctx: CanvasRenderingContext2D, s: number, r: number) {
  ctx.save();
  ctx.translate(s / 2, s * 0.95);
  drawGlobeDisc(ctx, r);
  // 대륙 몇 조각
  ctx.fillStyle = COLORS.land;
  ctx.fillRect(-r * 0.4, -r * 0.5, 6, 5);
  ctx.fillRect(r * 0.1, -r * 0.2, 5, 6);
  ctx.fillRect(-r * 0.1, -r * 0.7, 4, 4);
  ctx.restore();
}

const PANELS: Panel[] = [
  {
    titleKey: "orbit.explainer.title1",
    bodyKey: "orbit.explainer.body1",
    draw: (ctx, s) => {
      const r = s * 0.42;
      earthAt(ctx, s, r);
      // 궤도 곡선 — 지구 위를 도는 점선 호
      ctx.fillStyle = COLORS.accent;
      const cxp = s / 2;
      const cyp = s * 0.95;
      for (let i = 0; i < 40; i++) {
        const a = Math.PI + (i / 39) * Math.PI;
        const rr = r + s * 0.16;
        ctx.fillRect(
          Math.round(cxp + Math.cos(a) * rr) - 1,
          Math.round(cyp + Math.sin(a) * rr) - 1,
          2,
          2,
        );
      }
      // 줍스 — 궤도 왼쪽 위
      drawMascot(ctx, s * 0.24, s * 0.34, s * 0.09, 1, {
        gazeX: 1,
        gazeY: 0,
        blink: false,
        mouthOpen: 1,
      });
    },
  },
  {
    titleKey: "orbit.explainer.title2",
    bodyKey: "orbit.explainer.body2",
    draw: (ctx, s) => {
      const r = s * 0.3;
      earthAt(ctx, s, r);
      const cxp = s / 2;
      const cyp = s * 0.95;
      // 낮은 궤도(빠름) + 높은 궤도(느림) 두 개
      for (const [rr, col] of [
        [r + s * 0.1, COLORS.accent],
        [r + s * 0.26, COLORS.mascot],
      ] as const) {
        ctx.fillStyle = col;
        for (let i = 0; i < 44; i++) {
          const a = (i / 44) * 2 * Math.PI;
          ctx.fillRect(
            Math.round(cxp + Math.cos(a) * rr) - 1,
            Math.round(cyp + Math.sin(a) * (rr * 0.62)) - 1,
            2,
            2,
          );
        }
      }
      drawMascot(ctx, cxp + r + s * 0.1, cyp - 2, s * 0.07, 1, {
        gazeX: 0,
        gazeY: 0,
        blink: false,
        mouthOpen: 0,
      });
    },
  },
  {
    titleKey: "orbit.explainer.title3",
    bodyKey: "orbit.explainer.body3",
    draw: (ctx, s) => {
      const r = s * 0.4;
      earthAt(ctx, s, r);
      // 서쪽으로 밀리는 물결 궤적 — S자 도트
      ctx.fillStyle = COLORS.accent;
      for (let i = 0; i < 46; i++) {
        const t = i / 45;
        const x = s * (0.9 - t * 0.8);
        const y = s * (0.3 + 0.16 * Math.sin(t * Math.PI * 3));
        ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, 2, 2);
      }
      // 자전 화살표 힌트
      ctx.fillStyle = COLORS.ink;
      ctx.globalAlpha *= 0.6;
      ctx.fillRect(s * 0.5, s * 0.9, s * 0.12, 2);
    },
  },
];

/** 미니 그림 캔버스 — 레티나 또렷하게 2배로 그린다 (bag-grid.tsx와 같은 원리). */
function PanelSprite({ draw }: { draw: Panel["draw"] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(2, 2);
    draw(ctx, 96);
    ctx.restore();
  }, [draw]);
  return <canvas ref={ref} width={192} height={192} aria-hidden className="h-24 w-24 shrink-0" />;
}

export function OrbitExplainer() {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="font-pixel-ko text-sm underline underline-offset-4 transition-colors hover:opacity-80 focus-visible:opacity-80"
        style={{ color: COLORS.accent }}
      >
        {t("orbit.explainerLink")}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={t("orbit.explainer.intro")}
          onClick={close}
          className="fixed inset-0 z-50 flex cursor-pointer flex-col overflow-y-auto"
          style={{ backgroundColor: COLORS.space }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="mx-auto flex min-h-dvh max-w-xl cursor-default flex-col items-center gap-6 px-6 py-12"
          >
            <h2
              className="font-pixel text-2xl md:text-3xl"
              style={{ color: COLORS.accent, textShadow: "3px 3px 0 #000" }}
            >
              ORBITAL MECHANICS
            </h2>
            <p className="font-pixel-ko text-center text-sm text-gray-300">
              {t("orbit.explainer.intro")}
            </p>

            {PANELS.map((panel) => (
              <div
                key={panel.titleKey}
                className="flex w-full items-center gap-4 border-2 border-white/15 bg-black/30 px-4 py-4 text-left"
              >
                <PanelSprite draw={panel.draw} />
                <div className="min-w-0 flex-1">
                  <p
                    className="font-pixel-ko mb-1 text-base"
                    style={{ color: COLORS.mascot }}
                  >
                    {t(panel.titleKey)}
                  </p>
                  <p className="font-pixel-ko text-sm leading-relaxed text-gray-200">
                    {t(panel.bodyKey)}
                  </p>
                </div>
              </div>
            ))}

            <button
              onClick={close}
              className="font-pixel mt-2 border-4 px-6 py-3 text-sm transition-transform focus-visible:scale-105"
              style={{
                color: COLORS.accent,
                borderColor: COLORS.accent,
                textShadow: "2px 2px 0 #000",
              }}
            >
              GOT IT!
            </button>
          </div>
        </div>
      )}
    </>
  );
}
