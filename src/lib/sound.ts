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

// ----------------------------------------------------------------------------
// 스토리 인트로 사운드 (§4) — 파일 0개, 전부 합성.
// 잔잔한 앰비언트 패드(드론)를 깔고, 막 전환에 큐를 얹는다. 게임과 같은
// AudioContext를 공유하되, 테마는 이 노드들만 개별로 껐다 켠다 — 인트로가
// 컨텍스트를 닫으면 게임 효과음이 죽으므로 disposeAudio는 절대 부르지 않는다.
// ----------------------------------------------------------------------------

/** 앰비언트 패드가 물고 있는 노드들 — stopStoryTheme이 정리한다. */
let storyNodes: Array<OscillatorNode | GainNode> = [];
let storyGain: GainNode | null = null;

/**
 * 스토리 테마 시작 — 우주 정거장 같은 낮은 드론(디튠 사인 2개 + 5도 위 한 음).
 * 반드시 ensureAudio() 뒤에(제스처 안에서) 부를 것. suspended면 조용히 무음.
 */
export function startStoryTheme(): void {
  if (!audio || muted || storyGain) return; // 이미 켜져 있으면 중복 방지
  try {
    const t0 = audio.currentTime;
    const master = audio.createGain();
    master.gain.setValueAtTime(0.0001, t0);
    master.gain.exponentialRampToValueAtTime(0.05, t0 + 2); // 2초에 걸쳐 스며들 듯
    master.connect(audio.destination);
    storyGain = master;

    // 낮은 드론 3음 (A2·A2 디튠·E3) — 우주의 "웅" 하는 배경
    const freqs = [110, 110.6, 164.81];
    for (const f of freqs) {
      const osc = audio.createOscillator();
      const g = audio.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(f, t0);
      g.gain.setValueAtTime(0.5, t0);
      osc.connect(g).connect(master);
      osc.start(t0);
      storyNodes.push(osc, g);
    }
    // 아주 느린 숨결 LFO — 패드 음량이 천천히 밀물썰물
    const lfo = audio.createOscillator();
    const lfoGain = audio.createGain();
    lfo.frequency.setValueAtTime(0.08, t0); // ~12초 주기
    lfoGain.gain.setValueAtTime(0.02, t0);
    lfo.connect(lfoGain).connect(master.gain);
    lfo.start(t0);
    storyNodes.push(lfo, lfoGain);
  } catch {
    storyGain = null;
  }
}

/** 스토리 테마 정지 — 부드럽게 내리고 노드만 해제(컨텍스트는 그대로). */
export function stopStoryTheme(): void {
  if (!audio) {
    storyNodes = [];
    storyGain = null;
    return;
  }
  try {
    const t0 = audio.currentTime;
    if (storyGain) {
      storyGain.gain.cancelScheduledValues(t0);
      storyGain.gain.setValueAtTime(Math.max(0.0001, storyGain.gain.value), t0);
      storyGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.6);
    }
    for (const n of storyNodes) {
      if ("stop" in n) {
        try {
          (n as OscillatorNode).stop(t0 + 0.7);
        } catch {
          // 이미 멈췄으면 무시
        }
      }
    }
  } catch {
    // 정리 실패는 무시 — 다음 재생 때 어차피 새로 만든다
  }
  storyNodes = [];
  storyGain = null;
}

/** A막(케슬러) 큐 — 낮게 부풀었다 꺼지는 불길한 스웰(하강 문법 §10). */
export function playStoryRumble(): void {
  chirp("sawtooth", 70, 42, 1.4, 0.05);
  chirp("sine", 140, 90, 1.4, 0.04);
}
