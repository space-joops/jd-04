// ============================================================================
// settings/page.tsx — "/settings" 설정 페이지 껍데기 (§8-4)
//
// /rank·/bag과 같은 정보 페이지 패턴: 서버 컴포넌트로 메타데이터만 잡고,
// 실제 폼(캐릭터·위치·시간 형식)은 클라이언트 컴포넌트 SettingsForm이 그린다.
// ============================================================================

import type { Metadata } from "next";
import Link from "next/link";
import { COLORS } from "@/lib/constants";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = {
  title: "SPACE JOOPS · SETTINGS",
  description: "캐릭터·위치·시간 표시 설정",
};

export default function SettingsPage() {
  return (
    <main
      className="mx-auto flex min-h-dvh max-w-xl flex-col items-center gap-8 px-6 py-12 text-center"
      style={{ paddingTop: "max(3rem, env(safe-area-inset-top))" }}
    >
      <header className="flex flex-col items-center gap-3">
        <p className="font-pixel text-[10px] tracking-widest text-gray-400">
          MISSION CONTROL
        </p>
        <h1
          className="font-pixel text-3xl font-bold md:text-5xl"
          style={{ color: COLORS.accent, textShadow: "4px 4px 0 #000" }}
        >
          ⚙️ SETTINGS
        </h1>
      </header>

      <SettingsForm />

      <div className="mt-auto flex flex-col items-center gap-4 pb-4">
        <Link
          href="/play?start=1"
          className="font-pixel border-4 px-6 py-3 text-lg"
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
