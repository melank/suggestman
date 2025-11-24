import { describe, it, expect, jest } from "@jest/globals";
import { IdeaRepository } from "../../src/repositories/IdeaRepository";

describe("IdeaRepository", () => {
	describe("findByUserId", () => {
		it("should return ideas with parsed tags", async () => {
			const mockResults = [
				{
					id: 1,
					title: "Learn TypeScript",
					tags: '["programming","learning"]',
					estimated_minutes: 60,
					created_at: "2024-01-01T00:00:00Z",
					updated_at: "2024-01-01T00:00:00Z",
				},
				{
					id: 2,
					title: "Write blog post",
					tags: null,
					estimated_minutes: 30,
					created_at: "2024-01-02T00:00:00Z",
					updated_at: "2024-01-02T00:00:00Z",
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

			const repository = new IdeaRepository(mockDB);
			const result = await repository.findByUserId("user-123");

			expect(mockPrepare).toHaveBeenCalledWith(
				"SELECT id, title, tags, estimated_minutes, created_at, updated_at FROM ideas WHERE user_id = ? ORDER BY created_at DESC",
			);
			expect(mockBind).toHaveBeenCalledWith("user-123");
			expect(result).toEqual([
				{
					id: 1,
					user_id: "user-123",
					title: "Learn TypeScript",
					tags: ["programming", "learning"],
					estimated_minutes: 60,
					created_at: "2024-01-01T00:00:00Z",
					updated_at: "2024-01-01T00:00:00Z",
				},
				{
					id: 2,
					user_id: "user-123",
					title: "Write blog post",
					tags: [],
					estimated_minutes: 30,
					created_at: "2024-01-02T00:00:00Z",
					updated_at: "2024-01-02T00:00:00Z",
				},
			]);
		});

		it("should return empty array when user has no ideas", async () => {
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

			const repository = new IdeaRepository(mockDB);
			const result = await repository.findByUserId("user-123");

			expect(result).toEqual([]);
		});

		it("should handle ideas with null tags", async () => {
			const mockResults = [
				{
					id: 1,
					title: "Simple idea",
					tags: null,
					estimated_minutes: null,
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

			const repository = new IdeaRepository(mockDB);
			const result = await repository.findByUserId("user-123");

			expect(result[0].tags).toEqual([]);
		});
	});

	describe("findById", () => {
		it("should return idea with parsed tags when found", async () => {
			const mockIdea = {
				id: 1,
				user_id: "user-123",
				title: "Learn TypeScript",
				tags: '["programming","learning"]',
				estimated_minutes: 60,
				created_at: "2024-01-01T00:00:00Z",
				updated_at: "2024-01-01T00:00:00Z",
			};

			const mockFirst = (jest.fn() as any).mockResolvedValue(mockIdea);
			const mockBind = (jest.fn() as any).mockReturnValue({
				first: mockFirst,
			});
			const mockPrepare = (jest.fn() as any).mockReturnValue({
				bind: mockBind,
			});

			const mockDB: any = {
				prepare: mockPrepare,
			};

			const repository = new IdeaRepository(mockDB);
			const result = await repository.findById(1);

			expect(mockPrepare).toHaveBeenCalledWith(
				"SELECT * FROM ideas WHERE id = ?",
			);
			expect(mockBind).toHaveBeenCalledWith(1);
			expect(result).toEqual({
				id: 1,
				user_id: "user-123",
				title: "Learn TypeScript",
				tags: ["programming", "learning"],
				estimated_minutes: 60,
				created_at: "2024-01-01T00:00:00Z",
				updated_at: "2024-01-01T00:00:00Z",
			});
		});

		it("should return null when idea not found", async () => {
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

			const repository = new IdeaRepository(mockDB);
			const result = await repository.findById(999);

			expect(result).toBeNull();
		});

		it("should handle ideas with null tags", async () => {
			const mockIdea = {
				id: 1,
				user_id: "user-123",
				title: "Simple idea",
				tags: null,
				estimated_minutes: null,
				created_at: "2024-01-01T00:00:00Z",
				updated_at: "2024-01-01T00:00:00Z",
			};

			const mockFirst = (jest.fn() as any).mockResolvedValue(mockIdea);
			const mockBind = (jest.fn() as any).mockReturnValue({
				first: mockFirst,
			});
			const mockPrepare = (jest.fn() as any).mockReturnValue({
				bind: mockBind,
			});

			const mockDB: any = {
				prepare: mockPrepare,
			};

			const repository = new IdeaRepository(mockDB);
			const result = await repository.findById(1);

			expect(result?.tags).toEqual([]);
		});
	});
});
