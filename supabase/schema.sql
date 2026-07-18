-- ============================================================================
-- schema.sql — 온라인 리더보드 테이블 (CLAUDE.md §8-1)
--
-- 적용 방법: Supabase 대시보드 > SQL Editor에 이 파일 전체를 붙여넣고 Run.
-- 이미 적용된 프로젝트에 다시 돌려도 안전하다 (if not exists / drop 후 재생성).
-- ============================================================================

create table if not exists public.scores (
  id bigint generated always as identity primary key,
  -- 아케이드 이니셜: 대문자·숫자 1~3글자. 클라이언트(sanitizeName)와 같은 규칙을
  -- DB에도 걸어 둔다 — 클라이언트 검증은 우회할 수 있지만 check 제약은 못 지나간다.
  name text not null check (name ~ '^[A-Z0-9]{1,3}$'),
  -- 상한 체크: 스폰 간격 바닥(0.42초)상 물리적으로 불가능한 점수는 거른다.
  -- 익명 등록이라 조작을 완전히 막을 수는 없다 — 쓰레기 값의 하한선만 지킨다.
  score integer not null check (score between 1 and 100000),
  eaten integer not null default 0 check (eaten between 0 and 10000),
  created_at timestamptz not null default now()
);

-- 유일한 읽기 패턴이 "점수 내림차순 TOP N"이므로 그 모양 그대로 인덱스를 건다.
-- (동점일 때 먼저 등록한 쪽이 위 — 조회 order와 일치)
create index if not exists scores_top_idx
  on public.scores (score desc, created_at asc);

-- RLS(Row Level Security): anon key로 할 수 있는 일을 여기서 정한다.
-- anon key는 클라이언트 번들에 그대로 들어가는 공개 키다 — 권한의 진짜 원본은
-- 키가 아니라 이 정책들이다.
alter table public.scores enable row level security;

drop policy if exists "scores_select_all" on public.scores;
drop policy if exists "scores_insert_all" on public.scores;

-- 누구나 순위표를 읽을 수 있다.
create policy "scores_select_all" on public.scores
  for select using (true);

-- 누구나 점수를 추가할 수 있다. 수정(update)·삭제(delete) 정책은 만들지
-- 않는다 — 정책이 없으면 RLS가 기본 거부하므로, 한 번 오른 기록은 못 지운다.
create policy "scores_insert_all" on public.scores
  for insert with check (true);
