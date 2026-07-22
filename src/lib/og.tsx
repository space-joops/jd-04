// ============================================================================
// og.tsx — 소셜 프리뷰(OG) 이미지 생성기 (§13)
//
// next/og ImageResponse로 1200×630 PNG를 코드로 그린다(에셋 0개 §11). 아이콘과
// 같은 마스코트 도트(mascot-cells)를 크게 확대하고, 타이틀·태그라인을 얹는다.
// 언어별로 태그라인만 바꿔 부르면 언어별 OG가 된다(§2 i18n).
//
// 픽셀 폰트는 외부에서 받아야 하는데, 실패하면 빌드가 흔들린다(§12). 그래서
// 폰트를 따로 싣지 않고 next/og 기본 폰트로 두되, 픽셀 정체성은 마스코트 도트가
// 담당한다 — 타이틀은 굵고 자간을 벌려 아케이드 간판 느낌만 낸다.
// ============================================================================

import { ImageResponse } from "next/og";
import { COLORS } from "./constants";
import { MASCOT_CELLS } from "./mascot-cells";

export const OG_SIZE = { width: 1200, height: 630 };

/** 제목·태그라인으로 OG 이미지를 그린다. */
export function renderOgImage(title: string, tagline: string): ImageResponse {
  const u = 40; // 가상 픽셀 1칸 = 40px → 마스코트 폭 8칸 = 320px
  const ox = 0;
  const oy = 0;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 40,
          backgroundColor: COLORS.space,
          color: COLORS.ink,
        }}
      >
        {/* 마스코트 — 도트를 절대 위치 div로 (아이콘과 같은 기법) */}
        <div style={{ position: "relative", display: "flex", width: 320, height: 300 }}>
          {MASCOT_CELLS.map(([x, y, w, h, color], i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: 160 + ox + x * u,
                top: 220 + oy + y * u,
                width: w * u,
                height: h * u,
                backgroundColor: color,
              }}
            />
          ))}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 96,
            fontWeight: 800,
            letterSpacing: 8,
            color: COLORS.accent,
          }}
        >
          {title}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 36,
            maxWidth: 900,
            textAlign: "center",
            color: COLORS.ink,
          }}
        >
          {tagline}
        </div>
      </div>
    ),
    OG_SIZE,
  );
}
