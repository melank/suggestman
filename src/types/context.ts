// Hono Context の拡張型定義

import type { Bindings } from "./bindings";

// Context Variables - ミドルウェアでセットされる値
export type Variables = {
	userId?: string;
	userEmail?: string;
	userName?: string;
};

// Hono App の型定義
export type AppBindings = {
	Bindings: Bindings;
	Variables: Variables;
};
