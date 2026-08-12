# AGENTS.md

## Project Name

**Find My People**  
Working title. This can be renamed later.

## Product Vision

Build a private campus networking platform that helps students discover and connect with other students who share similar interests, goals, skills, hobbies, or current needs.

The core problem:

> A college can have 10,000+ students, and the exact person you want to meet may already be on campus, but you have no practical way to discover them.

The product should make it easy to find:

- startup cofounders
- hackathon teammates
- competitive programming partners
- gym partners
- study partners
- football/cricket/basketball players
- musicians
- designers
- developers
- photographers
- chess players
- finance/quant enthusiasts
- people attending the same event
- people traveling to the same place
- people pursuing the same goal
- students with niche interests

This is **not primarily a dating app**.

The product should feel like:

> "There are 10,000 students on campus. Find the 10 you should know."

---

# Primary User

Initially, the product is built for students at a single university.

The first campus is Bennett University.

However, do not hard-code the architecture so tightly to Bennett that expansion to other colleges becomes difficult.

For the MVP, Bennett-specific branding or email verification is acceptable.

---

# Core Product Principles

1. **Discovery over browsing**
   - Users should not need to search through hundreds of profiles.
   - The app should recommend relevant people.

2. **Utility over social media**
   - Do not build another Instagram.
   - No endless feed as the main product.
   - The goal is helping users meet useful or interesting people.

3. **Low friction**
   - Signup should be fast.
   - Creating a useful profile should take less than 2 minutes.

4. **Campus trust**
   - Users should preferably verify using a university email.
   - Profiles should represent real students.

5. **Mobile-first**
   - Most students will use this on their phones.
   - Every page must work well on mobile.

6. **Simple MVP**
   - Avoid unnecessary architecture.
   - Avoid premature optimization.
   - Do not build features that are not needed for the first 100-500 users.

---

# MVP

The MVP should contain the following features.

## 1. Authentication

Users should be able to:

- sign up
- log in
- log out
- reset password

Preferred authentication method:

- university email
- email + password or magic link

Use Supabase Auth.

For the first version, optionally restrict registrations to approved university email domains.

Example:

```text
@bennett.edu.in
```

Do not assume this domain is correct without configuration.

Store allowed domains in configuration.

---

# 2. User Profile

Each student should have a profile.

Required fields:

- full name
- username
- profile photo
- university
- graduation year
- course/branch
- short bio

Optional fields:

- hostel
- year of study
- skills
- interests
- goals
- social links
- GitHub
- LinkedIn
- Codeforces
- chess profile
- portfolio

Do not force users to fill every field.

---

# 3. Interests

Users can select multiple interests.

Examples:

- Competitive Programming
- Startups
- Web Development
- AI / ML
- Quant Finance
- Trading
- Chess
- Football
- Cricket
- Basketball
- Gym
- Running
- Music
- Guitar
- Filmmaking
- Photography
- Design
- Gaming
- Reading
- Philosophy
- Mathematics
- Economics
- Robotics
- Cybersecurity

Interests must be stored separately from users.

Use a many-to-many relationship.

Do NOT store interests as one comma-separated string.

---

# 4. Goals

Users should be able to select or create goals.

Examples:

- Reach Codeforces Specialist
- Build a startup
- Find a hackathon team
- Prepare for placements
- Learn machine learning
- Train for a marathon
- Improve at chess
- Start a band
- Build side projects

Goals should help improve matching.

---

# 5. Discover People

This is the most important page.

Display recommended students as cards.

Each card can show:

- profile photo
- name
- course/year
- short bio
- top interests
- top goals
- match score
- reason for recommendation

Example:

```text
Arjun Sharma
CSE, First Year

Competitive Programming
Quant Finance
Startups

92% Match

Why:
You both like Competitive Programming and Quant Finance.
You are both looking for hackathon teammates.
```

Buttons:

- View Profile
- Connect
- Skip

Do not build a swipe-based dating interface unless explicitly requested later.

---

# 6. Matching Algorithm

The first version should be simple and understandable.

Do NOT introduce machine learning.

Calculate compatibility using weighted overlaps.

Possible scoring:

```text
shared interests       +5 each
shared goals           +8 each
same course            +2
same graduation year   +2
same hostel             +1
shared skill            +4
```

Normalize into a score between 0 and 100.

Avoid recommending:

- the current user
- users already connected
- users blocked by the current user
- users the current user has recently skipped, if possible

Store the recommendation logic in a separate module so it can be improved later.

---

# 7. "I Need Someone For..." Posts

This is a major feature.

Users can create short requests.

Examples:

```text
Need one frontend developer for a hackathon this weekend.
```

```text
Looking for Codeforces 1200-1500 rated students to practice with.
```

```text
Anyone interested in playing football at 7 PM?
```

```text
Looking for someone interested in quant finance to build projects with.
```

A request should contain:

- author
- title
- description
- category
- relevant interests
- created time
- optional expiry time
- status

Status:

- active
- fulfilled
- expired
- deleted

Other users can respond with:

- Interested
- Connect

Initially, avoid public comment threads.

---

# 8. Connections

Users can send connection requests.

Connection states:

```text
pending
accepted
rejected
blocked
```

Users should see:

- requests received
- requests sent
- accepted connections

For MVP, messaging is optional.

If messaging is implemented, keep it extremely simple.

---

# 9. Search

Allow search by:

- name
- interest
- skill
- goal
- course

Do not make search the primary discovery mechanism.

---

# Database

Use **Supabase PostgreSQL**.

Keep the schema understandable for a beginner.

Recommended tables:

---

## profiles

```text
id
username
full_name
avatar_url
university_id
course
graduation_year
year_of_study
hostel
bio
github_url
linkedin_url
codeforces_handle
created_at
updated_at
```

`id` should reference the Supabase Auth user ID.

---

## universities

```text
id
name
slug
email_domain
created_at
```

Example:

```text
1
Bennett University
bennett
configured-domain
```

---

## interests

```text
id
name
slug
created_at
```

---

## user_interests

```text
user_id
interest_id
created_at
```

Composite unique constraint:

```text
user_id + interest_id
```

---

## skills

```text
id
name
slug
created_at
```

---

## user_skills

```text
user_id
skill_id
level
created_at
```

Possible levels:

```text
beginner
intermediate
advanced
```

Level is optional.

---

## goals

```text
id
title
slug
created_at
```

---

## user_goals

```text
user_id
goal_id
created_at
```

---

## connection_requests

```text
id
sender_id
receiver_id
status
created_at
updated_at
```

Status:

```text
pending
accepted
rejected
blocked
```

Prevent duplicate active connection requests.

---

## requests

Represents "I need someone for..." posts.

```text
id
user_id
title
description
category
status
expires_at
created_at
updated_at
```

---

## request_interests

```text
request_id
interest_id
```

---

## request_responses

```text
id
request_id
user_id
status
created_at
```

Possible status:

```text
interested
accepted
rejected
```

---

## profile_skips

Optional for recommendation quality.

```text
user_id
skipped_user_id
created_at
```

---

# Database Security

Use Supabase Row Level Security.

Important rules:

Users should:

- edit only their own profile
- edit only their own posts
- send connection requests only as themselves
- respond to requests only as themselves

Users should NOT:

- modify other students' profiles
- impersonate another user
- manually accept a connection request for someone else
- access private administrative data

Never expose Supabase service role keys in frontend code.

Environment secrets must remain server-side.

---

# Technology Stack

Use:

## Frontend

- Next.js
- TypeScript
- React
- Tailwind CSS

Prefer the Next.js App Router.

---

## Backend

Use Next.js server-side functionality where appropriate.

Do not create a separate backend server unless required.

---

## Database

Supabase PostgreSQL.

---

## Authentication

Supabase Auth.

---

## File Storage

Supabase Storage.

Use it initially for:

- profile pictures

---

## Hosting

Vercel.

---

# Suggested Folder Structure

```text
app/
  page.tsx

  login/
  signup/
  onboarding/
  discover/
  profile/
  requests/
  connections/
  settings/

components/
  ProfileCard.tsx
  InterestBadge.tsx
  MatchScore.tsx
  RequestCard.tsx
  Navbar.tsx
  BottomNav.tsx

lib/
  supabase/
    client.ts
    server.ts

  matching/
    calculateMatch.ts
    getRecommendations.ts

  validation/

types/
  database.ts
  profile.ts

utils/

public/
```

Do not overcomplicate the folder structure.

---

# Main Pages

## Landing Page

Explain the product immediately.

Suggested headline:

> Find the people on campus you should know.

Suggested subheading:

> Meet students who share your interests, goals, skills, and ambitions.

CTA:

```text
Join your campus
```

---

# Onboarding

The onboarding sequence should be short.

## Screen 1

Basic info:

- name
- course
- graduation year

## Screen 2

Choose interests.

Prompt:

> What are you into?

Allow selecting approximately 3-10 interests.

## Screen 3

Choose goals.

Prompt:

> What are you trying to do right now?

Examples:

- Build a startup
- Find hackathon teammates
- Improve at Codeforces
- Find gym partners
- Meet people interested in finance

## Screen 4

Optional bio.

Prompt:

> Tell people what you're working on.

Then take the user directly to Discover.

---

# Discover UI

Mobile-first card layout.

Example:

```text
--------------------------------

[Photo]

Arjun Sharma
CSE • First Year

Building startups and grinding Codeforces.

Competitive Programming
Startups
Quant Finance

92% MATCH

You both:
• like Competitive Programming
• want to build startups
• are interested in quant finance

[Skip]        [Connect]

--------------------------------
```

Avoid clutter.

---

# Requests UI

Page title:

```text
Find Someone
```

CTA:

```text
+ I need someone for...
```

Feed examples:

```text
HACKATHON

Need frontend developer

We're building a campus navigation app for a hackathon.
Need someone comfortable with React.

Posted 18 min ago

[I'm interested]
```

---

# Future Features

Do NOT build these in the initial MVP unless explicitly requested.

Possible future features:

- direct messaging
- campus communities
- private groups
- events
- hackathon team creation
- study groups
- startup cofounder matching
- sports team matching
- AI recommendations
- reputation system
- endorsements
- mutual connections
- trending campus interests
- anonymous mode
- club pages
- campus event discovery
- premium profile filters
- other universities

---

# Monetization

Do not optimize monetization before product usage.

Possible future pricing:

```text
Free
₹49/month
₹99/semester
```

Potential premium features:

- advanced filters
- additional daily recommendations
- see who is interested in connecting
- priority "I need someone" requests
- better matching controls
- profile analytics

Never block the core network behind a paywall early.

The product needs network effects.

---

# Important Product Metric

Do NOT optimize primarily for:

- page views
- time spent
- feed scrolling

Optimize for:

> Meaningful connections created.

Useful metrics:

- weekly active users
- profiles completed
- connection requests sent
- connection requests accepted
- request posts created
- request responses
- users who return within 7 days
- successful matches

A strong north-star metric could be:

```text
meaningful connections per weekly active user
```

---

# Privacy

This product involves real students.

Treat privacy seriously.

Do not expose:

- phone numbers
- personal email addresses
- precise location
- private messages
- sensitive profile information

unless the user explicitly chooses to share them.

Avoid real-time location tracking in the MVP.

Users must be able to:

- block another user
- report profiles
- report requests
- delete their account

---

# Moderation

Add basic reporting early.

Report reasons can include:

- spam
- harassment
- impersonation
- inappropriate content
- scam
- other

Admin moderation tooling can initially be simple.

---

# Design Style

The product should feel:

- modern
- clean
- youthful
- trustworthy
- premium
- fast

Avoid making it look like:

- an ERP
- a college portal
- LinkedIn
- a dating app
- a corporate SaaS dashboard

Use:

- large profile cards
- rounded components
- generous spacing
- clear typography
- minimal visual clutter

Mobile UX is the priority.

---

# Coding Rules

Codex should follow these rules.

1. Use TypeScript.

2. Prefer simple readable code over clever abstractions.

3. Do not introduce new dependencies unless they provide clear value.

4. Do not build unnecessary microservices.

5. Avoid premature optimization.

6. Keep database access isolated in reusable functions.

7. Validate user input.

8. Handle loading states.

9. Handle empty states.

10. Handle errors gracefully.

11. Never expose server secrets.

12. Use environment variables.

13. Make components responsive.

14. Keep accessibility in mind.

15. Do not use placeholder functionality that looks finished but does nothing.

16. If a feature is incomplete, make that clear.

17. Do not implement features from the Future Features section unless requested.

18. Before making major architectural changes, prefer the simplest working solution.

---

# Environment Variables

Expected variables may include:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

The service role key must never be exposed to browser code.

---

# Development Priorities

Build in this order:

## Phase 1

1. Next.js project setup
2. Supabase setup
3. Authentication
4. Database schema
5. Profile creation
6. Interest selection
7. Goal selection

## Phase 2

8. Discover page
9. Basic matching algorithm
10. User profile pages
11. Connection requests

## Phase 3

12. "I Need Someone For..." requests
13. Responses to requests
14. Search

## Phase 4

15. Reporting/blocking
16. UI polish
17. analytics
18. performance improvements

---

# First Version Success Criteria

The MVP is successful if a student can:

1. create an account
2. create a profile
3. select their interests
4. select their goals
5. see relevant students
6. understand why someone was recommended
7. send a connection request
8. accept a connection request
9. create an "I need someone for..." request
10. respond to another student's request

Everything beyond this is secondary.

---

# Product Test

Whenever adding a new feature, ask:

> Does this make it easier for one student to discover or connect with another useful person on campus?

If the answer is no, it probably should not be in the MVP.

---

# Core Product Statement

Keep this idea central while building:

> The right person is probably already on campus. The problem is discovering them.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
