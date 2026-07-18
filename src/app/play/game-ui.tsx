// ============================================================================
// game-ui.tsx — HUD · 타이틀 · 게임오버 오버레이
//
// 순수한 "표현 컴포넌트": 받은 값을 그리기만 하고 게임 로직은 전혀 없다.
// 전체가 pointer-events-none — HTML이 터치를 삼키면 그 아래 캔버스가
// 조작 불능이 된다. 터치는 전부 캔버스로 통과시킨다 (§12).
// 정보는 HTML 텍스트로 전달 (스크린리더가 읽을 수 있게, §13).
// ============================================================================

import Link from "next/link";
import { COLORS } from "@/lib/constants";
import type { StoredPet } from "@/lib/storage";
import { Leaderboard } from "./leaderboard";

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
  pet,
}: GameUiState & { pet: StoredPet }) {
  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{
        // 노치·펀치홀 기기에서 HUD가 가려지지 않게 (§13)
        paddingTop: "env(safe-area-inset-top)",
      }}
    >
      {/* ---- HUD: 왼쪽 점수, 오른쪽 HOME + 하트 ---- */}
      <div className="flex items-start justify-between px-5 pt-3 text-3xl tracking-widest">
        <div>{score}</div>
        <div className="flex items-start gap-3">
          {/* 초기 화면(랜딩)으로 복귀 — 하트 옆. 이 링크만 pointer-events-auto이고
              HUD 침범 금지선(y < r+64, §6-1) 안이라 조이스틱 조작과 안 겹친다.
              페이지를 떠나면 useEffect 정리 함수가 rAF·오디오를 해제한다 (§12). */}
          <Link
            href="/"
            aria-label="처음 화면으로 돌아가기"
            className="pointer-events-auto mt-1 border-2 border-white/30 px-2 py-1 text-xs text-white/60 transition-colors hover:border-white/60 hover:text-white focus-visible:border-white"
          >
            HOME
          </Link>
          <div>
            {/* 장식용 하트 문자는 aria-hidden, 실제 정보는 sr-only 텍스트로 */}
            <span aria-hidden style={{ color: COLORS.heart }}>
              {"♥".repeat(hearts)}
              <span className="opacity-40">{"♡".repeat(Math.max(0, 3 - hearts))}</span>
            </span>
            <span className="sr-only">Hearts: {hearts}</span>
          </div>
        </div>
      </div>

      {/* ---- 타이틀 ---- */}
      {phase === "title" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 px-6 text-center leading-loose">
          <h1
            className="text-4xl md:text-6xl font-bold"
            style={{ color: COLORS.accent, textShadow: "4px 4px 0 #000" }}
          >
            SPACE JOOPS
          </h1>
          {/* 조작 안내 — 실제 조작은 "누른 곳이 조이스틱, 끌어서 추진" (§6-1).
              튜토리얼 없이 3초 안에 이해돼야 하므로 한 줄로 압축한다 (§1) */}
          <p className="text-xl md:text-2xl tracking-widest text-white">
            DRAG TO THRUST!<br/>EAT JUNK, AVOID SPIKES!
          </p>
          <p
            className="mt-8 animate-pulse text-2xl md:text-3xl"
            style={{ color: COLORS.accent }}
          >
            TAP TO START
          </p>
        </div>
      )}

      {/* ---- 게임오버 ---- */}
      {phase === "over" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/70 px-6 text-center leading-loose">
          <h2
            className="text-4xl md:text-5xl font-bold"
            style={{ color: COLORS.heart, textShadow: "4px 4px 0 #000" }}
          >
            GAME OVER
          </h2>
          {/* 이번 판의 주인공 — 펫 이름 (한글이라 font-pixel-ko, §11) */}
          <p className="font-pixel-ko text-sm text-gray-400">
            🛰 {pet.name}의 청소 일지
          </p>
          <p className="mt-3 text-3xl md:text-4xl text-white">SCORE: {score}</p>
          <p className="text-lg md:text-xl text-gray-300">EATEN: {eaten} JUNK</p>
          {newBest ? (
            <p className="text-xl md:text-2xl animate-bounce mt-2" style={{ color: COLORS.accent }}>
              🎉 NEW BEST!
            </p>
          ) : (
            <p className="text-sm md:text-lg text-gray-400 mt-2">BEST: {best}</p>
          )}
          {/* 온라인 리더보드 — env 미설정이면 컴포넌트가 스스로 사라진다 (§8-1) */}
          <Leaderboard score={score} eaten={eaten} pet={pet} />
          <p
            className="mt-6 animate-pulse text-2xl md:text-3xl"
            style={{ color: COLORS.accent }}
          >
            TAP TO RESTART
          </p>
        </div>
      )}
    </div>
  );
}
