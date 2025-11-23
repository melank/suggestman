import { describe, it, expect, jest } from "@jest/globals";
import { UserRepository } from "../../src/repositories/UserRepository";

describe("UserRepository", () => {
	describe("findByEmail", () => {
		it("should return user when found", async () => {
			const mockUser = {
				id: "user-123",
				email: "test@example.com",
				name: "Test User",
				password_hash: "hashed_password",
				created_at: "2024-01-01T00:00:00Z",
				updated_at: "2024-01-01T00:00:00Z",
			};

			const mockFirst = (jest.fn() as any).mockResolvedValue(mockUser);
			const mockBind = (jest.fn() as any).mockReturnValue({
				first: mockFirst,
			});
			const mockPrepare = (jest.fn() as any).mockReturnValue({
				bind: mockBind,
			});

			const mockDB: any = {
				prepare: mockPrepare,
			};

			const repository = new UserRepository(mockDB);
			const result = await repository.findByEmail("test@example.com");

			expect(mockPrepare).toHaveBeenCalledWith(
				"SELECT * FROM users WHERE email = ?",
			);
			expect(mockBind).toHaveBeenCalledWith("test@example.com");
			expect(result).toEqual(mockUser);
		});

		it("should return null when user not found", async () => {
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

			const repository = new UserRepository(mockDB);
			const result = await repository.findByEmail("nonexistent@example.com");

			expect(result).toBeNull();
		});
	});

	describe("findByGitHubId", () => {
		it("should return user when found", async () => {
			const mockUser = {
				id: "user-123",
				email: "test@example.com",
				name: "Test User",
				github_id: "12345",
				created_at: "2024-01-01T00:00:00Z",
				updated_at: "2024-01-01T00:00:00Z",
			};

			const mockFirst = (jest.fn() as any).mockResolvedValue(mockUser);
			const mockBind = (jest.fn() as any).mockReturnValue({
				first: mockFirst,
			});
			const mockPrepare = (jest.fn() as any).mockReturnValue({
				bind: mockBind,
			});

			const mockDB: any = {
				prepare: mockPrepare,
			};

			const repository = new UserRepository(mockDB);
			const result = await repository.findByGitHubId("12345");

			expect(mockPrepare).toHaveBeenCalledWith(
				"SELECT * FROM users WHERE github_id = ?",
			);
			expect(mockBind).toHaveBeenCalledWith("12345");
			expect(result).toEqual(mockUser);
		});

		it("should return null when user not found", async () => {
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

			const repository = new UserRepository(mockDB);
			const result = await repository.findByGitHubId("99999");

			expect(result).toBeNull();
		});
	});

	describe("findById", () => {
		it("should return user when found", async () => {
			const mockUser = {
				id: "user-123",
				email: "test@example.com",
				name: "Test User",
				created_at: "2024-01-01T00:00:00Z",
				updated_at: "2024-01-01T00:00:00Z",
			};

			const mockFirst = (jest.fn() as any).mockResolvedValue(mockUser);
			const mockBind = (jest.fn() as any).mockReturnValue({
				first: mockFirst,
			});
			const mockPrepare = (jest.fn() as any).mockReturnValue({
				bind: mockBind,
			});

			const mockDB: any = {
				prepare: mockPrepare,
			};

			const repository = new UserRepository(mockDB);
			const result = await repository.findById("user-123");

			expect(mockPrepare).toHaveBeenCalledWith(
				"SELECT * FROM users WHERE id = ?",
			);
			expect(mockBind).toHaveBeenCalledWith("user-123");
			expect(result).toEqual(mockUser);
		});

		it("should return null when user not found", async () => {
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

			const repository = new UserRepository(mockDB);
			const result = await repository.findById("nonexistent-id");

			expect(result).toBeNull();
		});
	});

	describe("create", () => {
		it("should create GitHub OAuth user", async () => {
			const mockRun = (jest.fn() as any).mockResolvedValue({});
			const mockBind = (jest.fn() as any).mockReturnValue({
				run: mockRun,
			});
			const mockPrepare = (jest.fn() as any).mockReturnValue({
				bind: mockBind,
			});

			const mockDB: any = {
				prepare: mockPrepare,
			};

			const repository = new UserRepository(mockDB);
			await repository.create({
				id: "user-123",
				email: "test@example.com",
				name: "Test User",
				github_id: "12345",
			});

			expect(mockPrepare).toHaveBeenCalledWith(
				"INSERT INTO users (id, email, name, github_id) VALUES (?, ?, ?, ?)",
			);
			expect(mockBind).toHaveBeenCalledWith(
				"user-123",
				"test@example.com",
				"Test User",
				"12345",
			);
			expect(mockRun).toHaveBeenCalled();
		});

		it("should create password authentication user", async () => {
			const mockRun = (jest.fn() as any).mockResolvedValue({});
			const mockBind = (jest.fn() as any).mockReturnValue({
				run: mockRun,
			});
			const mockPrepare = (jest.fn() as any).mockReturnValue({
				bind: mockBind,
			});

			const mockDB: any = {
				prepare: mockPrepare,
			};

			const repository = new UserRepository(mockDB);
			await repository.create({
				id: "user-456",
				email: "password@example.com",
				name: "Password User",
				password_hash: "hashed_password",
			});

			expect(mockPrepare).toHaveBeenCalledWith(
				"INSERT INTO users (id, email, name, password_hash) VALUES (?, ?, ?, ?)",
			);
			expect(mockBind).toHaveBeenCalledWith(
				"user-456",
				"password@example.com",
				"Password User",
				"hashed_password",
			);
			expect(mockRun).toHaveBeenCalled();
		});
	});

	describe("updatePassword", () => {
		it("should update user password", async () => {
			const mockRun = (jest.fn() as any).mockResolvedValue({});
			const mockBind = (jest.fn() as any).mockReturnValue({
				run: mockRun,
			});
			const mockPrepare = (jest.fn() as any).mockReturnValue({
				bind: mockBind,
			});

			const mockDB: any = {
				prepare: mockPrepare,
			};

			const repository = new UserRepository(mockDB);
			await repository.updatePassword("user-123", "new_hashed_password");

			expect(mockPrepare).toHaveBeenCalledWith(
				"UPDATE users SET password_hash = ? WHERE id = ?",
			);
			expect(mockBind).toHaveBeenCalledWith("new_hashed_password", "user-123");
			expect(mockRun).toHaveBeenCalled();
		});
	});
});
