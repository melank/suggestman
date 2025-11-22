import { Hono } from "hono";
import type { Bindings } from "./types/bindings";
import index from "./routes/index";

const app = new Hono<{ Bindings: Bindings }>();

app.route("/", index);

export default app;
