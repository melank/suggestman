import {Hono} from "hono";
import type {Bindings} from "./types/bindings";
import index from "./routes/index";
import auth from "./routes/auth";
import dashboard from "./routes/dashboard";

const app = new Hono<{Bindings: Bindings}>();

app.route("/", index);
app.route("/api/auth", auth);
app.route("/dashboard", dashboard);

export default app;
