// ============================================================================
// leaderboard.ts — 온라인 리더보드 (Supabase REST 직접 호출)
//
// SDK(@supabase/supabase-js) 대신 fetch 두 개로 PostgREST API를 직접 부른다.
// 왜: 필요한 요청이 "TOP N 조회"와 "점수 등록" 둘뿐이라, 의존성을 하나 늘리는
// 것보다 HTTP 요청이 눈에 그대로 보이는 쪽이 학습용 저장소(§13)에 맞다.
//
// 리더보드는 부가 기능이다 — env 미설정·네트워크 끊김·서버 오류 어떤 경우에도
// 게임을 절대 막지 않는다 (§12). 그래서 모든 함수가 throw 대신
// null/false를 돌려주고, UI는 그걸 받아 조용히 숨는다.
// ============================================================================

/** 리더보드 항목 하나 — scores 테이블에서 공개해도 되는 컬럼만. */
export type ScoreRow = {
  name: string;
  score: number;
  eaten: number;
};

// NEXT_PUBLIC_ 접두사: Next.js가 빌드 시점에 값을 클라이언트 번들에 인라인해
// 주는 유일한 통로다 (접두사 없는 env는 브라우저에서 undefined).
// anon key는 공개되어도 되는 키다 — 쓰기 제한은 키가 아니라 DB의 RLS가 지킨다
// (supabase/schema.sql 참고).
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * env 두 개가 모두 설정돼 있을 때만 true.
 * false면 리더보드 UI가 통째로 렌더링되지 않는다 — Supabase 없이 클론만 받아도
 * 게임은 로컬 최고 기록(storage.ts)만으로 완전하게 돌아간다.
 */
export const leaderboardEnabled = Boolean(URL && KEY);

/** 게임오버 화면에 보여줄 순위 수 — 픽셀 폰트가 커서 5줄이 폰 화면의 한계다. */
export const TOP_LIMIT = 5;

/** 이니셜 규칙: 대문자·숫자 1~3글자 (아케이드 전통). DB check 제약과 동일. */
export function sanitizeName(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 3);
}

const ENDPOINT = `${URL}/rest/v1/scores`;
// apikey + Authorization 둘 다 필요 — PostgREST 게이트웨이의 요구 사항.
const HEADERS = {
  apikey: KEY ?? "",
  Authorization: `Bearer ${KEY}`,
  "Content-Type": "application/json",
};

/**
 * TOP N을 점수 내림차순으로 가져온다. 실패하면 null — 던지지 않는다.
 * 동점이면 먼저 등록한 쪽이 위 (order=score.desc,created_at.asc).
 */
export async function fetchTopScores(): Promise<ScoreRow[] | null> {
  if (!leaderboardEnabled) return null;
  try {
    const res = await fetch(
      `${ENDPOINT}?select=name,score,eaten` +
        `&order=score.desc,created_at.asc&limit=${TOP_LIMIT}`,
      { headers: HEADERS },
    );
    if (!res.ok) return null;
    const rows: unknown = await res.json();
    return Array.isArray(rows) ? (rows as ScoreRow[]) : null;
  } catch {
    return null; // 오프라인·CORS·타임아웃 — 어떤 실패든 조용히 (§12)
  }
}

/** 점수를 등록한다. 성공 여부만 돌려준다 — 실패해도 게임엔 아무 일도 없다. */
export async function submitScore(
  name: string,
  score: number,
  eaten: number,
): Promise<boolean> {
  if (!leaderboardEnabled) return false;
  const clean = sanitizeName(name);
  if (!clean || score <= 0) return false; // 빈 이름·0점은 보내지 않는다
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: HEADERS,
      // 정수로 내림 — DB check 제약(정수 범위)에 걸리지 않게
      body: JSON.stringify({
        name: clean,
        score: Math.floor(score),
        eaten: Math.floor(eaten),
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
