import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { Bindings } from "../types/bindings";
import { authMiddleware, type AuthContext } from "../services/middleware";
import { AdoptedIdeaRepository } from "../repositories/AdoptedIdeaRepository";
import { IdeaRepository } from "../repositories/IdeaRepository";
import {
	AdoptIdeaRequestSchema,
	AdoptIdeaResponseSchema,
	AdoptedIdeasListResponseSchema,
	AdoptedIdeaDetailResponseSchema,
	UpdateAdoptedIdeaStatusRequestSchema,
	UpdateAdoptedIdeaStatusResponseSchema,
	ErrorResponseSchema,
} from "../schemas/ideas";

const app = new OpenAPIHono<{ Bindings: Bindings } & AuthContext>();

// 認証ミドルウェアを適用
app.use("/*", authMiddleware);

// アイデアを採用（OpenAPI）
const adoptIdeaRoute = createRoute({
	method: "post",
	path: "/",
	request: {
		body: {
			content: {
				"application/json": {
					schema: AdoptIdeaRequestSchema,
				},
			},
		},
	},
	responses: {
		201: {
			content: {
				"application/json": {
					schema: AdoptIdeaResponseSchema,
				},
			},
			description: "アイデア採用成功",
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

app.openapi(adoptIdeaRoute, async (c) => {
	const user = c.get("user");
	const { idea_id, note } = c.req.valid("json");

	try {
		const ideaRepository = new IdeaRepository(c.env.DB);
		const adoptedIdeaRepository = new AdoptedIdeaRepository(c.env.DB);

		// アイデアの存在と所有者確認
		const idea = await ideaRepository.findById(idea_id);

		if (!idea) {
			return c.json({ error: "アイデアが見つかりません" }, 404);
		}

		if (idea.user_id !== user.sub) {
			return c.json({ error: "アイデアが見つかりません" }, 404);
		}

		// 採用レコードを作成
		const adoptedIdea = await adoptedIdeaRepository.create({
			idea_id,
			user_id: user.sub,
			note,
		});

		return c.json({ success: true, adopted_idea: adoptedIdea }, 201);
	} catch (error) {
		console.error("Failed to adopt idea:", error);
		return c.json({ error: "アイデアの採用に失敗しました" }, 500);
	}
});

// 採用されたアイデア一覧取得（OpenAPI）
const listAdoptedIdeasRoute = createRoute({
	method: "get",
	path: "/",
	responses: {
		200: {
			content: {
				"application/json": {
					schema: AdoptedIdeasListResponseSchema,
				},
			},
			description: "採用されたアイデア一覧取得成功",
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

app.openapi(listAdoptedIdeasRoute, async (c) => {
	const user = c.get("user");

	try {
		const adoptedIdeaRepository = new AdoptedIdeaRepository(c.env.DB);
		const adopted_ideas = await adoptedIdeaRepository.findByUserId(user.sub);

		return c.json({ adopted_ideas }, 200);
	} catch (error) {
		console.error("Failed to fetch adopted ideas:", error);
		return c.json({ error: "採用されたアイデアの取得に失敗しました" }, 500);
	}
});

// 採用されたアイデア詳細取得（OpenAPI）
const getAdoptedIdeaRoute = createRoute({
	method: "get",
	path: "/{id}",
	request: {
		params: z.object({
			id: z.coerce.number().int().positive("採用されたアイデアIDは必須です"),
		}),
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: AdoptedIdeaDetailResponseSchema,
				},
			},
			description: "採用されたアイデア詳細取得成功",
		},
		404: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "採用されたアイデアが見つかりません",
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

app.openapi(getAdoptedIdeaRoute, async (c) => {
	const user = c.get("user");
	const { id } = c.req.valid("param");

	try {
		const adoptedIdeaRepository = new AdoptedIdeaRepository(c.env.DB);
		const adopted_idea = await adoptedIdeaRepository.findById(id);

		if (!adopted_idea) {
			return c.json({ error: "採用されたアイデアが見つかりません" }, 404);
		}

		// 他のユーザーのアイデアへのアクセスを防ぐ
		if (adopted_idea.user_id !== user.sub) {
			return c.json({ error: "採用されたアイデアが見つかりません" }, 404);
		}

		return c.json({ adopted_idea }, 200);
	} catch (error) {
		console.error("Failed to fetch adopted idea:", error);
		return c.json({ error: "採用されたアイデアの取得に失敗しました" }, 500);
	}
});

// ステータス更新（OpenAPI）
const updateStatusRoute = createRoute({
	method: "patch",
	path: "/{id}/status",
	request: {
		params: z.object({
			id: z.coerce.number().int().positive("採用されたアイデアIDは必須です"),
		}),
		body: {
			content: {
				"application/json": {
					schema: UpdateAdoptedIdeaStatusRequestSchema,
				},
			},
		},
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: UpdateAdoptedIdeaStatusResponseSchema,
				},
			},
			description: "ステータス更新成功",
		},
		404: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "採用されたアイデアが見つかりません",
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

app.openapi(updateStatusRoute, async (c) => {
	const user = c.get("user");
	const { id } = c.req.valid("param");
	const { status } = c.req.valid("json");

	try {
		const adoptedIdeaRepository = new AdoptedIdeaRepository(c.env.DB);

		// アイデアの存在と所有者確認
		const adopted_idea = await adoptedIdeaRepository.findById(id);

		if (!adopted_idea) {
			return c.json({ error: "採用されたアイデアが見つかりません" }, 404);
		}

		if (adopted_idea.user_id !== user.sub) {
			return c.json({ error: "採用されたアイデアが見つかりません" }, 404);
		}

		// ステータス更新
		const updated_adopted_idea = await adoptedIdeaRepository.updateStatus(
			id,
			status,
		);

		if (!updated_adopted_idea) {
			return c.json({ error: "採用されたアイデアの更新に失敗しました" }, 500);
		}

		return c.json({ success: true, adopted_idea: updated_adopted_idea }, 200);
	} catch (error) {
		console.error("Failed to update status:", error);
		return c.json({ error: "ステータスの更新に失敗しました" }, 500);
	}
});

export default app;
