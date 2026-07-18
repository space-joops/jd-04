// ============================================================================
// game-ui.tsx — HUD · 타이틀 · 게임오버 오버레이
//
// 순수한 "표현 컴포넌트": 받은 값을 그리기만 하고 게임 로직은 전혀 없다.
// 전체가 pointer-events-none — HTML이 터치를 삼키면 그 아래 캔버스가
// 조작 불능이 된다. 터치는 전부 캔버스로 통과시킨다 (§12).
// 정보는 HTML 텍스트로 전달 (스크린리더가 읽을 수 있게, §13).
// ============================================================================

import { COLORS } from "@/lib/constants";

export type GameUiState = {
  phase: "title" | "playing" | "over";
  score: number;
  hearts: number;
  eaten: number;
  best: number;
  newBest: boolean;
};

export function GameUi({
  phase,
  score,
  hearts,
  eaten,
  best,
  newBest,
}: GameUiState) {
  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{
        // 노치·펀치홀 기기에서 HUD가 가려지지 않게 (§13)
        paddingTop: "env(safe-area-inset-top)",
      }}
    >
      {/* ---- HUD: 왼쪽 점수, 오른쪽 하트 ---- */}
      <div className="flex items-start justify-between px-5 pt-3 text-3xl">
        <div className="-rotate-2">{score}점</div>
        <div className="rotate-2">
          {/* 장식용 하트 문자는 aria-hidden, 실제 정보는 sr-only 텍스트로 */}
          <span aria-hidden style={{ color: COLORS.heart }}>
            {"♥".repeat(hearts)}
            <span className="opacity-40">{"♡".repeat(Math.max(0, 3 - hearts))}</span>
          </span>
          <span className="sr-only">남은 하트 {hearts}개</span>
        </div>
      </div>

      {/* ---- 타이틀 ---- */}
      {phase === "title" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
          <h1
            className="-rotate-2 text-6xl font-bold"
            style={{ color: COLORS.accent }}
          >
            SPACE JOOPS
          </h1>
          <p className="rotate-1 text-3xl">우주 냠냠!</p>
          <p className="mt-2 text-xl opacity-80">
            손가락으로 슥슥 움직여서 우주쓰레기를 냠냠!
            <br />
            빨갛고 뾰족한 애들은 살살 피하기!
          </p>
          <p
            className="mt-8 animate-pulse text-3xl"
            style={{ color: COLORS.accent }}
          >
            탭해서 시작!
          </p>
        </div>
      )}

      {/* ---- 게임오버 ---- */}
      {phase === "over" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/50 px-6 text-center">
          <h2
            className="-rotate-2 text-5xl font-bold"
            style={{ color: COLORS.heart }}
          >
            아이고 배야…
          </h2>
          <p className="mt-3 text-4xl">{score}점</p>
          <p className="text-xl opacity-80">우주쓰레기 {eaten}개 냠냠</p>
          {newBest ? (
            <p className="rotate-1 text-2xl" style={{ color: COLORS.accent }}>
              🎉 신기록!
            </p>
          ) : (
            <p className="text-lg opacity-70">최고 기록 {best}점</p>
          )}
          <p
            className="mt-8 animate-pulse text-3xl"
            style={{ color: COLORS.accent }}
          >
            탭해서 다시!
          </p>
        </div>
      )}
    </div>
  );
}
