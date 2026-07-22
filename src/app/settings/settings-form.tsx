"use client";

// ============================================================================
// settings-form.tsx — 설정 폼 (§8-4)
//
// 언어·캐릭터·기지국 위치·시간 표시 형식을 고른다. 변경 즉시 localStorage에
// 저장(오락실 문법). 언어는 I18nProvider가 관리(바꾸면 화면이 즉시 그 언어로),
// 나머지는 saveSettings로 저장한다. 캐릭터 미리보기·위치 지도는 게임과 같은
// 그리기 코드를 재사용한다(에셋 0개 §11).
// ============================================================================

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { COLORS, MASCOT_VARIANTS, type MascotVariantId } from "@/lib/constants";
import { drawMascot } from "@/lib/mascot";
import { LANGS, type DictKey } from "@/lib/i18n";
import {
  type StoredSettings,
  type TimeFormat,
  loadSettings,
  saveSettings,
} from "@/lib/storage";
import { useT } from "../i18n-provider";
import { LocationPicker } from "./location-picker";

/** 캐릭터 한 종을 미니 캔버스에 그린다 (bag-grid.tsx와 같은 원리). */
function CharacterPreview({ variant }: { variant: MascotVariantId }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(2, 2); // 레티나 또렷하게
    drawMascot(ctx, 28, 32, 20, 1, { gazeX: 0, gazeY: 0, blink: false, mouthOpen: 0 }, variant);
    ctx.restore();
  }, [variant]);
  return <canvas ref={ref} width={112} height={112} aria-hidden className="h-14 w-14" />;
}

const TIME_FORMATS: TimeFormat[] = ["utc", "device", "home"];
/** 세그먼트 라벨 — utc는 영어 고정, 나머지는 사전. */
const TF_LABEL: Record<TimeFormat, DictKey | "UTC"> = {
  utc: "UTC",
  device: "settings.tf.device",
  home: "settings.tf.home",
};
const TF_DESC: Record<TimeFormat, DictKey> = {
  utc: "settings.tf.utcDesc",
  device: "settings.tf.deviceDesc",
  home: "settings.tf.homeDesc",
};

export function SettingsForm() {
  const { t, setting: langSetting, setLang } = useT();
  // null = 아직 localStorage를 못 읽음 (서버/첫 클라 렌더 불일치 방지)
  const [settings, setSettings] = useState<StoredSettings | null>(null);
  const [geoMsg, setGeoMsg] = useState<string | null>(null);

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  if (!settings) {
    return <p className="animate-pulse font-pixel text-xs text-gray-400">LOADING...</p>;
  }

  /** 부분 갱신 + 즉시 저장. 언어는 provider가 따로 관리하므로 현재 값을 유지한다. */
  const update = (patch: Partial<StoredSettings>) => {
    const next = { ...settings, ...patch, language: langSetting };
    setSettings(next);
    saveSettings(next);
  };

  const askLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoMsg(t("settings.geo.unsupported"));
      return;
    }
    setGeoMsg(t("settings.geo.checking"));
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        update({
          lat: Math.round(pos.coords.latitude * 100) / 100,
          lon: Math.round(pos.coords.longitude * 100) / 100,
          homeLabel: null,
        });
        setGeoMsg(t("settings.geo.done"));
      },
      () => setGeoMsg(t("settings.geo.fail")),
      { timeout: 8000 },
    );
  };

  const homeDisabled = settings.lat === null || settings.lon === null;

  return (
    <div className="flex w-full flex-col gap-8 text-left">
      {/* ---- 언어 ---- */}
      <section className="flex flex-col gap-3">
        <h2 className="font-pixel-ko text-base text-white">{t("settings.language")}</h2>
        <select
          value={langSetting}
          onChange={(e) => setLang(e.target.value as typeof langSetting)}
          className="font-pixel-ko w-full border-2 border-white/20 bg-black/40 px-3 py-2 text-sm text-white outline-none focus-visible:border-white"
        >
          <option value="auto">{t("settings.langAuto")}</option>
          {LANGS.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label}
            </option>
          ))}
        </select>
      </section>

      {/* ---- 캐릭터 3종 ---- */}
      <section className="flex flex-col gap-3">
        <h2 className="font-pixel-ko text-base text-white">{t("settings.character")}</h2>
        <div className="grid grid-cols-3 gap-3">
          {MASCOT_VARIANTS.map((v) => {
            const chosen = settings.character === v.id;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => update({ character: v.id })}
                aria-pressed={chosen}
                className="flex flex-col items-center gap-1 border-2 bg-black/30 py-3 transition-colors"
                style={{ borderColor: chosen ? COLORS.accent : "rgba(255,255,255,0.15)" }}
              >
                <CharacterPreview variant={v.id} />
                <span
                  className="font-pixel-ko text-sm"
                  style={{ color: chosen ? COLORS.accent : "rgba(255,255,255,0.7)" }}
                >
                  {t(`character.${v.id}` as DictKey)}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ---- 위치(기지국) ---- */}
      <section className="flex flex-col gap-3">
        <h2 className="font-pixel-ko text-base text-white">{t("settings.location")}</h2>
        <p className="font-pixel-ko text-xs text-gray-400">{t("settings.locationHint")}</p>
        {settings.homeLabel && (
          <p className="font-pixel-ko text-sm" style={{ color: COLORS.mascot }}>
            📍 {settings.homeLabel}
          </p>
        )}
        <button
          type="button"
          onClick={askLocation}
          className="font-pixel-ko self-start border-2 px-4 py-2 text-sm"
          style={{ color: COLORS.mascot, borderColor: COLORS.mascot }}
        >
          {t("settings.getLocation")}
        </button>
        {geoMsg && <p className="font-pixel-ko text-xs text-gray-300">{geoMsg}</p>}

        {/* 지도 찍기 + 도시 검색 */}
        <LocationPicker
          lat={settings.lat}
          lon={settings.lon}
          onPick={(lat, lon, label) => update({ lat, lon, homeLabel: label })}
        />

        {/* 수동 입력 */}
        <div className="flex gap-3">
          <label className="flex flex-1 flex-col gap-1">
            <span className="font-pixel text-[9px] tracking-widest text-gray-400">LAT</span>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min={-90}
              max={90}
              value={settings.lat ?? ""}
              placeholder={t("settings.latPlaceholder")}
              onChange={(e) =>
                update({
                  lat: e.target.value === "" ? null : Number(e.target.value),
                  homeLabel: null,
                })
              }
              className="font-pixel-ko w-full border-2 border-white/20 bg-black/40 px-2 py-2 text-sm text-white outline-none focus-visible:border-white"
            />
          </label>
          <label className="flex flex-1 flex-col gap-1">
            <span className="font-pixel text-[9px] tracking-widest text-gray-400">LON</span>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min={-180}
              max={180}
              value={settings.lon ?? ""}
              placeholder={t("settings.lonPlaceholder")}
              onChange={(e) =>
                update({
                  lon: e.target.value === "" ? null : Number(e.target.value),
                  homeLabel: null,
                })
              }
              className="font-pixel-ko w-full border-2 border-white/20 bg-black/40 px-2 py-2 text-sm text-white outline-none focus-visible:border-white"
            />
          </label>
        </div>
      </section>

      {/* ---- 시간 표시 형식 (+ 뜻 설명, task 1) ---- */}
      <section className="flex flex-col gap-3">
        <h2 className="font-pixel-ko text-base text-white">{t("settings.time")}</h2>
        <p className="font-pixel-ko text-xs text-gray-400">{t("settings.timeHint")}</p>
        <div className="flex gap-2">
          {TIME_FORMATS.map((f) => {
            const chosen = settings.timeFormat === f;
            const disabled = f === "home" && homeDisabled;
            const label = TF_LABEL[f];
            return (
              <button
                key={f}
                type="button"
                disabled={disabled}
                onClick={() => update({ timeFormat: f })}
                aria-pressed={chosen}
                className="font-pixel-ko flex-1 border-2 px-1 py-2 text-xs transition-colors disabled:opacity-30"
                style={
                  chosen
                    ? { borderColor: COLORS.accent, color: COLORS.accent }
                    : { borderColor: "rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.7)" }
                }
              >
                {label === "UTC" ? "UTC" : t(label)}
              </button>
            );
          })}
        </div>
        {/* 고른 형식의 뜻 설명 (task 1) */}
        <p className="font-pixel-ko text-[11px] leading-relaxed text-gray-400">
          {t(TF_DESC[settings.timeFormat])}
        </p>
        {homeDisabled && (
          <p className="font-pixel-ko text-[11px] text-gray-500">
            {t("settings.tf.homeLocked")}
          </p>
        )}
      </section>

      <Link
        href="/orbit"
        className="font-pixel-ko self-center text-sm underline underline-offset-4"
        style={{ color: COLORS.mascot }}
      >
        {t("settings.orbitLink")}
      </Link>
    </div>
  );
}
