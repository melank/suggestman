import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { IdeasController } from "../../src/controllers/ideas";

describe("IdeasController", () => {
	describe("list", () => {
		it("should return ideas for the authenticated user", async () => {
			const mockIdeas = [
				{
					id: 1,
					title: "Learn TypeScript",
					tags: '["programming","learning"]',
					note: "Study TS handbook",
					estimated_minutes: 60,
					created_at: "2024-01-01T00:00:00Z",
					updated_at: "2024-01-01T00:00:00Z",
				},
				{
					id: 2,
					title: "Write blog post",
					tags: null,
					note: "About testing",
					estimated_minutes: 30,
					created_at: "2024-01-02T00:00:00Z",
					updated_at: "2024-01-02T00:00:00Z",
				},
			];

			const mockAll = (jest.fn() as any).mockResolvedValue({
				results: mockIdeas,
			});

			const mockBind = (jest.fn() as any).mockReturnValue({
				all: mockAll,
			});

			const mockPrepare = (jest.fn() as any).mockReturnValue({
				bind: mockBind,
			});

			const mockUser = {
				sub: "user-123",
				email: "test@example.com",
				name: "Test User",
				type: "access",
				iat: Math.floor(Date.now() / 1000),
				exp: Math.floor(Date.now() / 1000) + 3600,
			};

			const mockJson = jest.fn();
			const mockGet = jest.fn().mockReturnValue(mockUser);

			const mockContext: any = {
				env: {
					DB: {
						prepare: mockPrepare,
					},
				},
				get: mockGet,
				json: mockJson,
			};

			await IdeasController.list(mockContext);

			expect(mockPrepare).toHaveBeenCalledWith(
				"SELECT id, title, tags, note, estimated_minutes, created_at, updated_at FROM ideas WHERE user_id = ? ORDER BY created_at DESC",
			);
			expect(mockGet).toHaveBeenCalledWith("user");
			expect(mockBind).toHaveBeenCalledWith("user-123");
			expect(mockJson).toHaveBeenCalledWith({
				ideas: [
					{
						...mockIdeas[0],
						tags: ["programming", "learning"],
					},
					{
						...mockIdeas[1],
						tags: [],
					},
				],
			});
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

			const mockUser = {
				sub: "user-123",
				email: "test@example.com",
				name: "Test User",
				type: "access",
				iat: Math.floor(Date.now() / 1000),
				exp: Math.floor(Date.now() / 1000) + 3600,
			};

			const mockJson = jest.fn();
			const mockGet = jest.fn().mockReturnValue(mockUser);

			const mockContext: any = {
				env: {
					DB: {
						prepare: mockPrepare,
					},
				},
				get: mockGet,
				json: mockJson,
			};

			await IdeasController.list(mockContext);

			expect(mockJson).toHaveBeenCalledWith({
				ideas: [],
			});
		});

		it("should return error when database query fails", async () => {
			const mockAll = (jest.fn() as any).mockRejectedValue(
				new Error("Database error"),
			);

			const mockBind = (jest.fn() as any).mockReturnValue({
				all: mockAll,
			});

			const mockPrepare = (jest.fn() as any).mockReturnValue({
				bind: mockBind,
			});

			const mockUser = {
				sub: "user-123",
				email: "test@example.com",
				name: "Test User",
				type: "access",
				iat: Math.floor(Date.now() / 1000),
				exp: Math.floor(Date.now() / 1000) + 3600,
			};

			const mockJson = jest.fn();
			const mockGet = jest.fn().mockReturnValue(mockUser);

			const mockContext: any = {
				env: {
					DB: {
						prepare: mockPrepare,
					},
				},
				get: mockGet,
				json: mockJson,
			};

			await IdeasController.list(mockContext);

			expect(mockJson).toHaveBeenCalledWith(
				{ error: "アイデアの取得に失敗しました" },
				500,
			);
		});
	});
});
