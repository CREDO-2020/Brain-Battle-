-- Brain Battle profile and leaderboard setup
-- Run AFTER supabase/schema.sql in a fresh Supabase project.
-- The connected project already has these objects.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Brain Battler',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Profiles are publicly readable" on public.profiles;
create policy "Profiles are publicly readable" on public.profiles
  for select using (true);

drop policy if exists "Players can update their own profile" on public.profiles;
create policy "Players can update their own profile" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

grant select on public.profiles to anon, authenticated;
grant update on public.profiles to authenticated;

create or replace function public.handle_new_brain_battle_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
      split_part(coalesce(new.email, 'player'), '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_brain_battle_user_created on auth.users;
create trigger on_brain_battle_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_brain_battle_user();

create or replace view public.leaderboard as
  select p.display_name, a.score, a.category, a.correct_answers,
         a.total_questions, a.created_at
  from public.quiz_attempts a
  join public.profiles p on p.id = a.user_id;

grant select on public.leaderboard to anon, authenticated;
