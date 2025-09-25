-- Static wingsuit data accessible to all authenticated users.
create table if not exists public.wingsuits (
    id serial primary key,
    name text not null unique,
    speed_stat integer not null,
    maneuverability_stat integer not null,
    glide_stat integer not null,
    unlock_level integer not null default 1,
    created_at timestamptz not null default now()
);

alter table public.wingsuits enable row level security;

drop policy if exists "Wingsuits readable by authenticated" on public.wingsuits;
create policy "Wingsuits readable by authenticated"
    on public.wingsuits
    for select
    using (auth.role() = 'authenticated');

-- Disallow mutations from clients. Only service role may manage content.
revoke insert, update, delete on public.wingsuits from authenticated;
revoke insert, update, delete on public.wingsuits from anon;

