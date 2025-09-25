-- Leaderboards capture race results tied to profiles.
create table if not exists public.leaderboards (
    id bigserial primary key,
    user_id uuid not null references public.profiles(id) on delete cascade,
    race_seed text not null,
    finish_time_ms integer not null,
    created_at timestamptz not null default now()
);

create index if not exists leaderboards_race_seed_idx on public.leaderboards (race_seed);
create index if not exists leaderboards_user_id_idx on public.leaderboards (user_id);

alter table public.leaderboards enable row level security;

drop policy if exists "Leaderboards readable by authenticated" on public.leaderboards;
create policy "Leaderboards readable by authenticated"
    on public.leaderboards
    for select
    using (auth.role() = 'authenticated');

drop policy if exists "Leaderboards insert own" on public.leaderboards;
create policy "Leaderboards insert own"
    on public.leaderboards
    for insert
    with check (auth.uid() = user_id);

-- Prevent updates/deletes from clients. Service role can manage maintenance.
revoke update, delete on public.leaderboards from authenticated;
revoke all on public.leaderboards from anon;

