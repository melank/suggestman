import { createMiddleware } from "hono/factory";
import type { Bindings, JWTPayload } from "../types/bindings";
import { verifyJWT } from "./jwt";

// Context に user 情報を追加する型定義
export type AuthContext = {
	Variables: {
		user: JWTPayload;
	};
};

// JWT 認証ミドルウェア
export const authMiddleware = createMiddleware<{
	Bindings: Bindings;
	Variables: {
		user: JWTPayload;
	};
}>(async (c, next) => {
	// Cookie から token を取得
	const cookieHeader = c.req.header("Cookie");
	if (!cookieHeader) {
		return c.redirect("/");
	}

	// token を抽出
	const cookies = cookieHeader.split(";").reduce(
		(acc, cookie) => {
			const [key, value] = cookie.trim().split("=");
			acc[key] = value;
			return acc;
		},
		{} as Record<string, string>,
	);

	const token = cookies.token;
	if (!token) {
		return c.redirect("/");
	}

	try {
		// JWT を検証
		const payload = await verifyJWT(token, c.env.JWT_SECRET);

		// Context に user 情報を設定
		c.set("user", payload);

		await next();
	} catch (error) {
		console.error("JWT verification failed:", error);
		// トークンが無効な場合はログインページにリダイレクト
		return c.redirect("/");
	}
});
