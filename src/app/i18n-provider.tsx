"use client";

// ============================================================================
// i18n-provider.tsx — 언어 컨텍스트 (§2 i18n)
//
// 설정(sjs-settings.language)이 "auto"면 브라우저 언어를, 아니면 고른 언어를
// 쓴다. 서버/첫 클라이언트 렌더는 기본(en)으로 통일하고, 마운트 후 실제 언어로
// 바꾼다(하이드레이션 불일치 방지). 언어가 바뀌면 <html>의 lang·dir도 갱신 —
// 아랍어는 RTL이라 dir="rtl"이 된다.
// ============================================================================

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  type DictKey,
  type Lang,
  type LangSetting,
  DEFAULT_LANG,
  getDict,
  isRtl,
  resolveLang,
  t as translate,
} from "@/lib/i18n";
import { loadSettings, saveSettings } from "@/lib/storage";

type I18nValue = {
  /** 실제 적용 중인 언어(“auto” 해석 결과). */
  lang: Lang;
  /** 설정에 저장된 값(“auto” 포함) — 언어 선택 UI가 현재값 표시에 쓴다. */
  setting: LangSetting;
  /** 텍스트 방향. */
  dir: "ltr" | "rtl";
  /** 번역 함수. */
  t: (key: DictKey, params?: Record<string, string | number>) => string;
  /** 언어 설정 변경(“auto” 포함) — 저장 + 화면 갱신. */
  setLang: (setting: LangSetting) => void;
};

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  // 서버/첫 렌더는 en으로 통일 → 마운트 후 설정을 읽어 바꾼다
  const [setting, setSetting] = useState<LangSetting>("auto");
  const [lang, setLangState] = useState<Lang>(DEFAULT_LANG);

  const apply = useCallback((s: LangSetting) => {
    const resolved = resolveLang(s);
    setSetting(s);
    setLangState(resolved);
    try {
      document.documentElement.lang = resolved;
      document.documentElement.dir = isRtl(resolved) ? "rtl" : "ltr";
    } catch {
      // 문서 접근 실패는 무시 — 텍스트는 여전히 번역된다
    }
  }, []);

  useEffect(() => {
    apply(loadSettings().language);
  }, [apply]);

  const setLang = useCallback(
    (s: LangSetting) => {
      const cur = loadSettings();
      saveSettings({ ...cur, language: s });
      apply(s);
    },
    [apply],
  );

  const dict = getDict(lang);
  const value: I18nValue = {
    lang,
    setting,
    dir: isRtl(lang) ? "rtl" : "ltr",
    t: (key, params) => translate(dict, key, params),
    setLang,
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/** 컴포넌트에서 번역을 쓰는 훅. Provider 밖이면 기본(en)으로 폴백. */
export function useT(): I18nValue {
  const ctx = useContext(I18nContext);
  if (ctx) return ctx;
  // Provider 밖(이론상 없음) — en으로 안전 폴백
  const dict = getDict(DEFAULT_LANG);
  return {
    lang: DEFAULT_LANG,
    setting: "auto",
    dir: "ltr",
    t: (key, params) => translate(dict, key, params),
    setLang: () => {},
  };
}

/**
 * 서버 컴포넌트(페이지) 안에서도 쓸 수 있는 번역 텍스트 노드.
 * `<T k="landing.tagline" />` 처럼 — 클라이언트 컴포넌트라 컨텍스트를 읽는다.
 */
export function T({
  k,
  p,
}: {
  k: DictKey;
  p?: Record<string, string | number>;
}) {
  const { t } = useT();
  return <>{t(k, p)}</>;
}
