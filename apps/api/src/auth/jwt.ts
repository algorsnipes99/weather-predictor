import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET ?? "dev-secret-change-in-production";
const EXPIRY = "1h";

export interface TokenPayload {
  sub: string;
  role: "user";
}

/** Signs a JWT for the given subject. Returns the token string. */
export function signToken(sub: string): string {
  return jwt.sign({ sub, role: "user" } satisfies TokenPayload, SECRET, {
    algorithm: "HS256",
    expiresIn: EXPIRY,
  });
}

/**
 * Verifies a JWT and returns its decoded payload.
 * Throws `JsonWebTokenError` or `TokenExpiredError` on failure.
 */
export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, SECRET) as TokenPayload;
}
