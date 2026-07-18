// ============================================================================
// leaderboard.ts — 온라인 리더보드 v2 (Supabase REST 직접 호출)
//
// SDK(@supabase/supabase-js) 대신 fetch로 PostgREST API를 직접 부른다.
// 왜: 요청이 "단판 TOP N"·"누적 TOP N"·"기록 제출" 셋뿐이라, 의존성을 늘리는
// 것보다 HTTP 요청이 눈에 그대로 보이는 쪽이 학습용 저장소(§13)에 맞다.
//
// 경쟁은 두 판이다 (§8-1):
// - 단판(run): scores 테이블 — 게임 한 판의 점수 랭킹.
// - 누적(total): pets 테이블 — 등록된 펫이 지금까지 수거한 쓰레기 총량 랭킹.
// 쓰기는 RPC 함수 submit_result 하나로만 — 누적 가산이 DB 안에서 원자적으로
// 처리되고, anon 키로는 테이블에 직접 쓸 수 없다 (supabase/schema.sql).
//
// 리더보드는 부가 기능이다 — env 미설정·네트워크 끊김·서버 오류 어떤 경우에도
// 게임을 절대 막지 않는다 (§12). 모든 함수가 throw 대신 null/false를 돌려준다.
// ============================================================================

import type { StoredPet } from "./storage";

/** 단판 랭킹 한 줄 — 펫당 하나뿐인 "자기 최고 기록". id는 내 펫 강조용. */
export type RunRow = {
  id: string;
  name: string;
  score: number;
};

/** 누적 랭킹 한 줄 — 펫의 통산 수거량. id는 "내 펫" 강조 표시에 쓴다. */
export type TotalRow = {
  id: string;
  name: string;
  total_eaten: number;
};

// NEXT_PUBLIC_ 접두사: Next.js가 빌드 시점에 값을 클라이언트 번들에 인라인해
// 주는 유일한 통로다. anon key는 공개되어도 되는 키 — 쓰기 제한은 키가 아니라
// DB의 RLS·RPC 검증이 지킨다 (supabase/schema.sql 참고).
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

/**
 * 펫 이름 규칙: 앞뒤 공백 제거, 연속 공백 하나로, 최대 10자.
 * 한글 환영 — 이름은 HTML(Galmuri 폰트)에만 그려지고 캔버스에는 안 나온다 (§2).
 * DB의 check 제약(1~10자)·RPC 검증과 같은 상한선.
 */
export function sanitizePetName(raw: string): string {
  return raw.replace(/\s+/g, " ").trim().slice(0, 10);
}

// apikey + Authorization 둘 다 필요 — PostgREST 게이트웨이의 요구 사항.
const HEADERS = {
  apikey: KEY ?? "",
  Authorization: `Bearer ${KEY}`,
  "Content-Type": "application/json",
};

/**
 * 단판 TOP N — **펫당 한 줄**: pets.best_score(자기 기록을 깰 때만 갱신)를
 * 읽으므로 같은 펫이 1·2등을 동시에 차지하는 일이 없다 (§8-1).
 * 동점이면 먼저 세운 기록(best_at)이 위. 실패하면 null.
 * @param limit 게임오버 화면은 기본 5줄, 랭킹 페이지(/rank)는 10줄을 쓴다
 */
export async function fetchTopRuns(
  limit: number = TOP_LIMIT,
): Promise<RunRow[] | null> {
  if (!leaderboardEnabled) return null;
  try {
    // score:best_score — PostgREST 컬럼 별칭: 응답 필드는 score로 온다
    const res = await fetch(
      `${URL}/rest/v1/pets?select=id,name,score:best_score&best_score=gt.0` +
        `&order=best_score.desc,best_at.asc.nullslast&limit=${limit}`,
      { headers: HEADERS },
    );
    if (!res.ok) return null;
    const rows: unknown = await res.json();
    return Array.isArray(rows) ? (rows as RunRow[]) : null;
  } catch {
    return null; // 오프라인·CORS·타임아웃 — 어떤 실패든 조용히 (§12)
  }
}

/** 누적 TOP N — 통산 수거량 내림차순. 실패하면 null. */
export async function fetchTopTotals(
  limit: number = TOP_LIMIT,
): Promise<TotalRow[] | null> {
  if (!leaderboardEnabled) return null;
  try {
    const res = await fetch(
      `${URL}/rest/v1/pets?select=id,name,total_eaten` +
        `&order=total_eaten.desc,updated_at.asc&limit=${limit}`,
      { headers: HEADERS },
    );
    if (!res.ok) return null;
    const rows: unknown = await res.json();
    return Array.isArray(rows) ? (rows as TotalRow[]) : null;
  } catch {
    return null;
  }
}

/** 펫 등록(이름 선점) 결과 — "taken"만 사용자에게 다른 이름을 요구한다. */
export type RegisterResult = "ok" | "taken" | "error";

/**
 * 펫을 등록해 이름을 선점한다 (RPC register_pet).
 * - "ok": 등록 완료 (이미 등록된 id도 멱등 통과)
 * - "taken": 이름이 이미 선점됨 (유니크 위반 → 409) — 다른 이름을 지어야 한다
 * - "error": 네트워크·서버 문제 — 게임을 막지 말고 다음 제출 때 다시 시도
 */
export async function registerPet(pet: StoredPet): Promise<RegisterResult> {
  if (!leaderboardEnabled) return "error";
  const clean = sanitizePetName(pet.name);
  if (!clean) return "error";
  try {
    const res = await fetch(`${URL}/rest/v1/rpc/register_pet`, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify({ p_id: pet.id, p_name: clean }),
    });
    if (res.ok) return "ok";
    if (res.status === 409) return "taken"; // unique_violation → PostgREST 409
    return "error";
  } catch {
    return "error";
  }
}

/** 기록 제출 결과 — "taken"은 오프라인 등록 펫의 이름이 그새 선점된 희귀 사례. */
export type SubmitStatus = "ok" | "taken" | "fail";

/**
 * 게임 한 판의 결과를 제출한다.
 * 등록부터 다시 확인한다(register_pet은 멱등) — 이름 입력 때 오프라인이라
 * 등록을 건너뛴 펫도 여기서 자기 치유된다. 그 다음 RPC submit_result가
 * 누적 가산과 단판 기록 insert를 원자적으로 처리한다.
 * 실패해도 게임엔 아무 일도 없다.
 */
export async function submitResult(
  pet: StoredPet,
  score: number,
  eaten: number,
): Promise<SubmitStatus> {
  if (!leaderboardEnabled) return "fail";
  if (score <= 0) return "fail"; // 0점은 보내지 않는다
  const reg = await registerPet(pet);
  if (reg === "taken") return "taken";
  // reg가 "error"여도 제출은 시도한다 — 이미 등록된 펫이면 성공한다
  try {
    const res = await fetch(`${URL}/rest/v1/rpc/submit_result`, {
      method: "POST",
      headers: HEADERS,
      // 정수로 내림 — RPC 검증(정수 범위)에 걸리지 않게
      body: JSON.stringify({
        p_id: pet.id,
        p_score: Math.floor(score),
        p_eaten: Math.floor(eaten),
      }),
    });
    return res.ok ? "ok" : "fail";
  } catch {
    return "fail";
  }
}
