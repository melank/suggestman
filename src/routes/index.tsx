import { Hono } from "hono";
import type { Bindings } from "../types/bindings";
import { home, health, chromeDevTools } from "../handlers/home";

const app = new Hono<{ Bindings: Bindings }>();

// ルートページ（ログイン画面）
app.get("/", ...home);

// ヘルスチェック
app.get("/health", ...health);

// Chrome DevTools のリクエストを静かに処理
app.get("/.well-known/appspecific/com.chrome.devtools.json", ...chromeDevTools);

export default app;
