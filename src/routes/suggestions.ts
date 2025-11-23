import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import type { Bindings } from "../types/bindings";
import { authMiddleware, type AuthContext } from "../services/middleware";
import { IdeaRepository } from "../repositories/IdeaRepository";
import {
	SuggestionRequestSchema,
	SuggestionResponseSchema,
	ErrorResponseSchema,
} from "../schemas/suggestions";

const app = new OpenAPIHono<{ Bindings: Bindings } & AuthContext>();

// 認証ミドルウェアを適用
app.use("/*", authMiddleware);

// 提案取得（OpenAPI）
const getSuggestionRoute = createRoute({
	method: "post",
	path: "/",
	request: {
		body: {
			content: {
				"application/json": {
					schema: SuggestionRequestSchema,
				},
			},
		},
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: SuggestionResponseSchema,
				},
			},
			description: "提案取得成功",
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

app.openapi(getSuggestionRoute, async (c) => {
	const user = c.get("user");
	const userId = user.sub;

	try {
		const ideaRepository = new IdeaRepository(c.env.DB);
		const ideas = await ideaRepository.findByUserId(userId);

		// アイデアがない場合
		if (ideas.length === 0) {
			return c.json(
				{
					suggestion: null,
					message:
						"アイデアが登録されていません。まずはアイデアを追加してください。",
				},
				200,
			);
		}

		// MVP版: ランダムに1つ選択
		const randomIndex = Math.floor(Math.random() * ideas.length);
		const selectedIdea = ideas[randomIndex];

		// モチベーションメッセージ（シンプル版）
		const motivationalMessages = [
			"今がこれをやる絶好のタイミングです！",
			"このアイデアを実行してみましょう。",
			"今日はこれに挑戦してみませんか？",
			"このアクティビティで充実した時間を過ごしましょう。",
			"さあ、始めてみましょう！",
		];
		const randomMessageIndex = Math.floor(
			Math.random() * motivationalMessages.length,
		);
		const motivationalMessage = motivationalMessages[randomMessageIndex];

		// 提案を返す
		return c.json(
			{
				suggestion: {
					idea: selectedIdea,
					motivationalMessage,
					servedAt: new Date().toISOString(),
				},
			},
			200,
		);
	} catch (error) {
		console.error("Failed to get suggestion:", error);
		return c.json({ error: "提案の取得に失敗しました" }, 500);
	}
});

export default app;
