// dicts/fr.ts — Dictionnaire français (§2 i18n)

import type { Dict } from "../index";

export const fr: Dict = {
  "landing.tagline": "Space Snacks !",
  "landing.rulesAria": "Règles du jeu",
  "landing.rule.thrust": "🕹 Glisse pour propulser — économise ton carburant",
  "landing.rule.eat": "🛰 Gobe les débris spatiaux pour +10",
  "landing.rule.avoid": "🌵 Esquive les piquants rouges (3 cœurs)",
  "landing.rule.star": "⭐ Les étoiles valent +40 — ou un cœur si tu es blessé !",
  "landing.rule.fuel": "🔋 Croque une pile pour faire le plein",
  "landing.link.rank": "🏆 Classement",
  "landing.link.bag": "🎒 Inventaire",
  "landing.link.orbit": "🛰️ Moniteur d'orbite",
  "landing.link.settings": "⚙️ Réglages",
  "landing.footer": "Ce petit a grandi à la pouponnière au sol du projet STELLAPET.",

  "story.replay": "📜 Revoir l'histoire",
  "story.aria": "Intro de l'histoire du jeu",
  "story.p1":
    "En 2031, le syndrome de Kessler que tout le monde redoutait est devenu réel.\nLes débris ont fracassé des débris, et ces débris en ont engendré d'autres.\nL'orbite terrestre basse est devenue un nuage de déchets de 8 000 tonnes.",
  "story.p2":
    "La réponse de l'humanité n'a été ni une fusée plus grosse, ni un laser.\nC'était un satellite vivant qui grandit en mangeant les débris spatiaux.\nÉlevé avec soin au sol, puis envoyé en orbite un par un.",
  "story.p3":
    "Trente ans plus tard.\nLe plus grande gueule de tous\npart de nouveau travailler en orbite basse aujourd'hui.\n\"Space Yum-Yum !\"",

  "install.button": "📱 Installer l'appli",
  "install.iosSafari":
    "Appuie sur le bouton Partager (⬆) en bas de Safari et choisis \"Sur l'écran d'accueil\" pour l'installer comme une appli !",
  "install.iosInapp":
    "Tu ne peux pas installer depuis ce navigateur intégré. Ouvre-le dans Safari, puis appuie sur Partager (⬆) → \"Sur l'écran d'accueil\".",
  "install.openSafari": "Ouvrir dans Safari",
  "install.copyLink": "Copier le lien",
  "install.copied": "Copié !",
  "install.inappHint": "Si le bouton ne marche pas, colle l'adresse copiée dans Safari.",
  "install.other":
    "Dans le menu de ton navigateur (⋮), choisis \"Installer l'appli\" ou \"Sur l'écran d'accueil\" !",

  "share.button": "📤 Partager",
  "share.text": "Un jeu d'arcade pixel où tu gobes les débris spatiaux qui tombent !",
  "share.copied": "Lien copié !",

  "play.cleanupLog": "🛰 Journal de nettoyage de {name}",
  "play.ariaResume": "Reprendre la partie",
  "play.ariaPause": "Pause",
  "play.ariaSoundOff": "Couper le son",
  "play.ariaSoundOn": "Activer le son",
  "play.ariaHome": "Retour à l'écran d'accueil",

  "petname.title": "Donne un nom à ton compagnon !",
  "petname.sub":
    "Tes records de nettoyage orbital concourent sous ce nom.\n(Jusqu'à 10 caractères · doit être unique)",
  "petname.placeholder": "Miamou",
  "petname.taken": "Oups, ce nom est déjà pris ! Essaie-en un autre",
  "petname.aria": "Nom du compagnon",

  "leaderboard.runTop5": "SIMPLE TOP 5",
  "leaderboard.totalTop5": "TOTAL TOP 5",
  "leaderboard.empty": "Pas encore de record",
  "leaderboard.sendFail": "Échec de l'envoi du record — nouvel essai à la prochaine partie",
  "leaderboard.nameTaken": "Le nom était pris, le record n'a pas pu être envoyé",

  "rank.offline": "Mode hors ligne — le classement en ligne arrive bientôt",
  "rank.loadFail": "Impossible de charger le classement",
  "rank.runTitle": "SIMPLE TOP 10",
  "rank.runSub": "Les prodiges d'une partie — meilleur score en une seule partie",
  "rank.totalTitle": "TOTAL TOP 10",
  "rank.totalSub": "Les nettoyeurs assidus — débris spatiaux ramassés depuis toujours",

  "bag.subtitle": "Ce que ton animal a collecté jusqu'ici — enregistré uniquement sur cet appareil",

  "bag.summary": "{total} ramassés · Dex {found}/{kinds}",
  "bag.empty": "Ton sac est encore vide — on part pour un premier nettoyage ?",
  "bag.unit": "{n}",
  "bag.desc.satellite": "Ses panneaux solaires brillent encore",
  "bag.desc.bolt": "De quelle fusée est-il tombé ?",
  "bag.desc.can": "Une trace du goûter d'un astronaute",
  "bag.desc.spring": "Toujours rebondissant et plein d'entrain",
  "bag.desc.glove": "Le gant qu'Ed White a perdu lors de Gemini 4 en 1965 (histoire vraie)",
  "bag.desc.toolbag": "Le sac qui a dérivé lors de la sortie de STS-126 en 2008 (histoire vraie)",
  "bag.desc.fairing": "Un vétéran qui gardait autrefois le nez d'une fusée",
  "bag.desc.cubesat": "Un petit satellite cabossé mais courageux",
  "bag.desc.fuel": "Carburant miam-miam +800",
  "bag.desc.star": "Chance orbitale — un score, ou un cœur",
  "bag.desc.magnet": "Force d'attraction ×3, 8 s",
  "bag.desc.slowmo": "Les débris ralentissent, 8 s",
  "bag.desc.shield": "Je bloque un piquant pour toi",

  "junk.satellite": "Satellite",
  "junk.bolt": "Boulon",
  "junk.can": "Canette de soda",
  "junk.spring": "Ressort",
  "junk.glove": "Gant d'astronaute",
  "junk.toolbag": "Sac à outils",
  "junk.fairing": "Coiffe de fusée",
  "junk.cubesat": "CubeSat",
  "junk.hazard": "Boule à piquants",
  "junk.fuel": "Pile",
  "junk.star": "Étoile",
  "junk.magnet": "Aimant",
  "junk.slowmo": "Horloge",
  "junk.shield": "Bouclier",

  "character.mint": "Menthou",
  "character.coral": "Baie",
  "character.lavender": "Lavande",

  "moon.newMoon": "Nouvelle lune",
  "moon.waxingCrescent": "Premier croissant",
  "moon.firstQuarter": "Premier quartier",
  "moon.waxingGibbous": "Gibbeuse croissante",
  "moon.fullMoon": "Pleine lune",
  "moon.waningGibbous": "Gibbeuse décroissante",
  "moon.lastQuarter": "Dernier quartier",
  "moon.waningCrescent": "Dernier croissant",
  "moon.toast": "{emoji} Âge de la lune ~{day}j · {phase}",

  "orbit.subtitle": "Montre où ton compagnon survole la Terre en ce moment, en temps réel.",
  "orbit.realtimeNote": "Tout cet écran est calculé en direct avec de vraies mécaniques orbitales.",
  "orbit.explainerLink": "👉 C'est quoi la mécanique orbitale ?",
  "orbit.timeHint": "Accélère le temps pour voir le trajet de ton compagnon.",
  "orbit.ariaZoomIn": "Zoom avant",
  "orbit.ariaZoomOut": "Zoom arrière",
  "orbit.noPet": "Aucun compagnon n'a encore été lancé en orbite.\nCommence à jouer et ton compagnon naîtra.",
  "orbit.hint.LAT": "Latitude — à quelle distance au nord/sud de la Terre est ton compagnon. L'équateur est à 0°, le nord est +.",
  "orbit.hint.LON": "Longitude — à quelle distance à l'est/ouest. Greenwich est à 0°, l'est est +.",
  "orbit.hint.ALT": "Altitude — à quelle hauteur au-dessus de la surface il flotte (km).",
  "orbit.hint.VEL": "Vitesse — vitesse orbitale. Bien plus rapide qu'une balle !",
  "orbit.hint.PERIOD": "Période — temps pour faire un tour de la Terre (minutes).",
  "orbit.hint.REV": "Révolutions — combien de tours de la Terre depuis le lancement.",
  "orbit.explainer.intro":
    "Trois volets sur la façon dont ton compagnon ne tombe ni ne s'envole, mais tourne autour de la Terre pour toujours !",
  "orbit.explainer.title1": "Pourquoi ne tombe-t-il pas ?",
  "orbit.explainer.body1":
    "En fait, ton compagnon tombe tout le temps ! Mais il file de côté si vite que la Terre se courbe tout autant, alors il la rate sans cesse — et tourne pour toujours.",
  "orbit.explainer.title2": "Plus haut = plus tranquille",
  "orbit.explainer.body2":
    "Plus tu montes, plus tu orbites lentement et plus un tour prend de temps. Ton compagnon est en orbite basse, donc un tour dure ~90 minutes — seize tours par jour !",
  "orbit.explainer.title3": "La Terre tourne !",
  "orbit.explainer.body3":
    "Pendant que ton compagnon fait un tour, la Terre tourne discrètement sur elle-même. Chaque passage dérive donc un peu vers l'ouest, dessinant cette fameuse trace ondulée sur la carte du monde.",

  "settings.character": "Personnage",
  "settings.location": "Emplacement de la station de base",
  "settings.locationHint":
    "Sert à l'hémisphère de la lune (direction du croissant) et à l'heure locale du Moniteur d'orbite.",
  "settings.getLocation": "📍 Utiliser ma position actuelle",
  "settings.geo.unsupported": "Cet appareil ne prend pas en charge la localisation. Saisis-la à la main.",
  "settings.geo.checking": "Vérification de la position…",
  "settings.geo.done": "Réglé sur ta position actuelle !",
  "settings.geo.fail": "Impossible d'obtenir la position. Saisis-la à la main.",
  "settings.latPlaceholder": "Latitude",
  "settings.lonPlaceholder": "Longitude",
  "settings.citySearch": "Chercher une ville",
  "settings.cityPlaceholder": "Nom de la ville...",
  "settings.cityNone": "Aucune ville correspondante",
  "settings.mapPick": "Choisir sur la carte",
  "settings.mapHint": "Appuie sur la carte pour choisir un emplacement.",
  "settings.time": "Affichage de l'heure",
  "settings.timeHint": "Sert à l'horloge du Moniteur d'orbite.",
  "settings.tf.device": "Locale de l'appareil",
  "settings.tf.home": "Heure solaire de la base",
  "settings.tf.homeLocked": "* L'heure solaire de la base nécessite d'abord un emplacement défini.",
  "settings.tf.utcDesc": "UTC — Temps universel coordonné (basé sur Greenwich).",
  "settings.tf.deviceDesc": "Locale de l'appareil — l'horloge de cet appareil même.",
  "settings.tf.homeDesc":
    "Heure solaire de la base — heure solaire moyenne décalant l'UTC de 15°=1h de longitude (diffère de l'heure standard / heure d'été).",
  "settings.orbitLink": "🛰️ Vérifie-le dans le Moniteur d'orbite",
  "settings.language": "Langue",
  "settings.langAuto": "Auto",

  "sw.update": "🚀 Nouvelle version disponible ! Appuie pour mettre à jour",
};
