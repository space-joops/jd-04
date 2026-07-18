"use client";

// ============================================================================
// install-button.tsx — "홈 화면에 추가" 버튼 (§13)
//
// 브라우저가 설치 가능 신호(beforeinstallprompt)를 주면 버튼을 보여주고,
// 클릭하면 설치 프롬프트를 띄운다. 설치 완료(appinstalled)나 미지원
// 브라우저에서는 버튼을 숨긴다.
//
// iOS 사파리는 beforeinstallprompt가 없다 — 대신 "공유 → 홈 화면에 추가"
// 경로를 짧은 안내 문구로 알려준다 (이미 설치된 standalone 실행 중엔 숨김).
// ============================================================================

import { useEffect, useState } from "react";
import { COLORS } from "@/lib/constants";

/** beforeinstallprompt는 아직 표준 타입에 없어 필요한 만큼만 선언한다. */
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
};

export function InstallButton() {
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault(); // 브라우저 기본 미니 배너 대신 우리 버튼으로
      setInstallEvent(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setInstallEvent(null); // 설치 끝 — 버튼 치우기
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    // iOS 판별: 설치 프롬프트가 없는 대신 수동 안내를 보여준다.
    // standalone(이미 홈 화면에서 실행 중)이면 안내도 필요 없다.
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator &&
        (navigator as { standalone?: boolean }).standalone === true);
    setIosHint(isIos && !isStandalone);

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installEvent) {
    return (
      <button
        onClick={() => void installEvent.prompt()}
        className="font-pixel-ko border-2 px-4 py-2 text-sm transition-colors hover:bg-white/10 focus-visible:bg-white/10"
        style={{ borderColor: COLORS.mascot, color: COLORS.mascot }}
      >
        📱 홈 화면에 추가
      </button>
    );
  }
  if (iosHint) {
    return (
      <p className="font-pixel-ko text-xs text-gray-400">
        📱 iOS: 공유 버튼 → &ldquo;홈 화면에 추가&rdquo;로 설치할 수 있어요
      </p>
    );
  }
  return null; // 미지원 브라우저·이미 설치됨 — 조용히 생략 (§12의 정신)
}
