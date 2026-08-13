alter table public.profiles
  add column if not exists gender text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_gender_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_gender_check
      check (gender in ('male', 'female', 'non_binary', 'prefer_not_to_say'));
  end if;
end $$;
