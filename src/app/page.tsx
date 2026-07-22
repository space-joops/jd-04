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
import { StoryIntro } from "./story-intro";

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

        {/* ---- 시작 + 최고 기록 + 앱 설치 ----
             스토리보다 위에 둔다 — 모바일 첫 화면에서 버튼이 잘리면 안 된다 */}
        <div className="flex flex-col items-center gap-4">
          <Link
            href="/play?start=1"
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
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/rank"
              className="font-pixel-ko border-2 border-white/40 px-4 py-2 text-sm text-white/80 transition-colors hover:bg-white/10 focus-visible:bg-white/10"
            >
              🏆 랭킹 보기
            </Link>
            <Link
              href="/bag"
              className="font-pixel-ko border-2 border-white/40 px-4 py-2 text-sm text-white/80 transition-colors hover:bg-white/10 focus-visible:bg-white/10"
            >
              🎒 인벤토리
            </Link>
            <Link
              href="/orbit"
              className="font-pixel-ko border-2 border-white/40 px-4 py-2 text-sm text-white/80 transition-colors hover:bg-white/10 focus-visible:bg-white/10"
            >
              🛰️ 궤도 모니터
            </Link>
          </div>
          <InstallButton />
        </div>

        {/* ---- 각주 — 크로스오버 표기 + 버전 + 스토리 다시보기 ----
             세계관 스토리(§2)는 첫 방문에만 전체화면 인트로로 재생된다
             (StoryIntro). 여기 링크는 다시 보고 싶은 사람용. */}
        <footer className="font-pixel-ko mt-auto flex flex-col items-center gap-2 text-xs text-gray-500">
          <StoryIntro />
          <p>
            이 아이는 STELLAPET 프로젝트의 지상 육성장에서 자랐습니다.{" "}
            <span className="font-pixel text-[10px] text-gray-600">
              v{pkg.version}
            </span>
          </p>
        </footer>
      </div>
    </main>
  );
}
