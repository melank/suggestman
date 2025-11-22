import { Hono } from "hono";
import type { Bindings } from "../types/bindings";
import { LoginPage } from "../views/login";

const app = new Hono<{ Bindings: Bindings }>();

app.get("/", (c) => {
	return c.html(<LoginPage />);
});

app.get("/health", (c) => {
	return c.json({
		message: "Hello, Suggestman!",
		timestamp: new Date().toISOString(),
	});
});

export default app;
