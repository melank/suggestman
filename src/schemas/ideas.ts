import { z } from "zod";

// アイデア（ideas テーブル）
export const IdeaSchema = z.object({
	id: z.string(),
	user_id: z.string(),
	title: z.string(),
	tags: z.array(z.string()),
	estimated_minutes: z.number().int().positive().nullish(),
	created_at: z.string(),
	updated_at: z.string(),
});

// 採用されたアイデアのステータス
export const AdoptedIdeaStatusSchema = z.enum([
	"実行待ち",
	"実行中",
	"中断",
	"完了",
]);

// 採用されたアイデア（adopted_ideas テーブル）
export const AdoptedIdeaSchema = z.object({
	id: z.string(),
	idea_id: z.string(),
	user_id: z.string(),
	status: AdoptedIdeaStatusSchema,
	note: z.string().nullish(),
	adopted_at: z.string(),
	started_at: z.string().nullish(),
	completed_at: z.string().nullish(),
	created_at: z.string(),
	updated_at: z.string(),
});

// アイデア一覧レスポンス
export const IdeasListResponseSchema = z.object({
	ideas: z.array(IdeaSchema),
});

// アイデア詳細レスポンス
export const IdeaDetailResponseSchema = z.object({
	idea: IdeaSchema,
});

// アイデア採用リクエスト
export const AdoptIdeaRequestSchema = z.object({
	idea_id: z.string().min(1, "アイデアIDは必須です"),
	note: z.string().optional(),
});

// アイデア採用レスポンス
export const AdoptIdeaResponseSchema = z.object({
	success: z.boolean(),
	adopted_idea: AdoptedIdeaSchema,
});

// 採用されたアイデア一覧レスポンス
export const AdoptedIdeasListResponseSchema = z.object({
	adopted_ideas: z.array(AdoptedIdeaSchema),
});

// 採用されたアイデア詳細レスポンス
export const AdoptedIdeaDetailResponseSchema = z.object({
	adopted_idea: AdoptedIdeaSchema,
});

// ステータス更新リクエスト
export const UpdateAdoptedIdeaStatusRequestSchema = z.object({
	status: AdoptedIdeaStatusSchema,
});

// ステータス更新レスポンス
export const UpdateAdoptedIdeaStatusResponseSchema = z.object({
	success: z.boolean(),
	adopted_idea: AdoptedIdeaSchema,
});

// エラーレスポンス
export const ErrorResponseSchema = z.object({
	error: z.string(),
});
