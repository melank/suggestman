import { createFactory } from "hono/factory";
import type { Bindings } from "../types/bindings";
import { getGitHubAccessToken, getGitHubUser } from "../services/github";
import { generateAccessToken, verifyJWT } from "../services/jwt";
import {
	hashPassword,
	verifyPassword,
	validatePasswordStrength,
} from "../services/password";
import { UserRepository } from "../repositories/UserRepository";

const factory = createFactory<{ Bindings: Bindings }>();

// GitHub OAuth 認証開始
export const githubAuth = factory.createHandlers(async (c) => {
	const clientId = c.env.GITHUB_CLIENT_ID;
	const redirectUri = `${new URL(c.req.url).origin}/api/auth/github/callback`;

	const githubAuthUrl = new URL("https://github.com/login/oauth/authorize");
	githubAuthUrl.searchParams.set("client_id", clientId);
	githubAuthUrl.searchParams.set("redirect_uri", redirectUri);
	githubAuthUrl.searchParams.set("scope", "user:email");

	return c.redirect(githubAuthUrl.toString());
});

// GitHub OAuth コールバック
export const githubCallback = factory.createHandlers(async (c) => {
	const code = c.req.query("code");

	if (!code) {
		return c.json({ error: "Authorization code not found" }, 400);
	}

	try {
		const accessToken = await getGitHubAccessToken(
			code,
			c.env.GITHUB_CLIENT_ID,
			c.env.GITHUB_CLIENT_SECRET,
		);

		const githubUser = await getGitHubUser(accessToken);

		const userRepository = new UserRepository(c.env.DB);
		let user = await userRepository.findByGitHubId(githubUser.id.toString());

		if (!user) {
			const userId = crypto.randomUUID();
			const userName = githubUser.name || githubUser.login;
			await userRepository.create({
				id: userId,
				email: githubUser.email,
				name: userName,
				github_id: githubUser.id.toString(),
			});

			user = await userRepository.findByGitHubId(githubUser.id.toString());
			if (!user) {
				throw new Error("Failed to create user");
			}
		}

		const token = await generateAccessToken(
			{
				id: user.id,
				email: user.email,
				name: user.name,
			},
			c.env.JWT_SECRET,
		);

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
});

// サインアップ
export const signup = factory.createHandlers(async (c) => {
	try {
		const body = await c.req.json<{
			email: string;
			password: string;
			name: string;
		}>();

		const { email, password, name } = body;

		if (!email || !password || !name) {
			return c.json(
				{ error: "メールアドレス、パスワード、名前は必須です" },
				400,
			);
		}

		const passwordValidation = validatePasswordStrength(password);
		if (!passwordValidation.valid) {
			return c.json({ error: passwordValidation.errors.join(", ") }, 400);
		}

		const userRepository = new UserRepository(c.env.DB);
		const existingUser = await userRepository.findByEmail(email);

		if (existingUser) {
			return c.json({ error: "このメールアドレスは既に登録されています" }, 409);
		}

		const passwordHash = await hashPassword(password);

		const userId = crypto.randomUUID();
		await userRepository.create({
			id: userId,
			email,
			name,
			password_hash: passwordHash,
		});

		const token = await generateAccessToken(
			{
				id: userId,
				email,
				name,
			},
			c.env.JWT_SECRET,
		);

		c.header(
			"Set-Cookie",
			`token=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=3600`,
		);

		return c.json({ success: true, redirect: "/dashboard" });
	} catch (error) {
		console.error("Signup error:", error);
		return c.json({ error: "サインアップに失敗しました" }, 500);
	}
});

// ログイン
export const login = factory.createHandlers(async (c) => {
	try {
		const body = await c.req.json<{
			email: string;
			password: string;
		}>();

		const { email, password } = body;

		if (!email || !password) {
			return c.json({ error: "メールアドレスとパスワードは必須です" }, 400);
		}

		const userRepository = new UserRepository(c.env.DB);
		const user = await userRepository.findByEmail(email);

		if (!user) {
			return c.json(
				{ error: "メールアドレスまたはパスワードが正しくありません" },
				401,
			);
		}

		if (!user.password_hash) {
			return c.json(
				{ error: "このアカウントは GitHub でログインしてください" },
				401,
			);
		}

		const isValid = await verifyPassword(password, user.password_hash);
		if (!isValid) {
			return c.json(
				{ error: "メールアドレスまたはパスワードが正しくありません" },
				401,
			);
		}

		const token = await generateAccessToken(
			{
				id: user.id,
				email: user.email,
				name: user.name,
			},
			c.env.JWT_SECRET,
		);

		c.header(
			"Set-Cookie",
			`token=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=3600`,
		);

		return c.json({ success: true, redirect: "/dashboard" });
	} catch (error) {
		console.error("Login error:", error);
		return c.json({ error: "ログインに失敗しました" }, 500);
	}
});

// パスワード設定
export const setPassword = factory.createHandlers(async (c) => {
	try {
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

		const payload = await verifyJWT(token, c.env.JWT_SECRET);

		const body = await c.req.json<{
			password: string;
		}>();

		const { password } = body;

		if (!password) {
			return c.json({ error: "パスワードは必須です" }, 400);
		}

		const passwordValidation = validatePasswordStrength(password);
		if (!passwordValidation.valid) {
			return c.json({ error: passwordValidation.errors.join(", ") }, 400);
		}

		const passwordHash = await hashPassword(password);

		const userRepository = new UserRepository(c.env.DB);
		await userRepository.updatePassword(payload.sub, passwordHash);

		return c.json({ success: true, message: "パスワードが設定されました" });
	} catch (error) {
		console.error("Set password error:", error);
		return c.json({ error: "パスワードの設定に失敗しました" }, 500);
	}
});

// ログアウト
export const logout = factory.createHandlers(async (c) => {
	c.header(
		"Set-Cookie",
		"token=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0",
	);

	return c.redirect("/");
});
