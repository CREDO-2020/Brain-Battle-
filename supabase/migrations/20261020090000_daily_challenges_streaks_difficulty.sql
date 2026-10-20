-- Daily challenge, difficulty, streak, and ranking support.
alter table public.questions
  add column if not exists difficulty text not null default 'medium';
alter table public.questions
  add constraint questions_difficulty_check check (difficulty in ('easy', 'medium', 'hard'));

-- Assign a more balanced starting difficulty across the existing 89-question bank.
-- New questions default to medium and can be tuned individually.
update public.questions
set difficulty = case
  when id in (40,46,26,31,50,75,76,80,83,84,87,89,69,73,74,77,82,56,62,68,86,38,49,64,72,79) then 'hard'
  when id in (3,9,10,14,57,4,6,16,61,81,88,29,30,35,39,48,52,53,1,7,8,17,23,5,11,13,32,2,12,18,20,21) then 'easy'
  else 'medium'
end
where id between 1 and 89;

alter table public.quiz_attempts
  add column if not exists difficulty text not null default 'medium',
  add column if not exists is_daily_challenge boolean not null default false,
  add column if not exists challenge_date date;
alter table public.quiz_attempts
  add constraint quiz_attempts_difficulty_check check (difficulty in ('easy', 'medium', 'hard')),
  add constraint quiz_attempts_daily_date_check
    check ((is_daily_challenge = false) or challenge_date is not null);

create unique index if not exists quiz_attempts_one_daily_challenge_per_user
  on public.quiz_attempts (user_id, challenge_date)
  where is_daily_challenge = true and challenge_date is not null;

alter table public.profiles
  add column if not exists current_streak integer not null default 0,
  add column if not exists best_streak integer not null default 0,
  add column if not exists last_daily_challenge_date date;

create or replace function public.update_daily_challenge_streak()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  next_streak integer;
begin
  if new.is_daily_challenge then
    if new.challenge_date is distinct from (now() at time zone 'utc')::date then
      raise exception 'Daily challenge date must be today (UTC).';
    end if;

    select case
      when p.last_daily_challenge_date = new.challenge_date - 1 then p.current_streak + 1
      else 1
    end
    into next_streak
    from public.profiles p
    where p.id = new.user_id;

    next_streak := coalesce(next_streak, 1);

    insert into public.profiles (id, display_name, current_streak, best_streak, last_daily_challenge_date)
    values (
      new.user_id,
      coalesce((select p.display_name from public.profiles p where p.id = new.user_id), 'Brain Battler'),
      next_streak,
      next_streak,
      new.challenge_date
    )
    on conflict (id) do update
      set current_streak = next_streak,
          best_streak = greatest(public.profiles.best_streak, next_streak),
          last_daily_challenge_date = new.challenge_date;
  end if;
  return new;
end;
$$;

revoke all on function public.update_daily_challenge_streak() from public, anon, authenticated;
drop trigger if exists quiz_attempts_update_daily_streak on public.quiz_attempts;
create trigger quiz_attempts_update_daily_streak
after insert on public.quiz_attempts
for each row execute function public.update_daily_challenge_streak();

grant select on public.profiles to anon, authenticated;
grant select on public.leaderboard to anon, authenticated;
