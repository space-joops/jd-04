"use client";

// ============================================================================
// install-button.tsx — "앱 설치" 버튼 (§13)
//
// 누르면 곧장 설치되는 게 이상적이지만, 브라우저마다 사정이 다르다:
// - 안드로이드 크롬 등: beforeinstallprompt 이벤트 → prompt()로 바로 설치.
// - iOS 사파리: 설치 API가 없다 — "공유 → 홈 화면에 추가" 수동 안내.
// - iOS 인앱 브라우저(카카오톡·인스타 등): 설치 자체가 불가 —
//   사파리로 열어야 한다. x-safari- URL 스킴(iOS 17+)으로 이동을 시도하고,
//   안 되는 기기를 위해 링크 복사 버튼을 함께 준다.
// - 그 외: 브라우저 메뉴에서 설치하는 방법을 안내.
// 이미 설치돼 실행 중(standalone)이면 아무것도 보여주지 않는다.
// ============================================================================

import { useEffect, useState } from "react";
import { COLORS } from "@/lib/constants";

/** beforeinstallprompt는 아직 표준 타입에 없어 필요한 만큼만 선언한다. */
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
};

/** 설치 프롬프트가 없을 때, 환경별로 다른 안내를 고르기 위한 구분. */
type Env = "ios-safari" | "ios-inapp" | "other";

function detectEnv(): Env {
  const ua = navigator.userAgent;
  // iPadOS는 데스크톱 사파리인 척하므로 터치 지원 Mac도 iOS로 본다
  const isIos =
    /iphone|ipad|ipod/i.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (!isIos) return "other";
  // 인앱 브라우저·서드파티 브라우저 판별 — 이들에선 "홈 화면에 추가"가 없다
  const notSafari =
    /crios|fxios|edgios|kakaotalk|instagram|naver|line\/|fban|fbav|whale|daum/i.test(ua);
  return notSafari ? "ios-inapp" : "ios-safari";
}

export function InstallButton() {
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [hidden, setHidden] = useState(false); // standalone·설치 완료 → 통째로 숨김
  const [guideOpen, setGuideOpen] = useState(false);
  const [env, setEnv] = useState<Env>("other");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault(); // 브라우저 기본 미니 배너 대신 우리 버튼으로
      setInstallEvent(e as BeforeInstallPromptEvent);
      setGuideOpen(false); // 진짜 프롬프트가 생겼으면 수동 안내는 필요 없다
    };
    const onInstalled = () => setHidden(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    setEnv(detectEnv());
    // 이미 홈 화면에서 실행 중이면 설치 버튼 자체가 무의미
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator &&
        (navigator as { standalone?: boolean }).standalone === true);
    if (isStandalone) setHidden(true);

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (hidden) return null;

  const onClick = () => {
    if (installEvent) {
      void installEvent.prompt(); // 바로 설치되는 환경 — 안내 필요 없음
    } else {
      setGuideOpen((v) => !v); // 애플처럼 바로 안 되는 환경 — 안내 메시지
    }
  };

  /** 인앱 브라우저 → 사파리로 이동 시도. x-safari- 스킴은 iOS 17+에서 동작. */
  const openInSafari = () => {
    window.location.href = "x-safari-" + window.location.href;
  };

  /** 스킴이 안 먹는 기기용 폴백 — 주소를 복사해 사파리에 붙여넣게 한다. */
  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
    } catch {
      // 클립보드 미지원 — 조용히 생략 (§12의 정신)
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={onClick}
        className="font-pixel-ko border-2 px-4 py-2 text-sm transition-colors hover:bg-white/10 focus-visible:bg-white/10"
        style={{ borderColor: COLORS.mascot, color: COLORS.mascot }}
      >
        📱 앱 설치
      </button>

      {guideOpen && (
        <div className="font-pixel-ko flex max-w-xs flex-col gap-3 border-2 border-white/20 bg-black/60 px-4 py-3 text-xs leading-relaxed text-gray-200">
          {env === "ios-safari" && (
            <p>
              사파리 아래쪽 <b style={{ color: COLORS.accent }}>공유(⬆) 버튼</b>을
              누르고 <b style={{ color: COLORS.accent }}>&ldquo;홈 화면에 추가&rdquo;</b>를
              선택하면 앱으로 설치돼요!
            </p>
          )}
          {env === "ios-inapp" && (
            <>
              <p>
                지금 보고 있는 앱 안의 브라우저에서는 설치할 수 없어요.
                <br />
                <b style={{ color: COLORS.accent }}>사파리로 연 다음</b> 공유(⬆) →
                &ldquo;홈 화면에 추가&rdquo;를 눌러 주세요.
              </p>
              <div className="flex justify-center gap-2">
                <button
                  onClick={openInSafari}
                  className="border-2 px-3 py-1.5"
                  style={{ borderColor: COLORS.accent, color: COLORS.accent }}
                >
                  사파리로 열기
                </button>
                <button
                  onClick={() => void copyUrl()}
                  className="border-2 border-white/40 px-3 py-1.5 text-white/80"
                >
                  {copied ? "복사됐어요!" : "링크 복사"}
                </button>
              </div>
              <p className="text-gray-400">
                버튼이 안 되면 복사한 주소를 사파리에 붙여넣어 주세요.
              </p>
            </>
          )}
          {env === "other" && (
            <p>
              브라우저 메뉴(⋮)에서{" "}
              <b style={{ color: COLORS.accent }}>&ldquo;앱 설치&rdquo;</b> 또는
              &ldquo;홈 화면에 추가&rdquo;를 선택하면 설치돼요!
            </p>
          )}
        </div>
      )}
    </div>
  );
}
