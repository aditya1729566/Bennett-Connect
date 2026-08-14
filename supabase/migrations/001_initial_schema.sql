create extension if not exists "pgcrypto";

create type public.connection_status as enum ('pending', 'accepted', 'rejected', 'blocked');
create type public.request_status as enum ('active', 'fulfilled', 'expired', 'deleted');
create type public.request_response_status as enum ('interested', 'accepted', 'rejected');
create type public.skill_level as enum ('beginner', 'intermediate', 'advanced');
create type public.report_reason as enum ('spam', 'harassment', 'impersonation', 'inappropriate', 'scam', 'other');

create table public.universities (
  id bigint generated always as identity primary key,
  name text not null,
  slug text not null unique,
  email_domain text not null,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9][a-z0-9-]{2,30}$'),
  full_name text not null check (char_length(full_name) between 2 and 80),
  avatar_url text,
  university_id bigint references public.universities(id),
  course text,
  graduation_year integer,
  year_of_study text,
  gender text check (gender in ('male', 'female', 'non_binary', 'prefer_not_to_say')),
  residence_type text not null default 'hostel' check (residence_type in ('hostel', 'day_scholar')),
  hostel text check (residence_type <> 'hostel' or hostel is null or char_length(hostel) <= 3),
  room_no text check (char_length(coalesce(room_no, '')) <= 20),
  bio text check (char_length(coalesce(bio, '')) <= 280),
  github_url text,
  linkedin_url text,
  codeforces_handle text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.interests (
  id bigint generated always as identity primary key,
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table public.user_interests (
  user_id uuid not null references public.profiles(id) on delete cascade,
  interest_id bigint not null references public.interests(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, interest_id)
);

create table public.skills (
  id bigint generated always as identity primary key,
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table public.user_skills (
  user_id uuid not null references public.profiles(id) on delete cascade,
  skill_id bigint not null references public.skills(id) on delete cascade,
  level public.skill_level,
  created_at timestamptz not null default now(),
  primary key (user_id, skill_id)
);

create table public.goals (
  id bigint generated always as identity primary key,
  title text not null unique,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table public.user_goals (
  user_id uuid not null references public.profiles(id) on delete cascade,
  goal_id bigint not null references public.goals(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, goal_id)
);

create table public.connection_requests (
  id bigint generated always as identity primary key,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  status public.connection_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (sender_id <> receiver_id)
);

create unique index connection_requests_pair_active_idx
  on public.connection_requests (least(sender_id, receiver_id), greatest(sender_id, receiver_id))
  where status in ('pending', 'accepted', 'blocked');

create table public.requests (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 4 and 90),
  description text not null check (char_length(description) between 10 and 1000),
  category text not null,
  status public.request_status not null default 'active',
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.request_interests (
  request_id bigint not null references public.requests(id) on delete cascade,
  interest_id bigint not null references public.interests(id) on delete cascade,
  primary key (request_id, interest_id)
);

create table public.request_responses (
  id bigint generated always as identity primary key,
  request_id bigint not null references public.requests(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status public.request_response_status not null default 'interested',
  created_at timestamptz not null default now(),
  unique (request_id, user_id)
);

create table public.chat_messages (
  id bigint generated always as identity primary key,
  connection_request_id bigint not null references public.connection_requests(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);

create index chat_messages_connection_created_at_idx
  on public.chat_messages (connection_request_id, created_at);

create table public.profile_skips (
  user_id uuid not null references public.profiles(id) on delete cascade,
  skipped_user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, skipped_user_id),
  check (user_id <> skipped_user_id)
);

create table public.reports (
  id bigint generated always as identity primary key,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reported_user_id uuid references public.profiles(id) on delete cascade,
  request_id bigint references public.requests(id) on delete cascade,
  reason public.report_reason not null default 'other',
  details text,
  created_at timestamptz not null default now(),
  check (reported_user_id is not null or request_id is not null)
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at before update on public.profiles
  for each row execute function public.touch_updated_at();

create trigger connection_requests_touch_updated_at before update on public.connection_requests
  for each row execute function public.touch_updated_at();

create trigger requests_touch_updated_at before update on public.requests
  for each row execute function public.touch_updated_at();

insert into public.universities (name, slug, email_domain)
values ('Bennett University', 'bennett', 'configured-domain')
on conflict (slug) do nothing;

insert into public.interests (name, slug) values
  ('Competitive Programming', 'competitive-programming'),
  ('Startups', 'startups'),
  ('Web Development', 'web-development'),
  ('AI / ML', 'ai-ml'),
  ('Quant Finance', 'quant-finance'),
  ('Trading', 'trading'),
  ('Chess', 'chess'),
  ('Football', 'football'),
  ('Cricket', 'cricket'),
  ('Basketball', 'basketball'),
  ('Gym', 'gym'),
  ('Running', 'running'),
  ('Music', 'music'),
  ('Guitar', 'guitar'),
  ('Filmmaking', 'filmmaking'),
  ('Photography', 'photography'),
  ('Design', 'design'),
  ('Gaming', 'gaming'),
  ('Reading', 'reading'),
  ('Philosophy', 'philosophy'),
  ('Mathematics', 'mathematics'),
  ('Economics', 'economics'),
  ('Robotics', 'robotics'),
  ('Cybersecurity', 'cybersecurity')
on conflict (slug) do nothing;

insert into public.goals (title, slug) values
  ('Reach Codeforces Specialist', 'reach-codeforces-specialist'),
  ('Build a startup', 'build-a-startup'),
  ('Find a hackathon team', 'find-a-hackathon-team'),
  ('Prepare for placements', 'prepare-for-placements'),
  ('Learn machine learning', 'learn-machine-learning'),
  ('Train for a marathon', 'train-for-a-marathon'),
  ('Improve at chess', 'improve-at-chess'),
  ('Start a band', 'start-a-band'),
  ('Build side projects', 'build-side-projects'),
  ('Find gym partners', 'find-gym-partners'),
  ('Meet people interested in finance', 'meet-people-interested-in-finance')
on conflict (slug) do nothing;

alter table public.universities enable row level security;
alter table public.profiles enable row level security;
alter table public.interests enable row level security;
alter table public.user_interests enable row level security;
alter table public.skills enable row level security;
alter table public.user_skills enable row level security;
alter table public.goals enable row level security;
alter table public.user_goals enable row level security;
alter table public.connection_requests enable row level security;
alter table public.requests enable row level security;
alter table public.request_interests enable row level security;
alter table public.request_responses enable row level security;
alter table public.chat_messages enable row level security;
alter table public.profile_skips enable row level security;
alter table public.reports enable row level security;

create policy "Authenticated users can read universities" on public.universities
  for select to authenticated using (true);

create policy "Authenticated users can read profiles" on public.profiles
  for select to authenticated using (true);

create policy "Users can insert their profile" on public.profiles
  for insert to authenticated with check (id = auth.uid());

create policy "Users can update their profile" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "Users can delete their profile" on public.profiles
  for delete to authenticated using (id = auth.uid());

create policy "Authenticated users can read interests" on public.interests
  for select to authenticated using (true);

create policy "Authenticated users can read goals" on public.goals
  for select to authenticated using (true);

create policy "Authenticated users can read skills" on public.skills
  for select to authenticated using (true);

create policy "Authenticated users can create goals" on public.goals
  for insert to authenticated with check (true);

create policy "Users manage own interests" on public.user_interests
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Users can read user interests" on public.user_interests
  for select to authenticated using (true);

create policy "Users manage own goals" on public.user_goals
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Users can read user goals" on public.user_goals
  for select to authenticated using (true);

create policy "Users manage own skills" on public.user_skills
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Users can read user skills" on public.user_skills
  for select to authenticated using (true);

create policy "Users can read their connection rows" on public.connection_requests
  for select to authenticated using (sender_id = auth.uid() or receiver_id = auth.uid());

create policy "Users send connection requests as themselves" on public.connection_requests
  for insert to authenticated with check (sender_id = auth.uid());

create policy "Receivers can update connection status" on public.connection_requests
  for update to authenticated using (receiver_id = auth.uid()) with check (receiver_id = auth.uid());

create policy "Participants can block connection rows" on public.connection_requests
  for update to authenticated
  using (sender_id = auth.uid() or receiver_id = auth.uid())
  with check ((sender_id = auth.uid() or receiver_id = auth.uid()) and status = 'blocked');

create policy "Authenticated users can read active requests" on public.requests
  for select to authenticated using (status = 'active' or user_id = auth.uid());

create policy "Users create own requests" on public.requests
  for insert to authenticated with check (user_id = auth.uid());

create policy "Users update own requests" on public.requests
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Users delete own requests" on public.requests
  for delete to authenticated using (user_id = auth.uid());

create policy "Authenticated users can read request interests" on public.request_interests
  for select to authenticated using (true);

create policy "Authors manage request interests" on public.request_interests
  for all to authenticated
  using (exists (select 1 from public.requests r where r.id = request_id and r.user_id = auth.uid()))
  with check (exists (select 1 from public.requests r where r.id = request_id and r.user_id = auth.uid()));

create policy "Users can read own request responses or responses to own posts" on public.request_responses
  for select to authenticated
  using (
    user_id = auth.uid()
    or exists (select 1 from public.requests r where r.id = request_id and r.user_id = auth.uid())
  );

create policy "Users respond as themselves" on public.request_responses
  for insert to authenticated with check (user_id = auth.uid());

create policy "Users update own responses" on public.request_responses
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Accepted connection participants can read chat messages" on public.chat_messages
  for select to authenticated
  using (
    exists (
      select 1
      from public.connection_requests c
      where c.id = connection_request_id
        and c.status = 'accepted'
        and (c.sender_id = auth.uid() or c.receiver_id = auth.uid())
    )
  );

create policy "Accepted connection participants can send chat messages" on public.chat_messages
  for insert to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1
      from public.connection_requests c
      where c.id = connection_request_id
        and c.status = 'accepted'
        and (c.sender_id = auth.uid() or c.receiver_id = auth.uid())
    )
  );

create policy "Users manage own skips" on public.profile_skips
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Users can create reports as themselves" on public.reports
  for insert to authenticated with check (reporter_id = auth.uid());

create policy "Users can read their own reports" on public.reports
  for select to authenticated using (reporter_id = auth.uid());

insert into storage.buckets (id, name, public)
values ('profile-photos', 'profile-photos', true)
on conflict (id) do nothing;
