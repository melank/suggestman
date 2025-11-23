import { Hono } from "hono";
import type { Bindings } from "../types/bindings";
import { authMiddleware, type AuthContext } from "../services/middleware";
import { listIdeas } from "../handlers/ideas";

const app = new Hono<{ Bindings: Bindings } & AuthContext>();

// 認証ミドルウェアを適用
app.use("/*", authMiddleware);

// アイデア一覧取得
app.get("/", ...listIdeas);

export default app;
