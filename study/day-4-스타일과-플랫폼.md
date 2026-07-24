# Day 4 — 스타일링과 플랫폼: CSS/Tailwind · PWA · 접근성 · 배포

> **오늘의 목표**
> 1. CSS의 핵심 모델(박스·flexbox·캐스케이드)을 파이썬 배경에서 처음부터 잡는다.
> 2. Tailwind 유틸리티-퍼스트 사고법으로 이 프로젝트의 `className`을 해독한다.
> 3. PWA·**서비스 워커**·오프라인 캐시 전략을 이해한다 (데이터 엔지니어에게 익숙한 캐싱).
> 4. 접근성 기본 + 메타데이터/OG/Vercel 배포 — **어제 고친 버그의 무대**를 완성한다.
>
> **끝나면**: 반응형 UI를 스타일링하고, 캐시 전략을 설명하고, 왜 OG 프리뷰가 안 떴는지
> 완전히 이해한다.

---

## 0. 하루 타임박스

| 시간 | 내용 |
|---|---|
| 오전 1 | §1 CSS 박스 모델 · §2 flexbox·캐스케이드 |
| 오전 2 | §3 Tailwind 유틸리티 · §4 반응형·모바일 |
| 오후 1 | §5 PWA·매니페스트 · §6 서비스 워커 캐시 전략 |
| 오후 2 | §7 접근성 · §8 메타데이터·OG·배포(어제 버그 복습) |
| 저녁 | §9 실습 · §10 셀프 체크 |

---

## 1. CSS 박스 모델 — 모든 것은 상자다

파이썬엔 대응물이 없어 처음부터 갑니다. 하지만 규칙은 적습니다.

화면의 모든 요소(`<div>`, `<p>`, `<button>`)는 **사각형 상자**입니다. 각 상자는
안쪽부터 바깥쪽으로 4겹입니다:

```
┌─────────── margin (바깥 여백, 상자끼리의 간격) ───────────┐
│  ┌──────── border (테두리) ────────┐                      │
│  │  ┌───── padding (안쪽 여백) ────┐ │                      │
│  │  │        content (내용)        │ │                      │
│  │  └──────────────────────────────┘ │                      │
│  └────────────────────────────────────┘                      │
└──────────────────────────────────────────────────────────────┘
```

- **content**: 실제 내용(글자·이미지).
- **padding**: 내용과 테두리 사이 여백(상자 안쪽).
- **border**: 테두리 선.
- **margin**: 다른 상자와의 간격(상자 바깥).

CSS는 이 값들을 지정하는 언어입니다:
```css
.box { padding: 16px; border: 2px solid #7ee8b2; margin: 8px; color: #fff; }
```
이 프로젝트는 이걸 **Tailwind 클래스**로 씁니다: `p-4 border-2 m-2 text-white`(§3).
같은 것의 축약형입니다.

---

## 2. flexbox & 캐스케이드 — 레이아웃과 우선순위

### 2-1. flexbox — 요소를 줄 세우는 도구

옛날 CSS의 악몽(요소 가운데 정렬이 어려웠음)을 끝낸 현대적 레이아웃 모델. 부모에
`display: flex`를 주면 자식들이 한 줄(또는 한 열)로 배치됩니다.

```css
.row {
  display: flex;            /* 자식을 flex 아이템으로 */
  flex-direction: row;     /* row(가로) | column(세로) */
  justify-content: center; /* 주축 정렬 (가로 기준 가운데) */
  align-items: center;     /* 교차축 정렬 (세로 기준 가운데) */
  gap: 12px;               /* 자식 간 간격 */
}
```
이 프로젝트의 `page.tsx`가 통째로 이 패턴입니다:
```tsx
<div className="flex flex-col items-center gap-10 ...">   // 세로로, 가운데, 간격 10
```
- `flex` = `display:flex`, `flex-col` = `flex-direction:column`,
  `items-center` = `align-items:center`, `gap-10` = `gap: 2.5rem`.

> **데이터 엔지니어 비유**: flexbox는 "레코드들을 한 축으로 정렬하고 남는 공간을
> 규칙대로 분배"하는 것. `justify-content: space-between`은 균등 분배(파티셔닝 감각).

형제 격으로 **CSS Grid**(2차원 격자)도 있지만, 이 프로젝트는 대부분 flexbox입니다.

### 2-2. 캐스케이드 — "C"SS의 C

**Cascading** = 여러 규칙이 한 요소에 겹칠 때 **우선순위로 이긴 규칙이 적용**됩니다.
대략: 인라인 `style` > 구체적인 선택자 > 덜 구체적인 선택자, 같으면 나중에 온 것.
Tailwind를 쓰면 이 복잡성을 대부분 피합니다(클래스가 곧 스타일이라 겹칠 일이 적음).
그래도 `style={{...}}` 인라인이 클래스를 이긴다는 것만 기억하세요 — 그래서 이 프로젝트가
동적 색(`COLORS.accent`)은 `style`로, 정적 레이아웃은 className으로 나눕니다.

---

## 3. Tailwind CSS — 유틸리티 퍼스트

### 3-1. 발상의 전환

전통적 CSS는 "의미 있는 클래스명 + 별도 CSS 파일":
```css
/* styles.css */         /* HTML */
.card { padding: 16px;    <div class="card">
        border-radius: 8px; }
```
Tailwind는 **작은 유틸리티 클래스를 조합**해 HTML 안에서 바로 스타일링:
```tsx
<div className="p-4 rounded-lg border-2 border-white/40 text-sm">
```
처음엔 "지저분하다" 싶지만, 실무에선 **CSS 파일을 오가지 않고, 이름 짓기 고민이 없고,
안 쓰는 CSS가 쌓이지 않는** 큰 장점이 있습니다. 데이터 엔지니어의 "설정을 코드 옆에"
철학과 통합니다.

### 3-2. 이 프로젝트 클래스 해독 사전

`page.tsx`에서 실제로 나온 것들:

| 클래스 | 뜻 | CSS |
|---|---|---|
| `flex flex-col` | 세로 배치 | `display:flex; flex-direction:column` |
| `items-center` | 교차축 가운데 | `align-items:center` |
| `gap-10` | 자식 간격 | `gap: 2.5rem` |
| `px-6 py-16` | 좌우 패딩 6, 상하 16 | `padding: 4rem 1.5rem` |
| `text-sm` `text-4xl` | 글자 크기 | `font-size` |
| `text-white` `text-gray-400` | 글자 색 | `color` |
| `border-4` | 테두리 두께 | `border-width: 4px` |
| `min-h-dvh` | 최소 높이 = 화면 높이 | `min-height: 100dvh` |
| `relative` `z-10` | 위치·쌓임 순서 | `position; z-index` |
| `md:text-6xl` | **화면 넓을 때만** 6xl | 미디어 쿼리(§4) |
| `hover:bg-white/10` | 마우스 올리면 배경 | `:hover` 상태 |
| `animate-pulse` | 깜빡임 애니메이션 | 내장 keyframes |

숫자 규칙: `4` = `1rem`(16px), `p-4`는 `padding:1rem`. `/40`은 투명도 40%(`white/40`).
외우지 말고 **에디터에 "Tailwind CSS IntelliSense" 확장**을 깔면 자동완성·미리보기가
다 됩니다.

### 3-3. 예외: 순수 CSS가 필요할 때 — `globals.css`

Tailwind로 표현 못 하는 복잡한 애니메이션은 순수 CSS로. 이 프로젝트의 스타워즈 크롤이
그 예입니다(`src/app/globals.css`):
```css
@keyframes sw-crawl {
  from { transform: rotateX(10deg) translateY(100%); }
  to   { transform: rotateX(10deg) translateY(-250%); }
}
.starwars-crawl-once { animation: sw-crawl 32s linear forwards; }
```
어제(Day 0) 스토리 작업에서 이 `32s`를 20s에서 늘린 게 바로 이 파일입니다.

> 📌 **더 깊이**: [`docs/08-스타일링.md`](../docs/08-스타일링.md)가 Tailwind 문법과
> 크롤 CSS를 이 저장소 기준으로 풉니다.

---

## 4. 반응형과 모바일 — 모바일 퍼스트 (§13)

이 게임은 **모바일 우선**입니다(§1). Tailwind의 반응형은 **"기본은 모바일, 넓어지면
덮어쓰기"** 방식입니다:

```tsx
<h1 className="text-4xl md:text-6xl">   // 기본 4xl(모바일), md(768px+)에서 6xl
```
- 접두사 없는 클래스 = 모든 화면.
- `md:` = 화면 폭 768px 이상일 때만. `sm:` `lg:` `xl:`도 있음.
- 이 순서(작은 화면 기본 → 큰 화면 덮어쓰기)가 "모바일 퍼스트"의 실물.

**모바일 특수 대응(§13)**:
- **safe-area**: 노치·둥근 모서리 폰에서 내용이 잘리지 않게. `page.tsx`:
  `paddingTop: "max(4rem, env(safe-area-inset-top))"` — 노치만큼 자동으로 밀어냄.
- **핀치 줌 금지**: `layout.tsx`의 viewport 설정(`maximumScale: 1`)으로 더블탭 확대가
  조이스틱 조작을 방해하지 않게(§12).
- **`touch-none`**: 캔버스에 이 클래스가 없으면 드래그를 브라우저가 스크롤로 가로챕니다.
  게임 입력의 필수(§12).

---

## 5. PWA — 웹을 앱처럼 (설치·오프라인)

**PWA(Progressive Web App)**: 웹사이트를 홈 화면에 설치하고 오프라인에서도 돌리는 기술.
두 재료가 필요합니다: **매니페스트**(앱 정보) + **서비스 워커**(오프라인 캐시).

### 5-1. 웹 앱 매니페스트 — 앱의 신분증

```ts
// src/app/manifest.ts → /manifest.webmanifest 로 자동 서빙
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SPACE JOOPS",
    display: "fullscreen",       // 설치하면 브라우저 UI 없이 전체화면
    orientation: "portrait",     // 세로 고정
    backgroundColor: "#141838",  // 우주색
    icons: [ /* 192·512px */ ],
  };
}
```
앱 아이콘조차 **코드로 생성**합니다(§11 에셋 0개): `pwa-icon.tsx`가 마스코트 도트를
`ImageResponse`로 그립니다. 도트 좌표(`mascot-cells.ts`)를 OG 이미지와 공유해, 도트를
바꾸면 아이콘·소셜 프리뷰가 함께 갱신됩니다.

---

## 6. 서비스 워커 — 캐시 전략 (데이터 엔지니어의 홈그라운드)

**서비스 워커**는 브라우저와 네트워크 사이에 앉은 **프록시**입니다. 모든 요청을
가로채 "캐시에서 줄지, 네트워크로 갈지"를 코드로 결정합니다. 이건 당신이 아는
**캐싱 전략** 그 자체입니다.

이 프로젝트의 `public/sw.js`는 **요청 종류별로 다른 전략**을 씁니다(§13). "하나로
통일하면 어딘가는 반드시 곪는다"는 주석이 핵심 통찰입니다:

```js
// public/sw.js — 실제 코드의 뼈대
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;                 // POST(Supabase 제출)는 절대 캐시 X
  if (url.origin !== self.location.origin) return;  // 교차 출처(폰트·Supabase)는 손 X

  // 1) 페이지 이동 → 네트워크 우선 (새 배포가 캐시에 막히면 안 됨. 오프라인만 셸 폴백)
  // 2) /_next/static/·아이콘 → 캐시 우선 (파일명에 해시 = 내용 불변)
  // 3) 그 외 동일 출처 GET → stale-while-revalidate (캐시로 빠르게, 뒤에서 갱신)
});
```

세 전략을 데이터 파이프라인 용어로:

| 전략 | 동작 | 언제 | 파이프라인 비유 |
|---|---|---|---|
| **네트워크 우선** | 최신을 받고, 실패 시 캐시 | 페이지(HTML) — 항상 최신 배포 | write-through, 신선도 우선 |
| **캐시 우선** | 캐시에 있으면 끝 | 해시 자산(불변) | 불변 데이터의 영구 캐시 |
| **stale-while-revalidate** | 캐시로 즉답 + 백그라운드 갱신 | 나머지 | 캐시로 지연↓, 비동기 리프레시 |

**배포 갱신 메커니즘(§13)**: 등록 URL이 `/sw.js?v={package.json 버전}`이라, 버전을
올려 배포하면 브라우저가 새 워커를 감지 → `sw-register.tsx`가 "새 버전 도착" 토스트 →
사용자가 누르면 `SKIP_WAITING` → 교대 → 리로드. **리로드는 사용자가 누를 때만** — 게임
도중 멋대로 새로고침하면 안 되니까(§13). 개발 중엔 등록 안 함(핫리로드 오염 방지).

> 📌 **더 깊이**: [`docs/06-브라우저-API.md`](../docs/06-브라우저-API.md)의 PWA/서비스
> 워커 절.

---

## 7. 접근성(a11y) — 모두를 위한 UI

1티어 개발자의 필수 소양입니다. 이 프로젝트가 지키는 것들(§13):
- **의미 있는 태그**: `<button>`은 버튼, `<nav>`는 내비. 스크린 리더가 이해합니다.
  `<div onClick>` 남발 대신 `<button>`·`<Link>`.
- **장식엔 `aria-hidden`**: 순수 장식(배경 캔버스)은 보조기기가 무시하게.
  `AttractSky` 캔버스가 그렇습니다.
- **포커스 링 유지**: `focus-visible:` 클래스로 키보드 사용자가 "지금 어디"인지 보이게.
  `page.tsx`의 `focus-visible:scale-105`.
- **`prefers-reduced-motion`**: 움직임이 불편한 사용자에겐 애니메이션을 정지 화면으로.
  스토리 크롤의 `@media (prefers-reduced-motion: reduce)` 분기(§4).
- **정보는 HTML 텍스트로**: 캔버스 그림에만 의존하지 않고 HTML로도 정보 전달.

접근성은 "착한 일"이 아니라 **품질 지표**입니다. 데이터에서 결측·엣지 케이스를 챙기는
그 꼼꼼함을 UI에도 적용하는 것.

---

## 8. 메타데이터 · OG · 배포 — 어제 그 버그의 완결편

이제 Day 0에서 우리가 고친 OG 프리뷰 버그를 **완전히** 이해할 수 있습니다.

### 8-1. 메타데이터 → `<head>` (Day 2 복습)

`layout.tsx`의 `export const metadata`가 `<title>`·OG·트위터 태그를 만듭니다. 파일
컨벤션 `opengraph-image.tsx`가 있으면 Next가 `og:image` 태그를 자동으로 붙입니다.

### 8-2. OG 이미지도 코드로 (§11·§13)

```tsx
// src/lib/og.tsx — next/og의 ImageResponse로 1200×630 PNG를 코드 생성
// 마스코트 도트(mascot-cells.ts) + "SPACE JOOPS" 텍스트. 폰트 fetch 없이(빌드 안정성).
```
소셜(카톡·트위터·슬랙)이 링크를 펼칠 때 이 이미지를 크롤러가 가져가 보여줍니다.

### 8-3. 왜 프리뷰가 안 떴나 — `metadataBase`의 절대 URL

크롤러는 `og:image`를 **절대 URL**로 가져갑니다. 그 URL은 `metadataBase`를 기준으로
만들어집니다:
```ts
// 문제였던 코드
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3004");
```
- `VERCEL_URL`은 **배포마다 바뀌는** per-deployment 프리뷰 URL이라 프로덕션 도메인이
  아니고, 배포 보호가 켜지면 크롤러가 401 → **이미지 못 가져옴 → 프리뷰 빔**.
- 수정(PR #7): `VERCEL_PROJECT_PRODUCTION_URL`(안정적 프로덕션 도메인)을 우선 사용.

**배포 플랫폼 Vercel**: `git push`하면 자동 빌드·배포되는 서버리스 호스팅(파이썬의
Cloud Run/Lambda 감각). 환경변수(`VERCEL_*`)를 빌드에 주입합니다. `NEXT_PUBLIC_`
접두사가 붙은 env만 **브라우저 번들에 노출**됩니다(그 외는 서버 전용) — 비밀키를 실수로
노출하지 않게 하는 규칙. 데이터 엔지니어의 "secret vs public 설정 분리"와 같은 원칙.

### 8-4. 소셜 프리뷰 검증 도구
배포 후 `opengraph.xyz`, Facebook Sharing Debugger, Twitter Card Validator에 URL을
넣어 재스크랩하면 프리뷰가 갱신됩니다(카카오톡은 캐시가 있어 시간이 걸림). 어제 PR
본문에 이 체크리스트를 넣은 이유입니다.

---

## 9. 실습

1. **박스 모델 눈으로 보기**: 게임을 열고 F12 → Elements 탭에서 아무 요소나 클릭 →
   우측 "Computed"의 박스 다이어그램(margin/border/padding)을 확인. 값을 실시간으로
   바꿔 보기(브라우저에서 임시 편집, 새로고침하면 원복).

2. **Tailwind 조립**: `page.tsx`의 `<Link href="/rank">` 클래스에서 `border-2`를
   `border-4`로, `text-sm`을 `text-lg`로 바꿔 저장 → 화면 변화 확인. **되돌리기.**

3. **반응형 체험**: F12 → 기기 툴바(모바일 뷰) 토글 → 창을 넓혔다 좁혔다 하며
   `md:text-6xl`이 언제 켜지는지 관찰(768px 경계).

4. **서비스 워커 관찰**: F12 → Application 탭 → Service Workers / Cache Storage에서
   `sjs-1` 캐시에 뭐가 담겼는지 확인. Network 탭에서 "Offline" 체크 후 새로고침 →
   게임이 오프라인으로도 뜨는지(§6 셸 폴백).

5. **읽기 과제**: `public/sw.js`를 처음부터 끝까지 읽고, 세 캐시 전략이 각각 어떤
   `if`에서 갈리는지 손가락으로 짚어 보기. `layout.tsx`의 `metadataBase` 세 갈래(env
   우선순위)를 그림으로 그려 보기.

---

## 10. 셀프 체크 ✅

- [ ] 박스 모델 4겹(content/padding/border/margin)을 안쪽부터 말할 수 있나?
- [ ] flexbox에서 `justify-content`와 `align-items`는 각각 어느 축인가?
- [ ] `md:text-6xl`은 언제 적용되나? "모바일 퍼스트"가 왜 이 순서인가?
- [ ] 서비스 워커의 세 캐시 전략과 각각 언제 쓰는지 말할 수 있나?
- [ ] 왜 POST 요청과 교차 출처는 캐시하지 않나?
- [ ] `NEXT_PUBLIC_` 접두사가 붙은 env와 안 붙은 env의 차이는?
- [ ] OG 프리뷰가 안 뜬 근본 원인(`metadataBase` + `VERCEL_URL`)을 설명할 수 있나?
- [ ] 접근성 대응 3가지(aria-hidden, focus-visible, prefers-reduced-motion)의 목적은?

---

## 다음 → [Day 5: 데이터와 프로덕션](./day-5-데이터와-프로덕션.md)

마지막 날은 당신의 홈그라운드입니다 — fetch·REST·Supabase(RLS/RPC)·견고성 철학,
그리고 디버깅·성능 프로파일링과 **캡스톤 과제**, 1티어로 가는 습관까지.
