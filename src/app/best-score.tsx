"use client";

// ============================================================================
// best-score.tsx — 랜딩 페이지의 최고 기록 표시 (§16에서 승격)
//
// useSyncExternalStore를 쓰는 이유: localStorage는 React 바깥의 "외부 저장소"다.
// - 서버 렌더링 시점엔 localStorage가 없으므로 서버 스냅샷은 0 —
//   React가 하이드레이션 후 클라이언트 값으로 스스로 바꿔 준다 (불일치 경고 없음).
// - storage 이벤트 구독: 다른 탭에서 게임을 해서 기록이 갱신되면
//   이 탭의 랜딩 숫자도 따라 바뀐다.
// ============================================================================

import { useSyncExternalStore } from "react";
import { COLORS } from "@/lib/constants";
import { loadBest } from "@/lib/storage";

/** storage 이벤트 구독 — 같은 키만 골라 듣지 않아도 loadBest가 걸러 준다. */
function subscribe(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

export function BestScore() {
  const best = useSyncExternalStore(subscribe, loadBest, () => 0);
  if (best <= 0) return null; // 아직 기록이 없으면 아무것도 안 보여준다
  return (
    <p className="text-sm md:text-base" style={{ color: COLORS.accent }}>
      ★ BEST: {best}
    </p>
  );
}
