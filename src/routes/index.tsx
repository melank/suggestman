import { Hono } from "hono";
import type { Bindings } from "../types/bindings";
import { HomeController } from "../controllers/home";

const app = new Hono<{ Bindings: Bindings }>();

app.get("/", HomeController.index);
app.get("/health", HomeController.health);

// Chrome DevTools のリクエストを静かに処理
app.get("/.well-known/appspecific/com.chrome.devtools.json", (c) =>
	c.body(null, 204),
);

export default app;
