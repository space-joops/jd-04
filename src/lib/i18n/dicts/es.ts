// dicts/es.ts — Diccionario en español (§2 i18n)

import type { Dict } from "../index";

export const es: Dict = {
  "landing.tagline": "¡Bocaditos espaciales!",
  "landing.rulesAria": "Reglas del juego",
  "landing.rule.thrust": "🕹 Arrastra para impulsarte — cuida el combustible",
  "landing.rule.eat": "🛰 Zámpate la basura espacial y suma +10",
  "landing.rule.avoid": "🌵 Esquiva a los rojos pinchudos (3 corazones)",
  "landing.rule.star": "⭐ Las estrellas dan +40 — ¡o un corazón si estás herido!",
  "landing.rule.fuel": "🔋 Cómete una batería para recargar combustible",
  "landing.link.rank": "🏆 Ranking",
  "landing.link.bag": "🎒 Inventario",
  "landing.link.orbit": "🛰️ Monitor de órbita",
  "landing.link.settings": "⚙️ Ajustes",
  "landing.footer": "Este pequeñín creció en el vivero terrestre del proyecto STELLAPET.",

  "story.replay": "📜 Volver a ver la historia",
  "story.aria": "Introducción de la historia del juego",
  "story.p1":
    "En 2031, el Síndrome de Kessler que todos temían se hizo realidad.\nLos escombros chocaban contra escombros, y esos escombros generaban aún más.\nLa órbita baja terrestre se convirtió en una nube de basura de 8.000 toneladas.",
  "story.p2":
    "La respuesta de la humanidad no fue un cohete más grande, ni un láser.\nFue un satélite vivo que crece comiendo basura espacial.\nCriado con mimo en tierra, y luego enviado a la órbita uno a uno.",
  "story.p3":
    "Treinta años después.\nEl de la boca más grande de todos\nvuelve hoy a la órbita baja a trabajar.\n\"¡Ñam ñam espacial!\"",

  "install.button": "📱 Instalar app",
  "install.iosSafari":
    "¡Toca el botón Compartir (⬆) al pie de Safari y elige \"Añadir a pantalla de inicio\" para instalarla como app!",
  "install.iosInapp":
    "No puedes instalar desde este navegador dentro de la app. Ábrela en Safari y luego toca Compartir (⬆) → \"Añadir a pantalla de inicio\".",
  "install.openSafari": "Abrir en Safari",
  "install.copyLink": "Copiar enlace",
  "install.copied": "¡Copiado!",
  "install.inappHint": "Si el botón no funciona, pega la dirección copiada en Safari.",
  "install.other":
    "En el menú de tu navegador (⋮), elige \"Instalar app\" o \"Añadir a pantalla de inicio\".",

  "share.button": "📤 Compartir",
  "share.text": "¡Un juego arcade de píxeles donde te zampas la basura espacial que cae!",
  "share.copied": "¡Enlace copiado!",

  "play.cleanupLog": "🛰 Diario de limpieza de {name}",
  "play.ariaResume": "Reanudar juego",
  "play.ariaPause": "Pausar",
  "play.ariaSoundOff": "Silenciar",
  "play.ariaSoundOn": "Activar sonido",
  "play.ariaHome": "Volver a la pantalla de inicio",

  "petname.title": "¡Ponle nombre a tu mascota!",
  "petname.sub":
    "Tus récords de limpieza orbital compiten bajo este nombre.\n(Hasta 10 caracteres · debe ser único)",
  "petname.placeholder": "Ñami",
  "petname.taken": "¡Vaya, ese nombre ya está pillado! Prueba con otro",
  "petname.aria": "Nombre de la mascota",

  "leaderboard.runTop5": "PARTIDA TOP 5",
  "leaderboard.totalTop5": "TOTAL TOP 5",
  "leaderboard.empty": "Aún no hay récords",
  "leaderboard.sendFail": "No se pudo enviar el récord — se reintentará la próxima ronda",
  "leaderboard.nameTaken": "El nombre ya estaba pillado, así que el récord no se pudo enviar",

  "rank.offline": "Modo sin conexión — el ranking en línea llega pronto",
  "rank.loadFail": "No se pudo cargar el ranking",
  "rank.runTitle": "PARTIDA TOP 10",
  "rank.runSub": "Prodigios de una ronda — mejor puntuación en una sola partida",
  "rank.totalTitle": "TOTAL TOP 10",
  "rank.totalSub": "Limpiadores aplicados — basura espacial recogida en total",

  "bag.subtitle": "Lo que tu mascota ha recogido hasta ahora — se guarda solo en este dispositivo",

  "bag.summary": "{total} recogidos · Dex {found}/{kinds}",
  "bag.empty": "Tu bolsa sigue vacía — ¿te vas a tu primera limpieza?",
  "bag.unit": "{n}",
  "bag.desc.satellite": "Sus paneles solares todavía brillan",
  "bag.desc.bolt": "¿De qué cohete se habrá caído?",
  "bag.desc.can": "Un rastro de la merienda de un astronauta",
  "bag.desc.spring": "Todavía saltarín y lleno de energía",
  "bag.desc.glove": "El guante que Ed White perdió en la Gemini 4 en 1965 (historia real)",
  "bag.desc.toolbag": "La bolsa que se alejó a la deriva en el paseo espacial del STS-126 en 2008 (historia real)",
  "bag.desc.fairing": "Una pieza veterana que un día protegió la punta de un cohete",
  "bag.desc.cubesat": "Abollado pero valiente satelitito",
  "bag.desc.fuel": "Combustible ñam ñam +800",
  "bag.desc.star": "Suerte orbital — puntos, o un corazón",
  "bag.desc.magnet": "Fuerza de atracción ×3, 8 seg",
  "bag.desc.slowmo": "Las cosas que caen van más despacio, 8 seg",
  "bag.desc.shield": "Te bloqueo un pincho",

  "junk.satellite": "Satélite",
  "junk.bolt": "Perno",
  "junk.can": "Lata de refresco",
  "junk.spring": "Muelle",
  "junk.glove": "Guante de astronauta",
  "junk.toolbag": "Bolsa de herramientas",
  "junk.fairing": "Cofia de cohete",
  "junk.cubesat": "CubeSat",
  "junk.hazard": "Bola de pinchos",
  "junk.fuel": "Batería",
  "junk.star": "Estrella",
  "junk.magnet": "Imán",
  "junk.slowmo": "Reloj",
  "junk.shield": "Escudo",

  "character.mint": "Mentita",
  "character.coral": "Fresita",
  "character.lavender": "Lavanda",

  "moon.newMoon": "Luna nueva",
  "moon.waxingCrescent": "Creciente iluminante",
  "moon.firstQuarter": "Cuarto creciente",
  "moon.waxingGibbous": "Gibosa creciente",
  "moon.fullMoon": "Luna llena",
  "moon.waningGibbous": "Gibosa menguante",
  "moon.lastQuarter": "Cuarto menguante",
  "moon.waningCrescent": "Creciente menguante",
  "moon.toast": "{emoji} Edad lunar ~{day}d · {phase}",

  "orbit.subtitle": "Muestra dónde está volando tu mascota sobre la Tierra ahora mismo, en tiempo real.",
  "orbit.realtimeNote": "Toda esta pantalla se calcula en vivo con mecánica orbital de verdad.",
  "orbit.explainerLink": "👉 ¿Qué es la mecánica orbital?",
  "orbit.timeHint": "Acelera el tiempo para ver la trayectoria de tu mascota.",
  "orbit.ariaZoomIn": "Acercar",
  "orbit.ariaZoomOut": "Alejar",
  "orbit.noPet": "Aún no ha despegado ninguna mascota a la órbita.\nEmpieza a jugar y tu mascota nacerá.",
  "orbit.hint.LAT": "Latitud — cuán al norte/sur de la Tierra está tu mascota. El ecuador es 0°, el norte es +.",
  "orbit.hint.LON": "Longitud — cuán al este/oeste. Greenwich es 0°, el este es +.",
  "orbit.hint.ALT": "Altitud — a qué altura flota sobre la superficie (km).",
  "orbit.hint.VEL": "Velocidad — rapidez orbital. ¡Mucho más veloz que una bala!",
  "orbit.hint.PERIOD": "Periodo — tiempo para dar una vuelta a la Tierra (minutos).",
  "orbit.hint.REV": "Revoluciones — cuántas vueltas a la Tierra desde el despegue.",
  "orbit.explainer.intro":
    "¡Tres paneles sobre cómo tu mascota ni cae ni sale volando, sino que orbita la Tierra para siempre!",
  "orbit.explainer.title1": "¿Por qué no cae?",
  "orbit.explainer.body1":
    "¡En realidad tu mascota está cayendo todo el rato! Pero vuela de lado tan rápido que la Tierra se curva justo lo mismo, así que sigue fallando — y orbita para siempre.",
  "orbit.explainer.title2": "Más alto = más tranquilo",
  "orbit.explainer.body2":
    "Cuanto más alto vas, más lento orbitas y más tarda cada vuelta. Tu mascota está en órbita baja, así que una vuelta son ~90 minutos — ¡dieciséis vueltas al día!",
  "orbit.explainer.title3": "¡La Tierra gira!",
  "orbit.explainer.body3":
    "Mientras tu mascota da una vuelta, la Tierra rota en silencio. Así cada pasada se desplaza un poco al oeste, dibujando ese famoso rastro ondulado en el mapamundi.",

  "settings.character": "Personaje",
  "settings.location": "Ubicación de la estación base",
  "settings.locationHint":
    "Se usa para el hemisferio de la luna (dirección del creciente) y la hora local del Monitor de órbita.",
  "settings.getLocation": "📍 Usar mi ubicación actual",
  "settings.geo.unsupported": "Este dispositivo no admite ubicación. Introdúcela a mano.",
  "settings.geo.checking": "Comprobando ubicación…",
  "settings.geo.done": "¡Ajustada a tu ubicación actual!",
  "settings.geo.fail": "No se pudo obtener la ubicación. Introdúcela a mano.",
  "settings.latPlaceholder": "Latitud",
  "settings.lonPlaceholder": "Longitud",
  "settings.citySearch": "Buscar una ciudad",
  "settings.cityPlaceholder": "Nombre de la ciudad...",
  "settings.cityNone": "Ninguna ciudad coincide",
  "settings.mapPick": "Elegir en el mapa",
  "settings.mapHint": "Toca el mapa para elegir una ubicación.",
  "settings.time": "Formato de hora",
  "settings.timeHint": "Se usa para el reloj del Monitor de órbita.",
  "settings.tf.device": "Local del dispositivo",
  "settings.tf.home": "Hora solar de la base",
  "settings.tf.homeLocked": "* La hora solar de la base necesita una ubicación configurada primero.",
  "settings.tf.utcDesc": "UTC — Tiempo Universal Coordinado (basado en Greenwich).",
  "settings.tf.deviceDesc": "Local del dispositivo — el reloj de este mismo dispositivo.",
  "settings.tf.homeDesc":
    "Hora solar de la base — hora solar media que desplaza el UTC 15°=1h de longitud (distinta de la hora estándar / horario de verano).",
  "settings.orbitLink": "🛰️ Compruébalo en el Monitor de órbita",
  "settings.language": "Idioma",
  "settings.langAuto": "Automático",

  "sw.update": "🚀 ¡Nueva versión disponible! Toca para actualizar",
};
