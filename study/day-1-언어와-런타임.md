# Day 1 — 언어와 런타임: JS/TS와 브라우저의 사고방식

> **오늘의 목표**
> 1. JavaScript와 Python의 세계관 차이를 이해한다 (문법이 아니라 **모델**).
> 2. TypeScript를 "강제되는 타입 힌트"로 흡수하고, 이 프로젝트의 타입 코드를 읽는다.
> 3. 비동기(Promise/async)를 asyncio의 사촌으로 이해하고 실행 순서를 예측한다.
> 4. ESM 모듈·`package.json`·툴체인을 파이썬 생태계에 매핑한다.
>
> **끝나면**: `src/lib/` 아래 아무 `.ts` 파일이나 열어도 문법에 막히지 않는다.

---

## 0. 하루 타임박스 (권장)

| 시간 | 내용 |
|---|---|
| 오전 1 | §1 세계관 차이 · §2 값과 타입 |
| 오전 2 | §3 TypeScript 정독 (이 코스의 핵심) |
| 오후 1 | §4 함수·클로저·`this` · §5 비동기 |
| 오후 2 | §6 모듈과 툴체인 · §7 실제 코드 정독 |
| 저녁 | §8 실습 · §9 셀프 체크 |

---

## 1. 큰 그림: JavaScript는 왜 이렇게 생겼나

파이썬은 "한 사람이 서버에서 신중하게 설계한 언어"입니다. JavaScript는 "1995년에
브라우저를 움직이려고 **10일 만에** 만들어진 뒤, 전 세계가 20년간 뜯어고친 언어"입니다.
그래서 이상한 구석(`==`의 함정, `this`의 변덕)이 있지만, 그 위에 **TypeScript**라는
갑옷을 입히면 놀랍도록 견고해집니다. 이 코스는 처음부터 TypeScript로 갑니다.

**딱 하나만 기억할 근본 차이:**

> 파이썬 프로그램은 보통 **당신이 시작하고 당신이 끝냅니다** (스크립트가 위에서
> 아래로 흐르다 종료). 브라우저의 JavaScript는 **끝나지 않고 계속 살아서
> "이벤트"를 기다립니다** — 클릭, 터치, 타이머, 네트워크 응답. 프로그램의 본체는
> "이런 일이 생기면 이걸 해라"라는 **콜백(반응)의 등록**입니다.

이 게임을 보세요. `joops-game.tsx`는 실행되고 끝나는 게 아니라, "매 프레임마다 이걸
그려라", "터치가 오면 조이스틱을 잡아라"를 등록해 두고 **브라우저의 시계에 올라타**
돕니다. Day 3에서 그 루프를 직접 봅니다.

---

## 2. 값과 타입 — 파이썬 대조표

문법은 90% 직관적입니다. 대조표로 빠르게 훑고, 함정만 짚습니다.

| 개념 | Python | JavaScript / TypeScript |
|---|---|---|
| 변수 선언 | `x = 3` | `const x = 3;` (재할당 X) / `let x = 3;` (재할당 O) |
| 없음 | `None` | `null` (의도적 비움) / `undefined` (아직 없음) — **둘이 다르다** |
| 참/거짓 | `True` / `False` | `true` / `false` |
| 문자열 포맷 | `f"{n}점"` | `` `${n}점` `` (백틱 — template literal) |
| 리스트 | `[1, 2, 3]` | `[1, 2, 3]` (Array) |
| 딕셔너리 | `{"a": 1}` | `{ a: 1 }` (Object — 키 따옴표 생략 가능) |
| 딕셔너리 접근 | `d["a"]` | `d.a` 또는 `d["a"]` |
| 반복 | `for x in xs:` | `for (const x of xs) { }` |
| 주석 | `# ...` | `// ...` 또는 `/* ... */` |
| 문장 끝 | 줄바꿈 | `;` (관례상 붙임) |
| 블록 | 들여쓰기 | `{ }` 중괄호 |

**함정 3가지 (여기서만 조심하면 됨):**

1. **`const`는 기본, `let`은 필요할 때만.** `var`는 옛날 문법 — 이 프로젝트엔 없습니다.
   파이썬엔 없는 "재할당 금지" 개념. `const`가 많을수록 좋은 코드입니다.
2. **`null` vs `undefined`.** `undefined`는 "값이 아예 없음"(변수 선언만 하고 할당 안 함,
   객체에 없는 키). `null`은 "일부러 비웠음". 실무에선 `?? `(널 병합)로 둘 다 한 방에
   처리합니다 (§3에서).
3. **`==` 금지, `===`만.** `==`는 타입을 멋대로 바꿔 비교합니다(`0 == ""`이 `true`!).
   항상 `===`(엄격한 같음)를 쓰세요. 이 프로젝트도 그렇습니다.

```ts
// 이 프로젝트 실제 코드 — src/lib/storage.ts:20 근처
const n = raw === null ? 0 : Number(raw);
return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
```
파이썬으로 번역하면:
```python
n = 0 if raw is None else float(raw)
return math.floor(n) if math.isfinite(n) and n > 0 else 0
```
거의 똑같죠? `? :`는 파이썬의 삼항 표현식(`a if cond else b`)의 순서만 다른 버전입니다:
`조건 ? 참일때 : 거짓일때`.

---

## 3. TypeScript — 이 코스에서 가장 중요한 절

당신은 이미 파이썬 타입 힌트를 씁니다:
```python
def greet(name: str) -> str:
    return f"안녕, {name}"
```
파이썬에서 이 힌트는 **문서이자 mypy용 참고**일 뿐, 런타임엔 무시됩니다. TypeScript에선
같은 힌트가 **컴파일 전에 강제**됩니다. 타입이 안 맞으면 `npm run build`가 아예 실패합니다.
번역:
```ts
function greet(name: string): string {
  return `안녕, ${name}`;
}
```

### 3-1. 기본 타입

| TypeScript | 뜻 | Python 대응 |
|---|---|---|
| `string` | 문자열 | `str` |
| `number` | 숫자 (int/float 구분 없음!) | `int` \| `float` |
| `boolean` | 참/거짓 | `bool` |
| `T[]` 또는 `Array<T>` | 배열 | `list[T]` |
| `{ a: number }` | 객체 (구조를 명시) | `TypedDict` / `dataclass` |
| `null` / `undefined` | 없음 | `None` |
| `any` | "타입 검사 포기" (쓰지 마라) | 힌트 없는 상태 |
| `unknown` | "뭔지 모름, 검사 후 써라" | 안전한 `any` |
| `void` | 반환값 없음 | `-> None` |

> **number에 int/float 구분이 없다**는 게 데이터 엔지니어에겐 충격일 수 있습니다.
> JS의 모든 숫자는 64비트 부동소수점입니다. 큰 정수가 필요하면 `BigInt`가 따로 있지만
> 이 프로젝트엔 안 나옵니다. (게임 좌표·점수는 전부 `number`.)

### 3-2. 타입 별칭·유니온·리터럴 — 이 프로젝트의 실제 패턴

**유니온 타입** `A | B`는 "A거나 B". 파이썬의 `Union[A, B]` / `A | B`와 똑같습니다.

```ts
// src/lib/storage.ts — 실제 코드
export type TimeFormat = "utc" | "device" | "home";
```
이건 **리터럴 유니온**입니다: `TimeFormat` 값은 저 세 문자열 중 하나만 가능.
파이썬의 `Literal["utc", "device", "home"]`과 같지만, TS에선 오타가 **컴파일 오류**가
됩니다. `timeFormat = "utd"` 라고 쓰면 빌드가 막힙니다. 데이터 파이프라인에서 enum
잘못 넣어 밤샜던 기억… TS는 그걸 컴파일 타임에 잡습니다.

**객체 타입(구조)** — `dataclass`/`TypedDict`의 사촌:
```ts
// src/lib/storage.ts — StoredSettings 실제 정의(축약)
export type StoredSettings = {
  lat: number | null;      // 위도, 없으면 null
  lon: number | null;
  homeLabel: string | null;
  character: MascotVariantId;
  timeFormat: TimeFormat;
  language: LangSetting;
};
```
파이썬:
```python
@dataclass
class StoredSettings:
    lat: float | None
    lon: float | None
    home_label: str | None
    character: MascotVariantId
    time_format: TimeFormat
    language: LangSetting
```

### 3-3. `keyof typeof` — 이 프로젝트 i18n의 핵심 마법

번역 사전이 어떻게 "빠진 번역을 컴파일 타임에 잡는지" 봅시다. 이건 TS의 진짜 힘을
보여주는 예시입니다.

```ts
// src/lib/i18n/index.ts (개념)
import { en } from "./dicts/en";           // 영어 사전 = 정본(source of truth)

export type DictKey = keyof typeof en;      // en의 모든 "키"를 타입으로 뽑아낸다
export type Dict = Record<DictKey, string>; // 그 모든 키 → string 을 강제
```

- `typeof en` : 값 `en`(객체)의 **타입**을 얻는다. (파이썬엔 없는 개념 — 값에서
  타입을 역추출.)
- `keyof ...` : 그 타입의 모든 키를 유니온으로. `"landing.play" | "play.pause" | ...`
- `Record<DictKey, string>` : "이 모든 키가 반드시 있고, 값은 string인 객체". 파이썬의
  `dict[DictKey, str]`이되 **키가 빠지면 컴파일 실패**.

결과: 한국어 사전 `ko.ts`가 `Dict` 타입이라고 선언하는 순간, 영어에 있는 키 하나라도
빠뜨리면 `npm run build`가 그 파일을 빨갛게 칠합니다. **번역 누락이 배포로 새는 걸
타입 시스템이 원천 봉쇄**합니다. 데이터 스키마 검증을 코드로 강제하는 것과 같은 정신이죠.

> 📌 **더 깊이**: [`docs/02-타입스크립트-문법.md`](../docs/02-타입스크립트-문법.md)가
> `as const`, 제네릭, `Record`를 이 저장소 코드로 한 줄씩 풉니다.

### 3-4. 옵셔널 체이닝 `?.` 과 널 병합 `??`

데이터를 다루면 "있을 수도 없을 수도 있는 값"을 늘 만납니다. TS엔 우아한 도구가 있습니다.

```ts
const inv = loadInventory();
inv[kind] = (inv[kind] ?? 0) + 1;   // inv[kind]가 없으면(undefined) 0으로 치고 +1
```
- `a ?? b` : `a`가 `null`/`undefined`면 `b`. (파이썬 `a if a is not None else b`.)
  주의: `0`이나 `""`은 유효한 값이므로 `??`는 통과시킵니다 (`||`와의 결정적 차이).
- `a?.b` : `a`가 없으면 `undefined` 반환(터지지 않음). 파이썬엔 없어 `getattr`/`try`로
  하던 것. 예: `audio?.close()` — audio가 null이어도 에러 없이 넘어감(`sound.ts:35`).

---

## 4. 함수·화살표·클로저·`this`

### 4-1. 함수 두 가지 문법

```ts
function add(a: number, b: number): number { return a + b; }   // 일반 함수
const add = (a: number, b: number): number => a + b;           // 화살표 함수
```
**화살표 함수(`=>`)** 는 파이썬 `lambda`의 강화판입니다. 한 줄이면 `return` 생략,
여러 줄이면 `{ }`. 이 프로젝트의 콜백은 대부분 화살표 함수입니다:
```ts
window.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
```

### 4-2. 클로저 — 이 프로젝트 아키텍처의 뼈대

**클로저**: 함수가 자기 바깥의 변수를 "기억"하는 것. 파이썬에도 있습니다:
```python
def counter():
    n = 0
    def inc():
        nonlocal n
        n += 1
        return n
    return inc
```
JS는 `nonlocal` 선언 없이 그냥 됩니다. 이게 **이 게임 상태 관리의 핵심**입니다.
Day 2·3에서 보겠지만, 게임의 점수·좌표·엔티티 배열은 전부 `useEffect(() => { ... })`
안의 지역 변수입니다. 그 안에서 정의된 `update()`·`draw()` 함수가 클로저로 그 변수들을
붙잡고 60fps로 돌립니다. React state가 아니라요. (§Day3의 대원칙.)

### 4-3. `this`는… 일단 피하세요

파이썬 `self`와 비슷하지만 훨씬 변덕스럽습니다. **좋은 소식**: 이 프로젝트는 클래스를
거의 안 씁니다(§12 "클래스/상속 없이 객체 배열 + 순수 함수"). 화살표 함수는 `this`를
자기 바깥에서 물려받아 함정을 대부분 제거합니다. Day 5까지 `this` 걱정은 미뤄도 됩니다.

---

## 5. 비동기 — asyncio를 아는 당신에겐 쉽다

파이썬 asyncio를 써봤다면 절반은 끝났습니다. JS는 **처음부터 비동기가 핵심**인 언어라
오히려 더 일관됩니다.

### 5-1. Promise = Future/Awaitable

```ts
// src/lib/leaderboard.ts 스타일 (개념)
async function submitScore(): Promise<void> {
  const res = await fetch(url, { method: "POST", body });  // 네트워크 대기
  if (!res.ok) return;                                     // 실패는 조용히 (§12)
  const data = await res.json();                           // 본문 파싱도 비동기
}
```
파이썬:
```python
async def submit_score() -> None:
    res = await http.post(url, data=body)
    if not res.ok: return
    data = await res.json()
```
**거의 동일합니다.** `async def` → `async function`, `await` → `await`, `Future` →
`Promise`. `fetch`는 `httpx`/`aiohttp`의 표준 내장 버전입니다.

### 5-2. 결정적 차이: 이벤트 루프는 단일 스레드

여기가 **진짜 새로 배울 지점**입니다(§1의 예고). 브라우저 JS는 **스레드가 하나**입니다.
`await`로 양보하지 않는 한, 당신의 코드가 도는 동안 화면은 **얼어붙습니다**.

- 데이터 엔지니어 직관: "무거운 for 루프? 스레드/프로세스 풀에 던지지." → **브라우저엔
  기본적으로 안 됩니다.** 메인 스레드에서 100ms 넘게 계산하면 프레임이 끊깁니다(jank).
- 그래서 게임 루프는 매 프레임 "조금씩만" 일하고 `requestAnimationFrame`으로 양보합니다
  (Day 3). 무거운 병렬 계산이 정말 필요하면 `Web Worker`(별도 스레드)를 쓰지만, 이
  프로젝트엔 없습니다 — 매 프레임 가볍게 유지하는 설계로 회피합니다.

### 5-3. 실행 순서 퀴즈 (셀프 체크 예고)

```ts
console.log("A");
setTimeout(() => console.log("B"), 0);      // 0ms 뒤 = "다음 틱에"
Promise.resolve().then(() => console.log("C"));
console.log("D");
```
출력은? → **A, D, C, B**. 동기 코드(A, D)가 먼저 전부 끝나고, 그 다음 마이크로태스크
(Promise: C), 마지막에 매크로태스크(타이머: B). asyncio의 이벤트 루프 우선순위와
같은 원리입니다. 이걸 예측할 수 있으면 비동기 감각이 잡힌 겁니다.

---

## 6. 모듈과 툴체인 — pip 세계의 번역

### 6-1. ESM 모듈

```ts
// 내보내기 (여러 개) — src/lib/storage.ts
export function loadBest(): number { ... }
export type StoredSettings = { ... };

// 가져오기 — 다른 파일에서
import { loadBest, saveBest } from "@/lib/storage";
import type { StoredSettings } from "@/lib/storage";
```
파이썬:
```python
from lib.storage import load_best, save_best
from lib.storage import StoredSettings   # 타입만 (TS는 import type 으로 명시)
```
- `@/`는 이 프로젝트의 **경로 별칭**입니다. `tsconfig.json`의 `"paths": {"@/*": ["./src/*"]}`가
  `@/lib/storage` = `src/lib/storage`로 매핑합니다. 파이썬의 패키지 루트 설정과 비슷.
- `export default`(파일당 하나)와 `export`(여러 개) 두 종류가 있습니다. React 컴포넌트
  파일은 보통 `export default function Page()` 하나 + 보조 `export`들.

### 6-2. `package.json` = `pyproject.toml`

```jsonc
{
  "scripts": {                      // = [tool.poetry.scripts] / Makefile
    "dev": "next dev -p 3004 --turbopack",   // npm run dev  (≈ uvicorn --reload)
    "build": "next build --turbopack",       // npm run build (≈ 배포 빌드)
    "lint": "eslint"                          // npm run lint  (≈ ruff)
  },
  "dependencies": {                 // = [project.dependencies]
    "react": "19.1.0", "react-dom": "19.1.0", "next": "15.5.20"
  },
  "devDependencies": {              // = dev/test 전용 의존성
    "typescript": "^5", "tailwindcss": "^4", "eslint": "^9", ...
  }
}
```
| 파이썬 | Node |
|---|---|
| `pip install` | `npm install` |
| `requirements.txt` / `pyproject.toml` | `package.json` |
| `pip freeze` 잠금 | `package-lock.json` (자동 생성, 정확한 버전 고정) |
| `venv/` | `node_modules/` (프로젝트 로컬 설치 — venv가 기본 내장인 셈) |
| `python -m mymod` | `npx <도구>` (설치된 CLI 실행) |
| `mypy` | `tsc --noEmit` |
| `ruff` / `black` | `eslint` / `prettier` |

> `^5`의 `^`는 "5.x 중 최신 허용"(semver). `~`는 패치만. 데이터 재현성 위해 정확한
> 버전이 필요하면 `package-lock.json`이 실제 설치를 고정합니다 (`pip freeze`처럼).

### 6-3. 빌드가 왜 필요한가

파이썬은 소스를 그대로 실행합니다. 브라우저는 TypeScript·JSX·최신 문법을 이해 못 합니다.
그래서 **빌드 단계**가 TS→JS 변환, JSX→함수 호출 변환, 여러 파일→최적화된 번들로 묶기,
미사용 코드 제거(tree-shaking)를 합니다. 이 프로젝트는 **Turbopack**(webpack 후계자,
Rust로 작성)이 그 일을 합니다. 개발 중엔 `npm run dev`가 파일 저장 시마다 즉시
다시 빌드해 화면에 반영합니다(핫 리로드) — `--reload`의 강화판.

---

## 7. 실제 코드 정독 (오늘의 하이라이트)

이제 배운 걸로 **진짜 파일**을 읽습니다. 각 파일을 에디터로 열고, 아래 관전 포인트를
찾으며 위에서 아래로 읽으세요.

### 7-1. `src/lib/storage.ts` — 방금 배운 것 총집합
관전 포인트:
- 모든 함수가 `try { ... } catch { ... }`로 감싸짐 → §12 "부가 기능이 앱을 죽이면 안 됨".
  localStorage는 시크릿 모드 등에서 예외를 던질 수 있으므로 **실패해도 조용히**.
- `StoredSettings` 타입 + `loadSettings()`의 **필드별 유효성 검사**(손상된 값 방어).
  데이터 엔지니어의 "입력 데이터를 믿지 마라"와 정확히 같은 정신.
- `?? `, 리터럴 유니온(`TimeFormat`), `Number.isFinite` 방어.

### 7-2. `src/lib/constants.ts` — 유니온·상수의 원본
관전 포인트:
- `JunkKind` 유니온(낙하물 14종), `COLORS` 팔레트 객체. "색은 여기서만 정의"(§11)라는
  단일 원천(single source of truth) — 데이터 파이프라인의 설정 중앙화와 같은 습관.

### 7-3. `src/lib/i18n/index.ts` — `keyof typeof` 마법의 실물
관전 포인트: §3-3에서 본 `DictKey`/`Dict`가 실제로 어떻게 쓰이는지. `detectLang()`,
`resolveLang()`, `t(dict, key, params)` 치환 함수.

---

## 8. 실습 (저녁, 손을 움직이는 시간)

> 목표는 "정답"이 아니라 **핫 리로드 루프에 익숙해지는 것**. 깨뜨리고 되돌리세요.

1. **환경 확인**: `npm run dev` 실행, `http://localhost:3004`에서 게임 확인.
   `npx tsc --noEmit`을 실행해 "오류 0"을 눈으로 확인(초록 기준선).

2. **타입 오류를 일부러 내보기**: `src/lib/storage.ts`의 `loadBest`가 반환하는
   `Math.floor(n)`을 `String(n)`으로 바꿔 저장 → `npx tsc --noEmit`이 뭐라고 하는지
   읽기(반환 타입 `number` 위반). **되돌리기.** TS가 당신을 어떻게 지키는지 체감.

3. **리터럴 유니온의 벽 느끼기**: `storage.ts`에서 `timeFormat: "utc"`를 `"UTC"`(대문자)로
   바꿔 보고 `tsc`가 막는지 확인. **되돌리기.**

4. **비동기 순서 예측**: §5-3 퀴즈 코드를 브라우저 콘솔(F12 → Console)에 붙여넣고
   출력 순서가 예측과 맞는지 확인.

5. **읽기 과제**: `src/lib/storage.ts`를 처음부터 끝까지 읽고, 각 `export` 함수가
   "무엇을 저장/로드하는지"를 한 줄씩 자기 말로 주석 달아 보기(로컬에서, 커밋 X).

---

## 9. 셀프 체크 ✅

아래에 자신 있게 답할 수 있으면 Day 2로:

- [ ] `const`와 `let`의 차이, 왜 `const`가 기본인가?
- [ ] `null`과 `undefined`는 어떻게 다른가? `??`는 둘을 어떻게 처리하나?
- [ ] `type TimeFormat = "utc" | "device" | "home"`은 파이썬으로 뭐라 쓰나?
- [ ] `keyof typeof en`이 하는 일을 한 문장으로 설명할 수 있나?
- [ ] `a?.b`와 `a.b`의 차이는? 언제 `?.`를 쓰나?
- [ ] `await fetch(...)`는 파이썬의 무엇과 같은가? 이벤트 루프가 단일 스레드라는 게
      게임 루프 설계에 왜 중요한가?
- [ ] `npm install`·`npm run dev`·`tsc --noEmit`을 pip/uvicorn/mypy에 각각 대응시킬 수 있나?

---

## 다음 → [Day 2: React & Next.js](./day-2-react-nextjs.md)

내일은 "화면을 명령하지 말고 선언하라"는 React의 패러다임 전환입니다. 오늘 배운
클로저·타입·모듈이 전부 재료로 쓰입니다.
