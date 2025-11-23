import { Hono } from "hono";
import type { Bindings } from "../types/bindings";
import { AuthController } from "../controllers/auth";

const app = new Hono<{ Bindings: Bindings }>();

// GitHub OAuth 認証
app.get("/github", AuthController.githubAuth);
app.get("/github/callback", AuthController.githubCallback);

// メールアドレス/パスワード認証
app.post("/signup", AuthController.signup);
app.post("/login", AuthController.login);
app.post("/set-password", AuthController.setPassword);

// ログアウト
app.post("/logout", AuthController.logout);

export default app;
