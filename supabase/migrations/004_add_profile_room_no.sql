alter table public.profiles
  add column if not exists room_no text check (char_length(coalesce(room_no, '')) <= 20);
