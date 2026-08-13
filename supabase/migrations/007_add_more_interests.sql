insert into public.interests (name, slug) values
  ('UI/UX Design', 'ui-ux-design'),
  ('App Development', 'app-development'),
  ('Data Science', 'data-science'),
  ('Open Source', 'open-source'),
  ('Entrepreneurship', 'entrepreneurship'),
  ('Product Management', 'product-management'),
  ('Public Speaking', 'public-speaking'),
  ('Content Creation', 'content-creation'),
  ('Video Editing', 'video-editing'),
  ('Esports', 'esports'),
  ('Debate', 'debate'),
  ('Writing', 'writing'),
  ('Psychology', 'psychology'),
  ('Stock Markets', 'stock-markets'),
  ('Crypto/Web3', 'crypto-web3'),
  ('DSA', 'dsa'),
  ('Cloud Computing', 'cloud-computing'),
  ('DevOps', 'devops'),
  ('Cybersecurity CTFs', 'cybersecurity-ctfs'),
  ('Electronics', 'electronics'),
  ('IoT', 'iot'),
  ('AR/VR', 'ar-vr'),
  ('Anime', 'anime'),
  ('Dance', 'dance'),
  ('Theatre', 'theatre'),
  ('Volunteering', 'volunteering'),
  ('Event Management', 'event-management'),
  ('Marketing', 'marketing'),
  ('UI Animation', 'ui-animation'),
  ('Backend Development', 'backend-development')
on conflict (slug) do nothing;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'interests'
      and policyname = 'Authenticated users can create interests'
  ) then
    create policy "Authenticated users can create interests" on public.interests
      for insert to authenticated with check (true);
  end if;
end $$;
