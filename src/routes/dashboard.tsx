import { Hono } from "hono";
import type { Bindings, JWTPayload } from "../types/bindings";
import { authMiddleware } from "../lib/middleware";
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
app.get("/", (c) => {
	const user = c.get("user");

	return c.html(
		<DashboardPage
			user={{
				name: user.name,
				email: user.email,
			}}
		/>,
	);
});

export default app;
