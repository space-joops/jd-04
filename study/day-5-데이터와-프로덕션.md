# Day 5 — 데이터·프로덕션·1티어로 가는 길

> **오늘의 목표**
> 1. `fetch`와 REST를 프론트엔드 관점에서 완성한다 (당신의 홈그라운드).
> 2. Supabase의 **RLS·RPC**로 "익명 클라이언트인데도 안전한" 쓰기를 이해한다.
> 3. localStorage·클라이언트 상태·**견고성 철학**("부가 기능이 앱을 죽이면 안 된다").
> 4. DevTools 디버깅·성능 프로파일링, **캡스톤 미니 과제**, 1티어 습관과 성장 지도.
>
> **끝나면**: 데이터 계층을 설계하고, 실무 코드를 읽고 고치고, 스스로 성장할 길을 안다.

당신은 이미 SQL·REST·RLS·데이터 검증의 전문가입니다. 오늘은 그 지식이 **프론트엔드
에서 어떻게 만나는지**를 봅니다. 가장 빠르게 흡수할 날입니다.

---

## 0. 하루 타임박스

| 시간 | 내용 |
|---|---|
| 오전 1 | §1 fetch·REST · §2 Supabase 조회 |
| 오전 2 | §3 RLS·RPC 보안 모델 · §4 localStorage·클라 상태 |
| 오후 1 | §5 견고성 철학 · §6 DevTools 디버깅·성능 |
| 오후 2 | §7 캡스톤 미니 과제 (기능 하나를 끝까지) |
| 저녁 | §8 1티어 습관 · §9 성장 로드맵 · §10 셀프 체크 |

---

## 1. `fetch` — 브라우저의 HTTP 클라이언트

`fetch`는 `httpx`/`requests`의 브라우저 내장 버전입니다. Day 1에서 봤듯 비동기입니다.

```ts
const res = await fetch(url, {
  method: "POST",                                  // 기본은 GET
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ score: 1420 }),           // 파이썬 json.dumps
});
if (!res.ok) return null;          // res.ok = 상태코드 200~299 (raise_for_status 감각)
const data = await res.json();     // 본문 파싱도 비동기 (res.json())
```

| 파이썬(httpx) | fetch |
|---|---|
| `httpx.post(url, json=body)` | `fetch(url, {method:"POST", body: JSON.stringify(body)})` |
| `r.status_code` | `res.status` |
| `r.raise_for_status()` | `if (!res.ok) ...` (자동 예외 아님 — 직접 확인) |
| `r.json()` | `await res.json()` |
| `httpx.get(url, params={...})` | URL에 `?key=value` 직접 붙이거나 `URLSearchParams` |

> **함정**: `fetch`는 4xx/5xx에서 **예외를 안 던집니다**. 네트워크 자체가 실패할 때만
> throw. 그래서 `res.ok`를 반드시 확인해야 합니다. `requests`의 자동 `raise`와 다릅니다.

---

## 2. Supabase 조회 — 당신이 아는 그 PostgreSQL

**Supabase** = PostgreSQL + 자동 REST API(PostgREST) + 인증. 이 프로젝트는 SDK를 안 쓰고
`fetch`로 REST를 직접 부릅니다(§13 학습용 저장소 — HTTP가 그대로 보이게).

```ts
// src/lib/leaderboard.ts — 실제 헤더
const HEADERS = {
  apikey: KEY ?? "",                    // anon key (공개돼도 되는 키)
  Authorization: `Bearer ${KEY}`,
  "Content-Type": "application/json",
};
// 단판 TOP 5 조회 (개념) — PostgREST 쿼리 문법
// GET /rest/v1/pets?select=id,name,best_score&order=best_score.desc&limit=5
```
PostgREST는 **SQL을 URL로** 표현합니다: `?select=`, `?order=col.desc`, `?limit=`,
`?col=eq.value`(WHERE). 당신에겐 SQL이 URL 쿼리스트링으로 번역된 것으로 보일 겁니다 —
실제로 그렇습니다.

`NEXT_PUBLIC_SUPABASE_URL`/`ANON_KEY`는 Day 4에서 배운 대로 `NEXT_PUBLIC_` 접두사라
**브라우저 번들에 노출**됩니다. "어? 키가 공개돼도 되나?" — 네, 다음 절이 그 이유입니다.

---

## 3. RLS·RPC — 익명인데 안전한 이유 (핵심)

익명 키(anon key)가 공개돼도 남의 기록을 조작 못 하는 이유는 **키가 아니라 DB가
지키기** 때문입니다. 데이터 엔지니어에겐 익숙한 두 장치:

### 3-1. RLS (Row Level Security) — 행 단위 권한

PostgreSQL의 RLS 정책이 "anon 키로는 테이블에 직접 INSERT/UPDATE 불가"를 강제합니다.
즉 **읽기는 되지만, 남의 누적 점수를 덮어쓰는 쓰기는 원천 차단**. `supabase/schema.sql`에
정책이 정의돼 있습니다. 당신이 데이터 웨어하우스에서 역할별 권한을 거는 것과 같습니다.

### 3-2. RPC (원격 프로시저) — 검증된 쓰기 통로 하나

쓰기는 오직 `submit_result`라는 **security definer 함수**로만 가능합니다(§8-1):
```
submit_result(pet_id, pet_name, score, eaten)
  ├─ 함수 안에서 검증: 이름 1~10자, 점수 1~100000, eaten 0~10000
  ├─ 등록된 펫만 받음 (register_pet이 먼저 이름을 선점)
  └─ 누적 가산 + 단판 insert를 원자적으로(트랜잭션) 처리
```
- **왜 함수로만?** 클라이언트가 아무 값이나 직접 테이블에 쓰면 조작됩니다. 함수 안에서
  검증하면 쓰레기 값이 걸러집니다. 저장 프로시저로 쓰기를 게이트하는 당신의 그 패턴.
- **원자성**: 누적 가산과 기록 insert가 한 트랜잭션 — 중간에 끊겨도 반쪽 상태가 안 남음.
- 물론 "익명 제출 자체의 조작"은 완전히는 못 막습니다 — 아케이드 리더보드의 전통적
  타협(§8-1)입니다. 완벽한 보안이 아니라 **합리적 방어선**을 긋는 실무 감각.

> 📌 **더 깊이**: [`docs/07-서버와-데이터.md`](../docs/07-서버와-데이터.md)가 fetch·
> PostgREST·RLS·RPC·SQL 첫걸음을 이 저장소 기준으로 풉니다.

---

## 4. localStorage & 클라이언트 상태

### 4-1. localStorage — 브라우저 안의 작은 KV 스토어

문자열 키-값 저장소. 브라우저에 영구 저장(탭을 닫아도 남음). Day 1에서 본
`storage.ts`가 이걸 감쌉니다:
```ts
localStorage.setItem("sjs-best", "1420");   // 저장 (값은 항상 문자열)
const raw = localStorage.getItem("sjs-best"); // 읽기 ("1420" 또는 null)
```
- **값은 문자열만** — 객체는 `JSON.stringify`/`JSON.parse`로(파이썬 json과 동일).
- 이 프로젝트의 키: `sjs-best`·`sjs-pet`·`sjs-intro`·`sjs-muted`·`sjs-inventory`·
  `sjs-settings`. 게임 상태가 전부 여기 있어 **오프라인에서도 완전 동작**(Day 4 §6).
- 서버 DB(Supabase)와의 역할 분담: **개인 기기 상태 = localStorage**(로컬 도감·설정·
  최고 기록), **경쟁·공유 데이터 = Supabase**(온라인 랭킹). 엣지 상태와 중앙 상태의 분리.

### 4-2. 클라이언트 상태 공유 — Context (Day 2 예고편의 완결)

언어 설정처럼 "앱 전체가 알아야 하는 상태"는 prop으로 계속 내리기 번거롭습니다.
**React Context**가 전역 상태를 뿌립니다:
```tsx
// i18n-provider.tsx (개념) — Provider가 감싸면 자식 어디서든 useT()로 꺼낸다
<I18nProvider>{children}</I18nProvider>
// 자식에서:
const { t, lang, setLang } = useT();
```
Context는 "전역 싱글턴 설정을 의존성 주입"하는 것과 비슷합니다. 남용하면 리렌더가
넓게 퍼지니, 이 프로젝트처럼 **정말 전역적인 것(언어)에만** 씁니다.

---

## 5. 견고성 철학 — "부가 기능이 앱을 죽이면 안 된다" (§12)

이게 이 저장소가 가르치는 **가장 값진 실무 태도**이고, 데이터 엔지니어의 방어적
코딩과 완벽히 통합니다. 규칙: **localStorage·오디오·네트워크·진동은 전부 실패 허용.**

```ts
// storage.ts — 모든 저장 함수가 이 모양
export function saveBest(score: number): void {
  try {
    localStorage.setItem("sjs-best", String(Math.floor(score)));
  } catch {
    // 저장 실패는 게임 진행에 영향을 주지 않는다. (시크릿 모드 등)
  }
}
```
```ts
// leaderboard.ts — 네트워크 함수는 throw 대신 null/false 반환
export const leaderboardEnabled = Boolean(URL && KEY);  // env 없으면 UI 통째로 숨김
// 모든 조회/제출: 실패하면 null → 게임은 로컬 기록만으로 완전 동작
```

**핵심 원칙 3가지**:
1. **부가 기능은 실패해도 조용히**(try-catch, null 반환). 핵심(게임 플레이)은 절대 안 막음.
2. **입력을 믿지 마라**: `loadSettings`가 손상된 localStorage 값을 필드별로 검증
   (`Number.isFinite`, 리터럴 화이트리스트). 데이터 파이프라인의 스키마 검증과 동일.
3. **점진적 향상(graceful degradation)**: env 없으면 리더보드만 사라지고 게임은 돎.
   소리 미지원이면 무음, 진동 미지원이면 생략. "있으면 좋고 없어도 되는" 계층화.

> 이 태도 하나가 주니어와 시니어를 가릅니다. "해피 패스"만 짜는 게 아니라 **실패
> 경로를 먼저 설계**하는 것. 당신은 이미 파이프라인에서 이걸 합니다 — UI에도 그대로.

---

## 6. 디버깅과 성능 — DevTools는 당신의 pdb·htop

브라우저 F12(DevTools)가 프론트엔드의 관측 도구 전부입니다.

| 탭 | 하는 일 | 파이썬 대응 |
|---|---|---|
| **Console** | 로그·에러·즉석 JS 실행 | `print`/`pdb` REPL |
| **Elements** | DOM·CSS 실시간 편집 | — (박스 모델 관찰) |
| **Network** | 모든 HTTP 요청·응답 | `httpx` 로깅/프록시 |
| **Application** | localStorage·캐시·서비스워커 | 상태 저장소 관찰 |
| **Performance** | 프레임·병목 녹화 | `cProfile`/`py-spy` |
| **Sources** | 중단점 디버깅 | `pdb`/`breakpoint()` |

**디버깅 실전**:
- `console.log(값)` 곳곳에(가장 빠른 확인). `console.table(배열)`은 표로 보여줌.
- Sources 탭에서 코드 줄 클릭 → 중단점 → 변수 검사(pdb의 GUI판).
- **성능(60fps 유지 §13)**: Performance 탭 녹화 → 프레임이 16.6ms를 넘으면 빨간
   "long task". 원인을 찾아 매 프레임 일을 줄임(Day 3의 dt 상한·화면 밖 즉시 제거).
- React 개발자 도구(확장): 컴포넌트 트리·리렌더 원인 추적. "왜 이게 다시 그려지지?"에 답.

---

## 7. 캡스톤 미니 과제 — 기능 하나를 끝까지 (오늘의 하이라이트)

배운 걸 전부 엮어 **작은 기능을 A부터 Z까지** 구현합니다. 규모는 작게, 흐름은 완전하게.
(실제 브랜치를 따서 해 보되, 커밋/PR은 연습이면 로컬에서만.)

### 과제: 랜딩 페이지에 "총 플레이 수" 뱃지 추가

요구사항: 게임을 시작할 때마다 로컬 카운터를 +1 하고, 랜딩에 "PLAYS: N"을 표시.
(리더보드처럼 서버가 아니라 순수 로컬 — §8-2 도감과 같은 성격.)

**단계별 (각 단계가 이 코스의 한 날에 대응):**
1. **[Day 1·5] storage.ts에 저장 함수 추가**:
   ```ts
   const PLAYS_KEY = "sjs-plays";
   export function loadPlays(): number {
     try { const n = Number(localStorage.getItem(PLAYS_KEY)); 
           return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0; }
     catch { return 0; }
   }
   export function bumpPlays(): void {
     try { localStorage.setItem(PLAYS_KEY, String(loadPlays() + 1)); } catch {}
   }
   ```
   (§5 견고성: try-catch·입력 검증을 그대로.)
2. **[Day 3] 게임 시작 시 카운트**: `joops-game.tsx`의 `start()` 함수 안에서
   `bumpPlays()` 호출(먹을 때마다가 아니라 판 시작 시 1회).
3. **[Day 2] 표시 컴포넌트**: `best-score.tsx`를 본떠 `plays-badge.tsx`(클라이언트
   컴포넌트, `useSyncExternalStore`로 localStorage 구독)를 만들어 "PLAYS: N" 렌더.
4. **[Day 2] 랜딩에 꽂기**: `page.tsx`에서 `<BestScore/>` 아래에 `<PlaysBadge/>` 추가.
5. **[Day 4] 스타일**: Tailwind로 `text-sm text-gray-400`, 색은 `COLORS`에서.
6. **[Day 1] 검증**: `npx tsc --noEmit`·`npm run lint` 초록 확인, `npm run dev`로 눈으로.

**성공 기준**: 게임을 세 판 하면 랜딩에 "PLAYS: 3"이 뜨고, 새로고침해도 유지되고,
시크릿 모드(localStorage 막힘)에서도 게임이 안 죽는다. — 이걸 해내면 당신은 이 스택의
**세로 단면 전체**(저장→로직→상태 구독→컴포넌트→라우팅→스타일→검증)를 관통한 겁니다.

> 더 하고 싶으면: 이 뱃지를 `/bag`(도감) 페이지에도 넣기, 또는 "오늘 플레이 수"를
> 날짜와 함께 저장(객체를 JSON으로). CLAUDE.md §16 백로그의 "도전 과제"도 좋은 소재.

---

## 8. 1티어 프론트엔드 개발자의 습관

기술 목록이 아니라 **태도**입니다. 10년차가 주니어와 다른 지점:

1. **실패 경로를 먼저 설계한다.** 해피 패스는 누구나 짠다. "env가 없으면? 오프라인이면?
   손상된 데이터면?"을 먼저 묻는다(§5). — 당신의 데이터 엔지니어 본능 그대로.
2. **경계(boundary)를 안다.** 서버/클라, 캔버스/React, 로컬/원격, 동기/비동기. 무엇이
   어디서 도는지 항상 안다. 이 코스 5일이 전부 "경계 긋기"였다.
3. **60fps를 지표로 본다.** "돌아간다"가 아니라 "부드러운가, 접근 가능한가, 오프라인에서
   되는가"를 품질로 본다(§13 비기능 요구사항).
4. **단일 원천(single source of truth)을 지킨다.** 색은 `constants.ts`, 튜닝은 `TUNE`,
   번역 키는 `en.ts`. 값이 두 곳에 있으면 언젠가 어긋난다.
5. **왜를 남긴다.** 이 저장소의 한글 주석은 "무엇"이 아니라 "왜"를 적는다(§13). 6개월 뒤
   자신과 동료를 위한 투자. 코드는 어떻게, 주석은 왜, 문서는 어떻게 읽나.
6. **작게 자주 검증한다.** `tsc`·`lint`·핫 리로드로 5초마다 피드백. 큰 폭탄 대신 작은
   확인의 연속. 당신이 파이프라인을 단위로 쪼개 테스트하듯.
7. **타입을 갑옷으로 쓴다.** `any`를 피하고, 리터럴 유니온·`Record`로 컴파일러가 실수를
   잡게 한다. 번역 누락·잘못된 enum을 배포 전에 막는 그 힘(Day 1 §3-3).

---

## 9. 여기서 더 나아가려면 — 성장 로드맵

이 5일은 **탄탄한 코어**입니다. 다음 30~90일 방향:

- **React 심화**: 커스텀 훅 추출, `useMemo`/`useReducer`, Context 최적화, Suspense.
  이 프로젝트에서 게임 상태 로직을 커스텀 훅으로 리팩터해 보기.
- **Next.js 심화**: 서버 액션, 데이터 페칭·캐싱, 스트리밍 SSR, 미들웨어. 리더보드를
  서버 컴포넌트에서 미리 불러오게 바꿔 보기.
- **상태 관리**: 앱이 커지면 Zustand/Jotai/TanStack Query. "언제 전역이 필요한가"의 감각.
- **테스트**: Vitest(단위)·Playwright(E2E — 이 저장소가 검증에 쓰는 그것). update 순수
  함수에 단위 테스트를 붙이기 좋다.
- **타입 심화**: 제네릭, 조건부 타입, `infer`. 당신의 데이터 스키마 감각과 잘 맞는다.
- **성능**: 번들 분석, 코드 스플리팅, 렌더 프로파일링, 웹 바이탈.
- **접근성 심화**: 스크린 리더 실사용, 키보드 내비게이션, WCAG.

**가장 좋은 다음 스텝**: 이 게임에 CLAUDE.md §16 백로그의 기능 하나를 골라 **끝까지**
구현하는 것. "도전 과제(한 판에 별 3개)" 같은 것. 요구사항→설계→구현→검증→배포의
전체 사이클을 혼자 돌리면, 5일의 지식이 진짜 실력으로 굳습니다.

---

## 10. 셀프 체크 ✅ (졸업 시험)

- [ ] `fetch`가 4xx/5xx에서 예외를 안 던지는 걸 어떻게 처리하나?
- [ ] anon key가 공개돼도 안전한 이유(RLS + RPC)를 설명할 수 있나?
- [ ] 쓰기를 RPC 함수 하나로 게이트하는 이점 2가지는?
- [ ] localStorage와 Supabase의 역할 분담 기준은?
- [ ] "부가 기능이 앱을 죽이면 안 된다"를 코드 패턴(try-catch·null 반환·env 가드)으로
      말할 수 있나?
- [ ] DevTools 6개 탭을 파이썬 도구에 각각 대응시킬 수 있나?
- [ ] 캡스톤 과제를 끝냈고, 세로 단면(저장→로직→컴포넌트→라우팅→스타일→검증)을
      스스로 그릴 수 있나?
- [ ] 1티어 습관 7개 중 오늘부터 당장 쓸 3개를 골랐나?

---

## 🎓 수료

5일을 완주했습니다. 이제 당신은:
- TS 코드를 두려움 없이 읽고, 비동기 실행 순서를 예측하고,
- React 컴포넌트와 상태·효과를 다루고, 서버/클라 경계를 알고,
- 60fps 게임 루프와 캔버스·오디오의 원리를 이해하고,
- CSS/Tailwind로 반응형 UI를 만들고, PWA·캐시·배포·OG를 알고,
- 데이터 계층을 설계하고, 견고성 철학으로 실패를 먼저 다루고,
- DevTools로 디버깅·프로파일링하며, 스스로 성장할 지도를 가졌습니다.

**남은 건 반복입니다.** 이 저장소를 놀이터 삼아 계속 고치고 깨뜨리세요. 파이썬 데이터
엔지니어의 엄밀함에 프론트엔드의 감각이 더해지면, 그게 진짜 1티어입니다.

→ [코스 처음으로 (README)](./README.md) · [부록: 치트시트](./부록-치트시트.md)
