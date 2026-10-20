-- Remember questions completed by each signed-in player so quiz selection can avoid repeats.
create table if not exists public.user_question_history (
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id bigint not null references public.questions(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, question_id)
);

alter table public.user_question_history enable row level security;

drop policy if exists "Players can read their own question history" on public.user_question_history;
create policy "Players can read their own question history"
on public.user_question_history for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Players can record their own completed questions" on public.user_question_history;
create policy "Players can record their own completed questions"
on public.user_question_history for insert to authenticated
with check ((select auth.uid()) = user_id);

create index if not exists user_question_history_user_completed_idx
on public.user_question_history (user_id, completed_at desc);

grant select, insert on public.user_question_history to authenticated;
