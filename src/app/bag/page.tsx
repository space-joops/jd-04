// ============================================================================
// bag/page.tsx — "/bag" 인벤토리(로컬 도감) 페이지 껍데기 (§8-2)
//
// 지금까지 먹은 아이템을 종류별로 세어 보여준다. 기록은 이 기기의
// localStorage(sjs-inventory)에만 있다 — 서버가 아니라 내 가방이니까.
// 목록은 클라이언트 컴포넌트(BagGrid)가 그린다.
// ============================================================================

import type { Metadata } from "next";
import Link from "next/link";
import { COLORS } from "@/lib/constants";
import { BagGrid } from "./bag-grid";

export const metadata: Metadata = {
  title: "SPACE JOOPS · INVENTORY",
  description: "내 펫이 지금까지 수거한 우주쓰레기 도감",
};

export default function BagPage() {
  return (
    <main
      className="mx-auto flex min-h-dvh max-w-xl flex-col items-center gap-8 px-6 py-12 text-center"
      style={{ paddingTop: "max(3rem, env(safe-area-inset-top))" }}
    >
      <header className="flex flex-col items-center gap-3">
        <p className="font-pixel text-[10px] tracking-widest text-gray-400">
          ORBITAL COLLECTION LOG
        </p>
        <h1
          className="font-pixel text-3xl font-bold md:text-5xl"
          style={{ color: COLORS.accent, textShadow: "4px 4px 0 #000" }}
        >
          🎒 INVENTORY
        </h1>
        <p className="font-pixel-ko text-sm text-gray-400">
          내 펫이 지금까지 수거한 것들 — 이 기기에만 기록돼요
        </p>
      </header>

      <BagGrid />

      <div className="mt-auto flex flex-col items-center gap-4 pb-4">
        <Link
          href="/play?start=1"
          className="font-pixel animate-pulse border-4 px-6 py-3 text-lg focus-visible:animate-none"
          style={{
            color: COLORS.accent,
            borderColor: COLORS.accent,
            textShadow: "2px 2px 0 #000",
          }}
        >
          TAP TO START
        </Link>
        <Link
          href="/"
          className="font-pixel text-xs text-gray-400 underline underline-offset-4 hover:text-white focus-visible:text-white"
        >
          ← HOME
        </Link>
      </div>
    </main>
  );
}
