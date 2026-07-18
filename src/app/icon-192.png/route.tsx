// /icon-192.png — 매니페스트용 앱 아이콘 (코드 생성, pwa-icon.tsx 참고)
import { pwaIcon } from "../pwa-icon";

// 빌드 시점에 한 번만 렌더링해 정적 파일로 제공 (매 요청 렌더링 낭비 방지)
export const dynamic = "force-static";

export function GET() {
  return pwaIcon(192);
}
