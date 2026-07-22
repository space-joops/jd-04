// ============================================================================
// dicts/ko.ts — 한국어 사전 (§2 i18n). en.ts의 키를 그대로 번역.
// 원래 게임의 한글 문구가 여기 담긴다.
// ============================================================================

import type { Dict } from "../index";

export const ko: Dict = {
  "landing.tagline": "우주 냠냠!",
  "landing.rulesAria": "게임 규칙",
  "landing.rule.thrust": "🕹 드래그로 추진 — 연료를 아껴 쓰자",
  "landing.rule.eat": "🛰 우주쓰레기는 냠냠 +10점",
  "landing.rule.avoid": "🌵 빨갛고 뾰족한 애들은 살살 피하기 (하트 3개)",
  "landing.rule.star": "⭐ 별은 +40점 — 하트가 닳았으면 하트로!",
  "landing.rule.fuel": "🔋 배터리를 먹으면 연료 충전",
  "landing.link.rank": "🏆 랭킹 보기",
  "landing.link.bag": "🎒 인벤토리",
  "landing.link.orbit": "🛰️ 궤도 모니터",
  "landing.link.settings": "⚙️ 설정",
  "landing.footer": "이 아이는 STELLAPET 프로젝트의 지상 육성장에서 자랐습니다.",

  "story.replay": "📜 스토리 다시보기",
  "story.aria": "게임 스토리 인트로",
  "story.p1":
    "2031년, 걱정으로만 떠돌던 케슬러 신드롬이 진짜가 됐다.\n파편이 파편을 부수고, 그 파편이 또 파편을 낳았다.\n지구 저궤도는 8,000톤짜리 쓰레기 구름이 됐다.",
  "story.p2":
    "인류의 대답은 더 큰 로켓도, 레이저도 아니었다.\n우주쓰레기를 먹고 자라는 생체 위성.\n지상에서 정성껏 키워, 하나씩 궤도로 올려 보냈다.",
  "story.p3":
    "30년이 지난 지금.\n그중에서도 제일 입이 큰 아이가\n오늘도 저궤도로 출근한다.\n\"우주 냠냠!\"",

  "install.button": "📱 앱 설치",
  "install.iosSafari":
    "사파리 아래쪽 공유(⬆) 버튼을 누르고 \"홈 화면에 추가\"를 선택하면 앱으로 설치돼요!",
  "install.iosInapp":
    "지금 보고 있는 앱 안의 브라우저에서는 설치할 수 없어요. 사파리로 연 다음 공유(⬆) → \"홈 화면에 추가\"를 눌러 주세요.",
  "install.openSafari": "사파리로 열기",
  "install.copyLink": "링크 복사",
  "install.copied": "복사됐어요!",
  "install.inappHint": "버튼이 안 되면 복사한 주소를 사파리에 붙여넣어 주세요.",
  "install.other":
    "브라우저 메뉴(⋮)에서 \"앱 설치\" 또는 \"홈 화면에 추가\"를 선택하면 설치돼요!",

  "share.button": "📤 공유하기",
  "share.text": "하늘에서 떨어지는 우주쓰레기를 받아먹는 픽셀 아케이드 게임!",
  "share.copied": "링크가 복사됐어요!",

  "play.cleanupLog": "🛰 {name}의 청소 일지",
  "play.ariaResume": "게임 재개",
  "play.ariaPause": "일시정지",
  "play.ariaSoundOff": "소리 끄기",
  "play.ariaSoundOn": "소리 켜기",
  "play.ariaHome": "처음 화면으로 돌아가기",

  "petname.title": "펫 이름을 지어줘!",
  "petname.sub":
    "궤도 청소 기록은 이 이름으로 경쟁해요.\n(10자까지 · 세상에 하나뿐인 이름이어야 해요)",
  "petname.placeholder": "냠냠이",
  "petname.taken": "앗, 이미 있는 이름이야! 다른 이름을 지어줘",
  "petname.aria": "펫 이름",

  "leaderboard.runTop5": "단판 TOP 5",
  "leaderboard.totalTop5": "누적 TOP 5",
  "leaderboard.empty": "아직 기록이 없어요",
  "leaderboard.sendFail": "기록 전송 실패 — 다음 판에 다시 시도해요",
  "leaderboard.nameTaken": "이름이 이미 선점돼 기록을 못 보냈어요",

  "rank.offline": "오프라인 모드 — 온라인 순위는 준비 중이에요",
  "rank.loadFail": "순위를 불러오지 못했어요",
  "rank.runTitle": "단판 TOP 10",
  "rank.runSub": "한 판의 기적 — 게임 한 판 최고 점수",
  "rank.totalTitle": "누적 TOP 10",
  "rank.totalSub": "부지런한 청소부 — 통산 수거한 우주쓰레기",

  "bag.subtitle": "내 펫이 지금까지 수거한 것들 — 이 기기에만 기록돼요",

  "bag.summary": "총 {total}개 수거 · 도감 {found}/{kinds}",
  "bag.empty": "아직 가방이 비어 있어요 — 첫 청소를 떠나 볼까?",
  "bag.unit": "{n}개",
  "bag.desc.satellite": "태양전지판이 아직 반짝반짝",
  "bag.desc.bolt": "어느 로켓에서 빠졌을까",
  "bag.desc.can": "우주인의 간식 시간의 흔적",
  "bag.desc.spring": "아직도 통통 튀는 게 쌩쌩해",
  "bag.desc.glove": "1965년 제미니 4호에서 에드 화이트가 놓친 그 장갑 (실화)",
  "bag.desc.toolbag": "2008년 STS-126 우주유영 중 떠내려간 가방 (실화)",
  "bag.desc.fairing": "로켓의 코를 지키던 베테랑 조각",
  "bag.desc.cubesat": "찌그러졌지만 씩씩한 꼬마 위성",
  "bag.desc.fuel": "냠냠 연료 +800",
  "bag.desc.star": "궤도의 행운 — 점수 아니면 하트",
  "bag.desc.magnet": "끌어당기는 힘 ×3, 8초",
  "bag.desc.slowmo": "낙하물의 시간이 천천히, 8초",
  "bag.desc.shield": "가시 한 방은 내가 막을게",

  "junk.satellite": "인공위성",
  "junk.bolt": "볼트",
  "junk.can": "음료수 캔",
  "junk.spring": "스프링",
  "junk.glove": "우주인 장갑",
  "junk.toolbag": "공구가방",
  "junk.fairing": "로켓 페어링",
  "junk.cubesat": "큐브샛",
  "junk.hazard": "가시덩어리",
  "junk.fuel": "배터리",
  "junk.star": "별",
  "junk.magnet": "자석",
  "junk.slowmo": "시계",
  "junk.shield": "방패",

  "character.mint": "민초",
  "character.coral": "딸기",
  "character.lavender": "라벤더",

  "moon.newMoon": "신월",
  "moon.waxingCrescent": "초승달",
  "moon.firstQuarter": "상현달",
  "moon.waxingGibbous": "상현망간달",
  "moon.fullMoon": "보름달",
  "moon.waningGibbous": "하현망간달",
  "moon.lastQuarter": "하현달",
  "moon.waningCrescent": "그믐달",
  "moon.toast": "{emoji} 음력 약 {day}일 · {phase}",

  "orbit.subtitle": "내 펫이 지금 지구 어디 위를 날고 있는지 실시간으로 보여줘요.",
  "orbit.realtimeNote": "이 화면은 전부 진짜 궤도역학으로 실시간 계산돼요.",
  "orbit.explainerLink": "👉 궤도역학이 뭐야?",
  "orbit.timeHint": "시간을 빠르게 돌리면 줍스 이동 경로가 보여요.",
  "orbit.ariaZoomIn": "줌 인",
  "orbit.ariaZoomOut": "줌 아웃",
  "orbit.noPet": "아직 궤도로 올라간 펫이 없어요.\n플레이를 시작하면 펫이 태어나요.",
  "orbit.hint.LAT": "위도 — 줍스가 지구의 남북 어디쯤 위에 있는지. 적도가 0°, 북쪽이 +.",
  "orbit.hint.LON": "경도 — 동서 어디쯤. 영국 그리니치가 0°, 동쪽이 +.",
  "orbit.hint.ALT": "고도 — 지표면에서 얼마나 높이 떠 있는지 (km).",
  "orbit.hint.VEL": "속력 — 궤도를 도는 빠르기. 총알보다 훨씬 빨라!",
  "orbit.hint.PERIOD": "주기 — 지구를 한 바퀴 도는 데 걸리는 시간 (분).",
  "orbit.hint.REV": "공전수 — 발사한 뒤 지금까지 지구를 몇 바퀴 돌았는지.",
  "orbit.explainer.intro":
    "줍스가 어떻게 떨어지지도 날아가지도 않고 지구를 뱅뱅 도는지, 세 컷으로 알려줄게!",
  "orbit.explainer.title1": "왜 안 떨어져?",
  "orbit.explainer.body1":
    "사실 줍스는 계속 떨어지고 있어! 그런데 옆으로 엄청 빠르게 날아서, 떨어지는 만큼 지구가 둥글게 휘어 자꾸 빗나가. 그래서 영원히 지구를 뱅뱅 돌지.",
  "orbit.explainer.title2": "높으면 느긋~",
  "orbit.explainer.body2":
    "높이 올라갈수록 천천히 돌고, 한 바퀴 도는 시간도 길어져. 줍스는 낮은 저궤도라 약 90분이면 지구를 한 바퀴 — 하루에도 열여섯 바퀴나 돌아!",
  "orbit.explainer.title3": "지구가 돌잖아!",
  "orbit.explainer.body3":
    "줍스가 한 바퀴 도는 동안 지구도 슬쩍 자전해. 그래서 지날 때마다 발밑이 조금씩 서쪽으로 밀려서, 세계지도에 그 유명한 물결무늬 궤적이 그려지는 거야.",

  "settings.character": "캐릭터",
  "settings.location": "기지국 위치",
  "settings.locationHint":
    "달의 반구(초승달 방향)와 궤도 모니터의 현지시간에 쓰여요.",
  "settings.getLocation": "📍 현재 위치 가져오기",
  "settings.geo.unsupported": "이 기기는 위치를 지원하지 않아요. 직접 입력해줘.",
  "settings.geo.checking": "위치 확인 중…",
  "settings.geo.done": "현재 위치로 맞췄어!",
  "settings.geo.fail": "위치를 못 가져왔어. 직접 입력해줘.",
  "settings.latPlaceholder": "위도",
  "settings.lonPlaceholder": "경도",
  "settings.citySearch": "도시 검색",
  "settings.cityPlaceholder": "도시 이름...",
  "settings.cityNone": "일치하는 도시가 없어요",
  "settings.mapPick": "지도에서 찍기",
  "settings.mapHint": "지도를 탭해서 위치를 골라요.",
  "settings.time": "시간 표시",
  "settings.timeHint": "궤도 모니터의 시계에 쓰여요.",
  "settings.tf.device": "기기 현지",
  "settings.tf.home": "기지국 태양시",
  "settings.tf.homeLocked": "* 기지국 태양시는 위치를 먼저 설정해야 골라져요.",
  "settings.tf.utcDesc": "UTC — 세계 표준시(그리니치 기준).",
  "settings.tf.deviceDesc": "기기 현지 — 지금 이 기기의 시계.",
  "settings.tf.homeDesc":
    "기지국 태양시 — 경도 15°=1시간으로 UTC를 민 평균 태양시(표준시·서머타임과 달라요).",
  "settings.orbitLink": "🛰️ 궤도 모니터에서 확인하기",
  "settings.language": "언어",
  "settings.langAuto": "자동",
  "fx.eat": "냠냠!|꿀꺽!|맛나!|좋아!|냠!",
  "fx.hit": "아야!|으악!|이런!|윽!",
  "fx.fuel": "연료 충전!",
  "fx.magnet": "자석!",
  "fx.slowmo": "슬로모!",
  "fx.shield": "방패!",
  "fx.combo": "콤보 x{n}!",
  "fx.geo": "정지궤도!",
  "fx.moon": "달 근처!",
  "fx.blocked": "막았다!",


  "sw.update": "🚀 새 버전 도착! 탭해서 업데이트",
};
