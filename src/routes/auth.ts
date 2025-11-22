import {Hono} from "hono";
import type {Bindings} from "../types/bindings";
import {getGitHubAccessToken, getGitHubUser} from "../lib/github";
import {generateAccessToken} from "../lib/jwt";
import {
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
} from "../lib/password";

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

// メールアドレス/パスワードでサインアップ
app.post("/signup", async (c) => {
  try {
    const body = await c.req.json<{
      email: string;
      password: string;
      name: string;
    }>();

    const {email, password, name} = body;

    // バリデーション
    if (!email || !password || !name) {
      return c.json({error: "メールアドレス、パスワード、名前は必須です"}, 400);
    }

    // パスワード強度チェック
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return c.json({error: passwordValidation.errors.join(", ")}, 400);
    }

    // 既存ユーザーチェック
    const existingUser = await c.env.DB.prepare(
      "SELECT * FROM users WHERE email = ?"
    )
      .bind(email)
      .first();

    if (existingUser) {
      return c.json({error: "このメールアドレスは既に登録されています"}, 409);
    }

    // パスワードをハッシュ化
    const passwordHash = await hashPassword(password);

    // ユーザーを作成
    const userId = crypto.randomUUID();
    await c.env.DB.prepare(
      "INSERT INTO users (id, email, name, password_hash) VALUES (?, ?, ?, ?)"
    )
      .bind(userId, email, name, passwordHash)
      .run();

    // JWT トークンを生成
    const token = await generateAccessToken(
      {
        id: userId,
        email: email,
        name: name,
      },
      c.env.JWT_SECRET
    );

    // トークンを Cookie に設定
    c.header(
      "Set-Cookie",
      `token=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=3600`
    );

    return c.json({success: true, redirect: "/dashboard"});
  } catch (error) {
    console.error("Signup error:", error);
    return c.json({error: "サインアップに失敗しました"}, 500);
  }
});

// メールアドレス/パスワードでログイン
app.post("/login", async (c) => {
  try {
    console.log("=== Login Debug ===");
    const body = await c.req.json<{
      email: string;
      password: string;
    }>();

    const {email, password} = body;
    console.log("Email:", email);
    console.log("Password length:", password?.length);

    // バリデーション
    if (!email || !password) {
      console.log("Validation failed: email or password missing");
      return c.json({error: "メールアドレスとパスワードは必須です"}, 400);
    }

    // ユーザーを取得
    const user = await c.env.DB.prepare("SELECT * FROM users WHERE email = ?")
      .bind(email)
      .first();

    console.log("User found:", !!user);
    if (!user) {
      console.log("User not found");
      return c.json(
        {error: "メールアドレスまたはパスワードが正しくありません"},
        401
      );
    }

    console.log("User has password_hash:", !!user.password_hash);
    // password_hash が存在しない場合（GitHub OAuth のみのユーザー）
    if (!user.password_hash) {
      console.log("No password_hash");
      return c.json(
        {error: "このアカウントは GitHub でログインしてください"},
        401
      );
    }

    // パスワードを検証
    console.log("Verifying password...");
    const isValid = await verifyPassword(
      password,
      user.password_hash as string
    );
    console.log("Password valid:", isValid);
    if (!isValid) {
      console.log("Password verification failed");
      return c.json(
        {error: "メールアドレスまたはパスワードが正しくありません"},
        401
      );
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

    // トークンを Cookie に設定
    c.header(
      "Set-Cookie",
      `token=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=3600`
    );

    return c.json({success: true, redirect: "/dashboard"});
  } catch (error) {
    console.error("Login error:", error);
    return c.json({error: "ログインに失敗しました"}, 500);
  }
});

// パスワード設定（GitHub OAuth ユーザー向け）
app.post("/set-password", async (c) => {
  try {
    // Cookie から JWT トークンを取得
    const cookieHeader = c.req.header("Cookie");
    if (!cookieHeader) {
      return c.json({error: "認証が必要です"}, 401);
    }

    const cookies = cookieHeader.split(";").reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split("=");
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);

    const token = cookies.token;
    if (!token) {
      return c.json({error: "認証が必要です"}, 401);
    }

    // JWT を検証してユーザー情報を取得
    const {verifyJWT} = await import("../lib/jwt");
    const payload = await verifyJWT(token, c.env.JWT_SECRET);

    const body = await c.req.json<{
      password: string;
    }>();

    const {password} = body;

    // バリデーション
    if (!password) {
      return c.json({error: "パスワードは必須です"}, 400);
    }

    // パスワード強度チェック
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return c.json({error: passwordValidation.errors.join(", ")}, 400);
    }

    // パスワードをハッシュ化
    const passwordHash = await hashPassword(password);

    // ユーザーのパスワードを更新
    await c.env.DB.prepare("UPDATE users SET password_hash = ? WHERE id = ?")
      .bind(passwordHash, payload.sub)
      .run();

    return c.json({success: true, message: "パスワードが設定されました"});
  } catch (error) {
    console.error("Set password error:", error);
    return c.json({error: "パスワードの設定に失敗しました"}, 500);
  }
});

export default app;
