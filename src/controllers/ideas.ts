import type { Context } from "hono";
import type { Bindings, JWTPayload } from "../types/bindings";
import { IdeaRepository } from "../repositories/IdeaRepository";

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
			const ideaRepository = new IdeaRepository(c.env.DB);
			const ideas = await ideaRepository.findByUserId(userId);

			return c.json({ ideas });
		} catch (error) {
			console.error("Failed to fetch ideas:", error);
			return c.json({ error: "アイデアの取得に失敗しました" }, 500);
		}
	}
}
