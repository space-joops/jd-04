# 06. 브라우저 API — 브라우저가 공짜로 주는 능력들

자바스크립트 언어 자체엔 저장·소리·진동 기능이 없어요. 전부 **브라우저가
제공하는 API**입니다. 우리 게임이 쓰는 것들을 살펴봅시다.

## 1. localStorage — 새로고침해도 남는 저장소

```ts
localStorage.setItem("sjs-best", "1200");   // 저장 (값은 항상 문자열!)
localStorage.getItem("sjs-best");           // 읽기 → "1200" 또는 null
```

- 키-값 문자열 저장소. 브라우저를 꺼도 남습니다 (같은 사이트에서만 보임).
- **객체를 저장하려면 JSON을 거칩니다**:

```ts
// src/lib/storage.ts — 인벤토리 저장
localStorage.setItem(INVENTORY_KEY, JSON.stringify(inv));  // 객체 → 문자열
const parsed = JSON.parse(raw);                            // 문자열 → 객체
```

- 시크릿 모드 등에서 **예외를 던질 수 있어서** 우리는 모든 접근을
  try-catch로 감쌉니다. 읽은 값도 검증해요 — 사용자가 개발자 도구로
  이상한 값을 넣어도 게임이 안 깨지게:

```ts
const n = raw === null ? 0 : Number(raw);
return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
```

우리 게임의 저장 키 5형제: `sjs-best`(최고 기록), `sjs-pet`(펫),
`sjs-intro`(인트로 봤나), `sjs-muted`(음소거), `sjs-inventory`(도감).

## 2. Web Audio — 오디오 파일 없이 소리 만들기

효과음이 전부 **코드로 합성**됩니다. 재료는 딱 둘:

```ts
// src/lib/sound.ts — chirp의 뼈대
const osc = audio.createOscillator();   // 순수한 "삐" 소리 발생기
const g = audio.createGain();           // 볼륨 조절기
osc.frequency.setValueAtTime(430, t0);                       // 시작 주파수
osc.frequency.exponentialRampToValueAtTime(900, t0 + dur);   // 목표까지 미끄러지기
g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);       // 소리 잦아들기
osc.connect(g).connect(audio.destination);                   // 발생기→볼륨→스피커
osc.start(t0); osc.stop(t0 + dur + 0.02);
```

- **파형(type)**: `triangle`(부드러움)은 좋은 일, `sawtooth`(거친 소리)는 나쁜 일.
- **음 높이**: 올라가면 긍정, 내려가면 부정 — 이 두 문법으로 모든 효과음을 만듭니다.
- 지수 램프를 쓰는 이유: 귀는 로그 스케일로 들어서, 선형보다 지수 변화가 자연스러워요.

**자동재생 정책**: 브라우저는 사용자가 탭/클릭하기 전엔 소리를 막습니다.
그래서 `ensureAudio()`(AudioContext 생성/깨우기)를 반드시 **포인터 이벤트
핸들러 안에서** 부릅니다.

**음소거 토글**은 한 줄 관문으로 구현돼요:

```ts
if (!audio || muted) return;   // chirp 맨 앞 — 꺼져 있으면 조용히 통과
```

## 3. 진동 — navigator.vibrate

```ts
// src/lib/haptics.ts
navigator.vibrate?.(ms);   // 지원 안 하면(iOS 등) ?. 덕분에 그냥 무시
```

먹기 12ms, 피격 90ms, 방패 막기 30ms — 길이로 감각을 구분합니다.

## 4. 포인터 이벤트 — 터치와 마우스를 한 번에

`pointerdown` / `pointermove` / `pointerup`은 터치·마우스·펜을 **하나의
이벤트로 통일**한 API예요. 가상 조이스틱이 이걸로 만들어집니다:

```ts
canvas.addEventListener("pointerdown", onPointerDown);
// 핸들러 안: 화면 좌표 → 캔버스 좌표 변환
const rect = canvas.getBoundingClientRect();
const x = e.clientX - rect.left;
// 드래그가 캔버스 밖으로 나가도 이벤트를 계속 받게
(e.target as HTMLElement).setPointerCapture(e.pointerId);
```

CSS `touch-none`(touch-action: none)도 필수예요 — 없으면 브라우저가
드래그를 "스크롤"로 가로채 갑니다.

### pointer-events — 터치를 통과시키는 CSS

HUD는 캔버스 **위에** 떠 있는 HTML인데, 터치는 캔버스가 받아야 하죠:

```tsx
<div className="pointer-events-none ...">   {/* 오버레이 전체: 터치 통과 */}
  <button className="pointer-events-auto">⏸</button>  {/* 버튼만: 터치 받기 */}
```

## 5. visibilitychange — 탭이 숨겨지는 순간

```ts
// src/app/play/joops-game.tsx
const onVisibility = () => {
  if (document.hidden) setPaused(true);   // 전화·알림에 억울하게 죽지 않게
};
document.addEventListener("visibilitychange", onVisibility);
```

복귀 시 자동 재개는 일부러 안 합니다 — 준비된 건 화면이지 사람이 아니니까요.

## 6. PWA — 웹을 앱처럼 설치하기

세 조각이 모여 "홈 화면에 추가"가 완성됩니다:

1. **매니페스트** (`src/app/manifest.ts`): 앱 이름·아이콘·전체화면 여부.
   Next.js가 `/manifest.webmanifest`로 만들어 자동 연결해 줘요.
2. **아이콘**: 이미지 파일 대신 `ImageResponse`로 **서버가 JSX를 PNG로 렌더링**
   (`src/app/pwa-icon.tsx`) — 마스코트 도트 좌표를 div 사각형으로 옮긴 것.
3. **설치 버튼** (`src/app/install-button.tsx`): 크롬이 주는 `beforeinstallprompt`
   이벤트를 잡아 뒀다가, 버튼을 누르면 `prompt()`로 설치창을 띄웁니다.
   iOS엔 이 이벤트가 없어서 "공유 → 홈 화면에 추가" 안내로 대신해요.

## 7. 서비스 워커 — 오프라인과 업데이트

서비스 워커(`public/sw.js`)는 **페이지와 서버 사이에 끼어드는 프록시**입니다.
모든 네트워크 요청이 `fetch` 이벤트로 지나가요:

```js
self.addEventListener("fetch", (event) => {
  event.respondWith(/* 캐시에서 줄지, 네트워크로 갈지 우리가 결정 */);
});
```

우리 전략은 요청 종류별로 다릅니다:

| 요청 | 전략 | 이유 |
|---|---|---|
| 페이지 이동 | 네트워크 우선 | 새 배포가 캐시에 막히면 안 됨. 오프라인일 때만 캐시 |
| `/_next/static/` | 캐시 우선 | 파일명에 해시가 있어 내용이 절대 안 변함 |
| 그 외 GET | 캐시 주고, 뒤에서 갱신 | 빠르고 신선함의 타협 (stale-while-revalidate) |

**업데이트 흐름**: 등록 주소가 `/sw.js?v=버전`이라, package.json 버전을 올려
배포하면 브라우저가 "새 워커네?" 하고 설치합니다. `sw-register.tsx`가 그걸
감지해 "🚀 새 버전 도착!" 토스트를 띄우고, 누르면 워커 교대 후 새로고침 —
**사용자가 눌렀을 때만** 새로고침한다는 게 중요해요 (게임 도중 강제 리로드 금지).

개발 중엔 등록하지 않습니다 (`NODE_ENV !== "production"` 체크) — 핫리로드가
캐시에 오염되면 디버깅 지옥이 열리거든요.
