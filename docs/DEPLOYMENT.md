# Deployment

## Two useful deployment modes

1. **Full application**: Vercel frontend + Render Express API + Supabase PostgreSQL, or a single Render service serving both the API and frontend.
2. **Guest demo**: static frontend with `VITE_GUEST_ONLY=true`. All five-day gameplay, NASA terrain, lessons, achievements, results, and device saves work. Account controls are replaced with a clear guest-history screen. This mode does not imply that a cloud database is deployed.

No Vercel, Render, or Supabase account credentials were supplied. Their configuration is prepared; actual cloud provisioning is a separate step. Do not place credentials in this repository.

## PostgreSQL

Create a database using Supabase or another PostgreSQL provider. Obtain a connection string suitable for Prisma migrations (direct connection or session pooler); require SSL where the provider specifies it. Set `DATABASE_URL` in the server host. Review the provider's connection guidance rather than substituting a browser API key.

```sh
npm ci
npx prisma generate --schema prisma/schema.prisma
npx prisma migrate deploy --schema prisma/schema.prisma
```

The Express API uses a database connection, not Supabase's browser Data API. Keep its tables inaccessible to anonymous Data API clients; use a private schema/appropriate database permissions or enable restrictive RLS if exposing the public schema. Application ownership checks are enforced in the API, but are not a substitute for controlling direct database/API access.

Official setup: https://supabase.com/docs/guides/database/prisma

## Render API

The root `render.yaml` defines a Node web service with:

- Build: `npm ci && npx prisma generate --schema prisma/schema.prisma && npm run build`
- Start: `npx prisma migrate deploy --schema prisma/schema.prisma && npm start`
- Health: `/api/health` (checks database connectivity)
- Required secrets/configuration: `DATABASE_URL`, `WEB_ORIGIN`
- `NODE_ENV=production`; Node 22; cross-site cookies set to `none` in this template.

Import this repository/subdirectory as the service root. The server honors `PORT` and binds `0.0.0.0` in production. The blueprint uses a free service plan where available; review provider limits and availability. No paid service is provisioned by the project files.

Production startup applies checked-in migrations. For multi-instance deployments, run migrations as a separate release/predeploy operation rather than having every instance migrate.

Official blueprint reference: https://render.com/docs/blueprint-spec

## Vercel frontend

Import the `astroquest/` project directory. `vercel.json` supplies the build command, `dist/client` output, and SPA history fallback. Set:

- `VITE_API_URL=https://YOUR-RENDER-SERVICE` before building.
- Keep `VITE_GUEST_ONLY` unset/false for full accounts.
- In Render, set `WEB_ORIGIN` to the exact Vercel/custom-domain frontend origin (no trailing slash).
- Cross-site cookies need `COOKIE_SAME_SITE=none`, Secure/HTTPS, credentialed requests, and a browser permitting cross-site cookies. Prefer sibling custom domains or a same-origin API proxy if third-party cookies are blocked.

For a single-origin deployment, leave `VITE_API_URL` empty, set `WEB_ORIGIN` to the service's own HTTPS origin, and use `COOKIE_SAME_SITE=lax`. The production Express server serves `dist/client` and SPA routes after API routing. A single-origin Render deployment avoids cross-site cookie issues entirely.

Official Vercel routing reference: https://vercel.com/docs/routing/rewrites

## Private Sites guest demo

An optional local `.openai/hosting.json` declares a Site identity and `dist/client` output. This machine-specific file is ignored by Git; configure your own Site identity when using Sites hosting from a fresh clone. The Sites build uses `VITE_GUEST_ONLY=true`; no account backend, database, or secrets are included in the deployment archive. The full source retains Express and both Prisma database schemas for your own hosting.

Static servers must return `index.html` for frontend routes such as `/mission` and `/science` while serving actual assets normally. NASA imagery and fonts are packaged with the frontend. The site's audience remains owner-private unless explicitly changed.

## Build and production smoke checks

```sh
npm run build
# Set NODE_ENV=production and DATABASE_URL before starting.
npm start
```

Verify the homepage and a deep route, `/api/health`, account registration/login/logout, ownership isolation, saved-state restoration after refresh, and an entire five-day run. Check the browser console and account cookie configuration. Never infer full backend deployment success from a static guest demo.

## Secrets, backups, and known limits

- `.env`, databases, test results, dependency directories, and build archives are Git-ignored. Only `.env.example` contains public setup defaults.
- Back up the database before schema changes; do not use destructive reset commands in production.
- Guest saves are browser-local and disappear if browser storage is cleared. There is no cross-device guest sync.
- Optional audio, 3D, email verification/recovery, and service-worker offline startup are not implemented.
- Installed dependencies are pinned by the lockfile. Review updates and run the critical tests before deployment.
