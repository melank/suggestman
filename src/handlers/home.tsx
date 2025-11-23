import { createFactory } from "hono/factory";
import type { Bindings } from "../types/bindings";
import { LoginPage } from "../views/login";
import { verifyJWT } from "../services/jwt";

const factory = createFactory<{ Bindings: Bindings }>();

// ルートページ（ログイン画面）
export const home = factory.createHandlers(async (c) => {
	// Cookie から JWT トークンを取得
	const cookieHeader = c.req.header("Cookie");
	if (cookieHeader) {
		const cookies = cookieHeader.split(";").reduce(
			(acc, cookie) => {
				const [key, value] = cookie.trim().split("=");
				acc[key] = value;
				return acc;
			},
			{} as Record<string, string>,
		);

		const token = cookies.token;
		if (token) {
			try {
				// トークンを検証
				await verifyJWT(token, c.env.JWT_SECRET);
				// トークンが有効な場合は /dashboard にリダイレクト
				return c.redirect("/dashboard");
			} catch (error) {
				// トークンが無効な場合は続行（ログイン画面を表示）
			}
		}
	}

	return c.html(<LoginPage />);
});

// ヘルスチェック
export const health = factory.createHandlers(async (c) => {
	return c.json({
		message: "Hello, Suggestman!",
		timestamp: new Date().toISOString(),
	});
});

// Chrome DevTools のリクエストを静かに処理
export const chromeDevTools = factory.createHandlers((c) => c.body(null, 204));
