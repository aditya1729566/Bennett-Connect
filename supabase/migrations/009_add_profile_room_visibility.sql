alter table public.profiles
  add column if not exists show_room_publicly boolean not null default false;
