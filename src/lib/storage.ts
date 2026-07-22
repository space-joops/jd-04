// ============================================================================
// storage.ts — 최고 기록 저장 (localStorage)
//
// localStorage는 시크릿 모드·저장공간 부족·일부 웹뷰에서 예외를 던질 수 있다.
// 최고 기록은 "있으면 좋은" 부가 기능이지 게임의 필수 요소가 아니므로,
// 전부 try-catch로 감싸 실패해도 게임이 계속 굴러가게 한다 (§12).
// ============================================================================

import type { JunkKind, MascotVariantId } from "./constants";
import type { LangSetting } from "./i18n";

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

// ----------------------------------------------------------------------------
// 인벤토리 (§8-2) — 지금까지 먹은 아이템을 종류별로 세는 로컬 도감.
// 게임을 넘어 통산으로 쌓인다. 가시는 "먹는" 게 아니므로 안 들어온다.
// ----------------------------------------------------------------------------

const INVENTORY_KEY = "sjs-inventory";

/** 종류별 수집 개수. 아직 못 먹은 종류는 키 자체가 없다. */
export type Inventory = Partial<Record<JunkKind, number>>;

/** 인벤토리를 읽는다. 없거나 깨졌으면 빈 도감. */
export function loadInventory(): Inventory {
  try {
    const raw = localStorage.getItem(INVENTORY_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return {};
    // 손으로 조작된 이상한 값(NaN·음수·문자열)이 UI를 깨지 않게 걸러 준다
    const inv: Inventory = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v === "number" && Number.isFinite(v) && v > 0) {
        inv[k as JunkKind] = Math.floor(v);
      }
    }
    return inv;
  } catch {
    return {};
  }
}

/**
 * 방금 먹은 아이템을 도감에 +1 한다. 먹는 순간마다 바로 저장 —
 * 게임 도중 탭이 닫혀도 그때까지의 수집은 남는다. 실패하면 조용히 (§12).
 */
export function addToInventory(kind: JunkKind): void {
  try {
    const inv = loadInventory();
    inv[kind] = (inv[kind] ?? 0) + 1;
    localStorage.setItem(INVENTORY_KEY, JSON.stringify(inv));
  } catch {
    // 저장 실패는 게임 진행에 영향을 주지 않는다.
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

// ----------------------------------------------------------------------------
// 사용자 설정 (§8-4, /settings) — 위치·캐릭터·시간 형식.
// 위치(위/경도)는 달 위상의 반구와 궤도 모니터의 현지시간에, 캐릭터는 게임·
// 궤도의 마스코트에, 시간 형식은 궤도 시계 표시에 쓰인다.
// ----------------------------------------------------------------------------

const SETTINGS_KEY = "sjs-settings";

/** 시간 표시 형식 — UTC / 기기 현지 / 기지국(위치) 태양시. */
export type TimeFormat = "utc" | "device" | "home";

export type StoredSettings = {
  /** 기지국(집) 위도 -90~90. 미설정이면 null. */
  lat: number | null;
  /** 기지국(집) 경도 -180~180. 미설정이면 null. */
  lon: number | null;
  /** 도시 검색으로 고른 경우의 표시용 이름(없으면 null). */
  homeLabel: string | null;
  /** 고른 캐릭터. */
  character: MascotVariantId;
  /** 궤도 시계 표시 형식. */
  timeFormat: TimeFormat;
  /** UI 언어 (§2 i18n). "auto"면 브라우저 언어를 따라간다. */
  language: LangSetting;
};

/** 설정이 없을 때의 기본값 — 클론만 받아도 문제없이 도는 안전한 값. */
const DEFAULT_SETTINGS: StoredSettings = {
  lat: null,
  lon: null,
  homeLabel: null,
  character: "mint",
  timeFormat: "utc",
  language: "auto",
};

/** language 값이 지원 코드/"auto"인지. */
const LANG_SET = new Set<string>([
  "auto",
  "en",
  "ko",
  "ja",
  "zh",
  "es",
  "fr",
  "de",
  "pt",
  "ar",
  "sw",
]);

/** 설정을 읽는다. 없거나 깨졌으면 기본값. 필드별로 유효성을 검사한다. */
export function loadSettings(): StoredSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const p = JSON.parse(raw) as Partial<StoredSettings>;
    const validChar =
      p.character === "mint" || p.character === "coral" || p.character === "lavender";
    const validFmt =
      p.timeFormat === "utc" || p.timeFormat === "device" || p.timeFormat === "home";
    const validLang = typeof p.language === "string" && LANG_SET.has(p.language);
    return {
      lat:
        typeof p.lat === "number" && Number.isFinite(p.lat) && Math.abs(p.lat) <= 90
          ? p.lat
          : null,
      lon:
        typeof p.lon === "number" && Number.isFinite(p.lon) && Math.abs(p.lon) <= 180
          ? p.lon
          : null,
      homeLabel: typeof p.homeLabel === "string" && p.homeLabel ? p.homeLabel : null,
      character: validChar ? (p.character as MascotVariantId) : "mint",
      timeFormat: validFmt ? (p.timeFormat as TimeFormat) : "utc",
      language: validLang ? (p.language as LangSetting) : "auto",
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

/** 설정을 저장한다. 실패해도 조용히 넘어간다 (§12). */
export function saveSettings(settings: StoredSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // 저장 실패는 게임 진행에 영향을 주지 않는다.
  }
}
