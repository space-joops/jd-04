// ============================================================================
// dicts/en.ts — English dictionary (CANONICAL key set, §2 i18n)
//
// 이 파일이 모든 키의 "정본"이다. 다른 언어 사전은 이 키 집합을 그대로
// 번역한다(index.ts가 `type Dict = typeof en`으로 강제 — 키가 빠지면 타입 에러).
// 값 안의 {name}·{n} 같은 토큰은 t()가 치환한다. \n은 줄바꿈.
//
// 캔버스에 찍히는 아케이드 카피(SPACE JOOPS·GAME OVER·YUM! 등)와 순수 영어
// 라벨(UTC·LAT·TAP TO START 등)은 §2 규칙상 영어 고정이라 사전에 넣지 않는다.
// ============================================================================

export const en = {
  // ---- 랜딩 ----
  "landing.tagline": "Space Snacks!",
  "landing.rulesAria": "Game rules",
  "landing.rule.thrust": "🕹 Drag to thrust — go easy on the fuel",
  "landing.rule.eat": "🛰 Gobble space junk for +10",
  "landing.rule.avoid": "🌵 Dodge the red spiky ones (3 hearts)",
  "landing.rule.star": "⭐ Stars are +40 — or a heart if you're hurt!",
  "landing.rule.fuel": "🔋 Eat a battery to refuel",
  "landing.link.rank": "🏆 Ranking",
  "landing.link.bag": "🎒 Inventory",
  "landing.link.orbit": "🛰️ Orbit Monitor",
  "landing.link.settings": "⚙️ Settings",
  "landing.footer": "This little one grew up at the STELLAPET project's ground nursery.",

  // ---- 스토리 인트로 ----
  "story.replay": "📜 Replay the story",
  "story.aria": "Game story intro",
  "story.p1":
    "In 2031, the Kessler Syndrome everyone had only worried about became real.\nDebris smashed debris, and that debris spawned still more.\nLow Earth orbit became an 8,000-ton cloud of trash.",
  "story.p2":
    "Humanity's answer wasn't a bigger rocket, nor a laser.\nIt was a living satellite that grows by eating space junk.\nRaised with care on the ground, then sent up to orbit one by one.",
  "story.p3":
    "Thirty years later.\nThe biggest-mouthed of them all\nheads to low orbit for work again today.\n\"Space Yum-Yum!\"",

  // ---- 앱 설치 ----
  "install.button": "📱 Install App",
  "install.iosSafari":
    "Tap the Share (⬆) button at the bottom of Safari and choose \"Add to Home Screen\" to install as an app!",
  "install.iosInapp":
    "You can't install from this in-app browser. Open it in Safari, then tap Share (⬆) → \"Add to Home Screen\".",
  "install.openSafari": "Open in Safari",
  "install.copyLink": "Copy link",
  "install.copied": "Copied!",
  "install.inappHint": "If the button doesn't work, paste the copied address into Safari.",
  "install.other":
    "In your browser menu (⋮), choose \"Install app\" or \"Add to Home Screen\"!",

  // ---- 공유 ----
  "share.button": "📤 Share",
  "share.text": "A pixel arcade game where you gobble up falling space junk!",
  "share.copied": "Link copied!",

  // ---- 게임 HUD/오버레이 (한글이던 부분만) ----
  "play.cleanupLog": "🛰 {name}'s cleanup log",
  "play.ariaResume": "Resume game",
  "play.ariaPause": "Pause",
  "play.ariaSoundOff": "Mute",
  "play.ariaSoundOn": "Unmute",
  "play.ariaHome": "Back to home screen",

  // ---- 펫 이름 등록 ----
  "petname.title": "Name your pet!",
  "petname.sub":
    "Your orbital cleanup records compete under this name.\n(Up to 10 chars · must be one of a kind)",
  "petname.placeholder": "Nommy",
  "petname.taken": "Oops, that name's taken! Try another one",
  "petname.aria": "Pet name",

  // ---- 리더보드 (게임오버) ----
  "leaderboard.runTop5": "SINGLE TOP 5",
  "leaderboard.totalTop5": "TOTAL TOP 5",
  "leaderboard.empty": "No records yet",
  "leaderboard.sendFail": "Failed to send record — will retry next round",
  "leaderboard.nameTaken": "Name was taken, so the record couldn't be sent",

  // ---- 랭킹 페이지 ----
  "rank.offline": "Offline mode — online ranking is coming soon",
  "rank.loadFail": "Couldn't load the rankings",
  "rank.runTitle": "SINGLE TOP 10",
  "rank.runSub": "One-round wonders — best score in a single game",
  "rank.totalTitle": "TOTAL TOP 10",
  "rank.totalSub": "Diligent cleaners — lifetime space junk collected",

  // ---- 인벤토리(도감) ----
  "bag.subtitle": "What your pet has collected so far — saved only on this device",
  "bag.summary": "{total} collected · Dex {found}/{kinds}",
  "bag.empty": "Your bag's still empty — off on your first cleanup?",
  "bag.unit": "{n}",
  "bag.desc.satellite": "Its solar panels still sparkle",
  "bag.desc.bolt": "Which rocket did it fall from?",
  "bag.desc.can": "A trace of an astronaut's snack time",
  "bag.desc.spring": "Still bouncy and full of pep",
  "bag.desc.glove": "The glove Ed White lost on Gemini 4 in 1965 (true story)",
  "bag.desc.toolbag": "The bag that drifted away on STS-126's spacewalk in 2008 (true story)",
  "bag.desc.fairing": "A veteran piece that once guarded a rocket's nose",
  "bag.desc.cubesat": "Dented but plucky little satellite",
  "bag.desc.fuel": "Yum-yum fuel +800",
  "bag.desc.star": "Orbital luck — score, or a heart",
  "bag.desc.magnet": "Pull power ×3, 8 sec",
  "bag.desc.slowmo": "Falling stuff slows down, 8 sec",
  "bag.desc.shield": "I'll block one spike for you",

  // ---- 낙하물 이름 (JUNK_NAMES) ----
  "junk.satellite": "Satellite",
  "junk.bolt": "Bolt",
  "junk.can": "Soda Can",
  "junk.spring": "Spring",
  "junk.glove": "Astronaut Glove",
  "junk.toolbag": "Tool Bag",
  "junk.fairing": "Rocket Fairing",
  "junk.cubesat": "CubeSat",
  "junk.hazard": "Spike Ball",
  "junk.fuel": "Battery",
  "junk.star": "Star",
  "junk.magnet": "Magnet",
  "junk.slowmo": "Clock",
  "junk.shield": "Shield",

  // ---- 캐릭터 이름 ----
  "character.mint": "Minty",
  "character.coral": "Berry",
  "character.lavender": "Lavender",

  // ---- 달 위상 + 이스터에그 ----
  "moon.newMoon": "New Moon",
  "moon.waxingCrescent": "Waxing Crescent",
  "moon.firstQuarter": "First Quarter",
  "moon.waxingGibbous": "Waxing Gibbous",
  "moon.fullMoon": "Full Moon",
  "moon.waningGibbous": "Waning Gibbous",
  "moon.lastQuarter": "Last Quarter",
  "moon.waningCrescent": "Waning Crescent",
  "moon.toast": "{emoji} Moon age ~{day}d · {phase}",

  // ---- 궤도 모니터 ----
  "orbit.subtitle": "Shows where your pet is flying over Earth right now, in real time.",
  "orbit.realtimeNote": "This whole screen is computed live with real orbital mechanics.",
  "orbit.explainerLink": "👉 What is orbital mechanics?",
  "orbit.timeHint": "Speed up time to watch your pet's path.",
  "orbit.ariaZoomIn": "Zoom in",
  "orbit.ariaZoomOut": "Zoom out",
  "orbit.noPet": "No pet has launched into orbit yet.\nStart playing and your pet is born.",
  "orbit.hint.LAT": "Latitude — how far north/south of Earth your pet is. Equator is 0°, north is +.",
  "orbit.hint.LON": "Longitude — how far east/west. Greenwich is 0°, east is +.",
  "orbit.hint.ALT": "Altitude — how high above the surface it floats (km).",
  "orbit.hint.VEL": "Velocity — orbital speed. Way faster than a bullet!",
  "orbit.hint.PERIOD": "Period — time to circle Earth once (minutes).",
  "orbit.hint.REV": "Revolutions — how many laps around Earth since launch.",
  "orbit.explainer.intro":
    "Three panels on how your pet neither falls nor flies away, but circles Earth forever!",
  "orbit.explainer.title1": "Why doesn't it fall?",
  "orbit.explainer.body1":
    "Actually your pet is always falling! But it zooms sideways so fast that Earth curves away just as much, so it keeps missing — and circles forever.",
  "orbit.explainer.title2": "Higher = lazier",
  "orbit.explainer.body2":
    "The higher you go, the slower you orbit and the longer one lap takes. Your pet is in low orbit, so one lap is ~90 minutes — sixteen laps a day!",
  "orbit.explainer.title3": "Earth spins!",
  "orbit.explainer.body3":
    "While your pet makes one lap, Earth quietly rotates. So each pass drifts a bit west, drawing that famous wavy trail on the world map.",

  // ---- 설정 ----
  "settings.character": "Character",
  "settings.location": "Base Station Location",
  "settings.locationHint":
    "Used for the moon's hemisphere (crescent direction) and the Orbit Monitor's local time.",
  "settings.getLocation": "📍 Use my current location",
  "settings.geo.unsupported": "This device doesn't support location. Enter it manually.",
  "settings.geo.checking": "Checking location…",
  "settings.geo.done": "Set to your current location!",
  "settings.geo.fail": "Couldn't get location. Enter it manually.",
  "settings.latPlaceholder": "Latitude",
  "settings.lonPlaceholder": "Longitude",
  "settings.citySearch": "Search a city",
  "settings.cityPlaceholder": "City name...",
  "settings.cityNone": "No matching city",
  "settings.mapPick": "Pick on the map",
  "settings.mapHint": "Tap the map to choose a location.",
  "settings.time": "Time Display",
  "settings.timeHint": "Used for the Orbit Monitor's clock.",
  "settings.tf.device": "Device local",
  "settings.tf.home": "Base solar time",
  "settings.tf.homeLocked": "* Base solar time needs a location set first.",
  "settings.tf.utcDesc": "UTC — Coordinated Universal Time (based on Greenwich).",
  "settings.tf.deviceDesc": "Device local — the clock on this very device.",
  "settings.tf.homeDesc":
    "Base solar time — mean solar time shifting UTC by 15°=1h of longitude (differs from standard time / DST).",
  "settings.orbitLink": "🛰️ Check it in the Orbit Monitor",
  "settings.language": "Language",
  "settings.langAuto": "Auto",

  // ---- 서비스 워커 ----
  "sw.update": "🚀 New version available! Tap to update",
} as const;
