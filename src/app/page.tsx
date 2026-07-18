import { redirect } from "next/navigation";

// 랜딩 페이지(게임 소개 + 어트랙트 모드 데모)는 백로그(CLAUDE.md §16).
// MVP에서는 "/"로 들어오면 곧장 게임으로 보낸다.
export default function Home() {
  redirect("/play");
}
