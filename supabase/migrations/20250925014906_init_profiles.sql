-- Profiles table stores player progression linked to auth.users.
create extension if not exists "uuid-ossp";

create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    username text unique,
    xp integer not null default 0,
    level integer not null default 1,
    highest_unlocked_biome integer not null default 1,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Trigger to maintain updated_at.
create or replace function public.set_current_timestamp_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

drop trigger if exists set_timestamp on public.profiles;
create trigger set_timestamp
    before update on public.profiles
    for each row
    execute function public.set_current_timestamp_updated_at();

alter table public.profiles enable row level security;

drop policy if exists "Profiles are viewable by owners" on public.profiles;
create policy "Profiles are viewable by owners"
    on public.profiles
    for select
    using (auth.uid() = id);

drop policy if exists "Profiles are updatable by owners" on public.profiles;
create policy "Profiles are updatable by owners"
    on public.profiles
    for update
    using (auth.uid() = id)
    with check (auth.uid() = id);

-- Allow insert via backend (service role) for onboarding.
revoke insert on public.profiles from anon;
revoke insert on public.profiles from authenticated;

