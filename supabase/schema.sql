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
-- - scores: 게임 한 판 = 한 행 (판 히스토리 — 단판 랭킹은 pets.best_score가 원천).
-- - 펫 이름은 유니크(대소문자 무시) — register_pet이 등록 시점에 선점한다.
-- - 쓰기는 전부 RPC 두 개(register_pet·submit_result)로만 — anon의 직접
--   INSERT/UPDATE를 막아서, 이름 선점과 누적 가산이 DB 안에서 원자적으로 굴러간다.
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
  -- 단판 최고점 — 단판 랭킹의 원천. 자기 기록을 깰 때만 갱신되므로
  -- 랭킹에 같은 펫이 두 번 오르는 일이 없다 (§8-1)
  best_score integer not null default 0 check (best_score >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 단판 최고점을 "언제" 세웠는지 — 동점일 때 먼저 세운 쪽이 위 (v3.1 추가)
alter table public.pets add column if not exists best_at timestamptz;
-- 기존 펫 백필: 최고점은 있는데 시각이 없으면 마지막 활동 시각으로 근사
update public.pets set best_at = updated_at where best_at is null and best_score > 0;

-- 단판 랭킹의 읽기 패턴 그대로 인덱스
create index if not exists pets_best_idx
  on public.pets (best_score desc, best_at asc);

-- 누적 랭킹의 유일한 읽기 패턴 그대로 인덱스
create index if not exists pets_total_idx
  on public.pets (total_eaten desc, updated_at asc);

-- ----------------------------------------------------------------------------
-- 1-1) 펫 이름 유니크 (대소문자 무시) — 같은 이름의 펫은 하나만 (§8-1)
-- 인덱스를 만들기 전에 이미 들어온 중복 이름을 정리한다:
-- 수거량이 가장 많은 펫이 이름을 지키고, 나머지는 "이름·2"식으로 밀려난다.
-- (밀려난 펫의 화면 속 이름은 다음 제출부터 DB 이름으로 어긋날 수 있다 —
--  초기 운영 중 1회성 마이그레이션의 타협.)
-- ----------------------------------------------------------------------------
with ranked as (
  select id, name,
         row_number() over (
           partition by lower(name)
           order by total_eaten desc, created_at asc
         ) as rn
  from public.pets
)
update public.pets p
set name = left(r.name, 7) || '·' || r.rn
from ranked r
where p.id = r.id and r.rn > 1;

create unique index if not exists pets_name_unique_idx
  on public.pets (lower(name));

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
-- 3) register_pet — 펫 등록 = 이름 선점 (이름 입력 화면에서 호출)
--
-- 이름 검사를 게임오버가 아니라 "이름을 짓는 순간"에 해야, 한 판을 다
-- 플레이하고 나서야 이름이 겹친다는 걸 아는 사고가 없다 (§8-1).
-- 이미 등록된 id면 조용히 통과(멱등) — 이름은 최초 등록 때 고정, 개명 없음.
-- 이름이 선점돼 있으면 유니크 인덱스 위반(23505) → PostgREST가 409로 응답.
-- ----------------------------------------------------------------------------
create or replace function public.register_pet(
  p_id uuid,
  p_name text
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
  if exists (select 1 from pets where id = p_id) then
    return; -- 이미 등록된 펫 — 멱등 통과 (게임오버 자기 치유 경로에서도 온다)
  end if;
  insert into pets (id, name) values (p_id, clean_name);
end;
$$;

revoke all on function public.register_pet(uuid, text) from public;
grant execute on function public.register_pet(uuid, text) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- 4) submit_result — 게임 한 판의 결과 제출 (유일한 쓰기 경로)
--
-- v2의 4-인자 버전(이름 포함)은 제거한다 — 이름은 register_pet이 선점하므로
-- 제출 경로로 개명·무단 등록이 새면 안 된다. 등록 안 된 펫의 제출은 에러
-- (클라이언트가 register_pet부터 다시 시도한다 — 자기 치유).
-- ----------------------------------------------------------------------------
drop function if exists public.submit_result(uuid, text, integer, integer);

create or replace function public.submit_result(
  p_id uuid,
  p_score integer,
  p_eaten integer
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- 스폰 간격 바닥(0.42초)상 물리적으로 불가능한 값은 거른다 (조작의 하한선)
  if p_score is null or p_score not between 1 and 100000 then
    raise exception 'invalid score';
  end if;
  if p_eaten is null or p_eaten not between 0 and 10000 then
    raise exception 'invalid eaten';
  end if;

  -- 누적 가산 — 등록된 펫만. best_score·best_at은 자기 기록을 깰 때만 움직인다
  update pets set
    total_score = total_score + p_score,
    total_eaten = total_eaten + p_eaten,
    best_at = case when p_score > best_score then now() else best_at end,
    best_score = greatest(best_score, p_score),
    updated_at = now()
  where id = p_id;
  if not found then
    raise exception 'unregistered pet';
  end if;

  -- 판 히스토리 — 랭킹은 pets.best_score가 담당하고, 이 테이블은 모든 판의
  -- 기록 보관용이다 (최근 판·통계 같은 미래 기능의 재료)
  insert into scores (name, score, eaten, pet_id)
  select name, p_score, p_eaten, p_id from pets where id = p_id;
end;
$$;

revoke all on function public.submit_result(uuid, integer, integer) from public;
grant execute on function public.submit_result(uuid, integer, integer)
  to anon, authenticated;
