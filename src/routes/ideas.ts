import { Hono } from "hono";
import type { Bindings } from "../types/bindings";
import { authMiddleware, type AuthContext } from "../services/middleware";
import { IdeaRepository } from "../repositories/IdeaRepository";

const app = new Hono<{ Bindings: Bindings } & AuthContext>();

// 認証ミドルウェアを適用
app.use("/*", authMiddleware);

// アイデア一覧取得
app.get("/", async (c) => {
	const user = c.get("user");
	const userId = user.sub;

	try {
		const ideaRepository = new IdeaRepository(c.env.DB);
		const ideas = await ideaRepository.findByUserId(userId);

		return c.json({ ideas });
	} catch (error) {
		console.error("Failed to fetch ideas:", error);
		return c.json({ error: "アイデアの取得に失敗しました" }, 500);
	}
});

export default app;
