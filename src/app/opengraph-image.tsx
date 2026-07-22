// ============================================================================
// opengraph-image.tsx — 기본(영어) OG 소셜 프리뷰 (§13)
//
// 카카오톡·트위터·슬랙 등이 링크를 펼칠 때 보여주는 1200×630 미리보기 이미지.
// 크롤러는 페이지 URL의 이 이미지를 읽으므로 기본은 영어다(§2). 언어별 동적
// 이미지는 /og?lang=..(og/route.tsx)가 담당하고, 공유 버튼이 그 URL을 쓴다.
// ============================================================================

import { en } from "@/lib/i18n/dicts/en";
import { OG_SIZE, renderOgImage } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "SPACE JOOPS";

export default function OpengraphImage() {
  return renderOgImage("SPACE JOOPS", en["share.text"]);
}
