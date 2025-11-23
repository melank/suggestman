import { describe, it, expect, jest, beforeEach } from "@jest/globals";

// Mock jwt module BEFORE importing HomeController
jest.unstable_mockModule("../../src/lib/jwt", () => ({
	verifyJWT: jest.fn(),
}));

// Mock LoginPage component
jest.unstable_mockModule("../../src/views/login", () => ({
	LoginPage: () => "<html>Login Page</html>",
}));

// Import after mocking
const { verifyJWT } = await import("../../src/lib/jwt");
const { HomeController } = await import("../../src/controllers/home");

describe("HomeController", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe("index", () => {
		it("should show login page when no cookie present", async () => {
			const mockHtml = jest.fn();
			const mockContext: any = {
				req: {
					header: jest.fn().mockReturnValue(undefined),
				},
				html: mockHtml,
			};

			await HomeController.index(mockContext);

			expect(mockContext.req.header).toHaveBeenCalledWith("Cookie");
			expect(mockHtml).toHaveBeenCalled();
		});

		it("should show login page when token cookie is missing", async () => {
			const mockHtml = jest.fn();
			const mockContext: any = {
				req: {
					header: jest.fn().mockReturnValue("other=value; another=data"),
				},
				html: mockHtml,
			};

			await HomeController.index(mockContext);

			expect(mockHtml).toHaveBeenCalled();
		});

		it("should redirect to /dashboard when token is valid", async () => {
			const mockPayload = {
				sub: "user-123",
				email: "test@example.com",
				name: "Test User",
				type: "access" as const,
				iat: Math.floor(Date.now() / 1000),
				exp: Math.floor(Date.now() / 1000) + 3600,
			};

			(verifyJWT as jest.MockedFunction<any>).mockResolvedValue(mockPayload);

			const mockRedirect = jest.fn();
			const mockContext: any = {
				env: {
					JWT_SECRET: "test-secret",
				},
				req: {
					header: jest.fn().mockReturnValue("token=valid_token_123"),
				},
				redirect: mockRedirect,
			};

			await HomeController.index(mockContext);

			expect(verifyJWT).toHaveBeenCalledWith("valid_token_123", "test-secret");
			expect(mockRedirect).toHaveBeenCalledWith("/dashboard");
		});

		it("should show login page when token is invalid", async () => {
			(verifyJWT as jest.MockedFunction<any>).mockRejectedValue(
				new Error("Invalid token"),
			);

			const mockHtml = jest.fn();
			const mockContext: any = {
				env: {
					JWT_SECRET: "test-secret",
				},
				req: {
					header: jest.fn().mockReturnValue("token=invalid_token"),
				},
				html: mockHtml,
			};

			await HomeController.index(mockContext);

			expect(verifyJWT).toHaveBeenCalledWith("invalid_token", "test-secret");
			expect(mockHtml).toHaveBeenCalled();
		});

		it("should show login page when token is expired", async () => {
			(verifyJWT as jest.MockedFunction<any>).mockRejectedValue(
				new Error("JWT has expired"),
			);

			const mockHtml = jest.fn();
			const mockContext: any = {
				env: {
					JWT_SECRET: "test-secret",
				},
				req: {
					header: jest.fn().mockReturnValue("token=expired_token"),
				},
				html: mockHtml,
			};

			await HomeController.index(mockContext);

			expect(verifyJWT).toHaveBeenCalledWith("expired_token", "test-secret");
			expect(mockHtml).toHaveBeenCalled();
		});

		it("should parse cookies correctly with multiple values", async () => {
			const mockPayload = {
				sub: "user-123",
				email: "test@example.com",
				name: "Test User",
				type: "access" as const,
				iat: Math.floor(Date.now() / 1000),
				exp: Math.floor(Date.now() / 1000) + 3600,
			};

			(verifyJWT as jest.MockedFunction<any>).mockResolvedValue(mockPayload);

			const mockRedirect = jest.fn();
			const mockContext: any = {
				env: {
					JWT_SECRET: "test-secret",
				},
				req: {
					header: jest
						.fn()
						.mockReturnValue(
							"session=abc123; token=valid_token; lang=ja; theme=dark",
						),
				},
				redirect: mockRedirect,
			};

			await HomeController.index(mockContext);

			expect(verifyJWT).toHaveBeenCalledWith("valid_token", "test-secret");
			expect(mockRedirect).toHaveBeenCalledWith("/dashboard");
		});

		it("should handle cookies with spaces correctly", async () => {
			const mockPayload = {
				sub: "user-123",
				email: "test@example.com",
				name: "Test User",
				type: "access" as const,
				iat: Math.floor(Date.now() / 1000),
				exp: Math.floor(Date.now() / 1000) + 3600,
			};

			(verifyJWT as jest.MockedFunction<any>).mockResolvedValue(mockPayload);

			const mockRedirect = jest.fn();
			const mockContext: any = {
				env: {
					JWT_SECRET: "test-secret",
				},
				req: {
					header: jest
						.fn()
						.mockReturnValue("session=abc123 ; token=valid_token ; lang=ja"),
				},
				redirect: mockRedirect,
			};

			await HomeController.index(mockContext);

			expect(verifyJWT).toHaveBeenCalledWith("valid_token", "test-secret");
			expect(mockRedirect).toHaveBeenCalledWith("/dashboard");
		});
	});

	describe("health", () => {
		it("should return health check with message and timestamp", async () => {
			const mockJson = jest.fn();
			const mockContext: any = {
				json: mockJson,
			};

			await HomeController.health(mockContext);

			expect(mockJson).toHaveBeenCalledTimes(1);
			const callArgs = mockJson.mock.calls[0][0] as any;
			expect(callArgs).toHaveProperty("message", "Hello, Suggestman!");
			expect(callArgs).toHaveProperty("timestamp");
			expect(typeof callArgs.timestamp).toBe("string");
		});

		it("should return valid ISO timestamp", async () => {
			const mockJson = jest.fn();
			const mockContext: any = {
				json: mockJson,
			};

			const beforeCall = new Date();
			await HomeController.health(mockContext);
			const afterCall = new Date();

			const callArgs = mockJson.mock.calls[0][0] as any;
			const timestamp = new Date(callArgs.timestamp);

			expect(timestamp.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime());
			expect(timestamp.getTime()).toBeLessThanOrEqual(afterCall.getTime());
		});
	});
});
