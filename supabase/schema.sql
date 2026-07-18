-- ============================================================================
-- schema.sql — 온라인 리더보드 v2: 단판(scores) + 누적(pets) (CLAUDE.md §8-1)
--
-- 적용 방법: Supabase 대시보드 > SQL Editor에 이 파일 전체를 붙여넣고 Run.
-- v1(이니셜 3글자, scores만)에서 재실행해도 안전하게 마이그레이션된다.
--
-- 설계:
-- - pets: "등록된 펫" 하나당 한 행. id는 클라이언트가 만들어 localStorage에
--   보관하는 uuid — 이름이 같아도 다른 펫이 섞이지 않는 경쟁 키.
--   누적 쓰레기(total_eaten)·누적 점수·단판 최고를 여기서 관리한다.
-- - scores: 게임 한 판 = 한 행 (단판 랭킹의 원천).
-- - 쓰기는 전부 RPC 함수 submit_result 하나로만 — anon의 직접 INSERT/UPDATE를
--   막아서, 누적치가 클라이언트 계산이 아니라 DB 안에서 원자적으로 굴러가게 한다.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) pets — 등록된 펫과 누적 기록
-- ----------------------------------------------------------------------------
create table if not exists public.pets (
  id uuid primary key,
  -- 펫 이름: 1~10자 (한글 허용 — 표시용. 경쟁 키는 어디까지나 id)
  name text not null check (char_length(name) between 1 and 10),
  -- "총 수거한 쓰레기양" — 누적 경쟁의 기준 (§8-1)
  total_eaten bigint not null default 0 check (total_eaten >= 0),
  total_score bigint not null default 0 check (total_score >= 0),
  best_score integer not null default 0 check (best_score >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 누적 랭킹의 유일한 읽기 패턴 그대로 인덱스
create index if not exists pets_total_idx
  on public.pets (total_eaten desc, updated_at asc);

alter table public.pets enable row level security;

drop policy if exists "pets_select_all" on public.pets;
create policy "pets_select_all" on public.pets
  for select using (true);
-- insert/update 정책 없음 = anon 직접 쓰기 전부 거부.
-- 쓰기는 아래 security definer 함수만 할 수 있다.

-- ----------------------------------------------------------------------------
-- 2) scores — 단판 기록 (v1에서 확장)
-- ----------------------------------------------------------------------------
create table if not exists public.scores (
  id bigint generated always as identity primary key,
  name text not null,
  score integer not null check (score between 1 and 100000),
  eaten integer not null default 0 check (eaten between 0 and 10000),
  created_at timestamptz not null default now()
);

-- v1 마이그레이션: 이니셜(1~3자 영대문자) 제약 → 펫 이름(1~10자)으로 완화
alter table public.scores drop constraint if exists scores_name_check;
alter table public.scores
  add constraint scores_name_check check (char_length(name) between 1 and 10);

-- 어느 펫의 판이었는지 연결 (v1 행은 null로 남는다 — 과거 기록도 랭킹엔 유효)
alter table public.scores add column if not exists pet_id uuid;

create index if not exists scores_top_idx
  on public.scores (score desc, created_at asc);

alter table public.scores enable row level security;

drop policy if exists "scores_select_all" on public.scores;
create policy "scores_select_all" on public.scores
  for select using (true);

-- v1의 직접 INSERT 허용 정책 제거 — 이제 쓰기는 RPC로만
drop policy if exists "scores_insert_all" on public.scores;

-- ----------------------------------------------------------------------------
-- 3) submit_result — 게임 한 판의 결과 제출 (유일한 쓰기 경로)
--
-- security definer: 함수 소유자(관리자) 권한으로 실행되어 RLS를 지나간다.
-- 대신 함수 안에서 입력을 전부 검증한다 — check 제약과 같은 상한선.
-- 한 호출 안에서 펫 upsert(누적 가산)와 단판 기록 insert가 원자적으로 처리된다.
-- ----------------------------------------------------------------------------
create or replace function public.submit_result(
  p_id uuid,
  p_name text,
  p_score integer,
  p_eaten integer
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  clean_name text;
begin
  clean_name := btrim(p_name);
  if clean_name is null or char_length(clean_name) not between 1 and 10 then
    raise exception 'invalid pet name';
  end if;
  -- 스폰 간격 바닥(0.42초)상 물리적으로 불가능한 값은 거른다 (조작의 하한선)
  if p_score is null or p_score not between 1 and 100000 then
    raise exception 'invalid score';
  end if;
  if p_eaten is null or p_eaten not between 0 and 10000 then
    raise exception 'invalid eaten';
  end if;

  -- 펫 upsert: 처음 보는 id면 등록, 알던 id면 누적 가산 + 개명 반영
  insert into pets (id, name, total_score, total_eaten, best_score)
  values (p_id, clean_name, p_score, p_eaten, p_score)
  on conflict (id) do update set
    name = excluded.name,
    total_score = pets.total_score + excluded.total_score,
    total_eaten = pets.total_eaten + excluded.total_eaten,
    best_score = greatest(pets.best_score, excluded.best_score),
    updated_at = now();

  -- 단판 기록
  insert into scores (name, score, eaten, pet_id)
  values (clean_name, p_score, p_eaten, p_id);
end;
$$;

-- anon(공개 키)에게 실행 권한만 준다 — 테이블 쓰기 권한은 여전히 없다
revoke all on function public.submit_result(uuid, text, integer, integer) from public;
grant execute on function public.submit_result(uuid, text, integer, integer)
  to anon, authenticated;
