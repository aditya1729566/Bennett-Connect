# Bennett Connect

Find the people on campus you should know.

Bennett Connect is a mobile-first campus networking MVP for Bennett University students. It helps students create profiles, select interests and goals, discover relevant people, send connection requests, post "I need someone for..." requests, and chat with accepted connections.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Auth and Postgres
- Vercel hosting

## Local Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Add your Supabase keys to `.env.local` before using auth or live data.

## Checks

```bash
npm run lint
npm run build
```
