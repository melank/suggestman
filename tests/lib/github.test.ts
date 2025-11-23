import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { getGitHubAccessToken, getGitHubUser } from "../../src/lib/github";

// Mock global fetch
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

describe("GitHub OAuth Utilities", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe("getGitHubAccessToken", () => {
		it("should get access token from GitHub", async () => {
			const mockResponse = {
				access_token: "gho_test_token_123",
				token_type: "bearer",
				scope: "user:email",
			};

			(global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce(
				{
					ok: true,
					json: async () => mockResponse,
					text: async () => JSON.stringify(mockResponse),
					status: 200,
				} as Response,
			);

			const token = await getGitHubAccessToken(
				"auth_code_123",
				"client_id",
				"client_secret",
			);

			expect(token).toBe("gho_test_token_123");
			expect(global.fetch).toHaveBeenCalledWith(
				"https://github.com/login/oauth/access_token",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Accept: "application/json",
					},
					body: JSON.stringify({
						client_id: "client_id",
						client_secret: "client_secret",
						code: "auth_code_123",
					}),
				},
			);
		});

		it("should throw error when GitHub API returns error", async () => {
			(global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce(
				{
					ok: false,
					status: 400,
					text: async () => "Bad Request",
				} as Response,
			);

			await expect(
				getGitHubAccessToken("invalid_code", "client_id", "client_secret"),
			).rejects.toThrow("Failed to get GitHub access token: 400");
		});

		it("should throw error when no access token in response", async () => {
			(global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce(
				{
					ok: true,
					json: async () => ({ error: "invalid_grant" }),
					status: 200,
				} as Response,
			);

			await expect(
				getGitHubAccessToken("invalid_code", "client_id", "client_secret"),
			).rejects.toThrow("No access token in response");
		});
	});

	describe("getGitHubUser", () => {
		it("should get user info from GitHub", async () => {
			const mockUser = {
				id: 12345,
				login: "testuser",
				name: "Test User",
				email: "test@example.com",
				avatar_url: "https://avatars.githubusercontent.com/u/12345",
			};

			(global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce(
				{
					ok: true,
					json: async () => mockUser,
					text: async () => JSON.stringify(mockUser),
					status: 200,
				} as Response,
			);

			const user = await getGitHubUser("gho_test_token");

			expect(user).toEqual(mockUser);
			expect(global.fetch).toHaveBeenCalledWith("https://api.github.com/user", {
				headers: {
					Authorization: "Bearer gho_test_token",
					Accept: "application/vnd.github.v3+json",
					"User-Agent": "Suggestman",
				},
			});
		});

		it("should fetch primary email when email is not in user response", async () => {
			const mockUser = {
				id: 12345,
				login: "testuser",
				name: "Test User",
				email: null,
				avatar_url: "https://avatars.githubusercontent.com/u/12345",
			};

			const mockEmails = [
				{ email: "secondary@example.com", primary: false, verified: true },
				{ email: "primary@example.com", primary: true, verified: true },
			];

			(global.fetch as jest.MockedFunction<typeof fetch>)
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockUser,
					text: async () => JSON.stringify(mockUser),
					status: 200,
				} as Response)
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockEmails,
					text: async () => JSON.stringify(mockEmails),
					status: 200,
				} as Response);

			const user = await getGitHubUser("gho_test_token");

			expect(user.email).toBe("primary@example.com");
			expect(global.fetch).toHaveBeenCalledTimes(2);
			expect(global.fetch).toHaveBeenNthCalledWith(
				2,
				"https://api.github.com/user/emails",
				{
					headers: {
						Authorization: "Bearer gho_test_token",
						Accept: "application/vnd.github.v3+json",
						"User-Agent": "Suggestman",
					},
				},
			);
		});

		it("should throw error when GitHub user API fails", async () => {
			(global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce(
				{
					ok: false,
					status: 401,
					text: async () => "Unauthorized",
				} as Response,
			);

			await expect(getGitHubUser("invalid_token")).rejects.toThrow(
				"Failed to get GitHub user: 401 Unauthorized",
			);
		});

		it("should handle failed email fetch gracefully", async () => {
			const mockUser = {
				id: 12345,
				login: "testuser",
				name: "Test User",
				email: null,
				avatar_url: "https://avatars.githubusercontent.com/u/12345",
			};

			(global.fetch as jest.MockedFunction<typeof fetch>)
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockUser,
					text: async () => JSON.stringify(mockUser),
					status: 200,
				} as Response)
				.mockResolvedValueOnce({
					ok: false,
					status: 403,
					text: async () => "Forbidden",
				} as Response);

			const user = await getGitHubUser("gho_test_token");

			expect(user.email).toBeNull();
		});
	});
});
