# Auth Plan

## Goal

Secure the GraphQL API with JWT-based bearer token authentication.
There is no real user store — the login endpoint is intentionally faked —
but the token issuance and verification are production-grade.

---

## Why Bearer Tokens (not cookies)

This API is consumed by a React SPA served from a separate origin.
Cookie-based auth would require `SameSite`/`Domain` alignment and CORS
credential sharing. Bearer tokens in the `Authorization` header are simpler,
explicit, and standard for this kind of setup.

When a real identity provider is added later, only the token-issuing code
needs to change. Verification and middleware stay identical.

---

## Flow

```
Client                          API
  |                              |
  | POST /auth/token             |
  | { username, password }       |
  |----------------------------->|
  |                              | validate credentials (fake for now)
  |                              | sign JWT (HS256, 1h TTL)
  | 200 { token }                |
  |<-----------------------------|
  |                              |
  | store token in memory/state  |
  |                              |
  | POST /graphql                |
  | Authorization: Bearer <tok>  |
  |----------------------------->|
  |                              | verify JWT signature + expiry
  |                              | inject user into Apollo context
  |                              | resolver runs normally
  | 200 { data }                 |
  |<-----------------------------|
  |                              |
  | (no token / bad token)       |
  | POST /graphql                |
  |----------------------------->|
  |                              | verification fails
  | 401 Unauthorized             |
  |<-----------------------------|
```

---

## Architecture

```
apps/api/src/
  auth/
    jwt.ts              — sign + verify helpers (pure, testable)
    auth.middleware.ts  — Express middleware: extract header, verify, attach user
    auth.router.ts      — POST /auth/token  (fake credential check, returns JWT)
```

### Changes to existing files

| File | Change |
|---|---|
| `index.ts` | Switch from `startStandaloneServer` to Express + `expressMiddleware` so we can mount custom routes alongside GraphQL |
| `graphql/resolvers.ts` | Add `user` field to `AppContext` so resolvers can access the authenticated identity |
| `package.json` | Add `express`, `cors`, `jsonwebtoken` and their `@types` |

---

## Token Spec

| Property | Value |
|---|---|
| Algorithm | HS256 |
| Secret | `JWT_SECRET` env var (falls back to a dev default) |
| Expiry | 1 hour |
| Payload | `{ sub: string, role: "user" }` |

---

## Fake Credentials (Phase 1)

The `POST /auth/token` endpoint accepts hardcoded demo credentials:

```
username: demo
password: demo
```

Any other combination returns `401`. This keeps the endpoint realistic while
making it obvious that a real user store is not wired up yet.

---

## What This Does NOT Do

- No refresh tokens
- No real user database
- No role-based access control (all authenticated users have equal access)
- No HTTPS enforcement (assumed to be handled by a reverse proxy in production)
