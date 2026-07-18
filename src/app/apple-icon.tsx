// apple-icon.tsx — Next 메타데이터 파일 컨벤션: /apple-icon 이미지가 생성되고
// <link rel="apple-touch-icon">이 자동으로 붙는다 (iOS 홈 화면 추가용).
import { pwaIcon } from "./pwa-icon";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return pwaIcon(180);
}
