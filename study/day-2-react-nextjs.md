# Day 2 — React 19 & Next.js 15 App Router

> **오늘의 목표**
> 1. "명령형 → 선언형" 패러다임 전환을 몸으로 이해한다.
> 2. 컴포넌트·JSX·props·훅(useState/useEffect/useRef/useCallback)을 쓴다.
> 3. **서버 컴포넌트 vs 클라이언트 컴포넌트**의 경계를 안다 (Next.js의 핵심).
> 4. Next.js App Router의 파일 기반 라우팅을 FastAPI 라우터에 매핑한다.
>
> **끝나면**: 이 프로젝트의 `page.tsx`·`best-score.tsx`·`i18n-provider.tsx`를 읽고,
> "이 컴포넌트는 언제 다시 그려지나?"에 답할 수 있다.

---

## 0. 하루 타임박스

| 시간 | 내용 |
|---|---|
| 오전 1 | §1 선언형 패러다임 · §2 컴포넌트와 JSX |
| 오전 2 | §3 상태와 useState · §4 useEffect |
| 오후 1 | §5 useRef·useCallback · §6 서버/클라 컴포넌트 |
| 오후 2 | §7 Next.js 라우팅·메타데이터 · §8 실제 코드 정독 |
| 저녁 | §9 실습 · §10 셀프 체크 |

---

## 1. 패러다임 전환: 화면을 "명령"하지 말고 "선언"하라

데이터 엔지니어로서 당신은 **명령형(imperative)** 코드에 익숙합니다: "이걸 하고,
그다음 저걸 하고, DOM의 이 요소를 찾아서 텍스트를 바꿔라."

React는 정반대입니다. **선언형(declarative)**: "상태가 이러이러할 때, 화면은
이렇게 생겨야 한다"를 함수로 **선언**하면, React가 실제 DOM 조작을 알아서 합니다.

```
명령형 (jQuery 시대):  점수가 바뀌면 → document.getElementById("score").innerText = n
선언형 (React):        화면 = f(상태).  상태 n이 바뀌면 → React가 화면을 다시 계산
```

**데이터 파이프라인 비유**: React 컴포넌트는 순수 함수 `UI = render(state)`입니다.
당신이 Spark에서 `df.transform(...)`으로 "입력→출력 규칙"만 선언하면 엔진이 실행
계획을 짜듯, React에선 "상태→화면 규칙"만 선언하면 React가 최소한의 DOM 변경을
계산(reconciliation, "재조정")합니다. **당신은 결과를 기술하고, 엔진이 방법을 정한다.**

> 이 한 문장이 오늘의 전부입니다: **`화면 = f(상태)`. 상태를 바꾸면 화면이 따라온다.**

---

## 2. 컴포넌트와 JSX

### 2-1. 컴포넌트 = 화면 조각을 반환하는 함수

```tsx
// src/app/best-score.tsx — 실제 코드 (거의 전문)
export function BestScore() {
  const best = useSyncExternalStore(subscribe, loadBest, () => 0);
  if (best <= 0) return null;                 // 조건부 렌더: 기록 없으면 아무것도 안 그림
  return (
    <p className="text-sm" style={{ color: COLORS.accent }}>
      ★ BEST: {best}
    </p>
  );
}
```

- 컴포넌트는 **대문자로 시작하는 함수**입니다(관례가 아니라 규칙 — React가 소문자를
  HTML 태그로 취급).
- 반환값은 **JSX** — HTML처럼 생긴 것. `return null`이면 "아무것도 안 그림".
- `{best}`처럼 중괄호 안엔 **JS 표현식**이 들어갑니다 (파이썬 f-string의 `{}`와 유사).

### 2-2. JSX는 HTML이 아니라 "함수 호출의 설탕"

JSX `<p className="...">★ BEST: {best}</p>`는 빌드 시 `React.createElement("p", {...}, ...)`
같은 함수 호출로 변환됩니다. 그래서:
- `class`가 아니라 **`className`** (class는 JS 예약어).
- `style`은 문자열이 아니라 **객체**: `style={{ color: ... }}` (바깥 `{}`는 JSX 표현식,
  안쪽 `{}`는 JS 객체). CSS 속성은 카멜케이스(`textShadow`, `backgroundColor`).
- 태그는 반드시 닫아야 함: `<br />`, `<img />`.
- 최상위는 하나로 감싸야 함 → 감쌀 태그가 싫으면 **프래그먼트** `<>...</>`.

### 2-3. props = 함수 인자

컴포넌트에 데이터를 넘기는 법. 파이썬 함수 인자와 같되, "속성"처럼 씁니다.

```tsx
// 정의
function Medal({ rank, name }: { rank: number; name: string }) {
  return <li>{rank}위: {name}</li>;
}
// 사용
<Medal rank={1} name="줍스" />
```
`props`는 **읽기 전용**입니다 — 자식이 부모 데이터를 직접 바꾸지 않습니다(단방향
데이터 흐름). 바꾸려면 부모가 콜백 함수를 prop으로 내려 줍니다.

---

## 3. useState — 컴포넌트의 기억

컴포넌트는 함수라 매번 처음부터 실행됩니다. 그럼 "값을 기억"하려면? **useState 훅.**

```tsx
// 개념 예시 (share-button.tsx의 실제 패턴)
const [copied, setCopied] = useState(false);   // [현재값, 바꾸는 함수] = useState(초기값)

const onShare = async () => {
  await navigator.clipboard.writeText(url);
  setCopied(true);                    // ← 상태 변경 → React가 이 컴포넌트를 다시 그림
  setTimeout(() => setCopied(false), 2000);
};
return <button>{copied ? "복사됨!" : "공유하기"}</button>;
```

**핵심 규칙**:
- `setCopied(true)`를 호출하면 React가 이 컴포넌트 함수를 **다시 실행**하고, 이번엔
  `copied`가 `true`입니다 → 화면이 바뀝니다. 이게 `화면 = f(상태)`의 실물.
- **직접 대입 금지**: `copied = true`는 안 됩니다. 반드시 `setCopied(...)`. (React가
  "바뀌었다"를 알아야 다시 그리니까.)
- useState는 **컴포넌트 최상단에서만**, 조건문·반복문 안에서 호출하면 안 됩니다
  (훅의 규칙 — React가 호출 순서로 상태를 추적하기 때문).

> **데이터 엔지니어 주의보**: "매번 함수를 처음부터 실행한다"가 이상하게 느껴질 겁니다.
> React는 컴포넌트를 **재료 함수**로 봅니다. useState는 그 함수 바깥(React 내부)에
> 값을 보관해 두고, 재실행 때마다 최신값을 꽂아 줍니다. 함수는 stateless처럼 보이지만
> 훅이 상태를 "바깥에서" 관리하는 구조입니다.

---

## 4. useEffect — 바깥 세계와의 다리

React 컴포넌트는 순수하게 "상태→화면"만 해야 합니다. 그런데 실제 앱은 바깥 세계와
상호작용해야 합니다: 타이머 설정, 이벤트 리스너 등록, 네트워크 요청, 그리고 **이
프로젝트에선 게임 루프 시작**. 그 "부수 효과(side effect)"를 담는 곳이 `useEffect`.

```tsx
// story-intro.tsx — 실제 코드 (스토리 사운드 수명주기)
useEffect(() => {
  if (!open) return;
  setMuted(loadMuted());
  ensureAudio();
  startStoryTheme();            // 효과: 오디오 시작
  return () => stopStoryTheme(); // 정리(cleanup): 언마운트/재실행 전에 오디오 정지
}, [open]);                      // 의존성 배열: open이 바뀔 때만 이 효과를 다시 돌린다
```

세 부분을 뜯어보면:
1. **효과 함수** `() => { ... }` : 렌더 후에 실행됩니다.
2. **정리 함수** `return () => { ... }` : 다음 효과 실행 전 또는 컴포넌트가 사라질 때
   실행. 리스너 해제·타이머 정리·리소스 반납. (파이썬 `with`/`finally` 또는
   컨텍스트 매니저의 `__exit__`와 같은 정신.)
3. **의존성 배열** `[open]` : 이 값이 바뀔 때만 효과를 다시 돌립니다.
   - `[]` (빈 배열): **마운트 시 딱 한 번** (+ 언마운트 시 정리). 게임 루프 시작에 쓰임.
   - 배열 생략: 매 렌더마다 (거의 안 씀).
   - `[a, b]`: a나 b가 바뀔 때마다.

**정리 함수를 빠뜨리면?** 리스너·타이머·rAF·오디오 컨텍스트가 새어(leak) 앱이 무거워지고
버그가 생깁니다. 이 프로젝트가 §12에서 "useEffect 정리에서 rAF·리스너·AudioContext를
반드시 해제"를 강조하는 이유입니다. 데이터 파이프라인에서 파일 핸들·커넥션을 반드시
닫는 것과 똑같은 규율입니다.

> ⚠️ **흔한 함정**: 의존성 배열에 넣어야 할 값을 빠뜨리면 효과가 옛날 값을 붙잡고
> 안 갱신됩니다(stale closure). ESLint의 `react-hooks/exhaustive-deps` 규칙이 잡아 줍니다.
> `npm run lint`를 믿으세요.

---

## 5. useRef & useCallback — 리렌더 없이 기억하기

### 5-1. useRef — "다시 그리지 않아도 되는 상자"

`useState`는 바꾸면 리렌더를 일으킵니다. 그런데 리렌더가 **필요 없는** 값도 있습니다:
`<canvas>` DOM 요소 참조, 애니메이션 프레임 ID, 게임 루프 내부 변수.

```tsx
const canvasRef = useRef<HTMLCanvasElement>(null);
// ...
return <canvas ref={canvasRef} />;   // 마운트되면 canvasRef.current = 그 DOM 요소
```
- `ref.current`를 바꿔도 **리렌더가 안 일어납니다**. 그래서 60fps로 매 프레임 바뀌는
  게임 상태를 여기(또는 useEffect 클로저 변수)에 둡니다. Day 3의 대원칙과 직결.
- `<canvas>`의 실제 픽셀에 접근하려면 이 참조가 필요합니다 (`getContext("2d")`).

### 5-2. useCallback — 함수의 정체성 고정

```tsx
// story-intro.tsx — 실제 코드
const close = useCallback(() => {
  markIntroSeen();
  setOpen(false);
}, []);
```
컴포넌트가 리렌더될 때마다 함수도 새로 만들어집니다. 그 함수를 useEffect 의존성이나
자식 prop으로 넘기면 "매번 다른 함수"라 효과가 계속 다시 돕니다. `useCallback`은
**함수를 기억**해 정체성을 고정합니다. 지금은 "성능·안정성용 도구"로만 알아 두고,
Day 3에서 게임 루프와 함께 다시 봅니다.

---

## 6. 서버 컴포넌트 vs 클라이언트 컴포넌트 — Next.js의 심장

이게 Next.js App Router에서 **가장 헷갈리지만 가장 중요한** 개념입니다. 집중하세요.

### 6-1. 두 종류의 컴포넌트

- **서버 컴포넌트 (기본값)**: 서버(빌드 타임 또는 요청 시)에서 실행되고, 결과 HTML만
  브라우저로 보냅니다. **JS 번들에 안 실림** → 빠름. 단, `useState`·`useEffect`·이벤트
  핸들러·브라우저 API(`window`, `localStorage`)를 **쓸 수 없음**.
- **클라이언트 컴포넌트**: 파일 맨 위에 **`"use client";`** 선언. 브라우저에서 실행되고,
  훅·이벤트·브라우저 API를 다 쓸 수 있음. 대신 JS로 브라우저에 전송됨.

```tsx
// src/app/page.tsx — 첫 줄에 "use client"가 없다 → 서버 컴포넌트
import pkg from "../../package.json";   // 서버라서 빌드 시점에 파일을 직접 읽을 수 있다!
export default function Home() {
  return <main> ... v{pkg.version} ... </main>;
}
```
```tsx
// src/app/best-score.tsx — 첫 줄이 "use client" → 클라이언트 컴포넌트
"use client";
export function BestScore() {
  const best = useSyncExternalStore(subscribe, loadBest, () => 0); // localStorage = 브라우저 전용
  // ...
}
```

### 6-2. 왜 나누나? 그리고 어떻게 섞나?

**랜딩 페이지 `page.tsx`(서버 컴포넌트)** 를 보세요. 이 페이지는 대부분 정적이라
서버에서 HTML로 구워 빠르게 보냅니다. 하지만 `<BestScore/>`(localStorage 필요)나
`<ShareButton/>`(클릭 이벤트 필요)은 브라우저가 필요하죠. 그래서:

> **서버 컴포넌트가 뼈대를 그리고, 브라우저가 필요한 조각만 클라이언트 컴포넌트로
> "섬(island)"처럼 꽂는다.** page.tsx가 `<BestScore/>`·`<ShareButton/>`·`<StoryIntro/>`
> 를 자식으로 넣는 게 바로 이 패턴입니다.

**데이터 엔지니어 비유**: 서버 컴포넌트 = 배치(batch)로 미리 계산해 둔 결과(정적,
빠름). 클라이언트 컴포넌트 = 실시간 스트리밍이 필요한 부분. 무거운 실시간 로직을
꼭 필요한 곳에만 두는 최적화와 같은 사고입니다.

**규칙 요약**:
- 브라우저 API·훅·이벤트 핸들러 → `"use client"` 필요.
- 데이터를 그냥 보여주기만 → 서버 컴포넌트(기본)가 더 빠름.
- 서버 컴포넌트는 클라이언트 컴포넌트를 **자식으로 품을 수 있음**(page.tsx처럼). 반대로
  클라이언트 컴포넌트 안에서 서버 컴포넌트를 `import`해 쓸 수는 없음.

> 📌 **더 깊이**: [`docs/01-프로젝트-구조.md`](../docs/01-프로젝트-구조.md)가 이 경계와
> App Router 파일 구조를 이 저장소 기준으로 자세히 풉니다.

---

## 7. Next.js App Router — 파일이 곧 라우트

### 7-1. 폴더 = URL (FastAPI 라우터의 파일 버전)

FastAPI에선 `@app.get("/orbit")`로 경로를 코드에 씁니다. Next.js App Router는 **폴더
구조가 그대로 URL**입니다:

```
src/app/
├── page.tsx            →  /            (랜딩)
├── layout.tsx          →  모든 페이지를 감싸는 공통 껍데기 (<html><body>)
├── play/page.tsx       →  /play        (게임)
├── orbit/page.tsx      →  /orbit       (궤도 모니터)
├── settings/page.tsx   →  /settings    (설정)
├── rank/page.tsx       →  /rank
├── bag/page.tsx        →  /bag
└── og/route.tsx        →  /og          (이미지 API — route.tsx는 HTTP 핸들러)
```

| Next.js 파일 | 역할 | FastAPI 대응 |
|---|---|---|
| `page.tsx` | 그 경로의 화면 | `@app.get("/path")` 뷰 |
| `layout.tsx` | 하위 전체 공통 레이아웃 | 공통 의존성·미들웨어·베이스 템플릿 |
| `route.tsx` | HTTP 핸들러(JSON/이미지 반환) | 순수 API 엔드포인트 |
| `loading.tsx` | 로딩 중 화면 | — |
| `[id]/page.tsx` | 동적 경로 `/x/:id` | `@app.get("/x/{id}")` |

### 7-2. 페이지 이동 — `<Link>`

```tsx
import Link from "next/link";
<Link href="/play?start=1">TAP TO START</Link>   // page.tsx 실제 코드
```
`<a href>`와 달리 `<Link>`는 페이지를 통째로 새로 안 받고 **필요한 부분만 교체**합니다
(SPA 내비게이션 — 빠르고 상태 유지). 쿼리스트링 `?start=1`은 `/play`가 읽어 "타이틀
건너뛰고 바로 시작"에 씁니다(§4).

### 7-3. 메타데이터 — 코드로 `<head>` 만들기

우리가 어제 고친 그 무대입니다. 서버 컴포넌트는 `metadata`를 export해 `<head>`의
`<title>`·OG 태그를 선언합니다:

```tsx
// src/app/layout.tsx — 실제 코드(축약)
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),        // OG 이미지 절대 URL의 기준 (← PR #7의 핵심)
  title: "SPACE JOOPS · Space Snacks!",
  openGraph: { title, description, type: "website" },
  twitter: { card: "summary_large_image" },
};
```
Next.js가 이 객체를 진짜 `<meta>` 태그들로 변환합니다. `opengraph-image.tsx`라는
파일이 있으면 자동으로 `og:image` 태그까지 붙여 줍니다(파일 컨벤션). Day 4에서
서비스 워커·OG·배포를 한꺼번에 다룹니다.

---

## 8. 실제 코드 정독

에디터로 열고 관전 포인트를 찾으며 읽으세요.

### 8-1. `src/app/page.tsx` (서버 컴포넌트)
- `"use client"`가 **없음** → 서버 컴포넌트. 그래서 `import pkg from "../../package.json"`로
  버전을 빌드 타임에 읽음(브라우저에선 불가능한 일).
- JSX 구조: `<main>` 안에 `<header>`·`<section>`·`<Link>`·`<footer>`. 클라이언트 조각
  `<BestScore/>`·`<InstallButton/>`·`<ShareButton/>`·`<StoryIntro/>`가 섬처럼 박혀 있음.
- `<T k="landing.tagline" />` : i18n 번역 컴포넌트. §Day1의 사전이 여기서 화면에 나옴.
- `className="..."` 의 Tailwind 유틸리티들 → Day 4에서 해독.

### 8-2. `src/app/best-score.tsx` (클라이언트 컴포넌트)
- `useSyncExternalStore` : localStorage처럼 "React 바깥 저장소"를 구독하는 특수 훅.
  세 인자 = (구독 함수, 값 읽기, 서버용 기본값). 주석이 왜 이걸 쓰는지 설명함(서버엔
  localStorage가 없어 0, 하이드레이션 후 실제값으로 교체 + 다른 탭 변경 감지).
- `if (best <= 0) return null;` : 조건부 렌더의 실물.

### 8-3. `src/app/i18n-provider.tsx` (Context 패턴 예고)
- `useT()` 훅과 `<T>` 컴포넌트가 어떻게 언어 상태를 앱 전체에 뿌리는지 훑어보기.
  "Context"(전역 상태 공유)는 Day 5에서 더 봅니다. 오늘은 "provider가 감싸면 자식들이
  `useT()`로 언어를 꺼내 쓴다"만 이해하면 충분.

---

## 9. 실습

1. **컴포넌트 만들기**: `src/app/best-score.tsx`를 복제해 `hello.tsx`를 만들고,
   `export function Hello() { return <p>안녕, 프론트엔드!</p>; }`. `page.tsx`에서 import해
   `<BestScore/>` 아래에 `<Hello/>` 추가 → 화면에 뜨는지 확인. **되돌리기.**

2. **useState 체험**: `Hello`에 클릭하면 카운트가 오르는 버튼을 추가.
   ```tsx
   "use client";
   import { useState } from "react";
   export function Hello() {
     const [n, setN] = useState(0);
     return <button onClick={() => setN(n + 1)}>클릭 {n}</button>;
   }
   ```
   (`"use client"`를 빼면 왜 에러 나는지도 확인 → 이벤트 핸들러는 클라 전용.)

3. **서버/클라 경계 실험**: 방금 `Hello`에서 `"use client"`를 지우고 저장 → 브라우저·
   터미널의 에러 메시지 읽기. **다시 넣기.** 에러 메시지가 경계를 가르쳐 줍니다.

4. **useEffect + 정리**: `Hello`에 `useEffect(() => { const id = setInterval(() =>
   setN(x => x+1), 1000); return () => clearInterval(id); }, [])`를 넣어 1초마다 자동
   증가시키고, 정리 함수를 지웠을 때(타이머 누수) 콘솔이 어떻게 되는지 관찰. **되돌리기.**

5. **읽기 과제**: `page.tsx`에서 "서버에서만 가능한 일" 한 가지, `best-score.tsx`에서
   "브라우저에서만 가능한 일" 한 가지를 자기 말로 적어 보기.

---

## 10. 셀프 체크 ✅

- [ ] `화면 = f(상태)`를 자기 말로 설명하고, 명령형과 뭐가 다른지 말할 수 있나?
- [ ] `useState`로 값을 바꿀 때 왜 `x = ...`가 아니라 `setX(...)`를 쓰나?
- [ ] `useEffect`의 의존성 배열이 `[]`, `[open]`, 생략일 때 각각 언제 실행되나?
- [ ] 정리(cleanup) 함수는 왜 필요한가? 빠뜨리면 무슨 일이 생기나?
- [ ] `useRef`와 `useState`의 결정적 차이(리렌더)는? 왜 게임 상태는 ref/클로저에 두나?
- [ ] `"use client"`가 있는 파일과 없는 파일은 각각 어디서 실행되나? 서버 컴포넌트가
      못 하는 일 3가지는?
- [ ] Next.js에서 `/orbit` URL을 만들려면 어떤 파일을 어디에 두나?

---

## 다음 → [Day 3: 렌더링과 게임 루프](./day-3-렌더링과-게임루프.md)

내일은 이 프로젝트의 심장 — "60fps는 캔버스, 가끔은 React"라는 대원칙을 실제 게임 루프
코드로 해부합니다. 오늘 배운 useRef·useEffect·클로저가 전부 주역으로 등장합니다.
