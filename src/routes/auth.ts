import {Hono} from "hono";
import type {Bindings} from "../types/bindings";
import {getGitHubAccessToken, getGitHubUser} from "../lib/github";
import {generateAccessToken} from "../lib/jwt";

const app = new Hono<{Bindings: Bindings}>();

// GitHub OAuth 認証開始
app.get("/github", (c) => {
  const clientId = c.env.GITHUB_CLIENT_ID;
  const redirectUri = `${new URL(c.req.url).origin}/api/auth/github/callback`;

  const githubAuthUrl = new URL("https://github.com/login/oauth/authorize");
  githubAuthUrl.searchParams.set("client_id", clientId);
  githubAuthUrl.searchParams.set("redirect_uri", redirectUri);
  githubAuthUrl.searchParams.set("scope", "user:email");

  return c.redirect(githubAuthUrl.toString());
});

// GitHub OAuth コールバック
app.get("/github/callback", async (c) => {
  const code = c.req.query("code");

  if (!code) {
    return c.json({error: "Authorization code not found"}, 400);
  }

  try {
    // GitHub アクセストークンを取得
    const accessToken = await getGitHubAccessToken(
      code,
      c.env.GITHUB_CLIENT_ID,
      c.env.GITHUB_CLIENT_SECRET
    );

    // GitHub ユーザー情報を取得
    const githubUser = await getGitHubUser(accessToken);

    // データベースからユーザーを取得または作成
    let user = await c.env.DB.prepare("SELECT * FROM users WHERE github_id = ?")
      .bind(githubUser.id.toString())
      .first();

    if (!user) {
      // 新規ユーザー作成
      const userId = crypto.randomUUID();
      await c.env.DB.prepare(
        "INSERT INTO users (id, email, name, github_id) VALUES (?, ?, ?, ?)"
      )
        .bind(
          userId,
          githubUser.email,
          githubUser.name || githubUser.login,
          githubUser.id.toString()
        )
        .run();

      user = {
        id: userId,
        email: githubUser.email,
        name: githubUser.name || githubUser.login,
        github_id: githubUser.id.toString(),
      };
    }

    // JWT トークンを生成
    const token = await generateAccessToken(
      {
        id: user.id as string,
        email: user.email as string,
        name: user.name as string,
      },
      c.env.JWT_SECRET
    );

    // トークンを Cookie に設定してダッシュボードにリダイレクト
    c.header(
      "Set-Cookie",
      `token=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=3600`
    );
    return c.redirect("/dashboard");
  } catch (error) {
    console.error("GitHub OAuth error:", error);
    return c.json(
      {error: "Authentication failed", details: String(error)},
      500
    );
  }
});

export default app;
