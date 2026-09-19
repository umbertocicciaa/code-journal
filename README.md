# Code Journal

Self-hosted LeetCode journal with shared problem library, spaced repetition (Leitner), kanban reviews, markdown notes, and public stats.

## Stack

- Next.js 16 (App Router)
- PostgreSQL 17 + Drizzle ORM
- Better Auth (email + password)
- Tailwind CSS v4 (liquid glass UI)
- Vitest + Playwright

## Quick start (local)

1. Copy environment variables:

```bash
cp .env.example .env
```

Generate a 32-byte encryption key:

```bash
openssl rand -base64 32
```

2. Start Postgres (exposed on host port **5434** to avoid conflicts with a local Postgres on 5432):

```bash
docker compose up db -d
npm run db:migrate
```

3. Install dependencies and migrate:

```bash
npm install
npm run db:migrate
```

4. Run the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Docker Compose (local / Portainer / Komodo)

The root `docker-compose.yml` builds and runs `app` + `db`.

```bash
cp .env.example .env
# set BETTER_AUTH_SECRET and APP_ENCRYPTION_KEY
docker compose up --build
```

### Portainer

1. Stacks → Add stack
2. Paste `docker-compose.yml` (and set env vars in the UI)
3. Deploy

### Komodo

1. Create a stack from this repository
2. Provide env vars: `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_BETTER_AUTH_URL`, `APP_ENCRYPTION_KEY`
3. Deploy; migrations run automatically on container start

## Features

- **Shared library**: LeetCode problems are stored once; each user keeps their own journal entries
- **Add by URL**: Paste a LeetCode link; falls back to manual entry if fetch fails
- **Markdown**: Problem descriptions, notes, and solutions support markdown
- **Leitner review**: `/review` queue with active recall
- **Kanban**: Drag cards between Leitner boxes at `/kanban`
- **Stats**: Heatmap, streaks, charts at `/stats`
- **Public profiles**: `/u/[username]` when `statsPublic` is enabled
- **LeetCode Premium cookies**: Optional encrypted credentials in Settings for company tags

## Testing

Unit tests:

```bash
npm run test
```

Integration tests (requires Postgres on port 5433):

```bash
docker compose -f docker-compose.test.yml up -d
npm run db:migrate
npm run test:integration
```

E2E smoke tests:

```bash
npm run build
npm run start &
npm run test:e2e
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run db:generate` | Generate SQL migrations |
| `npm run db:migrate` | Apply migrations |
| `npm run test` | Unit tests |
| `npm run test:integration` | Integration tests |
| `npm run test:e2e` | Playwright smoke tests |
