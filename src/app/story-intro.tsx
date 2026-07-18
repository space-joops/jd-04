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

export function StoryIntro() {
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
        📜 스토리 다시보기
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="게임 스토리 인트로"
          onClick={close}
          className="fixed inset-0 z-50 flex cursor-pointer flex-col"
          style={{ backgroundColor: COLORS.space }}
        >
          {/* 크롤 무대 — 화면 전체. 애니메이션이 끝까지 가면 스스로 닫힌다 */}
          <div className="starwars-stage h-full w-full">
            <div
              onAnimationEnd={close}
              className="starwars-crawl-once font-pixel-ko mx-auto flex h-full max-w-xl flex-col justify-end gap-14 px-8 text-center text-lg leading-loose text-gray-200 md:text-2xl"
            >
              <p>
                2031년, 걱정으로만 떠돌던
                <br />
                케슬러 신드롬이 진짜가 됐다.
                <br />
                파편이 파편을 부수고,
                <br />그 파편이 또 파편을 낳았다.
                <br />
                지구 저궤도는{" "}
                <b style={{ color: COLORS.accent }}>
                  8,000톤짜리 쓰레기 구름
                </b>
                이 됐다.
              </p>
              <p>
                인류의 대답은
                <br />더 큰 로켓도, 레이저도 아니었다.
                <br />
                <b style={{ color: COLORS.mascot }}>
                  우주쓰레기를 먹고 자라는 생체 위성
                </b>
                <br />
                지상에서 정성껏 키워,
                <br />
                하나씩 궤도로 올려 보냈다.
              </p>
              <p>
                30년이 지난 지금.
                <br />
                그중에서도 제일{" "}
                <b style={{ color: COLORS.mascot }}>입이 큰 아이</b>가
                <br />
                오늘도 저궤도로 출근한다.
                <br />
                <span className="text-2xl text-white md:text-3xl">
                  &ldquo;우주 냠냠!&rdquo;
                </span>
              </p>
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
