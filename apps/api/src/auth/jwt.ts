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
 * Reconstructs the payload explicitly rather than casting so a malformed
 * token cannot silently pass through with the wrong shape.
 */
export function verifyToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, SECRET);
  if (typeof decoded === "string" || typeof decoded.sub !== "string") {
    throw new Error("Invalid token payload");
  }
  return { sub: decoded.sub, role: "user" };
}
