// ============================================================================
// manifest.ts — 웹 앱 매니페스트 (Next 컨벤션: /manifest.webmanifest 자동 생성·링크)
//
// 이 파일이 있어야 브라우저가 "설치할 수 있는 앱"으로 인정한다:
// 홈 화면 추가 시 주소창 없는 전체화면으로 뜨고(§13 몰입감), 아이콘·이름·
// 배경색이 스플래시 화면에 쓰인다. 아이콘은 전부 코드로 생성 (pwa-icon.tsx).
// ============================================================================

import type { MetadataRoute } from "next";
import { COLORS } from "@/lib/constants";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SPACE JOOPS · 우주 냠냠!",
    short_name: "SPACE JOOPS",
    description:
      "하늘에서 떨어지는 우주쓰레기를 조이스틱으로 슝슝 받아먹는 레트로 픽셀 아케이드",
    start_url: "/",
    // 설치 후: 전체화면(미지원 브라우저는 standalone 폴백) + 세로 고정 — 게임 몰입감
    display: "standalone",
    display_override: ["fullscreen", "standalone"],
    orientation: "portrait",
    background_color: COLORS.space, // 스플래시 배경도 우주색
    theme_color: COLORS.space,
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      // 마스커블: 같은 아이콘 재사용 — 마스코트가 안전 영역(중앙)에 들어가게 그렸다
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
