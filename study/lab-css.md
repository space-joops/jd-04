# 실습 랩 ② — CSS: 우리 코드로 배우는 표현의 언어

> **이 랩의 목적**
> CSS 문법과 배경지식을 우리 저장소의 실제 스타일 코드(`globals.css`, `page.tsx`의
> Tailwind 클래스, 스타워즈 크롤 애니메이션)로 익히고 손으로 연습합니다. Tailwind를
> 쓰더라도 **그 밑의 순수 CSS를 알아야** 1티어가 됩니다 — 이 랩은 둘을 함께 봅니다.
>
> **선행**: [Day 4 §1~4](./day-4-스타일과-플랫폼.md)에서 박스 모델·flexbox·Tailwind를 봤다면 좋습니다.

---

## 0. 배경지식 — CSS란 무엇인가

**CSS(Cascading Style Sheets)** 는 HTML 요소에 **모양**을 입히는 언어입니다. 색·크기·
간격·배치·애니메이션 전부 CSS입니다. 이름의 **"Cascading(계단식)"** 이 핵심 개념입니다:
여러 규칙이 한 요소에 겹칠 때 **우선순위로 이긴 규칙이 적용**됩니다(§7).

- HTML=구조, **CSS=표현**, JS=행동. 이 분리 덕에 같은 HTML에 다른 CSS를 입혀 완전히
  다른 모양을 만들 수 있습니다(다크모드·반응형).
- 우리 프로젝트는 대부분 **Tailwind**(유틸리티 클래스, Day 4 §3)로 CSS를 쓰고, 복잡한
  건 순수 CSS(`globals.css`)로 씁니다. 이 랩은 순수 CSS 문법을 기초로 깔고 Tailwind가
  그걸 어떻게 축약하는지 연결합니다.

> **데이터 엔지니어 비유**: CSS 선택자는 "필터 조건", 선언은 "적용할 변환". `.card p`는
> "card 안의 모든 p 행에 이 스타일을 적용"으로, SQL의 `WHERE`처럼 대상을 고르고 값을
> 세팅하는 선언형 규칙입니다.

---

## 1. CSS 규칙의 문법

```css
선택자 {
  속성: 값;
  속성: 값;
}
```
실제 예:
```css
h1 {
  color: #ffd166;      /* 속성: 값; — 세미콜론으로 구분 */
  font-size: 48px;
}
```
세 곳에서 CSS를 넣을 수 있습니다:
1. **외부 파일**(`globals.css`) — 권장. `@import`로 폰트도.
2. **인라인**(`style={{}}`) — 특정 요소에만, 동적 값에. 우선순위 최상(§7).
3. `<style>` 태그 — 잘 안 씀.

**우리 코드 (`src/app/globals.css`):**
```css
body {
  background: #141838;         /* 우주색 — COLORS.space의 거울 */
  color: #f4f6ff;
  font-family: var(--font-pixel);   /* CSS 변수 (§8) */
  image-rendering: pixelated;  /* 확대 시 보간 없이 도트 유지 (§11 픽셀 아트) */
  user-select: none;           /* 드래그가 텍스트 선택으로 변하는 것 방지 */
}
```

---

## 2. 선택자(selector) — 무엇을 꾸밀지 고르기

| 선택자 | 고르는 대상 | 예 |
|---|---|---|
| `p` | 모든 `<p>` 요소 | `p { }` |
| `.box` | class="box" 인 요소 | `.box { }` |
| `#hero` | id="hero" 인 요소 | `#hero { }` |
| `.a .b` | a 안의 모든 b (자손) | `.card p { }` |
| `.a > .b` | a의 직계 자식 b | |
| `.a:hover` | 마우스 올린 a | `button:hover { }` |
| `.a:focus-visible` | 키보드 포커스된 a | 접근성(Day4 §7) |
| `a, b` | a 또는 b (여러 개) | |
| `*` | 전부 | |

**우리 코드 (`globals.css` — 클래스 선택자):**
```css
.starwars-stage {           /* class="starwars-stage" 인 요소 */
  perspective: 520px;
  overflow: hidden;
}
.starwars-crawl-once {
  transform-origin: 50% 100%;
  animation: sw-crawl 32s linear forwards;   /* §6 애니메이션 */
}
```
Tailwind는 이 과정을 뒤집습니다: 미리 만들어진 클래스(`.flex`, `.p-4`)를 HTML에 붙일
뿐 선택자를 직접 안 씁니다. 하지만 `:hover`·`focus-visible` 같은 상태 선택자는 Tailwind도
`hover:`·`focus-visible:` 접두사로 그대로 노출합니다.

---

## 3. 박스 모델 — 모든 요소는 상자 (Day 4 §1 심화)

```
┌── margin ──────────────────────────────┐   바깥 여백 (상자끼리 간격)
│  ┌── border ──────────────────────┐     │   테두리
│  │  ┌── padding ──────────────┐   │     │   안쪽 여백
│  │  │      content            │   │     │   내용
│  │  └──────────────────────────┘   │     │
│  └────────────────────────────────┘     │
└──────────────────────────────────────────┘
```
```css
.box {
  width: 200px;
  padding: 16px;                 /* 네 방향 모두 */
  padding: 8px 16px;             /* 상하 8, 좌우 16 */
  border: 2px solid #7ee8b2;     /* 두께 종류 색 */
  margin: 0 auto;                /* 상하 0, 좌우 auto → 가로 가운데 정렬! */
  box-sizing: border-box;        /* width에 padding·border 포함 (권장 기본) */
}
```
- `box-sizing: border-box`는 "width 200px면 padding·border를 포함해 딱 200px". 이게
  없으면 padding이 크기를 밀어내 계산이 어긋납니다. 현대 CSS의 사실상 표준.
- `margin: 0 auto`는 블록 요소 가로 가운데 정렬의 고전 기법.

**Tailwind 매핑**: `p-4`=padding 1rem, `m-2`=margin, `border-2`=border-width 2px,
`w-52`=width. 숫자 4=1rem=16px.

---

## 4. 색·단위·타이포그래피

### 색 표기
```css
color: #ffd166;                  /* 16진수 RGB */
color: #ffd166aa;                /* 마지막 2자리 = 투명도(알파) */
color: rgb(255 209 102);         /* 함수형 */
color: rgba(255, 209, 102, 0.5); /* 알파 0.5 */
```
우리는 색을 `constants.ts`의 `COLORS`에서만 정의하고(§11 단일 원천), 동적으로 쓸 땐
인라인 `style={{ color: COLORS.accent }}`. Tailwind의 `text-gray-400`·`bg-white/10`도
같은 색 지정의 축약(`/10`=알파 10%).

### 단위
| 단위 | 뜻 | 언제 |
|---|---|---|
| `px` | 절대 픽셀 | 테두리·고정 크기 |
| `rem` | 루트 글자 크기 배수(보통 16px) | 간격·글자 (Tailwind 기본) |
| `em` | 부모 글자 크기 배수 | 상대 크기 |
| `%` | 부모 기준 백분율 | 너비·위치 |
| `dvh`/`vw` | 화면 높이/너비 | 전체 화면 레이아웃 |

우리 `page.tsx`의 `min-h-dvh`=`min-height: 100dvh`(화면 꽉 채우기), `text-[10px]`는
Tailwind에서 임의값을 쓰는 문법(대괄호).

### 폰트
```css
font-family: var(--font-pixel);  /* 우리 픽셀 폰트 (Press Start 2P) */
font-size: 1.5rem;
font-weight: bold;               /* 굵기 */
line-height: 1.6;                /* 줄 간격 */
text-align: center;              /* 정렬 */
text-shadow: 4px 4px 0 #000;     /* 아케이드 하드 섀도 (§11) */
```
우리 `<h1>`의 `textShadow: "4px 4px 0 #000"`가 이 "오락실 간판" 느낌을 만듭니다.

---

## 5. 레이아웃 — flexbox와 positioning

### 5-1. flexbox (Day 4 §2 심화)
부모에 `display: flex`를 주면 자식이 한 줄/한 열로 정렬됩니다.
```css
.row {
  display: flex;
  flex-direction: row;       /* row(가로·기본) | column(세로) */
  justify-content: center;   /* 주축 정렬: flex-start|center|space-between|space-around */
  align-items: center;       /* 교차축 정렬: stretch|center|flex-start */
  gap: 12px;                 /* 자식 간 간격 */
  flex-wrap: wrap;           /* 넘치면 다음 줄로 */
}
```
축 개념이 헷갈리면: `flex-direction`이 **주축**을 정하고, `justify-content`는 주축,
`align-items`는 그에 수직인 교차축. `flex-col`이면 주축이 세로가 됩니다.

**우리 코드 (`page.tsx`)**: `flex flex-col items-center gap-10` = 세로 배치, 가로 가운데,
간격 2.5rem. `flex flex-wrap justify-center gap-3` = 링크들이 가운데 정렬 + 넘치면 줄바꿈.

### 5-2. positioning — 겹치기와 고정
```css
position: static;    /* 기본 — 문서 흐름대로 */
position: relative;  /* 흐름 유지 + top/left로 미세 이동 + 자식 absolute의 기준 */
position: absolute;  /* 흐름에서 빠져 가장 가까운 relative 조상 기준 배치 */
position: fixed;     /* 화면에 고정(스크롤 무관) */
z-index: 10;         /* 쌓임 순서 — 클수록 위 */
```
**우리 코드**: 배경 어트랙트 캔버스는 `fixed`로 깔고, 콘텐츠는 `relative z-10`으로 그
위에 얹습니다(`page.tsx`의 `relative z-10`). 게임 HUD 오버레이도 이 방식.

> **CSS Grid**도 있습니다(2차원 격자, `display: grid`). 도감(`/bag`) 카드 그리드에
> 어울립니다. flexbox=1차원(한 줄), grid=2차원(행+열)로 기억하세요.

---

## 6. 트랜스폼과 애니메이션 — 스타워즈 크롤 해부

우리 스토리 인트로의 크롤은 순수 CSS 애니메이션의 훌륭한 실물입니다(`globals.css`).

### 6-1. transform — 이동·회전·확대 (레이아웃 안 건드림, 빠름)
```css
transform: translateY(100%);   /* 세로 이동(자기 높이의 100%) */
transform: rotateX(10deg);     /* X축 기준 회전(3D) */
transform: scale(1.5);         /* 확대 */
transform: rotateX(10deg) translateY(-250%);   /* 여러 개 조합 */
```
`transform`은 GPU가 처리해 부드럽습니다(레이아웃 재계산 없음). 캔버스의
`ctx.translate/scale`(Day 3 §5-3)과 개념이 같습니다.

### 6-2. keyframes + animation — 시간에 따른 변화
```css
/* 우리 실제 코드 — src/app/globals.css */
@keyframes sw-crawl {
  from { transform: rotateX(10deg) translateY(100%); }   /* 시작 상태 */
  to   { transform: rotateX(10deg) translateY(-250%); }  /* 끝 상태 (화면 위로) */
}
.starwars-crawl-once {
  animation: sw-crawl 32s linear forwards;
  /*         이름      지속 속도곡선 끝상태유지 */
}
```
- `@keyframes 이름 { from/to 또는 0%~100% }` : 변화의 구간을 정의.
- `animation: 이름 지속시간 속도곡선 [반복] [방향] [채우기]`.
- `linear`=등속, `ease`=자연 감속. `forwards`=끝 상태 유지(안 되돌아옴).
- Day 0에서 우리가 `20s → 32s`로 늘린 게 바로 이 `32s`입니다(크롤을 읽기 쉽게).

### 6-3. transition — 상태 변화에 부드러움
```css
.btn { transition: transform 0.2s, background 0.2s; }
.btn:hover { transform: scale(1.05); }   /* 0.2초에 걸쳐 부드럽게 커짐 */
```
Tailwind: `transition-transform hover:scale-105`. 우리 링크 버튼들이 이걸 씁니다.

### 6-4. perspective와 mask — 크롤의 "우주로 사라짐"
```css
.starwars-stage {
  perspective: 520px;   /* 3D 원근 — 작을수록 더 눕고 왜곡 큼 */
  mask-image: linear-gradient(to bottom, transparent, black 10%, black 96%, transparent);
  /* 위아래를 서서히 투명하게 — 글이 "저편으로" 사라지는 효과 */
}
```

---

## 7. 캐스케이드와 우선순위 (CSS의 "C")

여러 규칙이 한 요소에 겹치면 **명시도(specificity)** 로 승부합니다:
```
인라인 style  >  #id 선택자  >  .class 선택자  >  요소 선택자
같으면 → 나중에 선언된 것이 이김
```
예:
```css
p { color: gray; }          /* 약함 */
.note { color: blue; }      /* 더 강함 */
#warn { color: red; }       /* 가장 강함 */
/* <p id="warn" class="note" style="color:green"> → 초록 (인라인이 다 이김) */
```
**실무 함의**: 우리 프로젝트가 동적 색을 `style={{}}` 인라인으로 두는 이유 — 클래스보다
확실히 이깁니다. Tailwind는 명시도가 낮고 균일해 이 싸움을 대부분 피합니다(장점).
`!important`는 최후의 수단이니 되도록 피하세요(캐스케이드를 깨뜨림).

---

## 8. CSS 변수(커스텀 속성)와 반응형·다크모드

### 8-1. CSS 변수 — 값의 단일 원천
```css
/* 우리 globals.css의 @theme (Tailwind 4) */
--font-pixel: "Press Start 2P", var(--font-intl), monospace;
body { font-family: var(--font-pixel); }   /* var()로 참조 */
```
`--이름: 값;`으로 정의하고 `var(--이름)`으로 씁니다. 한 곳만 바꾸면 전부 반영 —
`constants.ts`의 `COLORS`와 같은 "단일 원천" 정신을 CSS에서.

### 8-2. 미디어 쿼리 — 반응형 (Day 4 §4)
```css
/* 기본은 모바일, 넓어지면 덮어쓰기 */
.title { font-size: 2.25rem; }
@media (min-width: 768px) {           /* 768px 이상에서만 */
  .title { font-size: 3.75rem; }
}
```
Tailwind: `text-4xl md:text-6xl` 한 줄이 위와 같습니다.

```css
/* 움직임에 민감한 사용자 배려 (접근성) — 우리 크롤이 이걸 씀 */
@media (prefers-reduced-motion: reduce) {
  .starwars-crawl-once { animation: none; transform: none; }
}
```

---

## 9. 연습 문제

`practice.html` 하나에 `<style>`을 넣어 실험하세요(빌드 불필요).

### 연습 1 — 박스 모델 손에 익히기
`<div class="card">`를 만들고 width 200px, padding 16px, border 2px, `margin: 0 auto`로
가운데 정렬. `box-sizing: border-box`를 넣었다 뺐다 하며 실제 크기가 어떻게 바뀌는지
F12 → Computed에서 확인.

### 연습 2 — flexbox 정렬 놀이
버튼 3개를 `display:flex`로 배치. `justify-content`를 `center`→`space-between`→`flex-end`로
바꿔 보고, `flex-direction: column`으로 세로 정렬. 우리 `page.tsx`의 링크 그룹을 재현.

### 연습 3 — hover 트랜지션
버튼에 `transition: transform 0.2s` + `:hover { transform: scale(1.1); }`. 마우스 올리면
부드럽게 커지는지. 그다음 Tailwind로 옮기면 `transition-transform hover:scale-110`.

### 연습 4 — keyframes 애니메이션 만들기
네모가 좌→우로 흐르는 `@keyframes slide`를 만들고 `animation: slide 3s linear infinite`.
`infinite`(무한)과 `forwards`(1회 후 유지)의 차이를 눈으로.

### 연습 5 — 우리 크롤 흉내
`perspective`를 준 부모 안에서 텍스트를 `rotateX(10deg) translateY(...)`로 눕히고 위로
흐르게. `perspective` 값을 300px↔800px로 바꿔 왜곡 차이를 체감. (`globals.css`의
`sw-crawl`을 참고서로.)

### 연습 6 — 우리 코드 읽기
`src/app/globals.css`를 처음부터 끝까지 읽고: (a) `body`에 걸린 스타일 5개의 목적을
한 줄씩, (b) `sw-crawl` 애니메이션의 `from`/`to`가 무엇을 바꾸는지, (c) reduced-motion
분기가 왜 있는지 적기. 그다음 `page.tsx`의 Tailwind 클래스 10개를 골라 순수 CSS로 번역.

---

## 10. 셀프 체크 ✅
- [ ] CSS 규칙의 3요소(선택자·속성·값)와 클래스/id/자손 선택자를 구분하나?
- [ ] 박스 모델 4겹과 `box-sizing: border-box`의 효과는?
- [ ] flexbox의 주축/교차축, `justify-content` vs `align-items`?
- [ ] `position` 4종(static/relative/absolute/fixed)과 `z-index`의 역할?
- [ ] `@keyframes` + `animation`으로 애니메이션을 만들 수 있나? `transition`과의 차이는?
- [ ] 캐스케이드 우선순위(인라인>id>class>요소)를 말할 수 있나?
- [ ] 미디어 쿼리로 반응형을, `prefers-reduced-motion`으로 접근성을 어떻게 처리하나?
- [ ] Tailwind 클래스 `p-4 flex md:text-6xl hover:scale-105`를 순수 CSS로 번역할 수 있나?

---

→ 다른 랩: [① HTML](./lab-html.md) · [③ JavaScript](./lab-js.md)
→ 커리큘럼: [Day 4](./day-4-스타일과-플랫폼.md)
