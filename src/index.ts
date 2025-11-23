import { Hono } from "hono";
import type { Bindings } from "./types/bindings";
import index from "./routes/index";
import auth from "./routes/auth";
import dashboard from "./routes/dashboard";
import static_routes from "./routes/static";
import ideas from "./routes/ideas";

const app = new Hono<{ Bindings: Bindings }>();

app.route("/", index);
app.route("/api/auth", auth);
app.route("/api/ideas", ideas);
app.route("/dashboard", dashboard);
app.route("/static", static_routes);

export default app;
