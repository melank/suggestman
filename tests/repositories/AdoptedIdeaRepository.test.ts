import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { AdoptedIdeaRepository } from "../../src/repositories/AdoptedIdeaRepository";
import type { AdoptedIdeaStatus } from "../../src/repositories/AdoptedIdeaRepository";

describe("AdoptedIdeaRepository", () => {
	describe("findByUserId", () => {
		it("should return adopted ideas for user", async () => {
			const mockResults = [
				{
					id: 1,
					idea_id: 1,
					user_id: "user-123",
					status: "実行待ち" as AdoptedIdeaStatus,
					note: "メモ1",
					adopted_at: "2024-01-01T00:00:00Z",
					started_at: null,
					completed_at: null,
					created_at: "2024-01-01T00:00:00Z",
					updated_at: "2024-01-01T00:00:00Z",
				},
				{
					id: 2,
					idea_id: 2,
					user_id: "user-123",
					status: "完了" as AdoptedIdeaStatus,
					note: null,
					adopted_at: "2024-01-02T00:00:00Z",
					started_at: "2024-01-02T10:00:00Z",
					completed_at: "2024-01-02T11:00:00Z",
					created_at: "2024-01-02T00:00:00Z",
					updated_at: "2024-01-02T11:00:00Z",
				},
			];

			const mockAll = (jest.fn() as any).mockResolvedValue({
				results: mockResults,
			});
			const mockBind = (jest.fn() as any).mockReturnValue({
				all: mockAll,
			});
			const mockPrepare = (jest.fn() as any).mockReturnValue({
				bind: mockBind,
			});

			const mockDB: any = {
				prepare: mockPrepare,
			};

			const repository = new AdoptedIdeaRepository(mockDB);
			const result = await repository.findByUserId("user-123");

			expect(mockPrepare).toHaveBeenCalledWith(
				"SELECT * FROM adopted_ideas WHERE user_id = ? ORDER BY adopted_at DESC",
			);
			expect(mockBind).toHaveBeenCalledWith("user-123");
			expect(result).toEqual(mockResults);
		});

		it("should return empty array when user has no adopted ideas", async () => {
			const mockAll = (jest.fn() as any).mockResolvedValue({
				results: [],
			});
			const mockBind = (jest.fn() as any).mockReturnValue({
				all: mockAll,
			});
			const mockPrepare = (jest.fn() as any).mockReturnValue({
				bind: mockBind,
			});

			const mockDB: any = {
				prepare: mockPrepare,
			};

			const repository = new AdoptedIdeaRepository(mockDB);
			const result = await repository.findByUserId("user-123");

			expect(result).toEqual([]);
		});
	});

	describe("findById", () => {
		it("should return adopted idea when found", async () => {
			const mockAdoptedIdea = {
				id: 1,
				idea_id: 1,
				user_id: "user-123",
				status: "実行中" as AdoptedIdeaStatus,
				note: "進行中",
				adopted_at: "2024-01-01T00:00:00Z",
				started_at: "2024-01-01T10:00:00Z",
				completed_at: null,
				created_at: "2024-01-01T00:00:00Z",
				updated_at: "2024-01-01T10:00:00Z",
			};

			const mockFirst = (jest.fn() as any).mockResolvedValue(mockAdoptedIdea);
			const mockBind = (jest.fn() as any).mockReturnValue({
				first: mockFirst,
			});
			const mockPrepare = (jest.fn() as any).mockReturnValue({
				bind: mockBind,
			});

			const mockDB: any = {
				prepare: mockPrepare,
			};

			const repository = new AdoptedIdeaRepository(mockDB);
			const result = await repository.findById(1);

			expect(mockPrepare).toHaveBeenCalledWith(
				"SELECT * FROM adopted_ideas WHERE id = ?",
			);
			expect(mockBind).toHaveBeenCalledWith(1);
			expect(result).toEqual(mockAdoptedIdea);
		});

		it("should return null when adopted idea not found", async () => {
			const mockFirst = (jest.fn() as any).mockResolvedValue(null);
			const mockBind = (jest.fn() as any).mockReturnValue({
				first: mockFirst,
			});
			const mockPrepare = (jest.fn() as any).mockReturnValue({
				bind: mockBind,
			});

			const mockDB: any = {
				prepare: mockPrepare,
			};

			const repository = new AdoptedIdeaRepository(mockDB);
			const result = await repository.findById(999);

			expect(result).toBeNull();
		});
	});

	describe("findByIdeaId", () => {
		it("should return adoption history for idea", async () => {
			const mockResults = [
				{
					id: 1,
					idea_id: 1,
					user_id: "user-123",
					status: "完了" as AdoptedIdeaStatus,
					note: "1回目",
					adopted_at: "2024-01-02T00:00:00Z",
					started_at: "2024-01-02T10:00:00Z",
					completed_at: "2024-01-02T11:00:00Z",
					created_at: "2024-01-02T00:00:00Z",
					updated_at: "2024-01-02T11:00:00Z",
				},
				{
					id: 2,
					idea_id: 1,
					user_id: "user-123",
					status: "実行待ち" as AdoptedIdeaStatus,
					note: "2回目",
					adopted_at: "2024-01-01T00:00:00Z",
					started_at: null,
					completed_at: null,
					created_at: "2024-01-01T00:00:00Z",
					updated_at: "2024-01-01T00:00:00Z",
				},
			];

			const mockAll = (jest.fn() as any).mockResolvedValue({
				results: mockResults,
			});
			const mockBind = (jest.fn() as any).mockReturnValue({
				all: mockAll,
			});
			const mockPrepare = (jest.fn() as any).mockReturnValue({
				bind: mockBind,
			});

			const mockDB: any = {
				prepare: mockPrepare,
			};

			const repository = new AdoptedIdeaRepository(mockDB);
			const result = await repository.findByIdeaId(1);

			expect(mockPrepare).toHaveBeenCalledWith(
				"SELECT * FROM adopted_ideas WHERE idea_id = ? ORDER BY adopted_at DESC",
			);
			expect(mockBind).toHaveBeenCalledWith(1);
			expect(result).toEqual(mockResults);
		});

		it("should return empty array when idea has never been adopted", async () => {
			const mockAll = (jest.fn() as any).mockResolvedValue({
				results: [],
			});
			const mockBind = (jest.fn() as any).mockReturnValue({
				all: mockAll,
			});
			const mockPrepare = (jest.fn() as any).mockReturnValue({
				bind: mockBind,
			});

			const mockDB: any = {
				prepare: mockPrepare,
			};

			const repository = new AdoptedIdeaRepository(mockDB);
			const result = await repository.findByIdeaId(999);

			expect(result).toEqual([]);
		});
	});

	describe("create", () => {
		it("should create adopted idea with note", async () => {
			const mockCreatedIdea = {
				id: 1,
				idea_id: 1,
				user_id: "user-123",
				status: "実行待ち" as AdoptedIdeaStatus,
				note: "メモ付き",
				adopted_at: "2024-01-01T00:00:00Z",
				started_at: null,
				completed_at: null,
				created_at: "2024-01-01T00:00:00Z",
				updated_at: "2024-01-01T00:00:00Z",
			};

			const mockRun = (jest.fn() as any).mockResolvedValue({
				success: true,
				meta: { last_row_id: 1 },
			});
			const mockBindInsert = (jest.fn() as any).mockReturnValue({
				run: mockRun,
			});
			const mockPrepareInsert = (jest.fn() as any).mockReturnValue({
				bind: mockBindInsert,
			});

			const mockFirst = (jest.fn() as any).mockResolvedValue(mockCreatedIdea);
			const mockBindSelect = (jest.fn() as any).mockReturnValue({
				first: mockFirst,
			});
			const mockPrepareSelect = (jest.fn() as any).mockReturnValue({
				bind: mockBindSelect,
			});

			let callCount = 0;
			const mockDB: any = {
				prepare: (jest.fn() as any).mockImplementation((sql: string) => {
					callCount++;
					if (callCount === 1) {
						return mockPrepareInsert();
					}
					return mockPrepareSelect();
				}),
			};

			const repository = new AdoptedIdeaRepository(mockDB);
			const result = await repository.create({
				idea_id: 1,
				user_id: "user-123",
				note: "メモ付き",
			});

			expect(result).toEqual(mockCreatedIdea);
		});

		it("should create adopted idea without note", async () => {
			const mockCreatedIdea = {
				id: 1,
				idea_id: 1,
				user_id: "user-123",
				status: "実行待ち" as AdoptedIdeaStatus,
				note: null,
				adopted_at: "2024-01-01T00:00:00Z",
				started_at: null,
				completed_at: null,
				created_at: "2024-01-01T00:00:00Z",
				updated_at: "2024-01-01T00:00:00Z",
			};

			const mockRun = (jest.fn() as any).mockResolvedValue({
				success: true,
				meta: { last_row_id: 1 },
			});
			const mockBindInsert = (jest.fn() as any).mockReturnValue({
				run: mockRun,
			});
			const mockPrepareInsert = (jest.fn() as any).mockReturnValue({
				bind: mockBindInsert,
			});

			const mockFirst = (jest.fn() as any).mockResolvedValue(mockCreatedIdea);
			const mockBindSelect = (jest.fn() as any).mockReturnValue({
				first: mockFirst,
			});
			const mockPrepareSelect = (jest.fn() as any).mockReturnValue({
				bind: mockBindSelect,
			});

			let callCount = 0;
			const mockDB: any = {
				prepare: (jest.fn() as any).mockImplementation((sql: string) => {
					callCount++;
					if (callCount === 1) {
						return mockPrepareInsert();
					}
					return mockPrepareSelect();
				}),
			};

			const repository = new AdoptedIdeaRepository(mockDB);
			const result = await repository.create({
				idea_id: 1,
				user_id: "user-123",
			});

			expect(result).toEqual(mockCreatedIdea);
		});

		it("should throw error when creation fails", async () => {
			const mockRun = (jest.fn() as any).mockResolvedValue({
				success: true,
				meta: { last_row_id: null },
			});
			const mockBindInsert = (jest.fn() as any).mockReturnValue({
				run: mockRun,
			});
			const mockPrepareInsert = (jest.fn() as any).mockReturnValue({
				bind: mockBindInsert,
			});

			const mockFirst = (jest.fn() as any).mockResolvedValue(null);
			const mockBindSelect = (jest.fn() as any).mockReturnValue({
				first: mockFirst,
			});
			const mockPrepareSelect = (jest.fn() as any).mockReturnValue({
				bind: mockBindSelect,
			});

			let callCount = 0;
			const mockDB: any = {
				prepare: (jest.fn() as any).mockImplementation((sql: string) => {
					callCount++;
					if (callCount === 1) {
						return mockPrepareInsert();
					}
					return mockPrepareSelect();
				}),
			};

			const repository = new AdoptedIdeaRepository(mockDB);

			await expect(
				repository.create({
					idea_id: 1,
					user_id: "user-123",
				}),
			).rejects.toThrow("Failed to create adopted idea");
		});
	});

	describe("updateStatus", () => {
		it("should update status to 実行中 and set started_at", async () => {
			const mockUpdatedIdea = {
				id: 1,
				idea_id: 1,
				user_id: "user-123",
				status: "実行中" as AdoptedIdeaStatus,
				note: null,
				adopted_at: "2024-01-01T00:00:00Z",
				started_at: "2024-01-01T10:00:00Z",
				completed_at: null,
				created_at: "2024-01-01T00:00:00Z",
				updated_at: "2024-01-01T10:00:00Z",
			};

			const mockRun = (jest.fn() as any).mockResolvedValue({ success: true });
			const mockBindUpdate = (jest.fn() as any).mockReturnValue({
				run: mockRun,
			});
			const mockPrepareUpdate = (jest.fn() as any).mockReturnValue({
				bind: mockBindUpdate,
			});

			const mockFirst = (jest.fn() as any).mockResolvedValue(mockUpdatedIdea);
			const mockBindSelect = (jest.fn() as any).mockReturnValue({
				first: mockFirst,
			});
			const mockPrepareSelect = (jest.fn() as any).mockReturnValue({
				bind: mockBindSelect,
			});

			let callCount = 0;
			const mockDB: any = {
				prepare: (jest.fn() as any).mockImplementation((sql: string) => {
					callCount++;
					if (callCount === 1) {
						return mockPrepareUpdate();
					}
					return mockPrepareSelect();
				}),
			};

			const repository = new AdoptedIdeaRepository(mockDB);
			const result = await repository.updateStatus(1, "実行中");

			expect(result).toEqual(mockUpdatedIdea);
		});

		it("should update status to 完了 and set completed_at", async () => {
			const mockUpdatedIdea = {
				id: 1,
				idea_id: 1,
				user_id: "user-123",
				status: "完了" as AdoptedIdeaStatus,
				note: null,
				adopted_at: "2024-01-01T00:00:00Z",
				started_at: "2024-01-01T10:00:00Z",
				completed_at: "2024-01-01T11:00:00Z",
				created_at: "2024-01-01T00:00:00Z",
				updated_at: "2024-01-01T11:00:00Z",
			};

			const mockRun = (jest.fn() as any).mockResolvedValue({ success: true });
			const mockBindUpdate = (jest.fn() as any).mockReturnValue({
				run: mockRun,
			});
			const mockPrepareUpdate = (jest.fn() as any).mockReturnValue({
				bind: mockBindUpdate,
			});

			const mockFirst = (jest.fn() as any).mockResolvedValue(mockUpdatedIdea);
			const mockBindSelect = (jest.fn() as any).mockReturnValue({
				first: mockFirst,
			});
			const mockPrepareSelect = (jest.fn() as any).mockReturnValue({
				bind: mockBindSelect,
			});

			let callCount = 0;
			const mockDB: any = {
				prepare: (jest.fn() as any).mockImplementation((sql: string) => {
					callCount++;
					if (callCount === 1) {
						return mockPrepareUpdate();
					}
					return mockPrepareSelect();
				}),
			};

			const repository = new AdoptedIdeaRepository(mockDB);
			const result = await repository.updateStatus(1, "完了");

			expect(result).toEqual(mockUpdatedIdea);
		});

		it("should update status to 中断 and set completed_at", async () => {
			const mockUpdatedIdea = {
				id: 1,
				idea_id: 1,
				user_id: "user-123",
				status: "中断" as AdoptedIdeaStatus,
				note: "時間切れ",
				adopted_at: "2024-01-01T00:00:00Z",
				started_at: "2024-01-01T10:00:00Z",
				completed_at: "2024-01-01T10:30:00Z",
				created_at: "2024-01-01T00:00:00Z",
				updated_at: "2024-01-01T10:30:00Z",
			};

			const mockRun = (jest.fn() as any).mockResolvedValue({ success: true });
			const mockBindUpdate = (jest.fn() as any).mockReturnValue({
				run: mockRun,
			});
			const mockPrepareUpdate = (jest.fn() as any).mockReturnValue({
				bind: mockBindUpdate,
			});

			const mockFirst = (jest.fn() as any).mockResolvedValue(mockUpdatedIdea);
			const mockBindSelect = (jest.fn() as any).mockReturnValue({
				first: mockFirst,
			});
			const mockPrepareSelect = (jest.fn() as any).mockReturnValue({
				bind: mockBindSelect,
			});

			let callCount = 0;
			const mockDB: any = {
				prepare: (jest.fn() as any).mockImplementation((sql: string) => {
					callCount++;
					if (callCount === 1) {
						return mockPrepareUpdate();
					}
					return mockPrepareSelect();
				}),
			};

			const repository = new AdoptedIdeaRepository(mockDB);
			const result = await repository.updateStatus(1, "中断");

			expect(result).toEqual(mockUpdatedIdea);
		});

		it("should update status to 実行待ち without timestamp", async () => {
			const mockUpdatedIdea = {
				id: 1,
				idea_id: 1,
				user_id: "user-123",
				status: "実行待ち" as AdoptedIdeaStatus,
				note: null,
				adopted_at: "2024-01-01T00:00:00Z",
				started_at: null,
				completed_at: null,
				created_at: "2024-01-01T00:00:00Z",
				updated_at: "2024-01-01T00:00:00Z",
			};

			const mockRun = (jest.fn() as any).mockResolvedValue({ success: true });
			const mockBindUpdate = (jest.fn() as any).mockReturnValue({
				run: mockRun,
			});
			const mockPrepareUpdate = (jest.fn() as any).mockReturnValue({
				bind: mockBindUpdate,
			});

			const mockFirst = (jest.fn() as any).mockResolvedValue(mockUpdatedIdea);
			const mockBindSelect = (jest.fn() as any).mockReturnValue({
				first: mockFirst,
			});
			const mockPrepareSelect = (jest.fn() as any).mockReturnValue({
				bind: mockBindSelect,
			});

			let callCount = 0;
			const mockDB: any = {
				prepare: (jest.fn() as any).mockImplementation((sql: string) => {
					callCount++;
					if (callCount === 1) {
						return mockPrepareUpdate();
					}
					return mockPrepareSelect();
				}),
			};

			const repository = new AdoptedIdeaRepository(mockDB);
			const result = await repository.updateStatus(1, "実行待ち");

			expect(result).toEqual(mockUpdatedIdea);
		});
	});

	describe("updateNote", () => {
		it("should update note successfully", async () => {
			const mockUpdatedIdea = {
				id: 1,
				idea_id: 1,
				user_id: "user-123",
				status: "実行中" as AdoptedIdeaStatus,
				note: "更新されたメモ",
				adopted_at: "2024-01-01T00:00:00Z",
				started_at: "2024-01-01T10:00:00Z",
				completed_at: null,
				created_at: "2024-01-01T00:00:00Z",
				updated_at: "2024-01-01T10:30:00Z",
			};

			const mockRun = (jest.fn() as any).mockResolvedValue({ success: true });
			const mockBindUpdate = (jest.fn() as any).mockReturnValue({
				run: mockRun,
			});
			const mockPrepareUpdate = (jest.fn() as any).mockReturnValue({
				bind: mockBindUpdate,
			});

			const mockFirst = (jest.fn() as any).mockResolvedValue(mockUpdatedIdea);
			const mockBindSelect = (jest.fn() as any).mockReturnValue({
				first: mockFirst,
			});
			const mockPrepareSelect = (jest.fn() as any).mockReturnValue({
				bind: mockBindSelect,
			});

			let callCount = 0;
			const mockDB: any = {
				prepare: (jest.fn() as any).mockImplementation((sql: string) => {
					callCount++;
					if (callCount === 1) {
						return mockPrepareUpdate();
					}
					return mockPrepareSelect();
				}),
			};

			const repository = new AdoptedIdeaRepository(mockDB);
			const result = await repository.updateNote(1, "更新されたメモ");

			expect(result).toEqual(mockUpdatedIdea);
		});

		it("should return null when adopted idea not found", async () => {
			const mockRun = (jest.fn() as any).mockResolvedValue({ success: true });
			const mockBindUpdate = (jest.fn() as any).mockReturnValue({
				run: mockRun,
			});
			const mockPrepareUpdate = (jest.fn() as any).mockReturnValue({
				bind: mockBindUpdate,
			});

			const mockFirst = (jest.fn() as any).mockResolvedValue(null);
			const mockBindSelect = (jest.fn() as any).mockReturnValue({
				first: mockFirst,
			});
			const mockPrepareSelect = (jest.fn() as any).mockReturnValue({
				bind: mockBindSelect,
			});

			let callCount = 0;
			const mockDB: any = {
				prepare: (jest.fn() as any).mockImplementation((sql: string) => {
					callCount++;
					if (callCount === 1) {
						return mockPrepareUpdate();
					}
					return mockPrepareSelect();
				}),
			};

			const repository = new AdoptedIdeaRepository(mockDB);
			const result = await repository.updateNote(999, "メモ");

			expect(result).toBeNull();
		});
	});
});
