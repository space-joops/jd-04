// ============================================================================
// canvas.ts — DPR(기기 픽셀 비율) 대응 캔버스 리사이즈
//
// 왜 필요한가: 요즘 폰은 CSS 1px 안에 물리 픽셀이 2~3개 들어간다(DPR 2~3).
// 캔버스 내부 버퍼를 CSS 크기 그대로 만들면 그림이 2~3배로 확대되어 흐릿해진다.
// 그래서 버퍼는 DPR배로 크게 만들고, 좌표계는 setTransform으로 다시 CSS px
// 단위로 맞춘다 — 게임 코드는 DPR을 전혀 몰라도 된다.
// ============================================================================

/**
 * 캔버스 버퍼를 현재 표시 크기 × DPR로 맞추고, CSS px 좌표계를 복원한다.
 * 리사이즈될 때마다 다시 불러야 한다 (버퍼 크기가 바뀌면 변환도 초기화되므로).
 *
 * @returns CSS px 기준의 논리적 크기 { w, h } — 게임 로직은 이 값만 쓴다.
 */
export function fitCanvas(canvas: HTMLCanvasElement): { w: number; h: number } {
  // DPR 상한 2: DPR 3 폰에서 픽셀을 2.25배나 더 칠해봐야 눈으로는 거의
  // 구분이 안 되는데 GPU 비용만 커진다 — 화질 대비 비용의 타협점 (§12).
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;

  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);

  // 이후의 모든 그리기가 CSS px 단위로 동작하도록 좌표계를 DPR배 확대해 둔다.
  canvas.getContext("2d")?.setTransform(dpr, 0, 0, dpr, 0, 0);

  return { w, h };
}
