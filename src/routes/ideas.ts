import {Hono} from "hono";
import type {Bindings} from "../types/bindings";
import type {AuthContext} from "../types/context";
import {authMiddleware} from "../lib/middleware";

const app = new Hono<{Bindings: Bindings; Variables: AuthContext}>();

// 認証ミドルウェアを適用
app.use("/*", authMiddleware);

// アイデア一覧取得
app.get("/", async (c) => {
	const user = c.get("user");
	const userId = user.sub; // JWT の sub フィールドにユーザーIDが入っている

	try {
		const {results} = await c.env.DB.prepare(
			"SELECT id, title, tags, note, estimated_minutes, created_at, updated_at FROM ideas WHERE user_id = ? ORDER BY created_at DESC",
		)
			.bind(userId)
			.all();

		// タグのJSON文字列を配列にパース
		const ideas = results.map((idea) => ({
			...idea,
			tags: idea.tags ? JSON.parse(idea.tags as string) : [],
		}));

		return c.json({ideas});
	} catch (error) {
		console.error("Failed to fetch ideas:", error);
		return c.json({error: "アイデアの取得に失敗しました"}, 500);
	}
});

export default app;
