// /icon-512.png — 매니페스트용 큰 아이콘 + 마스커블 겸용 (pwa-icon.tsx 참고).
// 마스코트가 가운데 절반만 차지하므로 둥근 마스크의 안전 영역에도 들어간다.
import { pwaIcon } from "../pwa-icon";

export const dynamic = "force-static";

export function GET() {
  return pwaIcon(512);
}
