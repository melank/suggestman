import { Hono } from "hono";
import type { Bindings } from "../types/bindings";
import { authMiddleware, type AuthContext } from "../lib/middleware";
import { IdeasController } from "../controllers/ideas";

const app = new Hono<{ Bindings: Bindings } & AuthContext>();

// 認証ミドルウェアを適用
app.use("/*", authMiddleware);

// アイデア一覧取得
app.get("/", IdeasController.list);

export default app;
