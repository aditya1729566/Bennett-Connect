alter table public.profiles
  add column if not exists residence_type text not null default 'hostel' check (residence_type in ('hostel', 'day_scholar'));

update public.profiles
set residence_type = 'hostel'
where residence_type is null;
