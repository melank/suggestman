import { z } from "zod";

// サインアップ
export const SignupRequestSchema = z.object({
	email: z.string().email("有効なメールアドレスを入力してください"),
	password: z.string().min(8, "パスワードは8文字以上である必要があります"),
	name: z.string().min(1, "名前は必須です"),
});

export const SignupResponseSchema = z.object({
	success: z.boolean(),
	redirect: z.string(),
});

// ログイン
export const LoginRequestSchema = z.object({
	email: z.string().email("有効なメールアドレスを入力してください"),
	password: z.string().min(1, "パスワードは必須です"),
});

export const LoginResponseSchema = z.object({
	success: z.boolean(),
	redirect: z.string(),
});

// パスワード設定
export const SetPasswordRequestSchema = z.object({
	password: z.string().min(8, "パスワードは8文字以上である必要があります"),
});

export const SetPasswordResponseSchema = z.object({
	success: z.boolean(),
	message: z.string(),
});

// エラーレスポンス
export const ErrorResponseSchema = z.object({
	error: z.string(),
	details: z.string().optional(),
});
