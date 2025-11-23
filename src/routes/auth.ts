import { Hono } from "hono";
import type { Bindings } from "../types/bindings";
import {
	githubAuth,
	githubCallback,
	signup,
	login,
	setPassword,
	logout,
} from "../handlers/auth";

const app = new Hono<{ Bindings: Bindings }>();

// GitHub OAuth 認証開始
app.get("/github", ...githubAuth);

// GitHub OAuth コールバック
app.get("/github/callback", ...githubCallback);

// メールアドレス/パスワードでサインアップ
app.post("/signup", ...signup);

// メールアドレス/パスワードでログイン
app.post("/login", ...login);

// パスワード設定（GitHub OAuth ユーザー向け）
app.post("/set-password", ...setPassword);

// ログアウト
app.post("/logout", ...logout);

export default app;
