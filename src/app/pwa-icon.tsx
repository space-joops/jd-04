// ============================================================================
// pwa-icon.tsx — 앱 아이콘을 코드로 생성 (에셋 파일 0개 원칙, §11)
//
// next/og의 ImageResponse는 JSX를 서버에서 PNG로 렌더링해 준다.
// mascot.ts의 픽셀 좌표를 그대로 div 사각형으로 옮겨 찍는다 — 캔버스의
// fillRect(x, y, w, h) 하나가 절대 위치 div 하나가 된다.
// mascot.ts의 도트를 바꾸면 여기도 함께 바꿔야 아이콘과 게임이 같은 얼굴이 된다.
// ============================================================================

import { ImageResponse } from "next/og";
import { COLORS } from "@/lib/constants";
import { MASCOT_CELLS as CELLS } from "@/lib/mascot-cells";

/**
 * size×size PNG 아이콘을 만든다.
 * 가상 픽셀 1칸 = size/16 — 마스코트(폭 8칸)가 아이콘의 가운데 절반만 차지해서,
 * 마스커블(둥근 마스크) 아이콘의 안전 영역 안에도 들어간다.
 */
export function pwaIcon(size: number): ImageResponse {
  const u = size / 16;
  const ox = size / 2; // 가로 중심
  const oy = size / 2 + u * 1.5; // 안테나(-7)~발(+4) 균형을 맞추는 세로 보정
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          backgroundColor: COLORS.space,
        }}
      >
        {CELLS.map(([x, y, w, h, color], i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: ox + x * u,
              top: oy + y * u,
              width: w * u,
              height: h * u,
              backgroundColor: color,
            }}
          />
        ))}
      </div>
    ),
    { width: size, height: size },
  );
}
