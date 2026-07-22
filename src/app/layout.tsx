import type { Metadata, Viewport } from "next";
import "./globals.css";
import { I18nProvider } from "./i18n-provider";
import { SwRegister } from "./sw-register";

// 배포 도메인 — OG의 절대 URL 기준(metadataBase). Vercel은 배포마다 VERCEL_URL을
// 준다. 직접 지정하고 싶으면 NEXT_PUBLIC_SITE_URL로 덮어쓴다. 없으면 로컬(§13).
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3004");

// 전역 메타데이터 — 페이지별로 덮어쓸 수 있지만 기본값은 여기서.
// OG/트위터 기본은 영어(§2) — 크롤러가 읽는 정본 이미지는 opengraph-image.tsx.
const OG_TITLE = "SPACE JOOPS";
const OG_DESC =
  "A pixel arcade game where you gobble up falling space junk on your phone!";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "SPACE JOOPS · Space Snacks!",
  description: OG_DESC,
  openGraph: {
    title: OG_TITLE,
    description: OG_DESC,
    siteName: "SPACE JOOPS",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: OG_TITLE,
    description: OG_DESC,
  },
  // iOS 홈 화면 추가(§13): 독립 실행 + 상태바 반투명 — 매니페스트(manifest.ts)의
  // iOS 짝꿍. 아이콘은 apple-icon.tsx가 자동으로 링크한다.
  appleWebApp: {
    capable: true,
    title: "SPACE JOOPS",
    statusBarStyle: "black-translucent",
  },
};

// 뷰포트 설정 — 게임의 몰입감과 조작감을 지키는 장치들 (§13).
export const viewport: Viewport = {
  themeColor: "#141838", // 브라우저 상단 바까지 우주색으로 (COLORS.space의 거울)
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, // 핀치 줌 금지 (§12) — 더블탭 확대가 게임 조작을 방해하지 않게
  userScalable: false,
  viewportFit: "cover", // 노치 영역까지 채우고 safe-area-inset으로 대응
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // lang="en"은 기본값 — I18nProvider가 마운트 후 설정/브라우저 언어로 lang·dir을
  // 갱신한다(아랍어는 rtl). 기본을 en으로 두는 이유는 OG·SEO 기본이 영어라서 (§2).
  return (
    <html lang="en">
      <body>
        <I18nProvider>
          {children}
          {/* 서비스 워커 등록 + 새 버전 토스트 — 모든 페이지에서 (§13) */}
          <SwRegister />
        </I18nProvider>
      </body>
    </html>
  );
}
