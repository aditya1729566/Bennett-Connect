alter table public.profiles
  drop constraint if exists profiles_hostel_code_length_check;

alter table public.profiles
  add constraint profiles_hostel_code_length_check
  check (residence_type <> 'hostel' or hostel is null or char_length(hostel) <= 3)
  not valid;
