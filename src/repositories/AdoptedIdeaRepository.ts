import type { D1Database } from "@cloudflare/workers-types";

export type AdoptedIdeaStatus = "実行待ち" | "実行中" | "中断" | "完了";

export interface AdoptedIdea {
	id: number;
	idea_id: number;
	user_id: string;
	status: AdoptedIdeaStatus;
	note?: string | null;
	adopted_at: string;
	started_at?: string | null;
	completed_at?: string | null;
	created_at: string;
	updated_at: string;
}

interface AdoptedIdeaRow {
	id: number;
	idea_id: number;
	user_id: string;
	status: AdoptedIdeaStatus;
	note?: string | null;
	adopted_at: string;
	started_at?: string | null;
	completed_at?: string | null;
	created_at: string;
	updated_at: string;
}

export class AdoptedIdeaRepository {
	constructor(private db: D1Database) {}

	/**
	 * ユーザーIDで採用されたアイデア一覧を取得
	 */
	async findByUserId(userId: string): Promise<AdoptedIdea[]> {
		const { results } = await this.db
			.prepare(
				"SELECT * FROM adopted_ideas WHERE user_id = ? ORDER BY adopted_at DESC",
			)
			.bind(userId)
			.all<AdoptedIdeaRow>();

		return results;
	}

	/**
	 * IDで採用されたアイデアを取得
	 */
	async findById(id: number): Promise<AdoptedIdea | null> {
		const row = await this.db
			.prepare("SELECT * FROM adopted_ideas WHERE id = ?")
			.bind(id)
			.first<AdoptedIdeaRow>();

		return row;
	}

	/**
	 * アイデアIDで採用履歴を取得
	 */
	async findByIdeaId(ideaId: number): Promise<AdoptedIdea[]> {
		const { results } = await this.db
			.prepare(
				"SELECT * FROM adopted_ideas WHERE idea_id = ? ORDER BY adopted_at DESC",
			)
			.bind(ideaId)
			.all<AdoptedIdeaRow>();

		return results;
	}

	/**
	 * 新しい採用レコードを作成
	 */
	async create(data: {
		idea_id: number;
		user_id: string;
		note?: string | null;
	}): Promise<AdoptedIdea> {
		const now = new Date().toISOString();

		// INTEGER AUTOINCREMENT なので id は指定しない
		const result = await this.db
			.prepare(
				"INSERT INTO adopted_ideas (idea_id, user_id, status, note, adopted_at, created_at, updated_at) VALUES (?, ?, '実行待ち', ?, ?, ?, ?)",
			)
			.bind(data.idea_id, data.user_id, data.note || null, now, now, now)
			.run();

		// D1 の結果から lastRowId を取得
		const lastId = result.meta.last_row_id;
		if (!lastId) {
			throw new Error("Failed to create adopted idea");
		}

		const created = await this.findById(lastId);
		if (!created) {
			throw new Error("Failed to create adopted idea");
		}

		return created;
	}

	/**
	 * ステータスを更新
	 */
	async updateStatus(
		id: number,
		status: AdoptedIdeaStatus,
	): Promise<AdoptedIdea | null> {
		const now = new Date().toISOString();

		// ステータスに応じてタイムスタンプを更新
		let timestampUpdate = "";
		if (status === "実行中") {
			timestampUpdate = ", started_at = ?";
		} else if (status === "完了" || status === "中断") {
			timestampUpdate = ", completed_at = ?";
		}

		const query = `UPDATE adopted_ideas SET status = ?, updated_at = ?${timestampUpdate} WHERE id = ?`;

		if (timestampUpdate) {
			await this.db.prepare(query).bind(status, now, now, id).run();
		} else {
			await this.db.prepare(query).bind(status, now, id).run();
		}

		return await this.findById(id);
	}

	/**
	 * メモを更新
	 */
	async updateNote(id: number, note: string): Promise<AdoptedIdea | null> {
		const now = new Date().toISOString();

		await this.db
			.prepare("UPDATE adopted_ideas SET note = ?, updated_at = ? WHERE id = ?")
			.bind(note, now, id)
			.run();

		return await this.findById(id);
	}
}
