// ============================================================================
// sw.js — 서비스 워커: 앱 셸 캐싱(오프라인) + 배포 갱신 (CLAUDE.md §13)
//
// 캐시 전략 (요청 종류별로 다르다 — 하나로 통일하면 어딘가는 반드시 곪는다):
// 1) 페이지 이동(navigate): 네트워크 우선 — 새 배포가 캐시에 가로막히면 안 된다.
//    오프라인일 때만 캐시된 셸로 폴백 (게임 상태는 localStorage라 오프라인 플레이 가능).
// 2) /_next/static/·아이콘: 캐시 우선 — 파일명에 해시가 있어 내용이 절대 안 변한다.
// 3) 그 외 동일 출처 GET: stale-while-revalidate — 일단 캐시로 빠르게, 뒤에서 갱신.
// 교차 출처(폰트 CDN·Supabase)는 건드리지 않는다 — 브라우저에 맡긴다.
//
// 갱신 메커니즘: 등록 URL의 ?v=(package.json 버전)이 배포마다 바뀌므로
// 브라우저가 새 워커를 설치하고, sw-register.tsx가 토스트를 띄운다.
// 사용자가 누르면 SKIP_WAITING 메시지 → 즉시 교대 → 페이지 리로드.
//
// VERSION: 캐시 저장소 이름. 캐시 구조를 바꾸거나 대청소가 필요할 때만 올린다 —
// activate에서 이름이 다른 옛 캐시를 전부 지운다.
// ============================================================================

const VERSION = "1";
const CACHE = "sjs-" + VERSION;
/** 오프라인 폴백용 앱 셸 — 이 두 페이지만 있으면 게임이 통째로 돈다. */
const SHELL = ["/", "/play"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      // cache: "reload" — HTTP 캐시를 건너뛰고 항상 서버의 최신 셸을 담는다
      cache.addAll(SHELL.map((url) => new Request(url, { cache: "reload" }))),
    ),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // 이름이 다른 옛 캐시 정리 — VERSION을 올려 배포하면 여기서 대청소된다
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith("sjs-") && key !== CACHE)
          .map((key) => caches.delete(key)),
      );
      // 대기 없이 즉시 모든 탭을 접수 — 다음 방문부터 오프라인이 동작하게
      await self.clients.claim();
    })(),
  );
});

// sw-register.tsx의 갱신 토스트에서 보낸다 — 대기 중인 새 워커를 즉시 교대
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return; // Supabase 등록(POST) 등은 절대 캐시하지 않는다
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // 교차 출처는 손대지 않는다

  // 1) 페이지 이동: 네트워크 우선, 실패하면 캐시된 셸
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(req);
          if (res.ok) {
            const cache = await caches.open(CACHE);
            cache.put(req, res.clone()); // 성공한 최신 셸을 다음 오프라인을 위해 저장
          }
          return res;
        } catch {
          // ignoreSearch: "/play?start=1"도 캐시된 "/play"로 열리게
          const cached = await caches.match(req, { ignoreSearch: true });
          return cached || (await caches.match("/")) || Response.error();
        }
      })(),
    );
    return;
  }

  // 2) 해시 자산: 캐시 우선 — 있으면 네트워크에 갈 이유가 없다
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icon-") ||
    url.pathname.startsWith("/apple-icon")
  ) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(req);
        if (cached) return cached;
        const res = await fetch(req);
        if (res.ok) {
          const cache = await caches.open(CACHE);
          cache.put(req, res.clone());
        }
        return res;
      })(),
    );
    return;
  }

  // 3) 그 외 동일 출처 GET: stale-while-revalidate
  event.respondWith(
    (async () => {
      const cached = await caches.match(req);
      const fetching = fetch(req)
        .then(async (res) => {
          if (res.ok) {
            const copy = res.clone();
            const cache = await caches.open(CACHE);
            cache.put(req, copy);
          }
          return res;
        })
        .catch(() => undefined);
      return cached || (await fetching) || Response.error();
    })(),
  );
});
