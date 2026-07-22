// ============================================================================
// og/route.tsx — 언어별 동적 OG 이미지 (§13, §2 i18n)
//
// /og?lang=ja 처럼 부르면 그 언어의 태그라인으로 그린 프리뷰를 준다. 공유 버튼이
// 현재 언어로 이 URL을 넘길 수 있다. (크롤러가 자동으로 읽는 정본은 영어
// opengraph-image이고, 이건 "언어별로도 만들 수 있다"는 보너스 경로다.)
// ============================================================================

import { type Lang, getDict } from "@/lib/i18n";
import { renderOgImage } from "@/lib/og";

export function GET(request: Request): Response {
  const raw = new URL(request.url).searchParams.get("lang") ?? "en";
  // getDict는 미지원 코드를 영어로 폴백하므로 그대로 넘겨도 안전하다.
  const dict = getDict(raw as Lang);
  return renderOgImage("SPACE JOOPS", dict["share.text"]);
}
