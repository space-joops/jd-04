# Day 3 — 실시간 렌더링: Canvas · 게임 루프 · Web Audio

> **오늘의 목표**
> 1. 이 프로젝트의 대원칙 "60fps는 캔버스, 가끔은 React"의 실체를 코드로 본다.
> 2. `requestAnimationFrame` 루프와 `dt` 기반 **프레임 독립성**을 이해하고 직접 짠다.
> 3. Canvas 2D API로 그림을 그리고, **update/draw 분리** 원칙을 안다.
> 4. Web Audio API로 파일 없이 소리를 합성하는 원리를 이해한다.
>
> **끝나면**: 프레임 독립적 애니메이션 루프를 직접 작성하고, "왜 이 게임이 120Hz
> 폰에서도 같은 속도로 도는가"를 설명할 수 있다.

이 프로젝트의 진짜 엔지니어링이 여기 있습니다. 데이터 엔지니어에게 이날은
**"실시간 스트리밍 파이프라인을 브라우저 한 스레드에서 60Hz로 돌리는 법"** 입니다.

---

## 0. 하루 타임박스

| 시간 | 내용 |
|---|---|
| 오전 1 | §1 대원칙 · §2 게임 루프 해부 |
| 오전 2 | §3 dt와 프레임 독립성 · §4 update/draw 분리 |
| 오후 1 | §5 Canvas 2D API · §6 좌표계와 픽셀 아트 |
| 오후 2 | §7 Web Audio 합성 · §8 실제 코드 정독 |
| 저녁 | §9 실습(미니 루프 직접 짜기) · §10 셀프 체크 |

---

## 1. 대원칙: "초당 60번 변하는 건 캔버스에, 가끔 변하는 것만 React에"

Day 2에서 배웠죠: `setState`를 부르면 React가 컴포넌트를 다시 그립니다. 그럼 게임처럼
**초당 60번** 좌표가 바뀌면? `setState`를 60번/초 부르면 React가 60번/초 리렌더 →
재조정 → 브라우저 폭발. **이건 React가 잘하는 일이 아닙니다.**

그래서 이 프로젝트의 아키텍처(§12):

> **게임 세계(점수·좌표·엔티티 배열)는 `useEffect` 클로저 안의 지역 변수**입니다.
> React `useState`는 **`ui` 객체 하나뿐**, 점수/하트/phase가 **실제로 바뀔 때만**
> `pushUi()`로 알립니다. 매 프레임 그리기는 전부 캔버스가 합니다.

```
┌─────────────────────────── React 영역 (가끔) ───────────────────┐
│  HUD: 점수 1420, 하트 ♥♥♡      ← pushUi()로 값 바뀔 때만 리렌더    │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────── Canvas 영역 (60fps) ─────────────────┐
│  마스코트·낙하물·스파크·배경  ← requestAnimationFrame 루프가 매 프레임 │
└─────────────────────────────────────────────────────────────────┘
```

**데이터 엔지니어 비유**: React는 "대시보드 집계값"(가끔 갱신). 캔버스는 "원본 이벤트
스트림"(초당 수만 건). 스트림 하나하나를 대시보드에 리렌더시키지 않고, 집계된 지표만
가끔 올리는 것 — 정확히 그 설계입니다.

Day 2에서 배운 `useRef`와 클로저가 여기서 빛납니다: 매 프레임 바뀌는 값은 리렌더를
일으키면 안 되니까, React state가 아니라 **클로저 지역 변수**에 둡니다.

---

## 2. 게임 루프 해부 — `requestAnimationFrame`

이 게임 심장의 실제 코드입니다 (`src/app/play/joops-game.tsx:862`):

```ts
let raf = 0;
let last = performance.now();          // 지금 시각(ms) — 파이썬 time.perf_counter()*1000
const frame = (now: number) => {
  // dt = 지난 프레임과의 시간 간격(초). 상한 0.05로 자른다(§3에서 설명)
  const dt = Math.min(TUNE.maxDt, (now - last) / 1000);
  last = now;
  if (!paused) update(dt);             // ① 세계를 dt초만큼 전진시킨다
  draw();                              // ② 현재 세계를 화면에 그린다
  raf = requestAnimationFrame(frame);  // ③ "다음 프레임에 또 불러 줘"
};
raf = requestAnimationFrame(frame);    // 첫 프레임 예약 → 루프 시작
```

### `requestAnimationFrame`(rAF)이란?

브라우저에게 "다음 화면 갱신 직전에 이 함수를 불러 줘"라고 예약하는 API입니다.
브라우저는 보통 **모니터 주사율(60Hz면 60번/초)**에 맞춰 부릅니다.

- `frame`이 끝나면서 또 `requestAnimationFrame(frame)`을 부릅니다 → **자기 자신을 계속
  예약**하는 무한 루프. 하지만 `while(True)`가 아니라 **브라우저 시계에 양보**하는
  루프라 화면이 안 얼어붙습니다(Day 1 §5-2의 단일 스레드 문제를 우아하게 해결).
- `now`(호출 시각)를 브라우저가 넣어 줍니다. 이걸로 `dt`를 잽니다.
- 왜 `setInterval(frame, 16)`이 아니라 rAF인가? rAF는 화면 갱신에 **동기화**되고,
  탭이 백그라운드면 **자동으로 멈춰** 배터리·CPU를 아낍니다. 게임 루프의 표준입니다.

### 정리(cleanup)를 잊지 마라

`useEffect`가 끝날 때(컴포넌트 언마운트) 루프를 멈춰야 합니다. 안 그러면 유령 루프가
계속 돕니다. 실제 코드(`:979`):
```ts
return () => { cancelAnimationFrame(raf); /* + 리스너·오디오 정리 */ };
```
Day 2 §4에서 강조한 정리 함수의 실물입니다.

---

## 3. `dt` — 프레임 독립성의 비밀 (오늘의 핵심 개념)

**문제**: 60Hz 폰과 120Hz 폰과 30fps로 버벅이는 폰에서, 게임이 **같은 속도**로 돌아야
공정합니다. "매 프레임 좌표를 +5" 하면 120Hz에선 2배 빨라집니다.

**해결**: 모든 움직임을 **`값 × dt`** 로 계산합니다. `dt`는 "지난 프레임 이후 흐른
실제 시간(초)". 초당 이동량을 정하고 거기에 dt를 곱하면, 프레임이 몇 번 돌든 **1초에
가는 거리는 같습니다.**

```ts
// 나쁨: 프레임 수에 의존 (120Hz에서 2배 빠름)
mascot.x += 5;

// 좋음: 시간에 비례 (어떤 주사율에서도 초당 300px)  ← 이 프로젝트의 규칙(§12)
mascot.x += 300 * dt;
```

**데이터 엔지니어 비유**: 처리량을 "배치당 N건"이 아니라 "초당 N건(throughput)"으로
정규화하는 것과 같습니다. 하드웨어 속도와 무관하게 결과가 일정하도록.

### dt 상한 — 터널링 방지

```ts
const dt = Math.min(TUNE.maxDt, (now - last) / 1000);   // maxDt = 0.05
```
사용자가 다른 탭에 갔다 오면(rAF가 멈췄다 재개) `now - last`가 **수십 초**가 됩니다.
그대로 곱하면 낙하물이 화면을 한 프레임에 뚫고 지나가(터널링) 충돌 판정이 씹힙니다.
그래서 dt를 0.05초(=최소 20fps 취급)로 **자릅니다**. "한 번에 최대 이만큼만 전진".
스트리밍에서 지연된 배치가 폭주하지 않게 워터마크/윈도우로 자르는 것과 같은 안전장치.

### 지수 감쇠 추적 — 부드러운 움직임의 공식

이 프로젝트 곳곳의 부드러운 추적은 전부 한 패턴입니다(§12):
```ts
pos += (target - pos) * Math.min(1, dt * k);   // k = 반응 속도
```
"목표까지 남은 거리의 일정 비율만큼 매 프레임 다가간다" → 처음엔 빠르게, 가까워질수록
느리게(자연스러운 감속). 실제 코드에서 눈동자 시선(`:547 gazeEase`), 입 벌림(`:553`),
마스코트 복귀(`:524`)가 전부 이 공식입니다. 신호 처리의 저역통과 필터(EMA, 지수이동
평균)와 **수학적으로 동일**합니다 — 당신이 이미 아는 그것.

---

## 4. update / draw 분리 — 순수성의 규율

이 프로젝트의 철칙(§12):

> **`update(dt)`는 상태만 바꾸고 캔버스를 절대 안 건드린다.**
> **`draw()`는 읽기만 하고 상태를 절대 안 바꾼다.**

```ts
if (!paused) update(dt);   // 세계를 전진: 좌표 갱신, 충돌 판정, 스폰, 점수 (그리기 X)
draw();                    // 세계를 렌더: 배경·엔티티·HUD를 캔버스에 (상태 변경 X)
```

**왜?**
- **일시정지**가 공짜로 됩니다: `update`만 건너뛰면(`if (!paused)`) 세계는 멈추고
  화면은 그대로 남습니다(§4 "멈춘 건 세계지 화면이 아니다").
- **테스트·추론이 쉬움**: update는 "입력 상태 → 다음 상태"인 순수 함수에 가깝고, draw는
  부작용 없는 렌더러. 데이터 파이프라인의 "변환 단계 vs 출력 단계" 분리와 같은 규율.
- **버그가 준다**: 그리다가 상태를 바꾸면 프레임마다 미묘하게 달라지는 지옥이 열립니다.

`update`가 하는 일(대략): 조이스틱 입력으로 마스코트 가속 → 마찰 → 경계 반발 →
낙하물 이동 → 자석 흡입 → 충돌 판정(먹기/피격) → 스폰 → 콤보·난이도 계산 →
연료 소모/회복. 전부 좌표와 숫자만 만집니다.

`draw`가 하는 일: 배경(별·격자·지구) → 낙하물 → 스파크 → 마스코트 → 조이스틱/분사
불꽃 → 팝업 글자. 전부 `ctx`에 그리기만.

---

## 5. Canvas 2D API — 코드로 그리는 그림

`<canvas>`는 브라우저의 그림판입니다. 파이썬의 Pillow/matplotlib과 개념이 같되,
**초당 60번 다시 그리는** 실시간 캔버스입니다.

### 5-1. 컨텍스트 얻기

```ts
const canvas = canvasRef.current;              // Day2의 useRef로 잡은 DOM 요소
const ctx = canvas.getContext("2d");           // 2D 그리기 도구 (Pillow의 ImageDraw)
```

### 5-2. 기본 그리기 명령

| 명령 | 하는 일 | Pillow 대응 |
|---|---|---|
| `ctx.fillStyle = "#ff8080"` | 채우기 색 설정 | `fill=(255,128,128)` |
| `ctx.fillRect(x, y, w, h)` | 사각형 채우기 | `draw.rectangle(...)` |
| `ctx.clearRect(x, y, w, h)` | 지우기(투명) | 새 프레임 시작 시 화면 비우기 |
| `ctx.fillText("YUM!", x, y)` | 글자 | `draw.text(...)` |
| `ctx.beginPath()`/`arc()`/`fill()` | 원 | `draw.ellipse(...)` |
| `ctx.globalAlpha` | 전체 투명도(0~1) | 알파 합성 |

### 5-3. 상태 변환 — `save`/`restore`/`translate`/`scale`/`rotate`

캔버스는 "좌표계 자체를 옮기고 돌리고 확대"할 수 있습니다. 이게 픽셀 아트의 비밀입니다.

```ts
ctx.save();                    // 현재 좌표계·스타일을 스택에 저장 (파이썬 스택 push)
ctx.translate(x, y);           // 원점을 (x,y)로 이동
ctx.rotate(angle);             // 회전
ctx.scale(s, s);               // 확대
// ... 여기서 그리면 (x,y) 기준으로 회전·확대되어 그려짐 ...
ctx.restore();                 // 저장했던 좌표계로 복귀 (pop)
```
`save`/`restore`는 **반드시 짝**을 맞춰야 합니다(파이썬 `with` 블록처럼). 안 맞으면
변환이 누적돼 화면이 무너집니다.

> **`globalAlpha`는 대입이 아니라 곱해서 써라**(§12): `ctx.globalAlpha *= 0.5`.
> 실제 코드 `:693`·`:703`에서 슬로모·자석 효과가 이렇게 중첩 투명도를 안전하게 씁니다.
> `= 0.5`로 덮으면 바깥에서 이미 반투명이던 걸 무시해 버그가 납니다.

---

## 6. 좌표계와 픽셀 아트 — 가상 픽셀 격자

### 6-1. DPR 대응 — 왜 그림이 안 흐릿한가

요즘 폰은 CSS 1px 안에 물리 픽셀이 2~3개(DPR). 캔버스 버퍼를 CSS 크기로 만들면
확대돼 흐려집니다. 그래서 `fitCanvas`(`src/lib/canvas.ts`)가:
```ts
const dpr = Math.min(2, window.devicePixelRatio || 1);  // 상한 2 (화질 대비 비용 타협)
canvas.width  = Math.round(w * dpr);   // 버퍼는 DPR배로 크게
canvas.getContext("2d")?.setTransform(dpr, 0, 0, dpr, 0, 0);  // 좌표계는 CSS px로 복원
return { w, h };                        // 게임 로직은 CSS px만 쓴다 (DPR을 몰라도 됨)
```
덕분에 게임 코드 전체가 DPR을 신경 안 씁니다. **복잡성을 한 곳에 가두는** 좋은 설계.

### 6-2. 가상 픽셀 격자 — 도트 실루엣 유지 (§11)

이 프로젝트는 그림을 부드러운 곡선이 아니라 **가상 픽셀 격자에 fillRect로 "찍어서"**
만듭니다. 마스코트를 -4~+4 범위의 픽셀 좌표로 그린 뒤 `ctx.scale(r/4)`로 확대하면,
크기가 달라도 도트 실루엣이 유지됩니다.

```ts
// 개념 (src/lib/mascot.ts 패턴)
ctx.save();
ctx.translate(x, y);
ctx.scale(r / 4, r / 4);       // -4~+4 격자를 반지름 r 크기로 확대
// 이제 fillRect(-2, -1, 1, 1) 같은 "도트"를 찍으면 픽셀 아트가 된다
ctx.restore();
```
그리기 함수는 전부 `src/lib/`로 격리(§11): `mascot.ts`(주인공), `debris.ts`(낙하물),
`backdrop.ts`(배경). "아트를 갈아탈 때 이 파일만 교체"하는 구조입니다 — 관심사 분리.

> 📌 **더 깊이**: [`docs/04-캔버스와-게임-루프.md`](../docs/04-캔버스와-게임-루프.md)와
> [`docs/05-게임-수학.md`](../docs/05-게임-수학.md)가 좌표 변환·거리 판정·sin 흔들림을
> 이 저장소 코드로 한 줄씩 풉니다. 오늘 루프를 이해했다면 그 문서가 술술 읽힙니다.

---

## 7. Web Audio API — 파일 0개로 소리 만들기

이 프로젝트엔 오디오 파일이 하나도 없습니다(§11). 모든 소리는 **오실레이터로 즉석
합성**합니다. 데이터 엔지니어에겐 친숙할 겁니다 — numpy로 사인파 만들어 스피커로
보내는 것과 개념이 같습니다.

### 7-1. 소리 = 파형 + 시간에 따른 주파수·음량

```ts
// src/lib/sound.ts — chirp() 실제 코드(축약)
const osc = audio.createOscillator();   // 발진기: 파형을 만든다
const g = audio.createGain();           // 게인: 음량을 조절한다
osc.type = "triangle";                  // 파형 종류(사인/삼각/톱니/사각)
osc.frequency.setValueAtTime(430, t0);                      // 시작 430Hz
osc.frequency.exponentialRampToValueAtTime(900, t0 + 0.12); // 0.12초에 걸쳐 900Hz로 상승
g.gain.setValueAtTime(0.08, t0);
g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.12);     // 음량은 지수로 감쇠
osc.connect(g).connect(audio.destination);   // 발진기 → 게인 → 스피커 (파이프라인!)
osc.start(t0);
osc.stop(t0 + 0.14);
```
**노드를 연결(connect)해 신호 흐름을 만드는 것**이 Web Audio의 핵심입니다. `osc → gain
→ destination`은 데이터 파이프라인의 `source → transform → sink`와 문자 그대로 같은
그래프 구조입니다.

### 7-2. 사운드 문법 (§10) — 소리로 의미 전달

이 프로젝트의 규칙: **음이 올라가면 긍정, 내려가면 부정. 부드러운 파형(triangle)은
좋은 일, 거친 파형(sawtooth)은 나쁜 일.**
- 먹기: 430→900Hz 상승 triangle (좋은 일, 올라감).
- 피격: 220→65Hz 하강 sawtooth (나쁜 일, 내려감, 거침).

### 7-3. 자동재생 정책 — 반드시 제스처 안에서

브라우저는 사용자가 안 건드렸는데 소리를 내는 걸 막습니다(광고 트라우마). 그래서
`AudioContext`는 사용자의 첫 터치/클릭 핸들러 안에서 깨워야 합니다:
```ts
// joops-game.tsx:880 — 첫 포인터다운에서 오디오를 깨운다
const onPointerDown = (e: PointerEvent) => {
  ensureAudio();   // ← 제스처 안에서 AudioContext.resume()
  // ...
};
```
그래서 어제 스토리 인트로 작업에서 "첫 방문 자동 오픈은 제스처가 없어 무음일 수 있다"는
한계가 나왔던 겁니다. 이제 그 이유가 완전히 이해되죠?

> 📌 **더 깊이**: [`docs/06-브라우저-API.md`](../docs/06-브라우저-API.md)가 Web Audio·
> 진동·포인터 이벤트·localStorage를 다룹니다.

---

## 8. 실제 코드 정독

### 8-1. `src/app/play/joops-game.tsx` (이 프로젝트의 본체 — 겁먹지 말고 구조만)
1000줄짜지만 **구조**만 잡으면 됩니다. 위에서 아래로:
- 상단: `TUNE` 상수(손맛·판정·성장 수치의 원본 §15), 타입 정의.
- `useEffect(() => { ... }, [])` **하나**가 게임 전체를 품습니다. 그 안에:
  - 지역 변수로 세계 선언(mascot, junks 배열, score, fuel, combo…). ← **클로저 상태**.
  - `update(dt)` 함수(§4): 입력→물리→충돌→스폰. `Math.min(1, dt*k)` 지수 감쇠 곳곳(§3).
  - `draw()` 함수(§4): 배경→엔티티→HUD.
  - `frame` 루프(`:864`)와 rAF(§2).
  - 입력 핸들러(`onPointerDown`…), visibilitychange 일시정지.
  - **정리 함수**(`:979`): `cancelAnimationFrame` + 리스너·오디오 해제.
- 관전 포인트: React state(`ui`)는 몇 개 안 되고, 나머지는 전부 클로저 변수라는 것을
  눈으로 확인하세요. 그게 대원칙의 실물입니다.

### 8-2. `src/lib/canvas.ts` (§6-1 이미 봄) — 짧고 밀도 높은 좋은 예.
### 8-3. `src/lib/sound.ts` — chirp() 하나로 모든 효과음을 합성하는 걸 확인.

---

## 9. 실습 — 미니 게임 루프 직접 짜기 (오늘의 하이라이트)

빈 HTML 파일 하나로 프레임 독립 루프를 처음부터 만들어 봅니다. 개념이 손에 붙습니다.
`study/` 밖 아무 데나 `loop.html`로 저장하고 브라우저로 여세요(빌드 불필요).

```html
<!doctype html><html><body>
<canvas id="c" width="400" height="300" style="background:#141838"></canvas>
<script>
const ctx = document.getElementById("c").getContext("2d");
let x = 0, last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);  // dt 상한(§3)
  last = now;
  // update: 초당 120px 오른쪽으로 (프레임 독립!)
  x += 120 * dt;
  if (x > 400) x = 0;
  // draw
  ctx.clearRect(0, 0, 400, 300);
  ctx.fillStyle = "#7ee8b2";
  ctx.fillRect(x, 130, 40, 40);     // 민트색 네모가 움직인다
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
</script>
</body></html>
```
과제:
1. 실행해 네모가 흐르는지 확인. `120 * dt`를 `2`(그냥 상수)로 바꿔 보고, 브라우저
   주사율이 다른 기기/모니터에서 속도가 달라짐을 상상(또는 개발자도구로 CPU 스로틀).
2. 지수 감쇠 추가: `x`가 마우스 X를 부드럽게 따라오게.
   `x += (mouseX - x) * Math.min(1, dt * 5)` (§3의 공식). `canvas.onmousemove`로 mouseX 갱신.
3. `save/translate/scale/restore`로 네모를 회전시키기(`ctx.rotate(now/500)`).
4. (도전) 위 §7-1의 chirp 코드를 붙여, 네모가 벽에 닿을 때 "삐" 소리 나게(첫 클릭으로
   AudioContext 깨우는 것 잊지 말 것 §7-3).

---

## 10. 셀프 체크 ✅

- [ ] 왜 게임 상태를 React `useState`가 아니라 클로저 변수/ref에 두나?
- [ ] `requestAnimationFrame`이 `setInterval`보다 게임 루프에 나은 이유 2가지는?
- [ ] `값 * dt`가 왜 프레임 독립성을 주나? dt 상한(0.05)은 무엇을 막나?
- [ ] `pos += (target - pos) * min(1, dt*k)`는 신호처리의 무엇과 같은가?
- [ ] update와 draw를 나누는 규칙은? 그 덕에 일시정지가 왜 공짜가 되나?
- [ ] `ctx.save()`/`restore()`는 왜 짝을 맞춰야 하나? `globalAlpha`는 왜 곱해서 쓰나?
- [ ] Web Audio에서 `osc → gain → destination` 연결은 데이터 파이프라인의 무엇과 같은가?
- [ ] 오디오는 왜 사용자 제스처 핸들러 안에서 깨워야 하나?

---

## 다음 → [Day 4: 스타일링과 플랫폼](./day-4-스타일과-플랫폼.md)

내일은 CSS/Tailwind로 화면을 꾸미고, PWA·서비스 워커·접근성·배포를 다룹니다.
어제 우리가 고친 OG 프리뷰 버그의 무대(Vercel 배포·메타데이터)도 그날 완전히 이해됩니다.
