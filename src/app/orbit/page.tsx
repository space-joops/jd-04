// ============================================================================
// orbit/page.tsx — "/orbit" 궤도 모니터 라우트 껍데기 (§8-3)
//
// /rank·/bag과 같은 정보 페이지 패턴: 서버 컴포넌트로 메타데이터만 잡고,
// 실제 화면(캔버스·telemetry)은 클라이언트 컴포넌트 OrbitView에 맡긴다.
// ============================================================================

import type { Metadata } from "next";
import Link from "next/link";
import { COLORS } from "@/lib/constants";
import { OrbitView } from "./orbit-view";
import { OrbitExplainer } from "./orbit-explainer";
import { T } from "../i18n-provider";

export const metadata: Metadata = {
  title: "SPACE JOOPS · ORBIT MONITOR",
  description: "내 펫(생체 위성)의 실시간 궤도 텔레메트리",
};

export default function OrbitPage() {
  return (
    <main
      className="mx-auto flex min-h-dvh max-w-xl flex-col items-center gap-8 px-6 py-12 text-center"
      style={{ backgroundColor: COLORS.space }}
    >
      <header className="flex flex-col items-center gap-3">
        <p className="font-pixel text-[10px] tracking-widest text-gray-400">
          BIOSATELLITE TELEMETRY
        </p>
        <h1
          className="font-pixel text-3xl md:text-5xl"
          style={{ color: COLORS.accent, textShadow: "4px 4px 0 #000" }}
        >
          🛰️ ORBIT MONITOR
        </h1>
        <p className="font-pixel-ko text-sm text-gray-300">
          <T k="orbit.subtitle" />
        </p>
        <div className="flex flex-col items-center gap-1">
          <p className="font-pixel-ko text-xs text-gray-400">
            <T k="orbit.realtimeNote" />
          </p>
          <OrbitExplainer />
        </div>
      </header>

      <OrbitView />

      <div className="mt-auto flex flex-col items-center gap-4">
        <Link
          href="/play?start=1"
          className="font-pixel inline-block border-4 px-8 py-4 text-xl transition-transform focus-visible:scale-105 md:text-2xl"
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
          className="font-pixel-ko border-2 border-white/40 px-4 py-2 text-sm text-white/80 transition-colors hover:bg-white/10 focus-visible:bg-white/10"
        >
          ← HOME
        </Link>
      </div>
    </main>
  );
}
