import type { D1Database } from "@cloudflare/workers-types";

export interface Idea {
	id: number;
	user_id: string;
	title: string;
	tags: string[];
	estimated_minutes?: number | null;
	created_at: string;
	updated_at: string;
}

interface IdeaRow {
	id: number;
	user_id: string;
	title: string;
	tags: string;
	estimated_minutes?: number | null;
	created_at: string;
	updated_at: string;
}

export class IdeaRepository {
	constructor(private db: D1Database) {}

	/**
	 * ユーザーIDでアイデア一覧を取得（作成日時の降順）
	 */
	async findByUserId(userId: string): Promise<Idea[]> {
		const { results } = await this.db
			.prepare(
				"SELECT id, title, tags, estimated_minutes, created_at, updated_at FROM ideas WHERE user_id = ? ORDER BY created_at DESC",
			)
			.bind(userId)
			.all<IdeaRow>();

		// タグのJSON文字列を配列にパース
		return results.map((idea) => ({
			...idea,
			user_id: userId,
			tags: idea.tags ? JSON.parse(idea.tags) : [],
		}));
	}

	/**
	 * IDでアイデアを取得
	 */
	async findById(id: number): Promise<Idea | null> {
		const row = await this.db
			.prepare("SELECT * FROM ideas WHERE id = ?")
			.bind(id)
			.first<IdeaRow>();

		if (!row) {
			return null;
		}

		return {
			...row,
			tags: row.tags ? JSON.parse(row.tags) : [],
		};
	}
}
