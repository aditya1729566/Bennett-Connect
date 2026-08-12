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

## Outlook Login

Enable the Supabase Azure (Microsoft) auth provider before using Outlook login:

- Azure redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`
- App redirect allow list in Supabase:
  - `https://bennettconnect.vercel.app/auth/callback`
  - `https://bennettconnectcom.vercel.app/auth/callback`
  - `http://localhost:3000/auth/callback`
- The app requests the `email` scope and rejects OAuth users outside `NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS`.

## Checks

```bash
npm run lint
npm run build
```
