import { z } from "zod";

// アイデア（実際の DB スキーマに合わせて）
export const IdeaSchema = z.object({
	id: z.string(),
	user_id: z.string(),
	title: z.string(),
	tags: z.array(z.string()),
	note: z.string().nullish(),
	estimated_minutes: z.number().int().positive().nullish(),
	created_at: z.string(),
	updated_at: z.string(),
});

// アイデア一覧レスポンス
export const IdeasListResponseSchema = z.object({
	ideas: z.array(IdeaSchema),
});

// エラーレスポンス
export const ErrorResponseSchema = z.object({
	error: z.string(),
});
