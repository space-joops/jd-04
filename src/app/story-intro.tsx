"use client";

// ============================================================================
// story-intro.tsx — 첫 방문 스토리 인트로 (전체화면 스타워즈 크롤, §4)
//
// 왜 오버레이인가: 스토리를 랜딩 본문에 두면 버튼을 밀어내고(모바일 첫 화면),
// 푸터 아래에 두면 아무도 안 본다. 그래서 영화처럼 — 첫 방문에만 전체화면으로
// 한 번 틀어 주고(탭하면 스킵), 이후엔 푸터의 "스토리 다시보기"로만 연다.
//
// 봤는지 여부는 localStorage(sjs-intro, storage.ts)에 기록한다.
// 크롤은 1회 재생(forwards) — 애니메이션이 끝나면 스스로 닫힌다.
// ============================================================================

import { useCallback, useEffect, useState } from "react";
import { COLORS } from "@/lib/constants";
import { hasSeenIntro, markIntroSeen } from "@/lib/storage";
import { useT } from "./i18n-provider";
import { StoryScene } from "./story-scene";

export function StoryIntro() {
  const { t } = useT();
  const [open, setOpen] = useState(false);

  // 첫 방문 판단은 하이드레이션 이후에 — 서버는 localStorage를 모르므로
  // 초기 렌더를 "닫힘"으로 통일해야 서버/클라이언트 HTML이 어긋나지 않는다.
  useEffect(() => {
    if (!hasSeenIntro()) setOpen(true);
  }, []);

  const close = useCallback(() => {
    markIntroSeen();
    setOpen(false);
  }, []);

  // ESC로도 닫기 — 키보드 사용자를 위해 (§13 접근성)
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
      {/* 푸터의 "스토리 다시보기" — 인트로를 놓쳤거나 또 보고 싶은 사람용 */}
      <button
        onClick={() => setOpen(true)}
        className="font-pixel-ko text-xs text-gray-500 underline underline-offset-4 transition-colors hover:text-gray-300 focus-visible:text-gray-300"
      >
        {t("story.replay")}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={t("story.aria")}
          onClick={close}
          className="fixed inset-0 z-50 flex cursor-pointer flex-col"
          style={{ backgroundColor: COLORS.space }}
        >
          {/* 삽화 애니메이션 — 크롤 텍스트 뒤에 깔린다 (open마다 처음부터 재생) */}
          <StoryScene />

          {/* 크롤 무대 — 화면 전체. 애니메이션이 끝까지 가면 스스로 닫힌다.
              번역 문장은 언어마다 강조 위치가 달라 인라인 색을 빼고
              whitespace-pre-line으로 \n 줄바꿈만 살린다 (§2 i18n). */}
          <div className="starwars-stage relative z-10 h-full w-full">
            <div
              onAnimationEnd={close}
              className="starwars-crawl-once font-pixel-ko mx-auto flex h-full max-w-xl flex-col justify-end gap-14 whitespace-pre-line px-8 text-center text-lg leading-loose text-gray-200 md:text-2xl"
            >
              <p>{t("story.p1")}</p>
              <p>{t("story.p2")}</p>
              <p>{t("story.p3")}</p>
            </div>
          </div>

          {/* 스킵 안내 — 오버레이 어디를 탭해도 닫히지만, 길은 보여줘야 한다 */}
          <button
            onClick={close}
            className="font-pixel absolute bottom-8 left-1/2 -translate-x-1/2 animate-pulse text-sm"
            style={{
              color: COLORS.accent,
              paddingBottom: "env(safe-area-inset-bottom)",
            }}
          >
            TAP TO SKIP
          </button>
        </div>
      )}
    </>
  );
}
