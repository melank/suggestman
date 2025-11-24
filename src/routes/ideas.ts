import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { Bindings } from "../types/bindings";
import { authMiddleware, type AuthContext } from "../services/middleware";
import { IdeaRepository } from "../repositories/IdeaRepository";
import {
	IdeasListResponseSchema,
	IdeaDetailResponseSchema,
	ErrorResponseSchema,
} from "../schemas/ideas";

const app = new OpenAPIHono<{ Bindings: Bindings } & AuthContext>();

// 認証ミドルウェアを適用
app.use("/*", authMiddleware);

// アイデア一覧取得（OpenAPI）
const listIdeasRoute = createRoute({
	method: "get",
	path: "/",
	responses: {
		200: {
			content: {
				"application/json": {
					schema: IdeasListResponseSchema,
				},
			},
			description: "アイデア一覧取得成功",
		},
		500: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "サーバーエラー",
		},
	},
});

app.openapi(listIdeasRoute, async (c) => {
	const user = c.get("user");
	const userId = user.sub;

	try {
		const ideaRepository = new IdeaRepository(c.env.DB);
		const ideas = await ideaRepository.findByUserId(userId);

		return c.json({ ideas }, 200);
	} catch (error) {
		console.error("Failed to fetch ideas:", error);
		return c.json({ error: "アイデアの取得に失敗しました" }, 500);
	}
});

// アイデア詳細取得（OpenAPI）
const getIdeaRoute = createRoute({
	method: "get",
	path: "/{id}",
	request: {
		params: z.object({
			id: z.coerce.number().int().positive("アイデアIDは必須です"),
		}),
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: IdeaDetailResponseSchema,
				},
			},
			description: "アイデア詳細取得成功",
		},
		404: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "アイデアが見つかりません",
		},
		500: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "サーバーエラー",
		},
	},
});

app.openapi(getIdeaRoute, async (c) => {
	const user = c.get("user");
	const { id } = c.req.valid("param");

	try {
		const ideaRepository = new IdeaRepository(c.env.DB);
		const idea = await ideaRepository.findById(id);

		if (!idea) {
			return c.json({ error: "アイデアが見つかりません" }, 404);
		}

		// 他のユーザーのアイデアへのアクセスを防ぐ
		if (idea.user_id !== user.sub) {
			return c.json({ error: "アイデアが見つかりません" }, 404);
		}

		return c.json({ idea }, 200);
	} catch (error) {
		console.error("Failed to fetch idea:", error);
		return c.json({ error: "アイデアの取得に失敗しました" }, 500);
	}
});

export default app;
