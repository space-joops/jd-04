// ============================================================================
// page.tsx — 랜딩 페이지 "/" (§16에서 승격)
//
// 게임 소개 + 세계관 스토리 + 규칙 + 시작 버튼 + 최고 기록.
// 배경에서는 어트랙트 모드(AttractSky)가 돌아간다 — 오락실 대기 화면처럼.
//
// 스토리는 자매작 STELLAPET(궤도 청소 다마고치)과 세계관을 공유한다:
// 2031년 케슬러 신드롬 이후, 우주쓰레기를 먹고 자라는 생체 위성을 지상에서
// 키워 궤도로 보낸다 — SPACE JOOPS의 주인공이 바로 그렇게 올라온 아이다 (§2).
//
// 한글 스토리는 font-pixel-ko(Galmuri11) — Press Start 2P에는 한글이 없다 (§11).
// ============================================================================

import Link from "next/link";
import { COLORS } from "@/lib/constants";
// 서버 컴포넌트라 package.json을 빌드 시점에 직접 읽을 수 있다 — 버전 표기(§13)
import pkg from "../../package.json";
import { AttractSky } from "./attract-sky";
import { BestScore } from "./best-score";
import { InstallButton } from "./install-button";

export default function Home() {
  return (
    <main className="relative min-h-dvh">
      <AttractSky />

      {/* 어트랙트 모드 위에 뜨는 콘텐츠 — 캔버스는 fixed라 스크롤과 무관 */}
      <div
        className="relative z-10 mx-auto flex min-h-dvh max-w-xl flex-col items-center gap-10 px-6 py-16 text-center"
        style={{ paddingTop: "max(4rem, env(safe-area-inset-top))" }}
      >
        {/* ---- 타이틀 ---- */}
        <header className="flex flex-col items-center gap-4">
          <p className="font-pixel text-[10px] tracking-widest text-gray-400">
            2061 · LOW EARTH ORBIT
          </p>
          <h1
            className="font-pixel text-4xl font-bold md:text-6xl"
            style={{ color: COLORS.accent, textShadow: "4px 4px 0 #000" }}
          >
            SPACE JOOPS
          </h1>
          <p className="font-pixel-ko text-2xl text-white">우주 냠냠!</p>
        </header>

        {/* ---- 세계관 스토리 (STELLAPET 세계관 공유, §2) ----
             스타워즈 오프닝 크롤: 우주 저편으로 흘러가는 자막 (globals.css).
             텍스트는 DOM에 그대로 있으므로 스크린리더는 평범하게 읽는다. */}
        <section
          aria-label="게임 스토리"
          className="starwars-stage h-64 w-full md:h-80"
        >
          <div className="starwars-crawl font-pixel-ko flex flex-col gap-10 text-base leading-relaxed text-gray-200 md:text-lg">
          <p>
            2031년, 걱정으로만 떠돌던 케슬러 신드롬이 진짜가 됐다.
            <br />
            파편이 파편을 부수고, 그 파편이 또 파편을 낳았다.
            <br />
            지구 저궤도는 <b style={{ color: COLORS.accent }}>8,000톤짜리 쓰레기 구름</b>이 됐다.
          </p>
          <p>
            인류의 대답은 더 큰 로켓도, 레이저도 아니었다.
            <br />
            <b style={{ color: COLORS.mascot }}>우주쓰레기를 먹고 자라는 생체 위성</b> —
            <br />
            지상에서 정성껏 키워, 하나씩 궤도로 올려 보냈다.
          </p>
          <p>
            30년이 지난 지금. 그중에서도 제일{" "}
            <b style={{ color: COLORS.mascot }}>입이 큰 아이</b>가
            <br />
            오늘도 저궤도로 출근한다.
            <br />
            <span className="text-xl text-white">&ldquo;우주 냠냠!&rdquo;</span>
          </p>
          </div>
        </section>

        {/* ---- 규칙 — 튜토리얼 없이 3초 안에 이해될 만큼만 (§1) ---- */}
        <section
          aria-label="게임 규칙"
          className="font-pixel-ko flex flex-col gap-2 text-sm text-gray-300 md:text-base"
        >
          <p>🕹 드래그로 추진 — 연료를 아껴 쓰자</p>
          <p>🛰 우주쓰레기는 냠냠 +10점</p>
          <p>🌵 빨갛고 뾰족한 애들은 살살 피하기 (하트 3개)</p>
          <p>⭐ 별은 +40점 — 하트가 닳았으면 하트로!</p>
          <p>🔋 배터리를 먹으면 연료 충전</p>
        </section>

        {/* ---- 시작 + 최고 기록 + 홈 화면 추가 ---- */}
        <div className="flex flex-col items-center gap-4">
          <Link
            href="/play"
            className="font-pixel inline-block animate-pulse border-4 px-8 py-4 text-xl transition-transform focus-visible:scale-105 focus-visible:animate-none md:text-2xl"
            style={{
              color: COLORS.accent,
              borderColor: COLORS.accent,
              textShadow: "2px 2px 0 #000",
            }}
          >
            TAP TO START
          </Link>
          <BestScore />
          <InstallButton />
        </div>

        {/* ---- 각주 — 자매작 크로스오버 표기 + 버전 ---- */}
        <footer className="font-pixel-ko mt-auto text-xs text-gray-500">
          이 아이는 STELLAPET 프로젝트의 지상 육성장에서 자랐습니다.{" "}
          <span className="font-pixel text-[10px] text-gray-600">
            v{pkg.version}
          </span>
        </footer>
      </div>
    </main>
  );
}
