# Auth Implementation Progress

## Phase 1 — JWT Bearer Token Auth

### Setup

- [x] Install packages: `express`, `cors`, `jsonwebtoken`, `@types/express`, `@types/cors`, `@types/jsonwebtoken`

### New files

- [x] `apps/api/src/auth/jwt.ts` — `signToken` and `verifyToken` helpers
- [x] `apps/api/src/auth/auth.middleware.ts` — Express middleware that validates the Bearer token
- [x] `apps/api/src/auth/auth.router.ts` — `POST /auth/token` endpoint

### Modified files

- [x] `apps/api/src/index.ts` — switch to Express + `expressMiddleware`, mount auth router and middleware
- [x] `apps/api/src/graphql/resolvers.ts` — add `user` to `AppContext`

### Done when

- [x] TypeScript compiles cleanly (`tsc --noEmit` passes)
- [ ] `POST /auth/token` with `{ username: "demo", password: "demo" }` returns a signed JWT
- [ ] `POST /graphql` without a token returns `401`
- [ ] `POST /graphql` with a valid token reaches the resolver normally
- [ ] `POST /graphql` with an expired or tampered token returns `401`
