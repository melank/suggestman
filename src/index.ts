import { Hono } from "hono";
import type { Bindings } from "./types/bindings";
import index from "./routes/index";
import auth from "./routes/auth";

const app = new Hono<{ Bindings: Bindings }>();

app.route("/", index);
app.route("/auth", auth);

export default app;
