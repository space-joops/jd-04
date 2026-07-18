// ============================================================================
// leaderboard.tsx — 게임오버 화면의 온라인 리더보드 (§8-1)
//
// v2: 이름 입력이 사라졌다 — 펫 이름은 첫 플레이 때 이미 지었으므로(pet-name.tsx)
// 게임오버가 되면 기록을 **자동으로 제출**하고, 두 개의 순위를 보여준다:
//   [단판 TOP 5]  이번 판 같은 "한 판 점수" 랭킹 (scores)
//   [누적 TOP 5]  펫이 통산 수거한 쓰레기 개수 랭킹 (pets.total_eaten)
//
// 게임오버 오버레이 안에서만 마운트된다 — phase가 "over"일 때 태어나고
// 재시작하면 언마운트된다. 그래서 "이번 판 제출했는지" 같은 상태를
// 리셋하는 코드가 필요 없다 (컴포넌트 수명 = 결과 화면 수명).
//
// 리더보드는 부가 기능: env 미설정이면 아예 그리지 않고, 조회·제출 실패는
// 조용히 생략한다 — 게임오버 화면의 나머지는 평소와 똑같다 (§12).
// ============================================================================

import { useEffect, useState } from "react";
import { COLORS } from "@/lib/constants";
import {
  fetchTopRuns,
  fetchTopTotals,
  leaderboardEnabled,
  submitResult,
  type RunRow,
  type TotalRow,
} from "@/lib/leaderboard";
import type { StoredPet } from "@/lib/storage";

type Props = {
  score: number;
  eaten: number;
  pet: StoredPet;
};

type Tab = "run" | "total";

export function Leaderboard({ score, eaten, pet }: Props) {
  const [tab, setTab] = useState<Tab>("run");
  // undefined = 불러오는 중, null = 실패(목록 숨김), 배열 = 표시
  const [runs, setRuns] = useState<RunRow[] | null | undefined>(undefined);
  const [totals, setTotals] = useState<TotalRow[] | null | undefined>(undefined);
  const [sendError, setSendError] = useState<"" | "fail" | "taken">("");

  useEffect(() => {
    let alive = true; // 재시작으로 언마운트된 뒤 도착한 응답이 setState 못 하게
    (async () => {
      // 1) 이번 판 기록 자동 제출 — 0점은 보낼 것이 없다.
      //    제출을 기다렸다가 조회해야 방금 판이 순위표에 반영돼 보인다.
      if (score > 0) {
        const status = await submitResult(pet, score, eaten);
        if (alive && status !== "ok") setSendError(status);
      }
      // 2) 단판·누적 순위를 같이 가져온다
      const [r, t] = await Promise.all([fetchTopRuns(), fetchTopTotals()]);
      if (alive) {
        setRuns(r);
        setTotals(t);
      }
    })();
    return () => {
      alive = false;
    };
  }, [pet, score, eaten]);

  if (!leaderboardEnabled) return null;

  const tabButton = (t: Tab, label: string) => (
    <button
      onClick={() => setTab(t)}
      className="border-2 px-3 py-1.5"
      style={
        tab === t
          ? { borderColor: COLORS.accent, color: COLORS.accent }
          : { borderColor: "rgba(255,255,255,0.25)", color: "rgba(255,255,255,0.5)" }
      }
    >
      {label}
    </button>
  );

  /** 순위 한 줄 — 내 펫이면 ★로 강조한다. */
  const row = (i: number, name: string, mine: boolean, value: string) => (
    <li key={i} className="flex justify-between gap-2">
      <span className={mine ? "text-white" : "text-gray-300"}>
        {i + 1} {name}
        {mine ? " ★" : ""}
      </span>
      <span className="text-white">{value}</span>
    </li>
  );

  const active = tab === "run" ? runs : totals;

  return (
    <div className="mt-4 flex w-full max-w-xs flex-col items-center gap-3 text-center">
      {/* 탭 — 단판/누적 전환. 버튼만 터치를 가진다 (나머지는 캔버스로 통과) */}
      <div className="pointer-events-auto font-pixel-ko flex gap-2 text-xs">
        {tabButton("run", "단판 TOP 5")}
        {tabButton("total", "누적 TOP 5")}
      </div>

      {active === undefined && (
        <p className="animate-pulse text-xs text-gray-400">LOADING...</p>
      )}
      {active !== undefined &&
        active !== null &&
        (active.length === 0 ? (
          <p className="font-pixel-ko text-xs text-gray-400">아직 기록이 없어요</p>
        ) : (
          <ol className="font-pixel-ko w-full text-xs leading-loose">
            {tab === "run"
              ? (runs as RunRow[]).map((r, i) =>
                  // 펫당 한 줄 (자기 최고 기록) — id로 내 펫을 강조 (§8-1)
                  row(i, r.name, r.id === pet.id, String(r.score)),
                )
              : (totals as TotalRow[]).map((r, i) =>
                  row(i, r.name, r.id === pet.id, `${r.total_eaten}개`),
                )}
          </ol>
        ))}

      {sendError === "fail" && (
        <p className="font-pixel-ko text-xs" style={{ color: COLORS.danger }}>
          기록 전송 실패 — 다음 판에 다시 시도해요
        </p>
      )}
      {sendError === "taken" && (
        // 오프라인으로 등록한 펫의 이름이 그새 선점된 희귀 사례 (§8-1)
        <p className="font-pixel-ko text-xs" style={{ color: COLORS.danger }}>
          이름이 이미 선점돼 기록을 못 보냈어요
        </p>
      )}
    </div>
  );
}
