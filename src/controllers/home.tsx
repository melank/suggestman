import type { Context } from "hono";
import type { Bindings } from "../types/bindings";
import { LoginPage } from "../views/login";
import { verifyJWT } from "../lib/jwt";

export class HomeController {
	/**
	 * ルートページを表示
	 * ログイン済みの場合は /dashboard にリダイレクト
	 */
	static async index(c: Context<{ Bindings: Bindings }>) {
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
	}

	/**
	 * ヘルスチェック
	 */
	static async health(c: Context<{ Bindings: Bindings }>) {
		return c.json({
			message: "Hello, Suggestman!",
			timestamp: new Date().toISOString(),
		});
	}
}
