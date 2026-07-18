// ============================================================================
// constants.ts — 게임 "분위기"의 원본
// 색·낙하물 종류·대사는 전부 여기서만 정의한다 (CLAUDE.md §11).
// 흩어져 있으면 톤이 어긋나기 시작하므로, 분위기에 관한 값은 이 파일 밖에서
// 하드코딩하지 않는 것이 규칙이다.
// ============================================================================

/** 팔레트 — 캔버스 그림은 전부 이 색만 쓴다. */
export const COLORS = {
  space: "#141838", // 우주 배경 (HTML 쪽 배경·themeColor도 이 값의 거울)
  mascot: "#7ee8b2", // 마스코트 민트
  accent: "#ffd166", // 포인트 노랑
  danger: "#ff8080", // 위험 빨강
  heart: "#ff8fab", // 하트 분홍
  ink: "#f4f6ff", // 밝은 글자색
  earth: "#2f6db8", // 지구 바다 파랑 (배경 고도 연출 §11)
  land: "#4ea86e", // 지구 대륙 초록
  moonRock: "#9aa5b5", // 달 표면 회색
} as const;

/**
 * 낙하물 종류.
 * 종류를 문자열 유니온으로 둔 이유는 확장이다 — 종류를 추가할 때
 * 이 타입과 아래 표만 늘리면 된다.
 */
export type JunkKind =
  // 쓰레기 8종 — 점수·콤보·수거량(eaten)의 대상 (§5)
  | "satellite"
  | "bolt"
  | "can"
  | "spring"
  | "glove" // 1965년 제미니 4호, 에드 화이트가 흘린 장갑 (실화!)
  | "toolbag" // 2008년 STS-126, 우주유영 중 놓친 공구가방 (실화!)
  | "fairing" // 로켓 페어링 조각
  | "cubesat" // 찌그러진 큐브샛
  // 위험물
  | "hazard"
  // 아이템
  | "fuel"
  | "star"
  // 파워업 3종 (§5-2) — 한시적 버프
  | "magnet" // 자석 강화
  | "slowmo" // 시간 느려짐
  | "shield"; // 방패 (콤보 지킴이)

/** 쓰레기 8종 — 점수·콤보·수거량의 대상. 스폰의 "나머지 균등" 몫 (§9). */
export const JUNK_FOOD_KINDS = [
  "satellite",
  "bolt",
  "can",
  "spring",
  "glove",
  "toolbag",
  "fairing",
  "cubesat",
] as const;

/** 파워업 3종 — 4% 고정 추첨을 셋이 균등하게 나눈다 (§9). */
export const POWERUP_KINDS = ["magnet", "slowmo", "shield"] as const;

/** 종류별 대표색 (§5 표의 원본). */
export const JUNK_COLORS: Record<JunkKind, string> = {
  satellite: "#8ecbff", // 하늘
  bolt: "#cfd8e6", // 은색
  can: "#f9a8d4", // 분홍
  spring: "#c4b5fd", // 보라
  glove: "#f1f3f5", // 흰 우주복 장갑
  toolbag: "#e8b26f", // 갈색 공구가방
  fairing: "#adb5bd", // 회색 페어링
  cubesat: "#74c0fc", // 파란 큐브샛
  hazard: "#ff8080", // 빨강 (COLORS.danger와 같은 값)
  fuel: "#66fcf1", // 연료 아이템 네온 민트
  star: "#ffd166", // 별 보너스 (COLORS.accent와 같은 값)
  magnet: "#ffa94d", // 자석 주황
  slowmo: "#b197fc", // 슬로모 라벤더
  shield: "#7ee8b2", // 방패 민트 (마스코트를 지키는 색)
};

/** 종류별 한글 이름 — 인벤토리 도감(/bag) 등 HTML 표기용 (§8-2). */
export const JUNK_NAMES: Record<JunkKind, string> = {
  satellite: "인공위성",
  bolt: "볼트",
  can: "음료수 캔",
  spring: "스프링",
  glove: "우주인 장갑",
  toolbag: "공구가방",
  fairing: "로켓 페어링",
  cubesat: "큐브샛",
  hazard: "가시덩어리",
  fuel: "배터리",
  star: "별",
  magnet: "자석",
  slowmo: "시계",
  shield: "방패",
};

// ----------------------------------------------------------------------------
// 대사 — 레트로 아케이드풍 영어 (§2 톤 앤 매너).
// 픽셀 폰트(Press Start 2P)에 한글 글리프가 없어 인게임 카피는 영어를 쓴다.
// 죽음/폭발 같은 어휘는 여전히 쓰지 않는다 — 귀엽고 낙천적으로.
// ----------------------------------------------------------------------------

/** 먹이를 먹었을 때 랜덤으로 하나 뽑아 띄우는 팝업 문구. */
export const EAT_WORDS = ["YUM!", "GULP!", "TASTY!", "DELISH!", "NICE!"];

/** 가시에 찔렸을 때의 팝업 문구. */
export const HIT_WORDS = ["OUCH!", "YIKES!", "BOO!", "ARGH!"];

/**
 * 캔버스 글자용 폰트 스택.
 * Press Start 2P는 globals.css에서 웹폰트로 불러온다 — 로드 전이나 오프라인일
 * 때를 대비해 monospace 폴백을 함께 적는다 (부가 기능이 게임을 죽이면 안 된다, §12).
 * ⚠️ 한글 글리프가 없으므로 캔버스에 찍는 문구는 반드시 영어로 (§2).
 */
export const CANVAS_FONT = `"Press Start 2P", monospace`;
