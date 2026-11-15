# Database schema

Production: `prisma/schema.prisma`, PostgreSQL. Local fallback: `prisma/sqlite/schema.prisma`, SQLite. Both have checked-in initial migrations under their own `migrations/` directories.

| Model | Purpose and constraints |
| --- | --- |
| User | CUID primary key; unique normalized email; salted password hash; creation timestamp |
| Profile | One-to-one user primary/foreign key; display name |
| AuthSession | Hashed token primary key; user foreign key; expiry; user/expiry indexes |
| MissionSession | CUID; owner foreign key; serialized engine state; revision; created/updated timestamps; owner/update index |
| MissionDecision | CUID; mission foreign key; event/choice/day; timestamp; unique mission + event |
| MissionResult | One-to-one mission primary/foreign key; server score, outcome, serialized dimension summary, timestamp |
| Achievement | Stable achievement-name primary key |
| UserAchievement | Composite user + achievement primary key; foreign keys; earned timestamp |

Relations use cascading deletion. Mission state and result details use serialized JSON strings for portable SQLite/PostgreSQL behavior. These are bounded snapshots; decisions, ownership, sessions, results, and earned achievements are relational records. The API never trusts uploaded snapshots.

Templates, events, NASA metadata, and lessons are versioned TypeScript/JSON content rather than redundant database tables. Mission history is a query over owned sessions and results, not a second copy of the same records. This deliberately avoids unnecessary schema complexity.

## Consistency

Each account command checks ownership and the expected revision. A transaction performs a conditional update (`id`, `userId`, `revision`), then writes associated decision/result/achievement records. If the revision no longer matches, the command fails without partial writes. Unique event and achievement constraints prevent duplicate awards/decisions.

## Setup

```sh
# Local, DATABASE_URL=file:./astroquest.db
npm run db:setup

# Production, DATABASE_URL=postgresql://...
npm run db:postgres
```

On Windows, `init-local-db.mjs` ensures the SQLite file exists before migration, without truncating existing contents. Do not run the migration-generation helper against established migration histories; it exists to reproduce this initial schema. Add future migrations normally and review SQL before deployment.

The local API tests create an isolated SQLite database, execute the actual checked-in migration, and test persistence with a new Prisma connection. PostgreSQL DDL is generated and checked in; applying it to a hosted database requires credentials and must be separately verified.
