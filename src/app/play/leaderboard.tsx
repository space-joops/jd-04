// ============================================================================
// leaderboard.tsx — 게임오버 화면의 온라인 리더보드 (TOP 5 + 이니셜 등록)
//
// 게임오버 오버레이 안에서만 마운트된다 — phase가 "over"일 때 태어나고
// 재시작하면 언마운트된다. 그래서 "이번 판 등록했는지" 같은 상태를
// 리셋하는 코드가 필요 없다 (컴포넌트 수명 = 결과 화면 수명).
//
// 리더보드는 부가 기능: env 미설정이면 아예 그리지 않고, 조회 실패면
// 목록만 조용히 생략한다 — 게임오버 화면의 나머지는 평소와 똑같다 (§12).
// ============================================================================

import { useEffect, useState } from "react";
import { COLORS } from "@/lib/constants";
import {
  fetchTopScores,
  leaderboardEnabled,
  sanitizeName,
  submitScore,
  type ScoreRow,
} from "@/lib/leaderboard";
import { loadName, saveName } from "@/lib/storage";

type Props = {
  score: number;
  eaten: number;
};

/** 등록 버튼의 상태 기계 — 중복 제출 방지가 목적. */
type SubmitState = "idle" | "sending" | "done" | "fail";

export function Leaderboard({ score, eaten }: Props) {
  // undefined = 불러오는 중, null = 실패(목록 숨김), 배열 = 표시
  const [rows, setRows] = useState<ScoreRow[] | null | undefined>(undefined);
  // 이니셜은 lazy 초기화 — 이 컴포넌트는 게임오버 때만 브라우저에서 마운트되므로
  // localStorage를 읽어도 SSR과 충돌하지 않는다.
  const [name, setName] = useState(loadName);
  const [submit, setSubmit] = useState<SubmitState>("idle");

  useEffect(() => {
    let alive = true; // 재시작으로 언마운트된 뒤 도착한 응답이 setState 못 하게
    fetchTopScores().then((r) => {
      if (alive) setRows(r);
    });
    return () => {
      alive = false;
    };
  }, []);

  if (!leaderboardEnabled) return null;

  const onSubmit = async () => {
    const clean = sanitizeName(name);
    if (!clean || submit === "sending" || submit === "done") return;
    setSubmit("sending");
    saveName(clean); // 다음 판부터 미리 채워 주기
    const ok = await submitScore(clean, score, eaten);
    setSubmit(ok ? "done" : "fail");
    if (ok) setRows(await fetchTopScores()); // 내 점수가 반영된 목록으로 갱신
  };

  return (
    <div className="mt-4 flex w-full max-w-xs flex-col items-center gap-3 text-center">
      {/* ---- TOP 5 목록 — 읽기 전용이라 터치는 캔버스로 통과시킨다.
           조회 실패(null)면 제목까지 통째로 숨긴다 — 빈 제목만 남으면 고장처럼 보인다 ---- */}
      {rows !== null && (
        <>
          <p className="text-sm" style={{ color: COLORS.accent }}>
            - TOP 5 -
          </p>
          {rows === undefined ? (
            <p className="animate-pulse text-xs text-gray-400">LOADING...</p>
          ) : rows.length === 0 ? (
            <p className="text-xs text-gray-400">NO SCORES YET</p>
          ) : (
            <ol className="w-full text-xs leading-loose">
              {rows.map((r, i) => (
                <li key={i} className="flex justify-between gap-2">
                  <span className="text-gray-300">
                    {i + 1} {r.name.padEnd(3, "·")}
                  </span>
                  <span className="text-white">{r.score}</span>
                </li>
              ))}
            </ol>
          )}
        </>
      )}

      {/* ---- 이니셜 등록 — 여기만 pointer-events-auto: 입력·버튼을 누른 게
           캔버스 "탭해서 재시작"으로 새지 않게 오버레이가 이벤트를 가진다 ---- */}
      {score > 0 && submit !== "done" && (
        <div className="pointer-events-auto flex items-center gap-2">
          <input
            value={name}
            onChange={(e) => setName(sanitizeName(e.target.value))}
            placeholder="AAA"
            maxLength={3}
            autoCapitalize="characters"
            autoComplete="off"
            aria-label="Initials for the leaderboard"
            className="w-20 border-2 border-white/60 bg-black/40 px-2 py-1 text-center text-sm text-white outline-none focus-visible:border-white"
          />
          <button
            onClick={onSubmit}
            disabled={submit === "sending" || sanitizeName(name).length === 0}
            className="border-2 px-3 py-1 text-sm disabled:opacity-40"
            style={{ borderColor: COLORS.accent, color: COLORS.accent }}
          >
            {submit === "sending" ? "..." : "SEND"}
          </button>
        </div>
      )}
      {submit === "done" && (
        <p className="text-sm" style={{ color: COLORS.mascot }}>
          SCORE SENT!
        </p>
      )}
      {submit === "fail" && (
        <p className="text-xs" style={{ color: COLORS.danger }}>
          OFFLINE - TRY AGAIN
        </p>
      )}
    </div>
  );
}
