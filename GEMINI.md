# GEMINI.md — Gemini 계열 에이전트 지침

이 저장소의 에이전트 공통 지침은 **[`AGENT.md`](./AGENT.md)** 에 있습니다.
작업을 시작하기 전에 반드시 다음 순서로 읽으세요:

1. [`AGENT.md`](./AGENT.md) — 작업 내역·작업 절차·검증/배포 루틴·알려진 이슈·로드맵
2. [`CLAUDE.md`](./CLAUDE.md) — 게임 요구사항 명세서 (설계 의도와 규칙의 원본, § 번호의 출처)
3. [`docs/`](./docs/README.md) — 코드 문법 해설 (초급자용 학습 문서)

## 최소 요약 (자세한 건 AGENT.md)

- 초당 60번 변하는 것은 캔버스에, 가끔 변하는 것만 React에.
- 부가 기능이 게임을 죽이면 안 된다 — 실패는 조용히.
- 에셋 파일 0개, 색은 `src/lib/constants.ts`에서만.
- 규칙·수치를 바꾸면 `CLAUDE.md`를, 절차·이슈가 바뀌면 `AGENT.md`를 함께 갱신.
- 시작 전 `git log`와 `package.json` version부터 확인 (소유자가 직접 배포·버전 관리).
