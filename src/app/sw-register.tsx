"use client";

// ============================================================================
// sw-register.tsx — 서비스 워커 등록 + "새 버전" 갱신 토스트 (§13)
//
// - 프로덕션에서만 등록한다: 개발 중에 켜면 핫리로드가 캐시에 오염된다.
// - 등록 URL에 ?v=(package.json 버전)을 붙인다 — 버전을 올려 배포하면
//   URL이 달라져 브라우저가 새 워커를 설치하고, 아래 감시 코드가 토스트를 띄운다.
//   즉 "배포 갱신 트리거 = package.json 버전 올리기" 하나로 통일된다.
// - 새 워커가 대기(waiting) 상태가 되면 토스트 노출 → 사용자가 누르면
//   SKIP_WAITING → 교대 완료(controllerchange) 시 리로드.
//   ⚠️ 리로드는 "사용자가 눌렀을 때만" — 최초 설치의 controllerchange
//   (clients.claim)에서 멋대로 새로고침하면 게임 도중 화면이 날아간다.
// ============================================================================

import { useEffect, useRef, useState } from "react";
import { COLORS } from "@/lib/constants";
import pkg from "../../package.json";
import { useT } from "./i18n-provider";

export function SwRegister() {
  const { t } = useT();
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const clickedRef = useRef(false); // 사용자가 업데이트를 눌렀는가

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return; // dev 캐시 오염 방지
    if (!("serviceWorker" in navigator)) return; // 미지원 — 조용히 생략 (§12)

    const onControllerChange = () => {
      // 새 워커가 페이지를 접수했다 — 사용자가 원했을 때만 새로고침
      if (clickedRef.current) window.location.reload();
    };
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      onControllerChange,
    );

    navigator.serviceWorker
      .register(`/sw.js?v=${pkg.version}`)
      .then((reg) => {
        // 지난 방문에서 설치만 되고 교대 못 한 워커가 남아 있을 수 있다
        if (reg.waiting && navigator.serviceWorker.controller) {
          setWaiting(reg.waiting);
        }
        reg.addEventListener("updatefound", () => {
          const next = reg.installing;
          if (!next) return;
          next.addEventListener("statechange", () => {
            // installed + 기존 컨트롤러 존재 = "업데이트"다
            // (컨트롤러가 없으면 최초 설치 — 토스트가 필요 없다)
            if (next.state === "installed" && navigator.serviceWorker.controller) {
              setWaiting(next);
            }
          });
        });
      })
      .catch(() => {
        // 등록 실패 — 오프라인 지원만 없을 뿐, 게임은 평소대로 (§12)
      });

    return () => {
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        onControllerChange,
      );
    };
  }, []);

  if (!waiting) return null;

  const update = () => {
    clickedRef.current = true;
    waiting.postMessage({ type: "SKIP_WAITING" });
  };

  return (
    <button
      onClick={update}
      className="font-pixel-ko fixed bottom-4 left-1/2 z-50 -translate-x-1/2 animate-pulse whitespace-nowrap border-2 bg-black/85 px-4 py-3 text-sm"
      style={{
        borderColor: COLORS.accent,
        color: COLORS.accent,
        marginBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {t("sw.update")}
    </button>
  );
}
