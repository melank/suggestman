import { describe, it, expect, beforeEach, jest } from "@jest/globals";

jest.unstable_mockModule("../../src/services/github", () => ({
	getGitHubAccessToken: jest.fn(),
	getGitHubUser: jest.fn(),
}));

jest.unstable_mockModule("../../src/services/jwt", () => ({
	generateAccessToken: jest.fn(),
	verifyJWT: jest.fn(),
}));

jest.unstable_mockModule("../../src/services/password", () => ({
	hashPassword: jest.fn(),
	verifyPassword: jest.fn(),
	validatePasswordStrength: jest.fn(),
}));

const { getGitHubAccessToken, getGitHubUser } = await import(
	"../../src/services/github"
);
const { generateAccessToken, verifyJWT } = await import(
	"../../src/services/jwt"
);
const { hashPassword, verifyPassword, validatePasswordStrength } = await import(
	"../../src/services/password"
);
const { AuthController } = await import("../../src/controllers/auth");

describe("AuthController", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe("githubAuth", () => {
		it("should redirect to GitHub OAuth URL", async () => {
			const mockRedirect = jest.fn();
			const mockContext: any = {
				env: {
					GITHUB_CLIENT_ID: "test-client-id",
				},
				req: {
					url: "http://localhost:3000/api/auth/github",
				},
				redirect: mockRedirect,
			};

			await AuthController.githubAuth(mockContext);

			expect(mockRedirect).toHaveBeenCalled();
			const redirectUrl = (mockRedirect.mock.calls[0] as any)[0] as string;
			expect(redirectUrl).toContain("https://github.com/login/oauth/authorize");
			expect(redirectUrl).toContain("client_id=test-client-id");
			expect(redirectUrl).toContain("scope=user%3Aemail");
		});
	});

	describe("githubCallback", () => {
		it("should create new user and redirect to dashboard on first login", async () => {
			const mockCode = "github_auth_code_123";
			const mockAccessToken = "github_access_token_456";
			const mockGitHubUser = {
				id: 12345,
				login: "testuser",
				name: "Test User",
				email: "test@example.com",
			};
			const mockJwtToken = "jwt_token_789";

			(getGitHubAccessToken as jest.MockedFunction<any>).mockResolvedValue(
				mockAccessToken,
			);
			(getGitHubUser as jest.MockedFunction<any>).mockResolvedValue(
				mockGitHubUser,
			);
			(generateAccessToken as jest.MockedFunction<any>).mockResolvedValue(
				mockJwtToken,
			);

			const mockPrepare = (jest.fn() as any)
				.mockReturnValueOnce({
					// First call: SELECT user (findByGitHubId - user not found)
					bind: (jest.fn() as any).mockReturnValue({
						first: (jest.fn() as any).mockResolvedValue(null),
					}),
				})
				.mockReturnValueOnce({
					// Second call: INSERT user (create)
					bind: (jest.fn() as any).mockReturnValue({
						run: (jest.fn() as any).mockResolvedValue({}),
					}),
				})
				.mockReturnValueOnce({
					// Third call: SELECT user again (findByGitHubId - user found after creation)
					bind: (jest.fn() as any).mockReturnValue({
						first: (jest.fn() as any).mockResolvedValue({
							id: expect.any(String),
							email: mockGitHubUser.email,
							name: mockGitHubUser.name,
							github_id: mockGitHubUser.id.toString(),
						}),
					}),
				});

			const mockHeader = jest.fn();
			const mockRedirect = jest.fn();
			const mockJson = jest.fn();

			const mockContext: any = {
				env: {
					DB: { prepare: mockPrepare },
					GITHUB_CLIENT_ID: "client-id",
					GITHUB_CLIENT_SECRET: "client-secret",
					JWT_SECRET: "jwt-secret",
				},
				req: {
					query: jest.fn().mockReturnValue(mockCode),
				},
				header: mockHeader,
				redirect: mockRedirect,
				json: mockJson,
			};

			await AuthController.githubCallback(mockContext);

			expect(getGitHubAccessToken).toHaveBeenCalledWith(
				mockCode,
				"client-id",
				"client-secret",
			);
			expect(getGitHubUser).toHaveBeenCalledWith(mockAccessToken);
			expect(generateAccessToken).toHaveBeenCalled();
			expect(mockHeader).toHaveBeenCalledWith(
				"Set-Cookie",
				expect.stringContaining("token="),
			);
			expect(mockRedirect).toHaveBeenCalledWith("/dashboard");
		});

		it("should return error when code is missing", async () => {
			const mockJson = jest.fn();
			const mockContext: any = {
				req: {
					query: jest.fn().mockReturnValue(undefined),
				},
				json: mockJson,
			};

			await AuthController.githubCallback(mockContext);

			expect(mockJson).toHaveBeenCalledWith(
				{ error: "Authorization code not found" },
				400,
			);
		});
	});

	describe("signup", () => {
		it("should create new user with valid credentials", async () => {
			const mockPasswordHash = "hashed_password_123";
			const mockJwtToken = "jwt_token_456";

			(validatePasswordStrength as jest.MockedFunction<any>).mockReturnValue({
				valid: true,
				errors: [],
			});
			(hashPassword as jest.MockedFunction<any>).mockResolvedValue(
				mockPasswordHash,
			);
			(generateAccessToken as jest.MockedFunction<any>).mockResolvedValue(
				mockJwtToken,
			);

			const mockPrepare = (jest.fn() as any)
				.mockReturnValueOnce({
					// First call: Check existing user
					bind: (jest.fn() as any).mockReturnValue({
						first: (jest.fn() as any).mockResolvedValue(null),
					}),
				})
				.mockReturnValueOnce({
					// Second call: Insert user
					bind: (jest.fn() as any).mockReturnValue({
						run: (jest.fn() as any).mockResolvedValue({}),
					}),
				});

			const mockJson = jest.fn();
			const mockHeader = jest.fn();

			const mockContext: any = {
				env: {
					DB: { prepare: mockPrepare },
					JWT_SECRET: "jwt-secret",
				},
				req: {
					json: (jest.fn() as any).mockResolvedValue({
						email: "newuser@example.com",
						password: "Password123",
						name: "New User",
					}),
				},
				header: mockHeader,
				json: mockJson,
			};

			await AuthController.signup(mockContext);

			expect(validatePasswordStrength).toHaveBeenCalledWith("Password123");
			expect(hashPassword).toHaveBeenCalledWith("Password123");
			expect(mockJson).toHaveBeenCalledWith({
				success: true,
				redirect: "/dashboard",
			});
		});

		it("should return error for weak password", async () => {
			(validatePasswordStrength as jest.MockedFunction<any>).mockReturnValue({
				valid: false,
				errors: ["パスワードは8文字以上である必要があります"],
			});

			const mockJson = jest.fn();
			const mockContext: any = {
				req: {
					json: (jest.fn() as any).mockResolvedValue({
						email: "test@example.com",
						password: "weak",
						name: "Test User",
					}),
				},
				json: mockJson,
			};

			await AuthController.signup(mockContext);

			expect(mockJson).toHaveBeenCalledWith(
				{ error: "パスワードは8文字以上である必要があります" },
				400,
			);
		});

		it("should return error for existing email", async () => {
			(validatePasswordStrength as jest.MockedFunction<any>).mockReturnValue({
				valid: true,
				errors: [],
			});

			const mockPrepare = (jest.fn() as any).mockReturnValue({
				bind: (jest.fn() as any).mockReturnValue({
					first: (jest.fn() as any).mockResolvedValue({ id: "existing-user" }),
				}),
			});

			const mockJson = jest.fn();
			const mockContext: any = {
				env: {
					DB: { prepare: mockPrepare },
				},
				req: {
					json: (jest.fn() as any).mockResolvedValue({
						email: "existing@example.com",
						password: "Password123",
						name: "Test User",
					}),
				},
				json: mockJson,
			};

			await AuthController.signup(mockContext);

			expect(mockJson).toHaveBeenCalledWith(
				{ error: "このメールアドレスは既に登録されています" },
				409,
			);
		});
	});

	describe("login", () => {
		it("should login user with correct credentials", async () => {
			const mockUser = {
				id: "user-123",
				email: "test@example.com",
				name: "Test User",
				password_hash: "hashed_password",
			};
			const mockJwtToken = "jwt_token_789";

			(verifyPassword as jest.MockedFunction<any>).mockResolvedValue(true);
			(generateAccessToken as jest.MockedFunction<any>).mockResolvedValue(
				mockJwtToken,
			);

			const mockPrepare = (jest.fn() as any).mockReturnValue({
				bind: (jest.fn() as any).mockReturnValue({
					first: (jest.fn() as any).mockResolvedValue(mockUser),
				}),
			});

			const mockJson = jest.fn();
			const mockHeader = jest.fn();

			const mockContext: any = {
				env: {
					DB: { prepare: mockPrepare },
					JWT_SECRET: "jwt-secret",
				},
				req: {
					json: (jest.fn() as any).mockResolvedValue({
						email: "test@example.com",
						password: "Password123",
					}),
				},
				header: mockHeader,
				json: mockJson,
			};

			await AuthController.login(mockContext);

			expect(verifyPassword).toHaveBeenCalledWith(
				"Password123",
				"hashed_password",
			);
			expect(mockJson).toHaveBeenCalledWith({
				success: true,
				redirect: "/dashboard",
			});
		});

		it("should return error for incorrect password", async () => {
			const mockUser = {
				id: "user-123",
				email: "test@example.com",
				password_hash: "hashed_password",
			};

			(verifyPassword as jest.MockedFunction<any>).mockResolvedValue(false);

			const mockPrepare = (jest.fn() as any).mockReturnValue({
				bind: (jest.fn() as any).mockReturnValue({
					first: (jest.fn() as any).mockResolvedValue(mockUser),
				}),
			});

			const mockJson = jest.fn();
			const mockContext: any = {
				env: {
					DB: { prepare: mockPrepare },
				},
				req: {
					json: (jest.fn() as any).mockResolvedValue({
						email: "test@example.com",
						password: "WrongPassword",
					}),
				},
				json: mockJson,
			};

			await AuthController.login(mockContext);

			expect(mockJson).toHaveBeenCalledWith(
				{ error: "メールアドレスまたはパスワードが正しくありません" },
				401,
			);
		});

		it("should return error for non-existent user", async () => {
			const mockPrepare = (jest.fn() as any).mockReturnValue({
				bind: (jest.fn() as any).mockReturnValue({
					first: (jest.fn() as any).mockResolvedValue(null),
				}),
			});

			const mockJson = jest.fn();
			const mockContext: any = {
				env: {
					DB: { prepare: mockPrepare },
				},
				req: {
					json: (jest.fn() as any).mockResolvedValue({
						email: "nonexistent@example.com",
						password: "Password123",
					}),
				},
				json: mockJson,
			};

			await AuthController.login(mockContext);

			expect(mockJson).toHaveBeenCalledWith(
				{ error: "メールアドレスまたはパスワードが正しくありません" },
				401,
			);
		});
	});

	describe("setPassword", () => {
		it("should set password for authenticated user", async () => {
			const mockPayload = {
				sub: "user-123",
				email: "test@example.com",
				name: "Test User",
			};
			const mockPasswordHash = "new_hashed_password";

			(verifyJWT as jest.MockedFunction<any>).mockResolvedValue(mockPayload);
			(validatePasswordStrength as jest.MockedFunction<any>).mockReturnValue({
				valid: true,
				errors: [],
			});
			(hashPassword as jest.MockedFunction<any>).mockResolvedValue(
				mockPasswordHash,
			);

			const mockPrepare = (jest.fn() as any).mockReturnValue({
				bind: (jest.fn() as any).mockReturnValue({
					run: (jest.fn() as any).mockResolvedValue({}),
				}),
			});

			const mockJson = jest.fn();
			const mockContext: any = {
				env: {
					DB: { prepare: mockPrepare },
					JWT_SECRET: "jwt-secret",
				},
				req: {
					header: jest.fn().mockReturnValue("token=valid_token"),
					json: (jest.fn() as any).mockResolvedValue({
						password: "NewPassword123",
					}),
				},
				json: mockJson,
			};

			await AuthController.setPassword(mockContext);

			expect(verifyJWT).toHaveBeenCalledWith("valid_token", "jwt-secret");
			expect(validatePasswordStrength).toHaveBeenCalledWith("NewPassword123");
			expect(hashPassword).toHaveBeenCalledWith("NewPassword123");
			expect(mockJson).toHaveBeenCalledWith({
				success: true,
				message: "パスワードが設定されました",
			});
		});

		it("should return error when not authenticated", async () => {
			const mockJson = jest.fn();
			const mockContext: any = {
				req: {
					header: jest.fn().mockReturnValue(undefined),
				},
				json: mockJson,
			};

			await AuthController.setPassword(mockContext);

			expect(mockJson).toHaveBeenCalledWith({ error: "認証が必要です" }, 401);
		});
	});

	describe("logout", () => {
		it("should set cookie with Max-Age=0 and redirect to /", async () => {
			const mockHeader = jest.fn();
			const mockRedirect = jest.fn();

			const mockContext: any = {
				header: mockHeader,
				redirect: mockRedirect,
			};

			await AuthController.logout(mockContext);

			expect(mockHeader).toHaveBeenCalledWith(
				"Set-Cookie",
				"token=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0",
			);
			expect(mockRedirect).toHaveBeenCalledWith("/");
		});
	});
});
