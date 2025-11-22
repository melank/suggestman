// Cloudflare Workers の環境変数とバインディングの型定義

export type Bindings = {
	// D1 Database
	DB: D1Database;

	// Environment Variables (Secrets)
	GITHUB_CLIENT_ID: string;
	GITHUB_CLIENT_SECRET: string;
	JWT_SECRET: string;

	// Environment name (development | production)
	ENVIRONMENT?: string;
};

// JWT Payload の型定義
export type JWTPayload = {
	sub: string; // User ID
	email: string;
	name: string;
	type: "access" | "refresh";
	iat: number; // Issued at
	exp: number; // Expiration time
	sessionId?: string; // Refresh token のみ
};

// User の型定義
export type User = {
	id: string;
	email: string | null;
	name: string;
	githubId: string | null;
	createdAt: string;
	updatedAt: string;
};

// GitHub API のユーザー情報
export type GitHubUser = {
	id: number;
	login: string;
	name: string | null;
	email: string | null;
	avatar_url: string;
};

// GitHub OAuth Token Response
export type GitHubTokenResponse = {
	access_token: string;
	token_type: string;
	scope: string;
};
