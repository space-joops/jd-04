"use client";

// ============================================================================
// share-button.tsx — 공유하기 버튼 (§13)
//
// 모바일 크롬·사파리처럼 navigator.share가 있으면 OS 기본 공유 시트를 띄운다
// (카톡·메시지·트위터 등 선택). 없으면(대개 데스크톱) 링크를 클립보드에 복사
// 하고 "복사됐어요" 토스트로 대신한다 — install-button.tsx의 폴백과 같은 정신.
// 공유 문구는 현재 언어로(§2 i18n). 미지원·취소는 조용히 무시(§12).
// ============================================================================

import { useState } from "react";
import { COLORS } from "@/lib/constants";
import { useT } from "./i18n-provider";

export function ShareButton() {
  const { t } = useT();
  const [copied, setCopied] = useState(false);

  const onShare = async () => {
    const url = typeof window !== "undefined" ? window.location.origin : "";
    const data = { title: "SPACE JOOPS", text: t("share.text"), url };
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share(data);
        return;
      }
    } catch {
      // 사용자가 공유 시트를 닫은 것(AbortError) 등 — 조용히 무시
      return;
    }
    // 폴백: 링크 복사
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 클립보드도 안 되면 할 수 있는 게 없다 — 조용히 (§12)
    }
  };

  return (
    <button
      onClick={() => void onShare()}
      className="font-pixel-ko border-2 px-4 py-2 text-sm transition-colors hover:bg-white/10 focus-visible:bg-white/10"
      style={{ borderColor: COLORS.accent, color: COLORS.accent }}
    >
      {copied ? t("share.copied") : t("share.button")}
    </button>
  );
}
