import type { D1Database } from "@cloudflare/workers-types";

export interface User {
	id: string;
	email: string;
	name: string;
	github_id?: string | null;
	password_hash?: string | null;
	created_at?: string;
	updated_at?: string;
}

export interface CreateUserData {
	id: string;
	email: string | null;
	name: string;
	github_id?: string;
	password_hash?: string;
}

export class UserRepository {
	constructor(private db: D1Database) {}

	/**
	 * メールアドレスでユーザーを検索
	 */
	async findByEmail(email: string): Promise<User | null> {
		return await this.db
			.prepare("SELECT * FROM users WHERE email = ?")
			.bind(email)
			.first<User>();
	}

	/**
	 * GitHub IDでユーザーを検索
	 */
	async findByGitHubId(githubId: string): Promise<User | null> {
		return await this.db
			.prepare("SELECT * FROM users WHERE github_id = ?")
			.bind(githubId)
			.first<User>();
	}

	/**
	 * IDでユーザーを検索
	 */
	async findById(id: string): Promise<User | null> {
		return await this.db
			.prepare("SELECT * FROM users WHERE id = ?")
			.bind(id)
			.first<User>();
	}

	/**
	 * 新規ユーザーを作成
	 */
	async create(userData: CreateUserData): Promise<void> {
		const { id, email, name, github_id, password_hash } = userData;

		if (github_id) {
			// GitHub OAuth ユーザー
			await this.db
				.prepare(
					"INSERT INTO users (id, email, name, github_id) VALUES (?, ?, ?, ?)",
				)
				.bind(id, email, name, github_id)
				.run();
		} else {
			// パスワード認証ユーザー
			await this.db
				.prepare(
					"INSERT INTO users (id, email, name, password_hash) VALUES (?, ?, ?, ?)",
				)
				.bind(id, email, name, password_hash)
				.run();
		}
	}

	/**
	 * ユーザーのパスワードを更新
	 */
	async updatePassword(userId: string, passwordHash: string): Promise<void> {
		await this.db
			.prepare("UPDATE users SET password_hash = ? WHERE id = ?")
			.bind(passwordHash, userId)
			.run();
	}
}
