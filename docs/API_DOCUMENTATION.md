# REST API

Base: `/api`. Success responses use `{ "data": ... }`; errors use `{ "error": "message" }`, optionally validation `issues`. All mutation requests require an `Origin` matching `WEB_ORIGIN`, JSON content, and relevant authentication. The API returns no-store responses.

## Authentication

| Method | Route | Body / behavior |
| --- | --- | --- |
| POST | `/auth/register` | `{email, password, displayName}`; 201 + HTTP-only session cookie |
| POST | `/auth/login` | `{email, password}`; creates session cookie |
| POST | `/auth/logout` | `{}`; deletes session and expires cookie |
| GET | `/auth/me` | Public user or `null` |

Passwords: 10–128 characters for registration; stored as scrypt hashes with random 16-byte salts. Session tokens: random 32 bytes, only SHA-256 hashes stored, seven-day expiry. Cookies are HTTP-only and Secure in production. Passwords, hashes, and tokens are never included in user response data.

## Missions and profile

| Method | Route | Behavior |
| --- | --- | --- |
| GET | `/missions` | Most recent 50 owned sessions |
| POST | `/missions/start` | `{seed, difficulty, siteId}`; returns `{id, revision, state}` |
| GET | `/missions/:id` | Owned mission |
| GET | `/missions/:id/state` | Alias for owned mission state |
| POST | `/missions/:id/command` | `{revision, command}`; authoritative state transition |
| POST | `/missions/:id/save` | `{}`; returns persisted state for synchronization |
| GET | `/profile` | Public profile, completed count, best score, achievements |

Options: integer seed 0–2147483647, `cadet`/`commander`, site `aurora`/`horizon`/`farpoint`. Defaults are 42, Cadet, Aurora. Unknown fields, including supplied scores, are rejected.

Commands:

```json
{"revision":0,"command":{"type":"decide","choiceId":"checklist"}}
```

```json
{"revision":1,"command":{"type":"learn","eventId":"communications"}}
```

Other command shapes: `{type:"advance"}`, `{type:"pause"}`, `{type:"resume"}`, `{type:"restart"}`, `{type:"abort"}`, `{type:"activity", activity:"survey"|"maintenance"|"conserve"|"rest"|"tend"|"harvest"}`. Habitat activities use the same authoritative engine, revision guard and once-per-day limit. Rest/tending resource requirements and harvest maturity are enforced server-side. Original version-1 snapshots without the optional `habitat` object remain valid and receive deterministic defaults on their next command.

This compact command endpoint replaces separate advance/decision/restart routes while retaining strict validation and a shared transition engine. Saves never accept a client-provided state, result, or score. Decision rows, mission updates, and result/achievement writes occur in one transaction. Updates use an expected revision; only one competing update can succeed. On 409, fetch current state before trying another valid command. Another user's mission is returned as 404.

## Public science

| Method | Route | Data |
| --- | --- | --- |
| GET | `/nasa/sources` | Source names, categories, attribution notes and official URLs |
| GET | `/nasa/lunar-terrain` | Cached real LOLA elevations, sites, units and fingerprint |
| GET | `/nasa/illumination` | Cached image reference and explicit visualization limitations |
| GET | `/learning/topics` | All eight learning topics |
| GET | `/learning/:topicId` | One lesson or 404 |
| GET | `/health` | Runs `SELECT 1`; healthy status requires database connectivity |

NASA data does not need an API key and is not downloaded on each request.

## Security and operations

- Helmet, 16 KB request limit, strict schemas, generic login errors, and scrypt work for unknown users.
- 180 API requests/minute per IP; 30 register/login requests per 15 minutes. A single trusted proxy is configured in production; adapt this to your actual hosting topology.
- Exact-origin mutation checks and secure cookies. Set production `WEB_ORIGIN` explicitly; never use `*` with credentials.
- Errors do not expose database credentials or stack traces. Server error logs contain error categories, not passwords or request bodies.
- 400: invalid input; 401: authentication required/incorrect login; 403: origin rejected; 404: absent or unowned resource; 409: duplicate, stale state, or invalid transition; 429: rate limited; 500: service unavailable.
