# 실습 랩 ① — HTML: 우리 코드로 배우는 문서의 뼈대

> **이 랩의 목적**
> Day 2~4의 커리큘럼이 "큰 그림"이라면, 이 랩은 **HTML 문법 하나하나를 우리 저장소의
> 실제 코드로** 익히고 손으로 연습하는 곳입니다. 배경지식(왜 이렇게 생겼나) → 문법 →
> 우리 코드 예제 → 연습 문제 순서로, 외우지 말고 **만들어 보며** 익힙니다.
>
> **선행**: [Day 2](./day-2-react-nextjs.md)에서 JSX와 컴포넌트를 봤다면 충분합니다.

---

## 0. 배경지식 — HTML이란 무엇인가

**HTML(HyperText Markup Language)** 은 "프로그래밍 언어"가 아니라 **마크업 언어**입니다.
계산하거나 반복하지 않습니다. 오직 **"이 텍스트는 제목이다", "이건 문단이다", "이건
버튼이다"** 라고 **의미를 표시(mark up)** 할 뿐입니다.

- 브라우저는 HTML을 읽어 **DOM(Document Object Model)** 이라는 객체 트리를 만듭니다.
- CSS가 그 트리에 **모양**을 입히고, JavaScript가 **행동**을 붙입니다.
- 이 셋의 역할 분담이 웹의 근본입니다: **HTML=구조, CSS=표현, JS=행동.**

> **데이터 엔지니어 비유**: HTML은 데이터의 **스키마·구조 정의**에 가깝습니다. 값이
> 아니라 "이 필드가 무엇인지"를 태그로 표시하는 것. 시맨틱(의미) 태그를 잘 쓰는 건
> 컬럼명을 잘 짓는 것과 같습니다 — 기계(스크린 리더·검색엔진)와 사람 모두가 읽습니다.

### 이 프로젝트에서 HTML은 어떻게 등장하나?

우리는 `.html` 파일을 거의 안 씁니다. 대신 **JSX**(Day 2)로 HTML 요소를 씁니다. 문법이
99% 같되 몇 가지 차이(예: `class` → `className`)만 있습니다. 이 랩은 그 차이까지 함께
짚습니다. 순수 HTML 실습도 병행하니, JSX든 순수 HTML이든 둘 다 손에 익습니다.

---

## 1. 요소(element)와 태그(tag)

HTML의 기본 단위는 **요소**이고, 요소는 **여는 태그 + 내용 + 닫는 태그**로 씁니다.

```html
<p>안녕하세요</p>
│  │        │
│  │        └ 닫는 태그
│  └ 내용(content)
└ 여는 태그
```

- 내용이 없는 요소는 **자기 닫기**: `<br />`, `<img />`, `<input />`.
- 요소는 **중첩**됩니다(트리 구조):
  ```html
  <section>
    <h2>제목</h2>
    <p>문단 <strong>강조</strong> 이어짐</p>
  </section>
  ```

**우리 코드 (`src/app/page.tsx` — JSX지만 HTML 요소 그대로):**
```tsx
<header className="flex flex-col items-center gap-4">
  <p className="font-pixel text-[10px] tracking-widest text-gray-400">
    2061 · LOW EARTH ORBIT
  </p>
  <h1 className="font-pixel text-4xl" style={{ color: COLORS.accent }}>
    SPACE JOOPS
  </h1>
</header>
```
`<header>` 안에 `<p>`와 `<h1>`이 중첩된 트리입니다. `className`·`style`은 **속성**(§3).

---

## 2. 시맨틱 요소 — 의미가 있는 태그 (중요)

`<div>`(의미 없는 상자)만 쓰면 기계가 구조를 모릅니다. **시맨틱 요소**는 "이게 무슨
역할인지"를 알립니다. 우리 랜딩 페이지가 좋은 교보재입니다:

| 요소 | 의미 | 우리 코드 위치 |
|---|---|---|
| `<main>` | 페이지의 주요 내용 (하나만) | `page.tsx` 최상위 `<main>` |
| `<header>` | 머리말·타이틀 영역 | 타이틀 블록 |
| `<section>` | 주제로 묶인 구역 | 게임 규칙 목록 |
| `<footer>` | 꼬리말(버전·링크) | 하단 각주 |
| `<nav>` | 내비게이션 링크 모음 | (링크 그룹에 쓸 수 있음) |
| `<h1>`~`<h6>` | 제목 계층 (h1은 페이지당 하나) | `<h1>SPACE JOOPS</h1>` |
| `<p>` | 문단 | 규칙 설명들 |
| `<ul>`/`<ol>`/`<li>` | 목록(순서 없음/있음/항목) | 랭킹·규칙 목록에 적합 |
| `<button>` | 누르는 버튼 | 공유·설치 버튼 |
| `<a>` | 하이퍼링크 | (Next에선 `<Link>`가 감쌈, §5) |

**왜 중요한가**:
- **접근성**: 스크린 리더가 "여기가 본문", "이건 버튼"이라 읽어 줍니다(Day 4 §7).
- **SEO**: 검색엔진이 구조를 이해합니다.
- **가독성**: `<div>` 20개보다 `<header><main><footer>`가 사람에게도 명확합니다.

> **안티패턴**: `<div onClick=...>`로 버튼 흉내 내지 마세요. 진짜 `<button>`을 쓰면
> 키보드 포커스·엔터 실행·스크린 리더 지원이 **공짜로** 옵니다. 우리 `ShareButton`이
> `<button>`을 쓰는 이유입니다.

---

## 3. 속성(attribute) — 요소에 정보 붙이기

여는 태그 안에 `이름="값"`으로 씁니다. 파이썬 함수의 키워드 인자 같은 것.

```html
<a href="/play" target="_blank" title="게임 시작">플레이</a>
   │            │              │
   └ 링크 목적지  └ 새 탭으로     └ 마우스 올리면 뜨는 설명
```

**자주 쓰는 속성**:
| 속성 | 용도 |
|---|---|
| `href` | 링크 목적지 (`<a>`, `<Link>`) |
| `src` | 이미지·미디어 소스 (`<img>`) |
| `alt` | 이미지 대체 텍스트 (접근성 필수) |
| `id` | 고유 식별자 (JS·CSS가 특정 요소 지목) |
| `class` (JSX: `className`) | CSS 클래스 (스타일 부착) |
| `style` | 인라인 스타일 |
| `type` | 입력·버튼 종류 (`<input type="text">`) |
| `disabled`, `checked` | 불리언 상태 |
| `aria-*` | 접근성 정보 (`aria-hidden`, `aria-label`) |
| `data-*` | 커스텀 데이터 (`data-theme` 등) |

**JSX와 순수 HTML의 차이 (외울 것 3개)**:
1. `class` → **`className`** (`class`가 JS 예약어라서).
2. `style`은 문자열이 아니라 **객체**: `style={{ color: "#fff" }}` (CSS 속성은 카멜케이스
   `backgroundColor`).
3. 이벤트는 `onclick` → **`onClick`**(카멜케이스), 값은 함수: `onClick={() => f()}`.

**우리 코드 (`page.tsx`):**
```tsx
<h1
  className="font-pixel text-4xl font-bold md:text-6xl"     // 여러 CSS 클래스 (공백 구분)
  style={{ color: COLORS.accent, textShadow: "4px 4px 0 #000" }}  // 인라인 스타일 객체
>
  SPACE JOOPS
</h1>
```
`aria-hidden` 예 — 배경 장식 캔버스는 보조기기가 무시하게(Day 4 §7):
```tsx
<canvas aria-hidden />   // 순수 HTML이면 <canvas aria-hidden="true">
```

---

## 4. 텍스트 요소와 특수 문자

```html
<h1>큰 제목</h1> ... <h6>작은 제목</h6>
<p>문단</p>
<strong>중요(굵게)</strong>  <em>강조(기울임)</em>
<span>의미 없는 인라인 묶음</span>   <!-- 스타일링용 -->
<br />     <!-- 줄바꿈 -->
<!-- 이건 주석 -->
```
- **블록 요소**(`<p>`, `<h1>`, `<div>`)는 세로로 쌓이고 가로 전체를 차지.
- **인라인 요소**(`<span>`, `<strong>`, `<a>`)는 글자처럼 옆으로 흐름.
- 특수 문자는 **엔티티**로: `&amp;`(&), `&lt;`(<), `&gt;`(>), `&nbsp;`(공백).
  우리 `page.tsx`에 `{" "}`가 보이는데, JSX에서 의도적 공백을 넣는 방법입니다.

---

## 5. 링크와 이미지, 그리고 Next.js의 `<Link>`

### 순수 HTML
```html
<a href="/rank">랭킹 보기</a>                    <!-- 페이지 이동 -->
<a href="https://example.com" target="_blank" rel="noopener">외부</a>
<img src="/photo.png" alt="설명 텍스트" width="200" />
```

### 우리 코드 — `<Link>` (Day 2 §7-2 복습)
Next.js는 `<a>` 대신 `<Link>`로 **빠른 내부 이동**(페이지 통째로 안 받고 부분 교체):
```tsx
import Link from "next/link";
<Link href="/play?start=1" className="...">TAP TO START</Link>
<Link href="/rank" className="...">랭킹 보기</Link>
```
- `href`에 쿼리스트링 `?start=1`을 붙이면 `/play`가 읽어 "타이틀 건너뛰고 시작"에 씁니다.
- 외부 링크(`https://`)는 여전히 `<a>`로 쓰고, `rel="noopener"`로 보안 처리.

---

## 6. `<canvas>` — 우리 게임의 화면 (특별 요소)

`<canvas>`는 "코드로 그림을 그리는 빈 도화지" 요소입니다(Day 3). HTML은 도화지만
선언하고, 실제 그림은 JS가 그립니다.

```tsx
// 개념 — 게임/궤도/도감이 전부 이 패턴
<canvas ref={canvasRef} className="touch-none" aria-hidden />
```
- `ref`(Day 2 §5-1): JS가 이 DOM 요소를 붙잡아 `getContext("2d")`로 그림.
- `className="touch-none"`(Day 4 §4): 드래그를 브라우저 스크롤로 뺏기지 않게 — 게임
  입력의 필수.
- `aria-hidden`: 장식이라 보조기기가 무시.
- 순수 HTML에선 크기를 `<canvas width="400" height="300">`로 주지만, 우리는 CSS로
  크기를 잡고 `fitCanvas`(Day 3 §6-1)가 DPR을 맞춥니다.

---

## 7. 폼과 입력 — 설정 화면의 재료

`/settings`(§8-4)는 입력 요소로 캐릭터·언어·위치를 고릅니다. 폼 요소를 배웁니다.

```html
<!-- 텍스트 입력 -->
<input type="text" placeholder="펫 이름" value="줍스" />
<!-- 숫자 -->
<input type="number" min="-90" max="90" step="0.1" />
<!-- 선택 목록 -->
<select>
  <option value="ko">한국어</option>
  <option value="en">English</option>
</select>
<!-- 체크박스 / 라디오 -->
<input type="checkbox" checked />
<input type="radio" name="char" value="mint" />
<!-- 라벨(접근성) — 클릭 영역을 넓히고 스크린 리더가 짝지음 -->
<label>이름 <input type="text" /></label>
<button type="button">저장</button>
```

**React의 "제어 컴포넌트"** — 입력값을 상태로 관리(Day 2 §3):
```tsx
"use client";
const [name, setName] = useState("");
<input
  type="text"
  value={name}                              // 상태가 화면을 지배
  onChange={(e) => setName(e.target.value)} // 입력 → 상태 갱신 → 리렌더
/>
```
`value`와 `onChange`가 짝을 이뤄 "화면 = f(상태)"를 입력에도 적용합니다. `e.target.value`가
사용자가 친 글자입니다.

> **배경**: 원래 HTML 폼은 서버로 `submit`해 페이지를 새로 받았습니다(파이썬 Flask의
> `request.form`). React는 대개 `onChange`로 실시간 상태를 잡고 JS로 처리해, 새로고침
> 없이 반응합니다. 우리 설정은 "저장 버튼 없이 즉시 저장"(§8-4)이라 이 방식이 딱입니다.

---

## 8. 문서의 뼈대 — `<html>`·`<head>`·`<body>`

모든 HTML 문서의 최상위 구조입니다. Next.js에선 `layout.tsx`가 이걸 만듭니다:

```tsx
// src/app/layout.tsx (개념)
<html lang="en">          {/* lang: 언어 — 스크린 리더·번역기가 읽음. 아랍어면 dir="rtl" */}
  <body>
    <I18nProvider>{children}</I18nProvider>
  </body>
</html>
```
- `<head>`(Next가 `metadata`로 생성): 화면에 안 보이는 정보 — `<title>`, OG 태그(Day 4 §8),
  파비콘, 뷰포트 설정.
- `<body>`: 실제로 보이는 모든 것.
- `lang`/`dir` 속성이 i18n(§2)에서 언어·글자 방향을 정합니다.

---

## 9. 연습 문제 (직접 손으로!)

빌드 없이 순수 HTML로 감을 잡습니다. `practice.html`로 저장하고 브라우저로 여세요.

### 연습 1 — 시맨틱 구조 만들기
아래 뼈대를 완성해, 우리 랜딩과 비슷한 구조를 순수 HTML로 만드세요.
```html
<!doctype html>
<html lang="ko">
<head><meta charset="utf-8"><title>연습</title></head>
<body>
  <main>
    <header>
      <h1>내 게임</h1>
      <p>2061 · 지구 저궤도</p>
    </header>
    <!-- TODO: <section>에 규칙 3개를 <ul><li>로 -->
    <!-- TODO: <button>시작</button> -->
    <!-- TODO: <footer>에 버전 텍스트 -->
  </main>
</body>
</html>
```
검증: F12 → Elements에서 트리가 `main > header/section/footer`로 잡히는지.

### 연습 2 — 속성과 링크
- `<a>`로 외부 링크를 만들되 새 탭(`target="_blank" rel="noopener"`)으로 열기.
- `<img>`에 `alt`를 넣고, 일부러 `src`를 깨진 경로로 줘서 `alt`가 대체 표시되는지 확인
  (접근성이 왜 필요한지 체감).

### 연습 3 — 폼 다루기
텍스트 입력 + 셀렉트 + 버튼을 만들고, `<label>`로 각 입력을 감싸 클릭 영역을 넓히기.
셀렉트에 언어 3개(`ko`/`en`/`ja`)를 `<option>`으로.

### 연습 4 — 우리 코드 읽기
`src/app/page.tsx`를 열고, 사용된 **시맨틱 요소를 전부 찾아** 목록으로 적기
(`main`/`header`/`section`/`footer` + `h1`/`p`/`Link`). 각각 "왜 `<div>`가 아니라 이걸
썼을까"를 한 줄로.

### 연습 5 — JSX 차이 잡기
순수 HTML `<div class="box" onclick="alert('hi')">`를 JSX로 바꿔 쓰기(정답: `className`,
`onClick={() => alert('hi')}`). 왜 바뀌는지 설명.

---

## 10. 셀프 체크 ✅
- [ ] HTML/CSS/JS의 역할 분담(구조/표현/행동)을 말할 수 있나?
- [ ] 시맨틱 요소를 쓰면 얻는 이점 3가지는?
- [ ] `<div onClick>` 대신 `<button>`을 쓰는 이유는?
- [ ] JSX가 순수 HTML과 다른 점 3가지(`className`, `style` 객체, `onClick`)?
- [ ] `<canvas>`에 `touch-none`·`aria-hidden`이 왜 붙나?
- [ ] React 제어 컴포넌트에서 `value`와 `onChange`는 왜 짝을 이루나?

---

→ 다음 랩: [② CSS](./lab-css.md) · [③ JavaScript](./lab-js.md)
→ 커리큘럼: [Day 2](./day-2-react-nextjs.md) · [Day 4](./day-4-스타일과-플랫폼.md)
