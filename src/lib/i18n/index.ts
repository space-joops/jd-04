// ============================================================================
// i18n/index.ts — 다국어 기반 (§2 i18n, 10개 언어)
//
// 순수 데이터 계층: 사전은 그냥 객체라 React 안(useT)에서도, 밖(게임 루프)에서도
// 쓴다. en.ts가 키의 정본이고, 다른 사전은 `Dict`(= en의 키 전부) 타입이라
// 키가 빠지면 컴파일 에러가 난다 — 번역 누락을 타입이 잡아 준다.
//
// 캔버스 아케이드 카피는 영어 고정이라 번역하지 않는다 (§2, layout 주석 참고).
// ============================================================================

import { en } from "./dicts/en";
import { ko } from "./dicts/ko";
import { ja } from "./dicts/ja";
import { zh } from "./dicts/zh";
import { es } from "./dicts/es";
import { fr } from "./dicts/fr";
import { de } from "./dicts/de";
import { pt } from "./dicts/pt";
import { ar } from "./dicts/ar";
import { sw } from "./dicts/sw";

/** 지원 언어 코드. en이 기본이자 정본. */
export type Lang = "en" | "ko" | "ja" | "zh" | "es" | "fr" | "de" | "pt" | "ar" | "sw";

/** 설정에 저장되는 값 — "auto"면 브라우저 언어를 따라간다. */
export type LangSetting = Lang | "auto";

/** 사전의 키(en의 키 집합) · 값 타입. */
export type DictKey = keyof typeof en;
export type Dict = Record<DictKey, string>;

/** 오른쪽→왼쪽 언어 (아랍어). */
const RTL_LANGS: Lang[] = ["ar"];

/** 언어 선택 UI용 — 코드 + 그 언어로 쓴 이름(엔도님). */
export const LANGS: Array<{ code: Lang; label: string }> = [
  { code: "en", label: "English" },
  { code: "ko", label: "한국어" },
  { code: "ja", label: "日本語" },
  { code: "zh", label: "中文" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "pt", label: "Português" },
  { code: "ar", label: "العربية" },
  { code: "sw", label: "Kiswahili" },
];

export const DEFAULT_LANG: Lang = "en";

const DICTS: Record<Lang, Dict> = { en, ko, ja, zh, es, fr, de, pt, ar, sw };

const SUPPORTED = new Set<string>(LANGS.map((l) => l.code));

/** 언어 코드가 지원 목록에 있으면 그대로, 아니면 기본(en). */
function coerce(code: string): Lang {
  const short = code.slice(0, 2).toLowerCase();
  return (SUPPORTED.has(short) ? short : DEFAULT_LANG) as Lang;
}

/** 브라우저 언어를 감지한다. 서버·미지원 환경이면 기본(en). */
export function detectLang(): Lang {
  try {
    if (typeof navigator === "undefined") return DEFAULT_LANG;
    return coerce(navigator.language || DEFAULT_LANG);
  } catch {
    return DEFAULT_LANG;
  }
}

/** 설정값("auto" 포함)을 실제 언어로 확정한다. */
export function resolveLang(setting: LangSetting): Lang {
  return setting === "auto" ? detectLang() : setting;
}

/** 오른쪽→왼쪽 언어인가? (아랍어) */
export function isRtl(lang: Lang): boolean {
  return RTL_LANGS.includes(lang);
}

/** 해당 언어의 사전. */
export function getDict(lang: Lang): Dict {
  return DICTS[lang] ?? en;
}

/**
 * 사전에서 키를 뽑고 {token}을 params로 치환한다.
 * 키가 없으면 키 문자열을 그대로 돌려줘 화면이 비지 않게 한다.
 */
export function t(
  dict: Dict,
  key: DictKey,
  params?: Record<string, string | number>,
): string {
  let s: string = dict[key] ?? en[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      s = s.replaceAll(`{${k}}`, String(v));
    }
  }
  return s;
}
