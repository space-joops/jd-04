# 🛰️ SPACE JOOPS · 우주 냠냠!

> 2031년 케슬러 신드롬 이후, 우주쓰레기를 먹고 자라는 생체 위성이
> 오늘도 저궤도로 출근한다 — **버추얼 조이스틱으로 슝슝 추진해서
> 떨어지는 우주쓰레기를 몽땅 먹어치우는 레트로 픽셀 아케이드.**

## 특징

- 🕹 원포인터 버추얼 조이스틱 + 추진·연료·관성 물리
- 🎨 에셋 파일 0개 — 그림·소리·앱 아이콘까지 전부 코드로 생성
- 🏆 온라인 리더보드 (펫 등록 → 단판 최고 / 통산 수거량 이원 경쟁, Supabase)
- 🎒 로컬 인벤토리 도감, ⭐ 별 보너스, 파워업 3종, 콤보 배율
- 📱 PWA — 홈 화면 설치·오프라인 플레이·배포 갱신 토스트

## 실행하기

```bash
npm install
npm run dev     # http://localhost:3004
```

온라인 리더보드까지 쓰려면 `.env.example`을 `.env.local`로 복사해
Supabase 정보를 채우고, `supabase/schema.sql`을 SQL Editor에서 실행하세요.
(없어도 게임은 로컬 기록만으로 완전하게 동작합니다.)

## 문서

- **[docs/ — 학습 문서 시리즈](./docs/README.md)**: 이 저장소는 프론트엔드
  초급자 학습용입니다. 모든 코드의 문법을 초급자 눈높이에서 풀어 쓴
  8챕터 해설(프로젝트 구조 · 타입스크립트 · 리액트 훅 · 캔버스와 게임 루프 ·
  게임 수학 · 브라우저 API · 서버와 데이터 · 스타일링)이 있어요.
- **[CLAUDE.md](./CLAUDE.md)**: 게임 요구사항 명세서 — 설계 의도와 규칙의 원본.

## 기술 스택

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS 4 ·
Canvas 2D · Web Audio · Supabase (REST 직접 호출) · Service Worker
