# ReExplain Web

The Next.js app for ReExplain. Users upload a PDF, explain its ideas in their own words, and answer adaptive questions. Learning sessions are saved and can be resumed from the dashboard.

## Stack

- Next.js and React
- Better Auth with Google OAuth
- PostgreSQL for users and login sessions
- Convex for documents, embeddings, learning sessions, turns, and progress
- FastAPI for PDF extraction and OpenAI requests

Writes and AI operations go through authenticated Next.js routes. The dashboard uses a Better Auth JWT to subscribe directly to owner-scoped Convex queries for live updates.

## Setup

Requirements: Node.js, PostgreSQL, a Convex project, Google OAuth credentials, and the running `backend` service.

```bash
npm install
cp .env.example .env.local
```

Fill in `.env.local`. Important values are:

- `BETTER_AUTH_SECRET`: generate with `openssl rand -base64 32`
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- PostgreSQL connection values
- `NEXT_PUBLIC_CONVEX_URL` and server-only `CONVEX_DEPLOY_KEY`
- `REEXPLAIN_API_URL`, normally `http://127.0.0.1:8000`
- `REEXPLAIN_API_SERVICE_KEY`: must match `REEXPLAIN_SERVICE_KEY` in the backend

For local Google OAuth, add this redirect URI in Google Cloud:

```text
http://localhost:3000/api/auth/callback/google
```

Prepare Better Auth once:

```bash
npm run auth:migrate
```

Configure Convex with the same origin used by `BETTER_AUTH_URL` so it can verify dashboard subscription tokens:

```bash
npx convex env set SITE_URL http://localhost:3000
```

Set the production deployment's `SITE_URL` to the production application origin before deploying.

During development, run Convex and Next.js in separate terminals:

```bash
npx convex dev
```

```bash
npm run dev
```

The app is available at `http://localhost:3000`.

## Structure

```text
app/          Pages and authenticated API routes
components/   Shared UI and dashboard components
convex/       Schema, queries, and mutations
lib/          Auth, Convex, FastAPI, and browser helpers
constants/    Shared limits and application values
types/        Shared TypeScript types
```

## Checks

```bash
npm test -- --runInBand
npm run lint
npx tsc --noEmit
npm run build
```
