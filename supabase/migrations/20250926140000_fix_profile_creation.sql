-- Fix profile creation by allowing authenticated users to insert their own profile
-- This enables the client-side createProfileIfNotExists function to work

-- Grant insert permission to authenticated users for their own profile
grant insert on public.profiles to authenticated;

-- Allow authenticated users to insert their own profile only
drop policy if exists "Profiles can be created by owners" on public.profiles;
create policy "Profiles can be created by owners"
    on public.profiles
    for insert
    with check (auth.uid() = id);

-- Also add the missing update permissions that the client needs
grant update on public.profiles to authenticated;
