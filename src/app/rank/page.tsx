// ============================================================================
// rank/page.tsx — "/rank" 랭킹 페이지 껍데기 (§8-1)
//
// 게임오버 화면의 TOP 5는 결과 확인용 요약이고, 여기는 느긋하게 구경하는
// 전용 페이지 — 단판·누적 TOP 10을 한눈에 보여준다.
// 목록은 클라이언트 컴포넌트(RankBoards)가 그린다 (fetch + 내 펫 강조).
// ============================================================================

import type { Metadata } from "next";
import Link from "next/link";
import { COLORS } from "@/lib/constants";
import { RankBoards } from "./rank-boards";

export const metadata: Metadata = {
  title: "SPACE JOOPS · RANKING",
  description: "우주 청소부 순위표 — 단판 최고 기록과 통산 수거량",
};

export default function RankPage() {
  return (
    <main
      className="mx-auto flex min-h-dvh max-w-xl flex-col items-center gap-8 px-6 py-12 text-center"
      style={{ paddingTop: "max(3rem, env(safe-area-inset-top))" }}
    >
      <header className="flex flex-col items-center gap-3">
        <p className="font-pixel text-[10px] tracking-widest text-gray-400">
          ORBITAL CLEANUP RECORDS
        </p>
        <h1
          className="font-pixel text-3xl font-bold md:text-5xl"
          style={{ color: COLORS.accent, textShadow: "4px 4px 0 #000" }}
        >
          🏆 RANKING
        </h1>
      </header>

      <RankBoards />

      <div className="mt-auto flex flex-col items-center gap-4 pb-4">
        <Link
          href="/play?start=1"
          className="font-pixel animate-pulse border-4 px-6 py-3 text-lg focus-visible:animate-none"
          style={{
            color: COLORS.accent,
            borderColor: COLORS.accent,
            textShadow: "2px 2px 0 #000",
          }}
        >
          TAP TO START
        </Link>
        <Link
          href="/"
          className="font-pixel text-xs text-gray-400 underline underline-offset-4 hover:text-white focus-visible:text-white"
        >
          ← HOME
        </Link>
      </div>
    </main>
  );
}
