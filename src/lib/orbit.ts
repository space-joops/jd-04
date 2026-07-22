// ============================================================================
// orbit.ts — 펫(생체 위성)의 실시간 궤도역학 (§8-3 궤도 모니터)
//
// 서버에도 로컬에도 펫의 "위치"라는 데이터는 없다. 대신 펫의 uuid를 씨앗
// 삼아 궤도 요소(고도·경사각·승교점 경도·발사 시점)를 결정론적으로 만들어
// 낸다 — backdrop.ts가 별의 위치를 hash(i)로 고정하는 것과 같은 발상이다.
// 같은 펫은 언제 다시 봐도 같은 궤도, 그 위에서 "지금 이 순간"의 실제 시계
// 기준 위치만 계속 달라진다.
//
// 물리는 원궤도 근사(케플러 제3법칙 + 지상궤적 공식)만 쓴다. 승교점 세차
// 같은 섭동(J2)은 다루지 않는다 — "진짜(약간) 궤도 시뮬레이션" 정도의
// 재미가 목적이지 정밀 항법이 아니다.
// ============================================================================

/** 지구 반지름(km). */
const EARTH_RADIUS_KM = 6371;
/** 지구 표준 중력 매개변수(km³/s²) — 케플러 계산의 핵심 상수. */
const MU_EARTH = 398600.4418;
/** 지구 자전각속도(rad/s, 항성일 기준) — 지상궤적이 서쪽으로 밀리는 원인. */
const EARTH_ROT_RATE = 7.2921159e-5;
/**
 * "발사 시점" 스프레드의 기준점 — 항상 실제 현재 시각(Date.now())보다
 * 과거여야 한다. 세계관(§2)의 케슬러 신드롬은 2031년이지만, 이 화면은
 * 진짜 현재 시각으로 도는 실시간 시뮬레이션이라 실제 오늘 날짜가 그보다
 * 이르면(예: 배포 시점이 2031년 이전) epoch가 미래가 되어 경과 시간이
 * 음수로 뒤집히고 REV가 음수로 표시되는 사고가 난다. 그래서 넉넉히 과거의
 * 고정 시점(2015~2023년)을 쓰고, "펫이 케슬러 신드롬 이후 세상에서
 * 태어났다"는 서사는 다른 화면(스토리 인트로 등)에서만 담당한다.
 */
const LAUNCH_BASE_MS = Date.UTC(2015, 0, 1);
/** 발사 시점을 이 기준점에서 최대 8년 뒤까지 펫마다 다르게 흩어 놓는다. */
const LAUNCH_SPREAD_MS = 8 * 365.25 * 86400 * 1000;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
function toDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}
/**
 * -180~180 범위로 접어 넣는다. JS의 `%`는 나머지 부호가 피제수를 따라가서
 * (예: -1000 % 360 === -280) `(deg+540)%360-180` 같은 한 줄 트릭은 경과
 * 시간이 몇 년치로 커지는 이 화면에서 범위를 벗어난다 — 그래서 먼저
 * `%360`으로 크기만 줄인 다음, 부호에 따라 한 번만 보정한다.
 */
function normalizeDeg(deg: number): number {
  const d = deg % 360; // (-360, 360) 범위로 축소
  if (d > 180) return d - 360;
  if (d < -180) return d + 360;
  return d;
}

/**
 * backdrop.ts의 hash(i)와 완전히 같은 공식 — 인덱스가 같으면 언제나 같은
 * 0~1 값이 나오는 결정론적 유사난수. 궤도 요소도 같은 문법으로 뽑는다.
 */
function hash(i: number): number {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/** uuid 문자열 → 안정적인 정수 시드 (djb2 계열 문자 해시). */
export function seedFromId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (Math.imul(h ^ id.charCodeAt(i), 2654435761) >>> 0) as number;
  }
  return h % 100000;
}

/** seed·salt 조합으로 서로 독립적인 0~1 값을 뽑는다 (요소별로 다른 salt). */
function rand(seed: number, salt: number): number {
  return hash(seed * 97 + salt);
}

/** 펫 하나의 궤도를 통째로 규정하는 값들. 시드에서 한 번만 만들면 끝. */
export type OrbitElements = {
  petId: string;
  altitudeKm: number; // 원궤도 고도 (400~500km, LEO)
  inclinationDeg: number; // 궤도 경사각 (30~98°)
  raan0Deg: number; // 발사 시점 기준 승교점 경도 (-180~180°)
  epochMs: number; // 발사 시점(케슬러 신드롬 이후) — REV·위상의 원점
  semiMajorAxisKm: number; // 궤도 장반경 = 지구반지름 + 고도
  periodSec: number; // 공전 주기 (케플러 제3법칙)
  speedKmS: number; // 원궤도 속력
};

/** 펫 uuid로부터 결정론적 궤도 요소를 만든다. 같은 id는 언제나 같은 궤도. */
export function generateOrbitElements(petId: string): OrbitElements {
  const seed = seedFromId(petId);
  const altitudeKm = 400 + rand(seed, 1) * 100;
  const inclinationDeg = 30 + rand(seed, 2) * 68;
  const raan0Deg = rand(seed, 3) * 360 - 180;
  const epochMs = LAUNCH_BASE_MS + rand(seed, 4) * LAUNCH_SPREAD_MS;

  const semiMajorAxisKm = EARTH_RADIUS_KM + altitudeKm;
  const periodSec = 2 * Math.PI * Math.sqrt(semiMajorAxisKm ** 3 / MU_EARTH);
  const speedKmS = Math.sqrt(MU_EARTH / semiMajorAxisKm);

  return {
    petId,
    altitudeKm,
    inclinationDeg,
    raan0Deg,
    epochMs,
    semiMajorAxisKm,
    periodSec,
    speedKmS,
  };
}

/** 특정 시각의 "승교점 이후 경과각"과 경과 시간(초)을 함께 돌려준다. */
function angleAtTime(
  el: OrbitElements,
  atTimeMs: number,
): { u: number; elapsedSec: number } {
  const n = (2 * Math.PI) / el.periodSec; // 평균운동(rad/s)
  const elapsedSec = (atTimeMs - el.epochMs) / 1000;
  return { u: n * elapsedSec, elapsedSec };
}

/** 경과각 u에서의 지상궤적 위/경도(도 단위) — 원궤도 지상궤적 공식. */
function subPointDeg(
  el: OrbitElements,
  u: number,
  elapsedSec: number,
): { latDeg: number; lonDeg: number } {
  const iRad = toRad(el.inclinationDeg);
  const raanRad = toRad(el.raan0Deg);
  // 위도: 구면삼각법 — sin(위도) = sin(경사각)·sin(u)
  const latRad = Math.asin(Math.sin(iRad) * Math.sin(u));
  // 관성계(비회전) 기준 경도 오프셋
  const dLon = Math.atan2(Math.cos(iRad) * Math.sin(u), Math.cos(u));
  const lonInertial = raanRad + dLon;
  // 지구 자전만큼 서쪽으로 되돌린다 — 매 궤도마다 지상궤적이 서쪽으로 이동
  const lonRad = lonInertial - EARTH_ROT_RATE * elapsedSec;
  return { latDeg: toDeg(latRad), lonDeg: normalizeDeg(toDeg(lonRad)) };
}

/**
 * 태양광 여부(근사) — 태양 적위와 부태양점 경도로 대충의 명암 경계를 그린다.
 * 균시차·대기굴절은 무시, 고도로 인한 지평선 하강만 여유값(-0.1)으로 보정.
 */
function isSunlit(latDeg: number, lonDeg: number, atTimeMs: number): boolean {
  const d = new Date(atTimeMs);
  const start = Date.UTC(d.getUTCFullYear(), 0, 0);
  const dayOfYear = Math.floor((atTimeMs - start) / 86400000);
  const declDeg = 23.44 * Math.sin(toRad((360 / 365) * (dayOfYear - 81)));
  const utcHours = d.getUTCHours() + d.getUTCMinutes() / 60;
  const subsolarLonDeg = normalizeDeg(180 - utcHours * 15);
  const cosAngle =
    Math.sin(toRad(latDeg)) * Math.sin(toRad(declDeg)) +
    Math.cos(toRad(latDeg)) *
      Math.cos(toRad(declDeg)) *
      Math.cos(toRad(lonDeg - subsolarLonDeg));
  return cosAngle > -0.1;
}

/** 특정 순간의 궤도 상태 — telemetry 카드가 그대로 보여줄 값들. */
export type OrbitState = {
  latDeg: number;
  lonDeg: number; // -180~180
  altitudeKm: number;
  speedKmS: number;
  periodSec: number;
  revolutions: number; // 소수 — 발사 이후 총 공전 수
  revCount: number; // floor(revolutions)
  sunlit: boolean;
};

/** 궤도 요소 + 실제 시각(ms)으로 "지금 이 순간"의 위치·속도를 계산한다. */
export function getOrbitState(
  el: OrbitElements,
  atTimeMs: number,
): OrbitState {
  const { u, elapsedSec } = angleAtTime(el, atTimeMs);
  const { latDeg, lonDeg } = subPointDeg(el, u, elapsedSec);
  const revolutions = elapsedSec / el.periodSec;
  return {
    latDeg,
    lonDeg,
    altitudeKm: el.altitudeKm,
    speedKmS: el.speedKmS,
    periodSec: el.periodSec,
    revolutions,
    revCount: Math.floor(revolutions),
    sunlit: isSunlit(latDeg, lonDeg, atTimeMs),
  };
}

/**
 * 현재 시각을 중심으로 앞뒤 반주기 구간의 지상궤적을 여러 점으로 샘플링한다.
 * 지구본에 점선 궤도로 투영할 원재료 — 지구 자전이 반영돼 있어 실제
 * 위성추적기처럼 S자로 휜다.
 */
export function sampleGroundTrack(
  el: OrbitElements,
  atTimeMs: number,
  steps = 48,
): Array<{ latDeg: number; lonDeg: number }> {
  const { u, elapsedSec } = angleAtTime(el, atTimeMs);
  const n = (2 * Math.PI) / el.periodSec;
  const points: Array<{ latDeg: number; lonDeg: number }> = [];
  for (let k = 0; k < steps; k++) {
    const du = (k / steps - 0.5) * 2 * Math.PI; // -π ~ +π (한 바퀴 전체)
    const uk = u + du;
    const dtSec = du / n;
    points.push(subPointDeg(el, uk, elapsedSec + dtSec));
  }
  return points;
}
