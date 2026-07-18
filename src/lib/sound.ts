// ============================================================================
// sound.ts — Web Audio 신시사이저
//
// 오디오 파일 0개: 모든 소리는 오실레이터로 즉석에서 합성한다 (§12).
// 사운드 문법(§10): 음이 올라가면 긍정, 내려가면 부정.
//                  부드러운 파형(triangle)은 좋은 일, 거친 파형(sawtooth)은 나쁜 일.
//
// 브라우저는 사용자 제스처(탭/클릭) 없이 소리를 못 내게 막는다(자동재생 정책).
// 그래서 AudioContext 생성/재개는 반드시 포인터 이벤트 핸들러 안에서
// ensureAudio()로 한다. 실패하면 조용히 무음으로 — 게임을 절대 막지 않는다.
// ============================================================================

let audio: AudioContext | null = null;

/** 음소거 (§10) — 끄면 모든 chirp가 조용히 빠져나간다. 저장은 storage.ts 몫. */
let muted = false;

export function setMuted(m: boolean): void {
  muted = m;
}

/** 사용자 제스처 핸들러 안에서 호출: 오디오를 켜거나(1회) 잠든 컨텍스트를 깨운다. */
export function ensureAudio(): void {
  try {
    if (!audio) audio = new AudioContext();
    // 모바일에서 탭 전환 등으로 suspended가 되면 다시 깨워 준다.
    if (audio.state === "suspended") void audio.resume();
  } catch {
    audio = null; // 미지원 환경 — 이후 재생 함수들이 전부 조용히 빠져나간다.
  }
}

/** useEffect 정리 단계에서 호출: 컨텍스트를 닫아 리소스를 돌려준다 (§12). */
export function disposeAudio(): void {
  try {
    void audio?.close();
  } catch {
    // 이미 닫혔어도 상관없다.
  }
  audio = null;
}

/**
 * 짧은 "삐" 하나를 합성한다.
 * 주파수를 from→to로 지수 곡선으로 미끄러뜨리고, 음량도 지수로 감쇠시킨다
 * (귀는 로그 스케일로 듣기 때문에 선형보다 지수 쪽이 자연스럽다).
 *
 * @param delay 시작을 늦출 시간(초) — 여러 음을 이어 멜로디를 만들 때 사용.
 */
function chirp(
  type: OscillatorType,
  from: number,
  to: number,
  dur: number,
  gain = 0.08,
  delay = 0,
): void {
  if (!audio || muted) return;
  try {
    const t0 = audio.currentTime + delay;
    const osc = audio.createOscillator();
    const g = audio.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(from, t0);
    // exponentialRamp는 0을 못 다루므로 최소 1Hz로 방어한다.
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), t0 + dur);

    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    osc.connect(g).connect(audio.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02); // 감쇠가 끝난 직후 정지 — 오실레이터 누수 방지
  } catch {
    // 어떤 이유로든 실패하면 그냥 무음.
  }
}

/** 먹이 먹음: 430→900Hz 상승 트라이앵글 — "좋은 일은 올라가는 부드러운 소리". */
export function playEat(): void {
  chirp("triangle", 430, 900, 0.12);
}

/** 가시 피격: 220→65Hz 하강 톱니파 — "나쁜 일은 내려가는 거친 소리". */
export function playHit(): void {
  chirp("sawtooth", 220, 65, 0.25, 0.06);
}

/** 게임 오버: 392→330→262Hz 세 음이 계단처럼 내려간다 ("솔–미–도"). */
export function playGameOver(): void {
  chirp("triangle", 392, 392, 0.16, 0.07, 0);
  chirp("triangle", 330, 330, 0.16, 0.07, 0.16);
  chirp("triangle", 262, 262, 0.28, 0.07, 0.32);
}

/**
 * 별 보너스: 660→880→1320Hz 상승 아르페지오 (§5) — 보통 먹이(둘 다 상승
 * 트라이앵글)와 같은 문법이되 세 음으로 "더 좋은 일"임을 알린다.
 */
export function playStar(): void {
  chirp("triangle", 660, 660, 0.09, 0.07, 0);
  chirp("triangle", 880, 880, 0.09, 0.07, 0.08);
  chirp("triangle", 1320, 1320, 0.16, 0.07, 0.16);
}

/**
 * 콤보 배율 상승 (§5-1): 옥타브 도약 2음 — 먹기(1음)보다 특별하고
 * 별(3음)보다 가벼운, 딱 중간 크기의 축하.
 */
export function playCombo(): void {
  chirp("triangle", 523, 523, 0.08, 0.07, 0);
  chirp("triangle", 1046, 1046, 0.14, 0.07, 0.07);
}

/** 파워업 획득 (§5-2): 낮은 곳에서 높이 미끄러져 올라가는 "충전" 스윕. */
export function playPowerup(): void {
  chirp("triangle", 330, 1320, 0.22, 0.08);
}

/**
 * 방패로 피격을 막음 (§5-2): 짧게 오르는 2음 — "나쁜 일을 피했다"는
 * 좋은 일이므로 상승 문법(§10)을 쓰되, 축하보다는 "텅" 하는 안도감으로.
 */
export function playBlock(): void {
  chirp("triangle", 262, 262, 0.06, 0.08, 0);
  chirp("triangle", 392, 392, 0.12, 0.08, 0.05);
}
