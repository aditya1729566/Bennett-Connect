create table if not exists public.chat_messages (
  id bigint generated always as identity primary key,
  connection_request_id bigint not null references public.connection_requests(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_connection_created_at_idx
  on public.chat_messages (connection_request_id, created_at);

alter table public.chat_messages enable row level security;

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
