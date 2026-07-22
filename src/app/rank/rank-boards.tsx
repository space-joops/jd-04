"use client";

// ============================================================================
// rank-boards.tsx — 랭킹 페이지의 두 순위표 (단판·누적 TOP 10, §8-1)
//
// 게임오버의 leaderboard.tsx와 달리 기록 제출이 없다 — 순수하게 읽기만.
// 내 펫(localStorage의 sjs-pet)이 순위에 있으면 ★로 강조한다.
// 리더보드는 부가 기능 — env 미설정·조회 실패 시 안내 한 줄로 조용히 (§12).
// ============================================================================

import { useEffect, useState } from "react";
import { COLORS } from "@/lib/constants";
import {
  fetchTopRuns,
  fetchTopTotals,
  leaderboardEnabled,
  type RunRow,
  type TotalRow,
} from "@/lib/leaderboard";
import { type StoredPet, loadPet } from "@/lib/storage";
import { useT } from "../i18n-provider";

/** 전용 페이지는 게임오버 요약(5줄)보다 넉넉하게. */
const PAGE_LIMIT = 10;

export function RankBoards() {
  const { t } = useT();
  // undefined = 불러오는 중, null = 실패
  const [runs, setRuns] = useState<RunRow[] | null | undefined>(undefined);
  const [totals, setTotals] = useState<TotalRow[] | null | undefined>(undefined);
  const [pet, setPet] = useState<StoredPet | null>(null);

  useEffect(() => {
    let alive = true;
    setPet(loadPet()); // 하이드레이션 이후에 읽는다 — 서버는 localStorage를 모른다
    (async () => {
      const [r, t] = await Promise.all([
        fetchTopRuns(PAGE_LIMIT),
        fetchTopTotals(PAGE_LIMIT),
      ]);
      if (alive) {
        setRuns(r);
        setTotals(t);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (!leaderboardEnabled) {
    return (
      <p className="font-pixel-ko text-sm text-gray-400">{t("rank.offline")}</p>
    );
  }

  const board = (
    title: string,
    subtitle: string,
    rows: Array<{ name: string; value: string; mine: boolean }> | null | undefined,
  ) => (
    <section aria-label={title} className="w-full max-w-sm">
      <h2 className="font-pixel-ko text-lg" style={{ color: COLORS.accent }}>
        {title}
      </h2>
      <p className="font-pixel-ko mb-3 text-xs text-gray-400">{subtitle}</p>
      {rows === undefined ? (
        <p className="animate-pulse font-pixel text-xs text-gray-400">
          LOADING...
        </p>
      ) : rows === null ? (
        <p className="font-pixel-ko text-xs text-gray-400">{t("rank.loadFail")}</p>
      ) : rows.length === 0 ? (
        <p className="font-pixel-ko text-xs text-gray-400">{t("leaderboard.empty")}</p>
      ) : (
        <ol className="font-pixel-ko border-2 border-white/15 bg-black/30 px-4 py-3 text-sm leading-loose">
          {rows.map((r, i) => (
            <li key={i} className="flex justify-between gap-3">
              <span className={r.mine ? "text-white" : "text-gray-300"}>
                {i + 1 <= 3 ? ["🥇", "🥈", "🥉"][i] : `${i + 1}`} {r.name}
                {r.mine ? " ★" : ""}
              </span>
              <span className="text-white">{r.value}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );

  // 조회 상태(undefined/null)는 그대로 흘리고, 배열만 표시용 행으로 바꾼다
  const runRows =
    runs == null
      ? runs
      : runs.map((r) => ({
          name: r.name,
          value: String(r.score),
          // 펫당 한 줄 (자기 최고 기록) — id로 내 펫을 강조 (§8-1)
          mine: pet !== null && r.id === pet.id,
        }));
  const totalRows =
    totals == null
      ? totals
      : totals.map((r) => ({
          name: r.name,
          value: t("bag.unit", { n: r.total_eaten }),
          mine: pet !== null && r.id === pet.id,
        }));

  return (
    <div className="flex w-full flex-col items-center gap-8">
      {board(t("rank.runTitle"), t("rank.runSub"), runRows)}
      {board(t("rank.totalTitle"), t("rank.totalSub"), totalRows)}
    </div>
  );
}
