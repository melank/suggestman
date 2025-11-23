import type { Context } from "hono";
import type { Bindings, JWTPayload } from "../types/bindings";

export class IdeasController {
	/**
	 * アイデア一覧取得
	 */
	static async list(
		c: Context<{ Bindings: Bindings; Variables: { user: JWTPayload } }>,
	) {
		const user = c.get("user");
		const userId = user.sub;

		try {
			const { results } = await c.env.DB.prepare(
				"SELECT id, title, tags, note, estimated_minutes, created_at, updated_at FROM ideas WHERE user_id = ? ORDER BY created_at DESC",
			)
				.bind(userId)
				.all();

			// タグのJSON文字列を配列にパース
			const ideas = results.map((idea) => ({
				...idea,
				tags: idea.tags ? JSON.parse(idea.tags as string) : [],
			}));

			return c.json({ ideas });
		} catch (error) {
			console.error("Failed to fetch ideas:", error);
			return c.json({ error: "アイデアの取得に失敗しました" }, 500);
		}
	}
}
