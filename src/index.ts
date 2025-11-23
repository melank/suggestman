import { OpenAPIHono } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";
import type { Bindings } from "./types/bindings";
import index from "./routes/index";
import auth from "./routes/auth";
import dashboard from "./routes/dashboard";
import static_routes from "./routes/static";
import ideas from "./routes/ideas";

const app = new OpenAPIHono<{ Bindings: Bindings }>();

app.route("/", index);
app.route("/api/auth", auth);
app.route("/api/ideas", ideas);
app.route("/dashboard", dashboard);
app.route("/static", static_routes);

// OpenAPI ドキュメント（環境変数ベース）
app.doc31("/openapi.json", (c) => {
	// 本番環境では API_BASE_URL 環境変数を使用、開発環境ではリクエスト元を使用
	const serverUrl = c.env.API_BASE_URL || new URL(c.req.url).origin;
	const isProduction = !!c.env.API_BASE_URL;

	return {
		openapi: "3.1.0",
		info: {
			title: "Suggestman API",
			version: "1.0.0",
			description:
				"自由時間が突然生まれた瞬間に「本当にやりたいこと」を提示してくれるサジェスト専用アプリケーション",
		},
		servers: [
			{
				url: serverUrl,
				description: isProduction ? "Production" : "Development",
			},
		],
	};
});

// Swagger UI
app.get(
	"/docs",
	swaggerUI({
		url: "/openapi.json",
	}),
);

export default app;
