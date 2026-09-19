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

2. Start Postgres (dev overlay publishes **5434** on the host for local tools; inside Compose, `app` reaches `db` on the internal network at port 5432):

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up db -d
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

The root `docker-compose.yml` builds and runs `app` + `db` on a private `internal` network. Services talk to each other by name (`db:5432`); Postgres is not published on the host unless you add the dev overlay.

### Local development

```bash
cp .env.example .env
# set BETTER_AUTH_SECRET and APP_ENCRYPTION_KEY
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

This exposes the app on port 3000 and Postgres on 5434.

### Reverse proxy (production)

Attach `app` to an existing external network (Traefik, nginx-proxy, etc.):

```bash
# create the network once, e.g. docker network create proxy
# set PROXY_NETWORK in .env
docker compose -f docker-compose.yml -f docker-compose.proxy.yml up -d --build
```

`app` and `db` stay on `internal`. Only `app` also joins `${PROXY_NETWORK}` for the reverse proxy; neither service binds host ports in this mode.

Set auth env vars to your public HTTPS URL (required for cookies and server-side auth):

```bash
BETTER_AUTH_URL=https://your-domain.example
BETTER_AUTH_TRUSTED_ORIGINS=https://your-domain.example
```

The browser auth client uses the same origin automatically, so you do not need to rebuild the image when the domain changes.

### Portainer

1. Stacks → Add stack → **Git repository** (not Web editor only)
2. Point at this repo and set the compose path to `docker-compose.yml`
3. Enable **Build** for the stack (the `app` service builds from the Dockerfile, it is not pulled from a registry)
4. Set env vars in the UI and deploy

If you see `pull access denied for code-journal`, the stack tried to pull instead of build. Redeploy with build enabled, or run `docker compose build app` on the host first.

### Komodo

1. Create a stack from this repository (with build context)
2. Provide env vars: `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` (public HTTPS URL), `APP_ENCRYPTION_KEY`
3. Deploy with build; migrations run automatically on container start

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
