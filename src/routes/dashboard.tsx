import { Hono } from "hono";
import type { Bindings, JWTPayload } from "../types/bindings";
import { authMiddleware } from "../services/middleware";
import { DashboardPage } from "../views/dashboard";

const app = new Hono<{
	Bindings: Bindings;
	Variables: {
		user: JWTPayload;
	};
}>();

// 認証ミドルウェアを適用
app.use("/*", authMiddleware);

// ダッシュボードページ
app.get("/", async (c) => {
	const user = c.get("user");

	// データベースからユーザー情報を取得してパスワードの有無を確認
	const dbUser = await c.env.DB.prepare(
		"SELECT password_hash FROM users WHERE id = ?",
	)
		.bind(user.sub)
		.first();

	const hasPassword = !!dbUser?.password_hash;

	return c.html(
		<DashboardPage
			user={{
				name: user.name,
				email: user.email,
			}}
			hasPassword={hasPassword}
		/>,
	);
});

export default app;
