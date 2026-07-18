// ============================================================================
// storage.ts — 최고 기록 저장 (localStorage)
//
// localStorage는 시크릿 모드·저장공간 부족·일부 웹뷰에서 예외를 던질 수 있다.
// 최고 기록은 "있으면 좋은" 부가 기능이지 게임의 필수 요소가 아니므로,
// 전부 try-catch로 감싸 실패해도 게임이 계속 굴러가게 한다 (§12).
// ============================================================================

/** 저장 키 — CLAUDE.md §8에 명세된 값. 바꾸면 기존 기록이 사라지니 주의. */
const BEST_KEY = "sjs-best";

/** 저장된 최고 기록을 읽는다. 없거나 실패하면 0. */
export function loadBest(): number {
  try {
    const raw = localStorage.getItem(BEST_KEY);
    const n = raw === null ? 0 : Number(raw);
    // 손으로 조작된 이상한 값(NaN, 음수)이 게임 UI를 깨지 않게 걸러 준다.
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
  } catch {
    return 0;
  }
}

/** 최고 기록을 저장한다. 실패해도 조용히 넘어간다. */
export function saveBest(score: number): void {
  try {
    localStorage.setItem(BEST_KEY, String(Math.floor(score)));
  } catch {
    // 저장 실패는 게임 진행에 영향을 주지 않는다.
  }
}

/** 리더보드 이니셜 저장 키 — 한 번 입력하면 다음 판부터 미리 채워 준다. */
const NAME_KEY = "sjs-name";

/** 저장된 이니셜을 읽는다. 없거나 실패하면 빈 문자열. */
export function loadName(): string {
  try {
    return localStorage.getItem(NAME_KEY) ?? "";
  } catch {
    return "";
  }
}

/** 이니셜을 저장한다. 실패해도 조용히 넘어간다. */
export function saveName(name: string): void {
  try {
    localStorage.setItem(NAME_KEY, name);
  } catch {
    // 저장 실패는 게임 진행에 영향을 주지 않는다.
  }
}

/** 스토리 인트로를 봤는지 저장하는 키 — 첫 방문에만 자동 재생 (§4). */
const INTRO_KEY = "sjs-intro";

/** 스토리 인트로를 이미 봤는가? 판단 불가(시크릿 모드 등)면 "봤다"로 —
 * 애매할 때 인트로를 강제로 또 트는 것보다 안 트는 쪽이 덜 성가시다. */
export function hasSeenIntro(): boolean {
  try {
    return localStorage.getItem(INTRO_KEY) !== null;
  } catch {
    return true;
  }
}

/** 스토리 인트로를 봤다고 기록한다. 실패해도 조용히 넘어간다. */
export function markIntroSeen(): void {
  try {
    localStorage.setItem(INTRO_KEY, "1");
  } catch {
    // 다음 방문에 인트로가 또 나올 뿐 — 게임엔 지장 없다.
  }
}
