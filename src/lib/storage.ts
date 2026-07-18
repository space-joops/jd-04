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

// ----------------------------------------------------------------------------
// 등록된 펫 (§8-1) — 첫 플레이 때 지은 이름 + 경쟁 키(uuid)
// 이름은 표시용일 뿐, 리더보드의 경쟁 키는 uuid다 — 이름이 같은 두 펫이
// 서로의 누적 기록에 섞이면 안 된다.
// ----------------------------------------------------------------------------

const PET_KEY = "sjs-pet";

export type StoredPet = { id: string; name: string };

/** 등록된 펫을 읽는다. 없거나 깨졌으면 null — 이름 입력 화면으로 보낸다. */
export function loadPet(): StoredPet | null {
  try {
    const raw = localStorage.getItem(PET_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<StoredPet>;
    // 손으로 조작돼 깨진 값이 게임을 죽이지 않게 모양을 검사한다
    if (typeof p.id === "string" && p.id && typeof p.name === "string" && p.name) {
      return { id: p.id, name: p.name };
    }
    return null;
  } catch {
    return null;
  }
}

/** 펫을 저장한다. 실패해도 조용히 — 이번 세션 동안은 메모리의 펫으로 논다. */
export function savePet(pet: StoredPet): void {
  try {
    localStorage.setItem(PET_KEY, JSON.stringify(pet));
  } catch {
    // 저장 실패는 게임 진행에 영향을 주지 않는다.
  }
}

/** 새 펫의 경쟁 키(uuid v4)를 만든다. */
export function newPetId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    // 아주 옛 브라우저 폴백 — 형식만 uuid v4를 흉내 낸다 (DB uuid 컬럼 통과용)
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}

/** 음소거 설정 저장 키 (§10) — 한 번 끄면 다음 방문에도 꺼져 있어야 한다. */
const MUTED_KEY = "sjs-muted";

/** 음소거 상태를 읽는다. 없거나 실패하면 소리 켬. */
export function loadMuted(): boolean {
  try {
    return localStorage.getItem(MUTED_KEY) === "1";
  } catch {
    return false;
  }
}

/** 음소거 상태를 저장한다. 실패해도 조용히 넘어간다. */
export function saveMuted(muted: boolean): void {
  try {
    localStorage.setItem(MUTED_KEY, muted ? "1" : "0");
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
