# Auth — Plain English Explanations

## What is a JWT?

A JWT (JSON Web Token) is a compact, self-contained string that proves who you
are. It has three parts separated by dots:

```
header.payload.signature
```

- **Header** — says which algorithm was used to sign it (we use HS256)
- **Payload** — contains claims like who you are (`sub`) and when it expires (`exp`)
- **Signature** — a cryptographic hash of the header + payload, signed with a
  secret key only the server knows

When the server receives a token, it re-computes the signature and checks it
matches. If someone tampered with the payload, the signature won't match and
the token is rejected. The server never needs to look anything up in a database
to verify — the token is self-verifying.

---

## Why HS256?

HS256 (HMAC-SHA256) uses a single shared secret for both signing and
verification. This is fine when the same server both issues and verifies tokens.

If you later split into separate auth and resource servers, you'd switch to
RS256 (asymmetric), where the auth server signs with a private key and the
resource server only holds the public key.

---

## The Login Flow (what's faked vs real)

```
Real production system:
  1. User submits credentials
  2. Server looks them up in a user database
  3. Checks password against a bcrypt hash
  4. Issues a JWT if they match

This project:
  1. User submits { username: "demo", password: "demo" }
  2. Server checks against hardcoded values  ← the fake part
  3. Issues a real signed JWT               ← identical to production
  4. Everything after this point is production-grade
```

The token itself, how it's transmitted, and how it's verified are all real.
Only step 2 is mocked.

---

## How the Token Travels

After login the client receives:

```json
{ "token": "eyJhbGci..." }
```

The client stores this in memory (or `localStorage` in a browser) and attaches
it to every subsequent request:

```
Authorization: Bearer eyJhbGci...
```

The server's auth middleware intercepts every request, pulls out the token,
verifies it, and if valid attaches the decoded user to the request. The
GraphQL resolver then receives the user through Apollo's context.

---

## Why Not Cookies?

Cookies can be more secure in browser apps (HttpOnly cookies can't be read
by JavaScript, protecting against XSS). However they require:

- `SameSite` and `Domain` configuration when the API is on a different origin
- CORS configured with `credentials: true` on both ends
- Additional CSRF protection in some cases

For a React SPA calling a separate API server, the Bearer header approach is
simpler and more explicit. The client is in full control of when the token is
sent.

---

## What Happens to Expired Tokens?

JWTs contain an `exp` (expiry) claim. Our tokens expire after 1 hour.

When `jsonwebtoken.verify()` is called on an expired token it throws a
`TokenExpiredError`. Our middleware catches this and returns `401`. The client
would need to re-authenticate to get a fresh token.

A production system would typically add refresh tokens to avoid forcing the
user to log in every hour — we've skipped that here.

---

## Environment Variable: JWT_SECRET

The signing secret is read from `process.env.JWT_SECRET`.

In development, the code falls back to a hardcoded default so you don't need
to set it to run the project locally. In production this env var must be set
to a long random string and kept secret — anyone who knows it can forge tokens.
