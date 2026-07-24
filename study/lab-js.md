# 실습 랩 ③ — JavaScript: 우리 코드로 배우는 행동의 언어

> **이 랩의 목적**
> JavaScript 문법과 배경지식을 우리 저장소의 실제 코드로 깊게 익히고 손으로 연습합니다.
> Day 1이 "언어의 세계관"이었다면, 이 랩은 **문법 하나하나를 예제와 연습으로** 굳힙니다.
> 파이썬과의 대조를 계속 활용합니다.
>
> **선행**: [Day 1](./day-1-언어와-런타임.md)의 값·타입·비동기 개념.

---

## 0. 배경지식 — JavaScript란 무엇인가

**JavaScript(JS)** 는 웹의 **행동**을 담당하는 프로그래밍 언어입니다. HTML=구조,
CSS=표현, **JS=행동**(클릭 반응, 데이터 처리, 애니메이션, 네트워크). 1995년 브라우저용
으로 태어나 지금은 서버(Node.js)·모바일·게임까지 갑니다.

- 우리 코드는 **TypeScript**(JS + 타입, Day 1 §3)로 쓰지만, 타입을 벗기면 전부 JS입니다.
  이 랩은 타입은 잠깐 접어 두고 **JS 문법 알맹이**에 집중합니다.
- JS는 **동적·인터프리터·단일 스레드·이벤트 기반**입니다(Day 1 §1, §5). 파이썬과
  가장 크게 다른 건 "프로그램이 끝나지 않고 이벤트를 기다린다"는 점.

> **데이터 엔지니어에게**: JS의 배열 메서드(`map`/`filter`/`reduce`)는 당신이 아는
> 함수형 데이터 변환과 판박이입니다. pandas/Spark의 변환 사고를 그대로 씁니다.

---

## 1. 변수·값·연산자

```js
const x = 3;        // 재할당 금지 (기본)
let y = 3;          // 재할당 가능
y = 5;              // OK
// x = 5;           // 에러

// 자료형
const s = "문자열"; const n = 42; const b = true;
const nothing = null;        // 의도적 비움
let notyet;                  // undefined (값 미할당)

// 산술
5 / 2      // 2.5  (파이썬처럼 정수 나눗셈 없음 — 다 실수)
5 % 2      // 1    (나머지)
2 ** 10    // 1024 (거듭제곱, 파이썬과 같음)

// 비교 (항상 === / !== 를 써라)
3 === 3    // true (엄격한 같음)
3 == "3"   // true 지만 금지! (타입 변환 함정)
3 !== 4    // true

// 논리
a && b     // 그리고 (파이썬 and)
a || b     // 또는   (파이썬 or)
!a         // 부정   (파이썬 not)

// 없음 다루기 (Day 1 §3-4)
a ?? b     // a가 null/undefined면 b
a?.b       // a 없으면 undefined
```

**우리 코드 (`storage.ts`)** — 방어적 값 처리의 전형:
```js
const n = raw === null ? 0 : Number(raw);
return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
```
`? :`(삼항)은 파이썬 `0 if raw is None else float(raw)`의 순서만 다른 버전.

---

## 2. 문자열

```js
const name = "줍스";
`안녕 ${name}, 점수 ${100 + 20}점`   // 템플릿 리터럴 (백틱) — 파이썬 f-string
name.length            // 길이
name.toUpperCase()     // 대문자
name.slice(0, 2)       // 부분 문자열 (파이썬 name[0:2])
name.includes("줍")     // 포함 여부
name.replace(/\s+/g, " ")   // 정규식 치환
"a,b,c".split(",")     // ["a","b","c"] (파이썬 split)
["a","b"].join("-")    // "a-b"
name.trim()            // 앞뒤 공백 제거
```
**우리 코드 (`leaderboard.ts`)** — 펫 이름 정리:
```js
export function sanitizePetName(raw) {
  return raw.replace(/\s+/g, " ").trim().slice(0, 10);   // 연속공백→하나, 다듬기, 10자 제한
}
```
`.replace().trim().slice()`처럼 **메서드를 이어 붙이는(chaining)** 게 JS의 흔한 스타일.
왼쪽에서 오른쪽으로 파이프라인처럼 읽힙니다.

---

## 3. 배열(Array) — 데이터 엔지니어의 홈그라운드

```js
const xs = [10, 20, 30];
xs.length          // 3
xs[0]              // 10
xs.push(40)        // 끝에 추가 → [10,20,30,40]
xs.pop()           // 끝 제거
xs.splice(1, 1)    // 인덱스1에서 1개 제거 (제자리 변경)
xs.includes(20)    // true
xs.indexOf(20)     // 1
[...xs, 50]        // 전개로 새 배열 (불변)
```

### 3-1. 고차 메서드 — map/filter/reduce (파이썬·pandas와 동일 사고)
```js
const nums = [1, 2, 3, 4];
nums.map(x => x * 2)              // [2,4,6,8]   (변환) — 파이썬 [x*2 for x in nums]
nums.filter(x => x % 2 === 0)     // [2,4]       (거르기)
nums.reduce((sum, x) => sum + x, 0)  // 10        (누적) — functools.reduce
nums.forEach(x => console.log(x)) // 반복 (반환 없음)
nums.find(x => x > 2)             // 3           (첫 매치)
nums.some(x => x > 3)             // true        (하나라도)
nums.every(x => x > 0)            // true        (전부)
nums.sort((a, b) => a - b)        // 오름차순 (제자리)
```
**우리 코드 (`joops-game.tsx`)**:
```js
junks = junks.filter(isFood);          // 쓰레기만 남기기 (별·연료 제외)
sparks.push(...makeSparks(x, y, color, 7));   // 스파크 7개를 펼쳐서 추가
```
`push(...배열)`은 배열을 낱개로 펼쳐 넣는 관용구(파이썬 `list.extend`).

### 3-2. ⚠️ 역순 순회 + splice — 우리 프로젝트의 필수 패턴 (§12)
"순회하면서 삭제"는 정방향이면 건너뛰기 버그가 납니다. 그래서 **뒤에서 앞으로** 돕니다:
```js
// 우리 실제 코드 — joops-game.tsx:568
for (let i = junks.length - 1; i >= 0; i--) {
  const j = junks[i];
  // ...
  if (j.eatT >= TUNE.eatAnimTime) junks.splice(i, 1);   // 다 먹은 낙하물 제거
}
```
왜 역순? 앞에서 지우면 뒤 요소들의 인덱스가 하나씩 당겨져 다음 요소를 건너뜁니다.
뒤에서 지우면 아직 안 본 앞쪽 인덱스가 안 흔들립니다. (배치 삭제 시 인덱스 꼬임을
피하는 당신의 그 감각.)

---

## 4. 객체(Object) — 딕셔너리이자 구조체

```js
const pet = { id: "abc", name: "줍스", score: 1420 };
pet.name              // "줍스" (점 접근)
pet["name"]           // 같음 (대괄호 접근 — 키가 변수일 때)
pet.name = "냠냠"      // 수정
pet.level = 5         // 키 추가
Object.keys(pet)      // ["id","name","score","level"]
Object.entries(pet)   // [["id","abc"], ...] — 파이썬 .items()
"name" in pet         // true
delete pet.level      // 키 삭제
```

### 4-1. 단축 표기·계산된 키
```js
const name = "줍스", score = 100;
const pet = { name, score };            // { name: name, score: score } 축약
const key = "level";
const obj = { [key]: 5 };               // { level: 5 } — 계산된 키
```

### 4-2. 우리 코드 — 상수 객체와 `as const`
```js
// constants.ts — 색 팔레트 (단일 원천)
export const COLORS = {
  space: "#141838",
  mascot: "#7ee8b2",
  accent: "#ffd166",
  // ...
};   // TS에선 끝에 as const 를 붙여 "값이 절대 안 바뀜"을 못박는다 (Day1 리터럴)
COLORS.accent   // "#ffd166"
```
`as const`(TS)는 "이 객체·배열을 읽기 전용 리터럴로 고정" — 오타·변조를 컴파일 타임에
막습니다. 데이터 엔지니어의 "설정을 불변으로" 원칙.

---

## 5. 구조 분해와 전개 (JS의 슈퍼파워)

### 5-1. 구조 분해(destructuring) — 파이썬 언패킹
```js
const [a, b] = [1, 2];              // a=1, b=2
const [first, ...rest] = [1,2,3];   // first=1, rest=[2,3]
const { name, score } = pet;        // pet.name, pet.score 를 변수로
const { lat = 0 } = settings;       // 없으면 기본값 0
```
**우리 코드 (React 훅 — Day 2)**: `const [copied, setCopied] = useState(false);`가 바로
배열 구조 분해입니다. `const { t, lang } = useT();`는 객체 구조 분해.

### 5-2. 전개(spread) — 펼치기
```js
const merged = { ...base, extra: 1 };      // 객체 병합 (파이썬 {**base, "extra":1})
const arr2 = [...arr, 4];                  // 배열 뒤에 추가
fn(...args);                               // 인자 펼치기 (파이썬 *args)
```
**우리 코드**: `return { ...DEFAULT_SETTINGS };`(설정 기본값 복제),
`sparks.push(...makeSparks(...))`(배열 펼쳐 추가).

---

## 6. 함수·화살표·클로저 (Day 1 §4 심화)

```js
function add(a, b) { return a + b; }       // 선언식
const add = (a, b) => a + b;               // 화살표 (한 줄 = return 생략)
const greet = (name) => { return `안녕 ${name}`; };  // 여러 줄 = {} + return
const noArg = () => 42;                    // 인자 없음
const defaults = (a, b = 10) => a + b;     // 기본 인자 (파이썬과 같음)
```

### 6-1. 콜백 — 함수를 인자로
```js
setTimeout(() => console.log("나중에"), 1000);   // 1초 뒤 실행
button.addEventListener("click", () => f());     // 클릭하면 실행
[1,2,3].map(x => x * 2);                          // map에 함수 전달
```
함수를 값으로 넘기는 게 JS의 일상입니다(일급 함수). 파이썬도 되지만 JS는 훨씬 잦습니다.

### 6-2. 클로저 — 바깥 변수를 기억 (우리 게임 상태의 뼈대)
```js
function makeCounter() {
  let n = 0;                     // 바깥 변수
  return () => { n += 1; return n; };   // 안쪽 함수가 n을 "기억"
}
const inc = makeCounter();
inc(); inc();   // 1, 2
```
**우리 코드의 핵심 (Day 3 §1)**: 게임의 점수·좌표·엔티티 배열은 `useEffect(() => { ... })`
안의 지역 변수이고, 그 안에서 정의된 `update()`·`draw()`가 클로저로 그것들을 붙잡아
60fps로 돌립니다. React state가 아니라 클로저 — 이게 "60fps는 캔버스" 원칙의 실물.

---

## 7. 제어 흐름

```js
// 조건
if (score > 100) { ... } else if (score > 50) { ... } else { ... }
score > 100 ? "높음" : "낮음"               // 삼항 (값을 만들 때)

// 반복
for (let i = 0; i < 10; i++) { ... }        // C 스타일
for (const x of xs) { ... }                 // 값 순회 (파이썬 for x in xs)
for (const k in obj) { ... }                // 키 순회 (주의: 배열엔 of 를 써라)
while (cond) { ... }
xs.forEach(x => { ... });                   // 메서드 방식

// switch (여러 갈래)
switch (kind) {
  case "star": handleStar(); break;
  case "fuel": handleFuel(); break;
  default: handleJunk();
}
```
**우리 코드**: 게임 루프의 `for (let i = junks.length - 1; ...)`(§3-2), 스폰 확률 분기의
`if/else if` 사다리(`spawn()`), 낙하물 종류별 그리기의 분기 등.

---

## 8. 비동기 — Promise·async/await (Day 1 §5 심화)

```js
// async 함수는 Promise를 반환
async function loadData() {
  try {
    const res = await fetch(url);          // 네트워크 대기 (파이썬 await)
    if (!res.ok) return null;              // 4xx/5xx는 예외 안 남 → 직접 확인!
    return await res.json();               // 본문 파싱도 비동기
  } catch (err) {
    return null;                           // 네트워크 실패 → 조용히 (§12)
  }
}
loadData().then(data => { ... });          // Promise 소비
const data = await loadData();             // 또는 await (async 안에서)
```
**우리 코드 (`leaderboard.ts`·`share-button.tsx`)**: 모든 네트워크·클립보드 호출이
`try/await/catch`로 감싸여 "실패해도 게임을 안 막음"(§12). Day 1 §5-3의 실행 순서
(동기→마이크로태스크→매크로태스크)를 다시 떠올려 보세요.

---

## 9. 브라우저·수학 API (우리 게임의 도구들)

```js
// Math — 게임 물리·판정 (Day 3 §3, docs/05)
Math.min(2, dpr)          // 작은 값 (dt 상한·연료 상한에)
Math.max(0, x)            // 큰 값
Math.floor(3.9)           // 3 (내림)
Math.round(2.5)           // 3
Math.abs(-5)              // 5
Math.hypot(dx, dy)        // √(dx²+dy²) 거리 — 충돌 판정 (§7 황금률)
Math.sin(t), Math.cos(t)  // 흔들림·궤도 (sin 낙하 흔들림)
Math.random()             // 0~1 난수 (스폰 확률·지터)
Math.PI                   // 원주율

// JSON (localStorage 저장 — 파이썬 json)
JSON.stringify({a:1})     // '{"a":1}'
JSON.parse('{"a":1}')     // {a:1}

// 타이머
setTimeout(fn, ms)        // 한 번 뒤에
setInterval(fn, ms)       // 반복 (clearInterval로 해제)
requestAnimationFrame(fn) // 화면 갱신 직전 (게임 루프, Day 3 §2)

// 이벤트
el.addEventListener("pointerdown", handler)   // 등록
el.removeEventListener("pointerdown", handler) // 해제 (정리 필수)
```
**우리 코드**: `Math.min(TUNE.maxDt, (now-last)/1000)`(dt 상한), `Math.hypot`(거리 판정),
`Math.random()`(스폰 지터 ±30%), `JSON.stringify/parse`(설정·인벤토리 저장).

---

## 10. 모듈 — import/export (Day 1 §6)

```js
// 내보내기 (storage.ts)
export function loadBest() { ... }
export const COLORS = { ... };
export default function Page() { ... }   // 파일당 하나

// 가져오기
import { loadBest, COLORS } from "@/lib/storage";   // 이름으로
import Page from "./page";                          // default
import type { StoredSettings } from "@/lib/storage"; // 타입만 (TS)
```
`@/`는 `src/`의 별칭(tsconfig 설정). 파이썬 `from lib.storage import load_best`.

---

## 11. 연습 문제 (브라우저 콘솔 F12 → Console에서 바로!)

콘솔은 JS의 REPL입니다(파이썬 `>>>`). 붙여넣고 즉시 실행하세요.

### 연습 1 — 배열 파이프라인
```js
const scores = [120, 45, 300, 80, 210];
// TODO: 100점 넘는 것만 골라, 2배 한 뒤, 합계를 구하라 (filter→map→reduce)
// 기대: (120+300+210) 각 2배의 합 = 1260
```
힌트: `scores.filter(...).map(...).reduce(...)`. 파이썬으로도 써 보고 대조.

### 연습 2 — 역순 삭제 버그 체험
```js
const xs = [1, 2, 3, 4, 5, 6];
// (a) 정방향으로 짝수를 지워 보라 — 버그로 일부가 남는다
for (let i = 0; i < xs.length; i++) if (xs[i] % 2 === 0) xs.splice(i, 1);
console.log(xs);   // 예상과 다를 것! 왜인지 설명
// (b) 역순으로 고쳐서 올바르게 지우기 (우리 코드 §3-2 방식)
```

### 연습 3 — 구조 분해·전개
```js
const settings = { lat: 37.5, lon: 127, character: "mint" };
// TODO: 구조 분해로 lat/lon만 꺼내기
// TODO: 전개로 character만 "coral"로 바꾼 새 객체 만들기 (원본 불변)
```

### 연습 4 — 클로저로 카운터
`makeCounter`(§6-2)를 직접 짜고, 두 개의 독립 카운터가 서로 간섭 안 하는지 확인
(`const a = makeCounter(); const b = makeCounter();`).

### 연습 5 — 비동기 순서 예측 (Day 1 §5-3 복습)
```js
console.log("A");
setTimeout(() => console.log("B"), 0);
Promise.resolve().then(() => console.log("C"));
console.log("D");
// 출력 순서를 먼저 예측하고, 실행해 맞춰 보기 (정답: A D C B)
```

### 연습 6 — 미니 게임 로직
`Math.hypot`로 두 점 거리를 구하고, 반지름 합보다 작으면 "충돌!"을 찍는 함수를
작성(우리 §7 판정 규칙의 축소판):
```js
function hit(ax, ay, ar, bx, by, br) {
  // TODO: Math.hypot(ax-bx, ay-by) < ar + br 이면 true
}
```

### 연습 7 — 우리 코드 읽기
`src/lib/storage.ts`의 `loadSettings`를 읽고: (a) 어떤 배열/객체 메서드가 쓰였나,
(b) `??`·`?.`·삼항이 각각 어디서 무엇을 방어하나, (c) `try/catch`가 왜 필요한가를
자기 말로 정리. 그다음 `joops-game.tsx`의 역순 순회 루프(§3-2 실물)를 찾아 왜 역순인지
주석 없이 설명해 보기.

---

## 12. 셀프 체크 ✅
- [ ] `const`/`let`, `===`/`==`, `??`/`||`의 차이를 말할 수 있나?
- [ ] `map`/`filter`/`reduce`를 파이썬 대응과 함께 쓸 수 있나?
- [ ] 순회 중 삭제는 왜 역순 + splice로 하나?
- [ ] 구조 분해와 전개를 객체·배열 양쪽에서 쓸 수 있나? React 훅에서 어디에 나오나?
- [ ] 클로저가 무엇이고, 왜 우리 게임 상태가 클로저에 사나?
- [ ] `async/await`로 네트워크를 다루고, `fetch`가 4xx에서 예외를 안 던지는 걸 처리하나?
- [ ] `Math.hypot`·`Math.min`·`Math.random`이 게임에서 각각 어디에 쓰이나?
- [ ] `import`/`export`와 `@/` 별칭을 파이썬 모듈에 대응시킬 수 있나?

---

🎓 세 랩(HTML·CSS·JS)을 마치면, 우리 저장소의 어떤 파일을 열어도 **문법이 막히지
않습니다.** 이제 [Day 3](./day-3-렌더링과-게임루프.md)의 게임 루프와
[Day 5](./day-5-데이터와-프로덕션.md)의 데이터 계층을 코드 레벨로 정독할 준비가 됐습니다.

→ 다른 랩: [① HTML](./lab-html.md) · [② CSS](./lab-css.md)
→ 커리큘럼 처음으로: [README](./README.md)
