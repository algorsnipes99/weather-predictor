import { Router, Request, Response } from "express";
import { signToken } from "./jwt.js";

const DEMO_USERNAME = "demo";
const DEMO_PASSWORD = "demo";

interface TokenRequestBody {
  username: string;
  password: string;
}

/**
 * Auth router — exposes POST /auth/token.
 *
 * Credentials are hardcoded (demo/demo) since there is no real user store yet.
 * Token issuance and the surrounding HTTP contract are production-grade;
 * only the credential validation step is faked.
 */
export const authRouter = Router();

authRouter.post("/token", (req: Request<object, object, TokenRequestBody>, res: Response): void => {
  const { username, password } = req.body ?? {};

  if (username !== DEMO_USERNAME || password !== DEMO_PASSWORD) {
    res.status(401).json({ error: "Invalid credentials." });
    return;
  }

  const token = signToken(username);
  res.json({ token });
});
