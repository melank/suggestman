import type { Context } from "hono";
import type { Bindings } from "../types/bindings";
import { getGitHubAccessToken, getGitHubUser } from "../services/github";
import { generateAccessToken, verifyJWT } from "../services/jwt";
import {
	hashPassword,
	verifyPassword,
	validatePasswordStrength,
} from "../services/password";
import { UserRepository } from "../repositories/UserRepository";

export class AuthController {
	/**
	 * GitHub OAuth 認証開始
	 */
	static async githubAuth(c: Context<{ Bindings: Bindings }>) {
		const clientId = c.env.GITHUB_CLIENT_ID;
		const redirectUri = `${new URL(c.req.url).origin}/api/auth/github/callback`;

		const githubAuthUrl = new URL("https://github.com/login/oauth/authorize");
		githubAuthUrl.searchParams.set("client_id", clientId);
		githubAuthUrl.searchParams.set("redirect_uri", redirectUri);
		githubAuthUrl.searchParams.set("scope", "user:email");

		return c.redirect(githubAuthUrl.toString());
	}

	/**
	 * GitHub OAuth コールバック
	 */
	static async githubCallback(c: Context<{ Bindings: Bindings }>) {
		const code = c.req.query("code");

		if (!code) {
			return c.json({ error: "Authorization code not found" }, 400);
		}

		try {
			// GitHub アクセストークンを取得
			const accessToken = await getGitHubAccessToken(
				code,
				c.env.GITHUB_CLIENT_ID,
				c.env.GITHUB_CLIENT_SECRET,
			);

			// GitHub ユーザー情報を取得
			const githubUser = await getGitHubUser(accessToken);

			// データベースからユーザーを取得または作成
			const userRepository = new UserRepository(c.env.DB);
			let user = await userRepository.findByGitHubId(githubUser.id.toString());

			if (!user) {
				// 新規ユーザー作成
				const userId = crypto.randomUUID();
				const userName = githubUser.name || githubUser.login;
				await userRepository.create({
					id: userId,
					email: githubUser.email,
					name: userName,
					github_id: githubUser.id.toString(),
				});

				// 作成したユーザーを再取得
				user = await userRepository.findByGitHubId(githubUser.id.toString());
				if (!user) {
					throw new Error("Failed to create user");
				}
			}

			// JWT トークンを生成
			const token = await generateAccessToken(
				{
					id: user.id,
					email: user.email,
					name: user.name,
				},
				c.env.JWT_SECRET,
			);

			// トークンを Cookie に設定してダッシュボードにリダイレクト
			c.header(
				"Set-Cookie",
				`token=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=3600`,
			);
			return c.redirect("/dashboard");
		} catch (error) {
			console.error("GitHub OAuth error:", error);
			return c.json(
				{ error: "Authentication failed", details: String(error) },
				500,
			);
		}
	}

	/**
	 * メールアドレス/パスワードでサインアップ
	 */
	static async signup(c: Context<{ Bindings: Bindings }>) {
		try {
			const body = await c.req.json<{
				email: string;
				password: string;
				name: string;
			}>();

			const { email, password, name } = body;

			// バリデーション
			if (!email || !password || !name) {
				return c.json(
					{ error: "メールアドレス、パスワード、名前は必須です" },
					400,
				);
			}

			// パスワード強度チェック
			const passwordValidation = validatePasswordStrength(password);
			if (!passwordValidation.valid) {
				return c.json({ error: passwordValidation.errors.join(", ") }, 400);
			}

			// 既存ユーザーチェック
			const userRepository = new UserRepository(c.env.DB);
			const existingUser = await userRepository.findByEmail(email);

			if (existingUser) {
				return c.json(
					{ error: "このメールアドレスは既に登録されています" },
					409,
				);
			}

			// パスワードをハッシュ化
			const passwordHash = await hashPassword(password);

			// ユーザーを作成
			const userId = crypto.randomUUID();
			await userRepository.create({
				id: userId,
				email,
				name,
				password_hash: passwordHash,
			});

			// JWT トークンを生成
			const token = await generateAccessToken(
				{
					id: userId,
					email,
					name,
				},
				c.env.JWT_SECRET,
			);

			// トークンを Cookie に設定
			c.header(
				"Set-Cookie",
				`token=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=3600`,
			);

			return c.json({ success: true, redirect: "/dashboard" });
		} catch (error) {
			console.error("Signup error:", error);
			return c.json({ error: "サインアップに失敗しました" }, 500);
		}
	}

	/**
	 * メールアドレス/パスワードでログイン
	 */
	static async login(c: Context<{ Bindings: Bindings }>) {
		try {
			const body = await c.req.json<{
				email: string;
				password: string;
			}>();

			const { email, password } = body;

			// バリデーション
			if (!email || !password) {
				return c.json({ error: "メールアドレスとパスワードは必須です" }, 400);
			}

			// ユーザーを取得
			const userRepository = new UserRepository(c.env.DB);
			const user = await userRepository.findByEmail(email);

			if (!user) {
				return c.json(
					{ error: "メールアドレスまたはパスワードが正しくありません" },
					401,
				);
			}

			// password_hash が存在しない場合（GitHub OAuth のみのユーザー）
			if (!user.password_hash) {
				return c.json(
					{ error: "このアカウントは GitHub でログインしてください" },
					401,
				);
			}

			// パスワードを検証
			const isValid = await verifyPassword(password, user.password_hash);
			if (!isValid) {
				return c.json(
					{ error: "メールアドレスまたはパスワードが正しくありません" },
					401,
				);
			}

			// JWT トークンを生成
			const token = await generateAccessToken(
				{
					id: user.id,
					email: user.email,
					name: user.name,
				},
				c.env.JWT_SECRET,
			);

			// トークンを Cookie に設定
			c.header(
				"Set-Cookie",
				`token=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=3600`,
			);

			return c.json({ success: true, redirect: "/dashboard" });
		} catch (error) {
			console.error("Login error:", error);
			return c.json({ error: "ログインに失敗しました" }, 500);
		}
	}

	/**
	 * パスワード設定（GitHub OAuth ユーザー向け）
	 */
	static async setPassword(c: Context<{ Bindings: Bindings }>) {
		try {
			// Cookie から JWT トークンを取得
			const cookieHeader = c.req.header("Cookie");
			if (!cookieHeader) {
				return c.json({ error: "認証が必要です" }, 401);
			}

			const cookies = cookieHeader.split(";").reduce(
				(acc, cookie) => {
					const [key, value] = cookie.trim().split("=");
					acc[key] = value;
					return acc;
				},
				{} as Record<string, string>,
			);

			const token = cookies.token;
			if (!token) {
				return c.json({ error: "認証が必要です" }, 401);
			}

			// JWT を検証してユーザー情報を取得
			const payload = await verifyJWT(token, c.env.JWT_SECRET);

			const body = await c.req.json<{
				password: string;
			}>();

			const { password } = body;

			// バリデーション
			if (!password) {
				return c.json({ error: "パスワードは必須です" }, 400);
			}

			// パスワード強度チェック
			const passwordValidation = validatePasswordStrength(password);
			if (!passwordValidation.valid) {
				return c.json({ error: passwordValidation.errors.join(", ") }, 400);
			}

			// パスワードをハッシュ化
			const passwordHash = await hashPassword(password);

			// ユーザーのパスワードを更新
			const userRepository = new UserRepository(c.env.DB);
			await userRepository.updatePassword(payload.sub, passwordHash);

			return c.json({ success: true, message: "パスワードが設定されました" });
		} catch (error) {
			console.error("Set password error:", error);
			return c.json({ error: "パスワードの設定に失敗しました" }, 500);
		}
	}

	/**
	 * ログアウト
	 */
	static async logout(c: Context<{ Bindings: Bindings }>) {
		// Cookie を削除（Max-Age=0 で即座に期限切れにする）
		c.header(
			"Set-Cookie",
			"token=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0",
		);

		// ログイン画面にリダイレクト
		return c.redirect("/");
	}
}
