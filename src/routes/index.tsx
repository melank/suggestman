import { Hono } from "hono";
import type { Bindings } from "../types/bindings";
import { HomeController } from "../controllers/home";

const app = new Hono<{ Bindings: Bindings }>();

app.get("/", HomeController.index);
app.get("/health", HomeController.health);

export default app;
