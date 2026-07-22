// ============================================================================
// dicts/ja.ts — 日本語辞書 (§2 i18n). en.ts のキーをそのまま翻訳.
// ============================================================================

import type { Dict } from "../index";

export const ja: Dict = {
  "landing.tagline": "うちゅうモグモグ！",
  "landing.rulesAria": "ゲームのルール",
  "landing.rule.thrust": "🕹 ドラッグでふんしゃ — 燃料はたいせつに",
  "landing.rule.eat": "🛰 うちゅうゴミをパクッと +10",
  "landing.rule.avoid": "🌵 赤くてトゲトゲな子はそっとよけて（ハート3つ）",
  "landing.rule.star": "⭐ 星は +40 — ハートが減ってたらハートに！",
  "landing.rule.fuel": "🔋 バッテリーを食べて燃料チャージ",
  "landing.link.rank": "🏆 ランキング",
  "landing.link.bag": "🎒 インベントリ",
  "landing.link.orbit": "🛰️ 軌道モニター",
  "landing.link.settings": "⚙️ 設定",
  "landing.footer": "この子は STELLAPET プロジェクトの地上そだて場で育ちました。",

  "story.replay": "📜 ストーリーをもう一度",
  "story.aria": "ゲームストーリーのイントロ",
  "story.p1":
    "2031年、みんなが心配していただけのケスラーシンドロームが本当になった。\nかけらがかけらを砕き、そのかけらがさらにかけらを生んだ。\n地球低軌道は8,000トンのゴミの雲になった。",
  "story.p2":
    "人類の答えは、もっと大きなロケットでも、レーザーでもなかった。\nうちゅうゴミを食べて育つ生体衛星。\n地上で大切に育てて、ひとつずつ軌道へ送り出した。",
  "story.p3":
    "それから30年。\nその中でも一番の大きなお口の子が\n今日もまた低軌道へお仕事に向かう。\n「うちゅうモグモグ！」",

  "install.button": "📱 アプリをインストール",
  "install.iosSafari":
    "Safari 下の共有（⬆）ボタンを押して「ホーム画面に追加」を選ぶと、アプリとしてインストールできます！",
  "install.iosInapp":
    "このアプリ内ブラウザからはインストールできません。Safari で開いてから共有（⬆）→「ホーム画面に追加」を押してください。",
  "install.openSafari": "Safari で開く",
  "install.copyLink": "リンクをコピー",
  "install.copied": "コピーしました！",
  "install.inappHint": "ボタンが効かないときは、コピーしたアドレスを Safari に貼り付けてください。",
  "install.other":
    "ブラウザのメニュー（⋮）から「アプリをインストール」または「ホーム画面に追加」を選んでください！",

  "share.button": "📤 シェア",
  "share.text": "落ちてくるうちゅうゴミをパクパク食べるピクセルアーケードゲーム！",
  "share.copied": "リンクをコピーしました！",

  "play.cleanupLog": "🛰 {name} のおそうじ日誌",
  "play.ariaResume": "ゲーム再開",
  "play.ariaPause": "一時停止",
  "play.ariaSoundOff": "音を消す",
  "play.ariaSoundOn": "音を出す",
  "play.ariaHome": "ホーム画面へ戻る",

  "petname.title": "ペットの名前をつけてね！",
  "petname.sub":
    "軌道おそうじの記録は、この名前で競います。\n（10文字まで・世界にひとつだけの名前）",
  "petname.placeholder": "モグモグ",
  "petname.taken": "あっ、その名前はもう使われてるよ！別の名前をつけてね",
  "petname.aria": "ペットの名前",

  "leaderboard.runTop5": "シングル TOP 5",
  "leaderboard.totalTop5": "トータル TOP 5",
  "leaderboard.empty": "まだ記録がありません",
  "leaderboard.sendFail": "記録の送信に失敗 — 次のラウンドで再挑戦します",
  "leaderboard.nameTaken": "名前がすでに使われていて、記録を送れませんでした",

  "rank.offline": "オフラインモード — オンラインランキングは準備中です",
  "rank.loadFail": "ランキングを読み込めませんでした",
  "rank.runTitle": "シングル TOP 10",
  "rank.runSub": "一発の奇跡 — 1ゲームの最高スコア",
  "rank.totalTitle": "トータル TOP 10",
  "rank.totalSub": "はたらきものの掃除屋 — 通算で集めたうちゅうゴミ",

  "bag.subtitle": "ペットがこれまでに集めたもの — この端末だけに保存されます",

  "bag.summary": "合計 {total} 個 · 図鑑 {found}/{kinds}",
  "bag.empty": "カバンはまだ空っぽ — はじめてのおそうじに出かけよう？",
  "bag.unit": "{n} 個",
  "bag.desc.satellite": "ソーラーパネルがまだキラキラ",
  "bag.desc.bolt": "どのロケットから外れたのかな",
  "bag.desc.can": "宇宙飛行士のおやつタイムの跡",
  "bag.desc.spring": "まだピョンピョン元気いっぱい",
  "bag.desc.glove": "1965年、ジェミニ4号でエド・ホワイトが落としたあの手袋（実話）",
  "bag.desc.toolbag": "2008年、STS-126 の船外活動中に流されたカバン（実話）",
  "bag.desc.fairing": "ロケットの先っぽを守っていたベテランのかけら",
  "bag.desc.cubesat": "へこんでるけど元気いっぱいのおチビ衛星",
  "bag.desc.fuel": "モグモグ燃料 +800",
  "bag.desc.star": "軌道のラッキー — スコア、それともハート",
  "bag.desc.magnet": "引きよせる力 ×3、8秒",
  "bag.desc.slowmo": "落ちてくるものの時間がゆっくり、8秒",
  "bag.desc.shield": "トゲ1発はぼくが受けとめるよ",

  "junk.satellite": "人工衛星",
  "junk.bolt": "ボルト",
  "junk.can": "ジュースの缶",
  "junk.spring": "スプリング",
  "junk.glove": "宇宙飛行士の手袋",
  "junk.toolbag": "工具バッグ",
  "junk.fairing": "ロケットフェアリング",
  "junk.cubesat": "CubeSat",
  "junk.hazard": "トゲトゲ玉",
  "junk.fuel": "バッテリー",
  "junk.star": "星",
  "junk.magnet": "磁石",
  "junk.slowmo": "時計",
  "junk.shield": "盾",

  "character.mint": "ミント",
  "character.coral": "ベリー",
  "character.lavender": "ラベンダー",

  "moon.newMoon": "新月",
  "moon.waxingCrescent": "三日月",
  "moon.firstQuarter": "上弦の月",
  "moon.waxingGibbous": "十三夜月",
  "moon.fullMoon": "満月",
  "moon.waningGibbous": "寝待月",
  "moon.lastQuarter": "下弦の月",
  "moon.waningCrescent": "有明月",
  "moon.toast": "{emoji} 月齢 約{day}日 · {phase}",

  "orbit.subtitle": "あなたのペットが今、地球のどこを飛んでいるかをリアルタイムで見せます。",
  "orbit.realtimeNote": "この画面はぜんぶ、本物の軌道力学でリアルタイムに計算しています。",
  "orbit.explainerLink": "👉 軌道力学ってなに？",
  "orbit.timeHint": "時間を早送りすると、ペットの通り道が見えます。",
  "orbit.ariaZoomIn": "ズームイン",
  "orbit.ariaZoomOut": "ズームアウト",
  "orbit.noPet": "まだ軌道に上がったペットがいません。\nプレイを始めるとペットが生まれます。",
  "orbit.hint.LAT": "緯度 — ペットが地球の南北どのあたりにいるか。赤道が0°、北が+。",
  "orbit.hint.LON": "経度 — 東西どのあたりか。グリニッジが0°、東が+。",
  "orbit.hint.ALT": "高度 — 地表からどれくらい高く浮いているか（km）。",
  "orbit.hint.VEL": "速度 — 軌道を回る速さ。弾丸よりずっと速い！",
  "orbit.hint.PERIOD": "周期 — 地球を1周するのにかかる時間（分）。",
  "orbit.hint.REV": "周回数 — 打ち上げから今まで地球を何周したか。",
  "orbit.explainer.intro":
    "あなたのペットが、落ちも飛び去りもせず、どうやって地球をぐるぐる回り続けるのか、3コマで教えるよ！",
  "orbit.explainer.title1": "なんで落ちないの？",
  "orbit.explainer.body1":
    "じつはペットはずっと落ちてるんだ！でも横向きにものすごく速く飛ぶから、落ちるぶんだけ地球が丸くカーブして、いつもすれちがう — だから永遠に地球をぐるぐる回るんだよ。",
  "orbit.explainer.title2": "高いほどのんびり",
  "orbit.explainer.body2":
    "高く上がるほどゆっくり回って、1周にかかる時間も長くなる。ペットは低い軌道だから、1周は約90分 — 1日で16周もするよ！",
  "orbit.explainer.title3": "地球は回ってる！",
  "orbit.explainer.body3":
    "ペットが1周する間に、地球もそっと自転する。だから通るたびに足もとが少しずつ西へずれて、世界地図にあの有名なうねうね模様の軌跡が描かれるんだ。",

  "settings.character": "キャラクター",
  "settings.location": "基地局の位置",
  "settings.locationHint":
    "月の半球（三日月の向き）と、軌道モニターの現地時間に使います。",
  "settings.getLocation": "📍 現在地を取得",
  "settings.geo.unsupported": "この端末は位置情報に対応していません。手動で入力してね。",
  "settings.geo.checking": "位置を確認中…",
  "settings.geo.done": "現在地に合わせたよ！",
  "settings.geo.fail": "位置を取得できなかったよ。手動で入力してね。",
  "settings.latPlaceholder": "緯度",
  "settings.lonPlaceholder": "経度",
  "settings.citySearch": "都市を検索",
  "settings.cityPlaceholder": "都市名...",
  "settings.cityNone": "一致する都市がありません",
  "settings.mapPick": "地図で選ぶ",
  "settings.mapHint": "地図をタップして位置を選びます。",
  "settings.time": "時刻の表示",
  "settings.timeHint": "軌道モニターの時計に使います。",
  "settings.tf.device": "端末の現地時刻",
  "settings.tf.home": "基地局の太陽時",
  "settings.tf.homeLocked": "* 基地局の太陽時は、先に位置を設定する必要があります。",
  "settings.tf.utcDesc": "UTC — 協定世界時（グリニッジ基準）。",
  "settings.tf.deviceDesc": "端末の現地時刻 — 今このデバイスの時計。",
  "settings.tf.homeDesc":
    "基地局の太陽時 — 経度15°=1時間で UTC をずらした平均太陽時（標準時・サマータイムとは異なります）。",
  "settings.orbitLink": "🛰️ 軌道モニターで確認する",
  "settings.language": "言語",
  "settings.langAuto": "自動",
  "fx.eat": "モグモグ!|ゴクリ!|おいしい!|やった!|うまっ!",
  "fx.hit": "いたっ!|うわっ!|ああ!|うぐっ!",
  "fx.fuel": "燃料補給!",
  "fx.magnet": "マグネット!",
  "fx.slowmo": "スロー!",
  "fx.shield": "シールド!",
  "fx.combo": "コンボ x{n}!",
  "fx.geo": "静止軌道!",
  "fx.moon": "月ゾーン!",
  "fx.blocked": "ガード!",


  "sw.update": "🚀 新しいバージョンが届きました！タップして更新",
};
