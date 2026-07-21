# ReExplain

ReExplain is an AI-powered teach-back learning app built around a simple question: what do you actually understand after studying something? Instead of summarising a PDF or presenting a fixed quiz, it asks the learner to explain concepts in their own words. The AI takes the role of a curious learner, reflecting what it understood, pointing out what remains unclear, and asking the learner to take the explanation further.

Each conversation becomes a saved learning session with evidence from the learner's own explanations, focused practice activities, and a mastery map that grows across documents. AI does not replace the act of learning here; it helps make the learner's understanding visible.

> **Judge highlight:** GPT-5.6 is part of the product itself, while Codex was part of how I built it. I used Codex throughout the project to move faster on implementation, debugging, and tests, but kept the learning model, product direction, architecture, and final design decisions in my hands. The full story is in [How I worked with GPT-5.6 and Codex](#how-i-worked-with-gpt-56-and-codex).

## What the web app does

- Lets an authenticated learner upload a PDF and start a learning session.
- Sends the PDF through the private API for safe extraction and learning-material checks.
- Shows a two-panel session workspace:
  - a conversation where the learner teaches the AI;
  - a learning mirror with evidence, gaps, and an understanding estimate.
- Supports typed and recorded responses. A recording is limited to two minutes per turn and is transcribed before the learner sends it.
- Saves incomplete sessions without losing progress. Saving also refreshes practice concepts and the mastery graph from the discussion so far.
- Creates concise, non-repeating practice activities from the discussed concepts.
- Shows a live, owner-scoped dashboard with saved sessions, practice, and a connection-aware mastery map.

## Product flow

```mermaid
flowchart LR
  A[Upload PDF] --> B[Next.js validates the request]
  B --> C[FastAPI extracts and checks the PDF]
  C --> D[Convex stores document and session data]
  D --> E[Learner teaches the AI]
  E --> F[GPT-5.6 returns a structured learning turn]
  F --> G[Evidence, concepts, and gaps are saved]
  G --> H[Save or complete session]
  H --> I[Practice concepts and mastery map refresh]
```

## Main technical decisions

| Decision | Why it matters |
| --- | --- |
| Teach-back rather than a quiz-first flow | It asks learners to retrieve and connect ideas, so the app can assess the explanation rather than only a selected answer. |
| Next.js routes as the browser boundary | Secrets, user checks, and calls to internal services stay on the server. The browser never calls the AI service directly. |
| Better Auth + PostgreSQL for identity | Authentication and user sessions have a familiar relational home. |
| Convex for learning state | Documents, turns, evidence, concepts, practice, and mastery updates benefit from reactive queries and transactions. |
| FastAPI for PDF and AI work | File validation, extraction, model calls, and typed request validation are isolated from the UI. |
| Structured AI output | The UI receives typed concepts, evidence, gaps, and summaries instead of parsing free-form text. |
| Connection-aware mastery layout | The map uses stored concept relationships to group related nodes when the learner chooses auto-align. |

## Architecture

```text
Browser
  └─ Next.js / React UI
       ├─ Better Auth + PostgreSQL: accounts and login sessions
       ├─ Convex: documents, sessions, turns, concepts, evidence, mastery
       └─ FastAPI: PDF extraction, transcription, GPT-5.6 learning turns, embeddings
            └─ OpenAI APIs
```

The dashboard starts with a server-rendered snapshot, then switches to owner-scoped Convex subscriptions after authentication connects. This keeps the first render useful while allowing practice and mastery changes to appear without a page refresh.

## How I worked with GPT-5.6 and Codex

I used GPT-5.6 and Codex for two very different jobs. GPT-5.6 runs inside ReExplain and participates in the learner's experience. Codex was my engineering collaborator while I built that experience. Keeping those roles separate was important to me: one is a runtime product capability, while the other helped me turn the idea into a reliable application.

### How GPT-5.6 is used

The learning API uses the configured GPT-5.6 question model (the development default is `gpt-5.6-luna`) for structured learning turns. I deliberately made the model a curious learner rather than a tutor or quizmaster. That choice is the core of ReExplain: the user has to retrieve an idea, put it into words, and respond to a real gap in their explanation instead of passively reading another summary.

For every learner explanation, GPT-5.6 returns:

- a short, natural reply from the AI learner;
- the active concept and a small set of distinct concepts;
- evidence of support, contradiction, or uncertainty;
- open questions that should guide a later turn;
- an understanding score and resumable summary.

I iterated on the prompt to keep the conversation natural and to stop the model from turning the experience into an exam. It asks one focused follow-up, gives only a small corrective cue when needed, and separates its conversational reply from its assessment. The prompt also requires general subject-matter concepts rather than PDF labels such as chapter, exercise, figure, or page names. This keeps practice focused on what the learner was trying to explain, not on the document's formatting.

Embeddings use `text-embedding-3-small`. They make it possible to merge related concepts across sessions and draw similarity-based mastery edges.

### How Codex and I collaborated

I worked with Codex throughout the build, not as a one-shot code generator. My usual loop was to describe a concrete behavior, have Codex trace the relevant Next.js, Convex, or FastAPI path, review the proposed change, and then use focused tests or the running application to decide what needed another pass. That made it especially useful on changes that crossed repository or framework boundaries.

Codex accelerated several parts of the project:

- It traced end-to-end flows across the React UI, authenticated Next.js routes, Convex functions, and FastAPI service. This saved a lot of time when a visible issue was actually controlled somewhere else, such as practice generation on save or a stale Convex deployment.
- It implemented repetitive but important engineering work: typed contracts, owner-scoped queries, loading and error states, test fixtures, and focused Jest coverage.
- It helped turn the mastery map from a static graph into a cumulative learning view. We iterated through cross-document cosine links, collision-free auto-layout, selected-node provenance, hover highlighting, and responsive behavior.
- It helped verify changes continuously with TypeScript, ESLint, Jest, production builds, Convex smoke queries, and runtime diagnostics. That shortened the feedback loop without lowering the bar for correctness.
- It was useful during prompt iteration because it could compare the prompt, Pydantic contract, persisted Convex data, and final UI together instead of treating them as separate features.

The collaboration was not "ask for an app and accept the first result." For example, early mastery-map layouts technically placed every node but still produced overlap and wasted space. I decided that every node had to remain readable, that cross-document relationships should be visible, and that selected and hovered states needed different visual signals. Codex helped replace the layout algorithm, add regression tests, and refine the interactions, but the acceptance criteria came from using the product and deciding what the experience should communicate.

The same was true for practice. The first implementation could generate activities from saved concepts, but it did not guarantee that the activities addressed the learner's latest weakness. I made weakness-first practice a product requirement; Codex traced the save-and-leave path and implemented deterministic ranking from the latest assessment so the flashcard and quiz now begin with unresolved or low-scoring concepts.

### Decisions I kept human

I made the decisions that define the product:

- The AI should be the learner, not the authority. ReExplain should create productive pressure to explain, not another stream of generated notes.
- A partial session is still valuable. Saving and leaving should preserve the conversation and update practice and mastery rather than treating an unfinished session as discarded work.
- Practice should come from demonstrated weakness in the latest session, not generic questions about the PDF.
- Mastery should accumulate across documents. Similar concepts can merge semantically, while related concepts remain connected so the learner can see a larger mental map forming.
- AI calls and file processing belong behind authenticated server boundaries, with typed validation before model output reaches the UI.
- The interface should expose evidence, uncertainty, and provenance. A score alone is not enough to help someone understand why the system thinks they know something.

Codex made it possible to explore and validate these decisions much faster, but I treated its output as a draft that had to survive the codebase, tests, and the product experience. GPT-5.6 supplies the adaptive reasoning during a learning session; Codex accelerated the engineering process around it; the final result came from repeatedly testing both against the original idea: help someone discover what they can actually explain.

## Technology

- Next.js 16, React 19, and TypeScript
- Tailwind CSS and shadcn/ui primitives
- Better Auth with Google OAuth and PostgreSQL
- Convex for reactive learning data and mastery relationships
- `@xyflow/react` for the mastery map
- Jest and React Testing Library
- FastAPI service in [backend](https://github.com/reexplain/backend)

## Prerequisites

- Node.js 20 or newer
- PostgreSQL
- A Convex project
- Google OAuth client credentials
- The ReExplain FastAPI service running locally or deployed

## Local setup

Install the web dependencies and create a local environment file:

```bash
npm install
cp .env.example .env.local
```

Fill in `.env.local`:

| Variable | Purpose |
| --- | --- |
| `BETTER_AUTH_SECRET` | Secret used to sign Better Auth tokens. Generate with `openssl rand -base64 32`. |
| `BETTER_AUTH_URL` | Web app origin, normally `http://localhost:3000`. |
| `BETTER_AUTH_TRUSTED_ORIGINS` | Comma-separated browser origins allowed by Better Auth. |
| `POSTGRES_*` | PostgreSQL connection settings for Better Auth. |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth credentials. |
| `NEXT_PUBLIC_CONVEX_URL` | Public Convex deployment URL used by the client. |
| `CONVEX_DEPLOY_KEY` | Server-only Convex deployment key. Never expose it in the browser. |
| `REEXPLAIN_API_URL` | FastAPI base URL, normally `http://127.0.0.1:8000`. |
| `REEXPLAIN_API_SERVICE_KEY` | Shared secret used by Next.js when it calls the backend. |
| `REEXPLAIN_QUESTION_MODEL` | Optional learning-turn model override. |
| `REEXPLAIN_EMBEDDING_MODEL` | Optional embedding-model override. |

For local Google OAuth, add this redirect URI in Google Cloud:

```text
http://localhost:3000/api/auth/callback/google
```

Run the Better Auth migration once:

```bash
npm run auth:migrate
```

## Convex authentication setup

Convex uses the same application origin as the Better Auth token issuer and audience.

```bash
npx convex env set SITE_URL http://localhost:3000
```

Hosted Convex cannot fetch a JWKS document from localhost. Start the app, then copy Better Auth's public signing key into Convex:

```bash
npm run dev
```

```bash
npm run auth:sync-convex-jwks
```

Run the sync command again when the signing key changes. For production, use the public web origin and target the production deployment:

```bash
BETTER_AUTH_URL=https://example.com npm run auth:sync-convex-jwks -- --prod
```

## Run locally

Use three terminals from the repository:

```bash
# backend/
uv run uvicorn reexplain_api.main:app --app-dir src --reload
```

```bash
# web/
npx convex dev
```

```bash
# web/
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Important application areas

```text
app/          Pages and authenticated API routes
components/   Shared, session, and dashboard UI
constants/    Shared product limits and metadata
convex/       Schema, owner-scoped queries, and mutations
lib/          Auth, Convex, FastAPI, and browser helpers
types/        Feature-oriented TypeScript contracts
utils/        Small reusable utilities grouped by feature
scripts/      Operational helpers, including Convex JWKS sync
```

## Security and data boundaries

- The browser talks to Next.js and Convex only after authentication.
- Next.js checks the Better Auth session before internal mutations and backend calls.
- The FastAPI service is protected with `X-ReExplain-Service-Key`; the service key must match in both apps.
- PDF, audio, model input, and model output all have size or schema limits.
- Convex queries and mutations check ownership so learners can only read or change their own data.
- Keep `.env.local`, deployment keys, and OAuth secrets out of version control.

## Quality checks

```bash
npm test -- --runInBand
npm run lint
npx tsc --noEmit
npm run build
```

Run the backend checks from [backend](https://github.com/reexplain/backend) as well:

```bash
uv run ruff check src tests
uv run pytest
```

## Deployment notes

Deploy the web app with its environment variables configured, deploy Convex separately, and deploy the backend from [backend](https://github.com/reexplain/backend) (the backend README includes Cloud Run instructions). Use the same public web origin for Better Auth trusted origins, the Convex `SITE_URL`, and the backend allowed origins.

Built for [OpenAI Build Week hackathon](https://openai.devpost.com/)