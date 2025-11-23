import { z } from "zod";
import { IdeaSchema } from "./ideas";

// 提案コンテキスト（MVP版：シンプルなバージョン）
export const SuggestionContextSchema = z.object({
	mood: z
		.enum([
			"high_energy",
			"low_energy",
			"creative",
			"productive",
			"social",
			"solo",
		])
		.optional(),
	availableMinutes: z.number().int().positive().optional(),
	includeTags: z.array(z.string()).optional(),
	excludeTags: z.array(z.string()).optional(),
	excludeIdeaIds: z.array(z.string()).optional(),
});

// 提案リクエスト
export const SuggestionRequestSchema = z.object({
	context: SuggestionContextSchema.optional(),
});

// 提案レスポンス
export const SuggestionSchema = z.object({
	idea: IdeaSchema,
	motivationalMessage: z.string(),
	matchScore: z.number().optional(),
	matchReasons: z.array(z.string()).optional(),
	servedAt: z.string(),
});

export const SuggestionResponseSchema = z.object({
	suggestion: SuggestionSchema.nullable(),
	message: z.string().optional(),
});

// エラーレスポンス
export const ErrorResponseSchema = z.object({
	error: z.string(),
});
