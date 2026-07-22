"use client";

// ============================================================================
// bag-grid.tsx — 인벤토리 도감 그리드 (§8-2)
//
// 종류별 수집 개수를 카드로 보여준다. 카드의 그림은 이미지 파일이 아니라
// 게임과 같은 drawJunk를 미니 캔버스에 한 번 그린 것 — "모든 그림은 코드로"
// (§11)를 도감에서도 지키고, 게임 도트가 바뀌면 도감도 저절로 같아진다.
// ============================================================================

import { useEffect, useRef, useState } from "react";
import { JUNK_COLORS, type JunkKind } from "@/lib/constants";
import { type Junk, drawJunk } from "@/lib/debris";
import { type Inventory, loadInventory } from "@/lib/storage";
import { useT } from "../i18n-provider";
import type { DictKey } from "@/lib/i18n";

/** 도감 순서 — 쓰레기 8종 → 아이템 → 파워업. 이름·설명은 사전에서(§2 i18n). */
const CATALOG: JunkKind[] = [
  "satellite",
  "bolt",
  "can",
  "spring",
  "glove",
  "toolbag",
  "fairing",
  "cubesat",
  "fuel",
  "star",
  "magnet",
  "slowmo",
  "shield",
];

/** 게임 스프라이트를 그대로 한 번 그려 두는 미니 캔버스. */
function ItemSprite({ kind, dim }: { kind: JunkKind; dim: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    // 레티나 또렷함: 2배 픽셀로 그리고 CSS 크기로 줄인다 (canvas.ts와 같은 원리)
    ctx.scale(2, 2);
    // 정지 상태의 낙하물 하나 — swayT=0이라 별의 맥박도 기본 크기다
    const j: Junk = {
      kind,
      x: 28,
      x0: 28,
      y: 28,
      vy: 0,
      size: 18,
      sway: 0,
      swayT: 0,
      swaySpeed: 0,
      rot: 0,
      rotSpeed: 0,
      eatT: -1,
    };
    if (dim) ctx.globalAlpha = 0.25; // 아직 못 먹은 종류는 실루엣처럼 흐리게
    drawJunk(ctx, j, 1);
  }, [kind, dim]);

  return (
    <canvas
      ref={ref}
      width={112}
      height={112}
      aria-hidden
      className="h-14 w-14"
    />
  );
}

export function BagGrid() {
  const { t } = useT();
  // null = 아직 localStorage를 못 읽음 (서버 렌더와 첫 클라이언트 렌더)
  const [inv, setInv] = useState<Inventory | null>(null);

  useEffect(() => {
    setInv(loadInventory());
  }, []);

  if (inv === null) {
    return <p className="animate-pulse font-pixel text-xs text-gray-400">LOADING...</p>;
  }

  const total = CATALOG.reduce((sum, kind) => sum + (inv[kind] ?? 0), 0);
  const found = CATALOG.filter((kind) => (inv[kind] ?? 0) > 0).length;

  return (
    <div className="flex w-full flex-col items-center gap-5">
      <p className="font-pixel-ko text-sm text-gray-300">
        {t("bag.summary", { total, found, kinds: CATALOG.length })}
      </p>

      {total === 0 && (
        <p className="font-pixel-ko text-sm text-gray-400">{t("bag.empty")}</p>
      )}

      <ul className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
        {CATALOG.map((kind) => {
          const count = inv[kind] ?? 0;
          const has = count > 0;
          return (
            <li
              key={kind}
              className="flex items-center gap-3 border-2 border-white/15 bg-black/30 px-3 py-2 text-left"
            >
              <ItemSprite kind={kind} dim={!has} />
              <div className="min-w-0 flex-1">
                <p
                  className="font-pixel-ko text-sm"
                  style={{ color: has ? JUNK_COLORS[kind] : "rgba(255,255,255,0.35)" }}
                >
                  {t(`junk.${kind}` as DictKey)}
                </p>
                <p className="font-pixel-ko text-xs leading-snug text-gray-400">
                  {has ? t(`bag.desc.${kind}` as DictKey) : "???"}
                </p>
              </div>
              <p className="font-pixel shrink-0 text-sm text-white">
                {has ? `x${count}` : "-"}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
