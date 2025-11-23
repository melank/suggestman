import { createFactory } from "hono/factory";
import type { Bindings } from "../types/bindings";
import type { AuthContext } from "../services/middleware";
import { IdeaRepository } from "../repositories/IdeaRepository";

const factory = createFactory<{ Bindings: Bindings } & AuthContext>();

// アイデア一覧取得
export const listIdeas = factory.createHandlers(async (c) => {
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
