do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_hostel_code_length_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_hostel_code_length_check
      check (residence_type <> 'hostel' or hostel is null or char_length(hostel) <= 2)
      not valid;
  end if;
end $$;
