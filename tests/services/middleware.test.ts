import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Hono } from "hono";
import type { Bindings } from "../../src/types/bindings";

// Mock jwt module
jest.unstable_mockModule("../../src/services/jwt", () => ({
	verifyJWT: jest.fn(),
}));

// Import after mocking
const { authMiddleware } = await import("../../src/services/middleware");
const { verifyJWT } = await import("../../src/services/jwt");

describe("Auth Middleware", () => {
	let app: Hono<{ Bindings: Bindings }>;
	const mockEnv: Bindings = {
		DB: {} as D1Database,
		JWT_SECRET: "test-secret",
		GITHUB_CLIENT_ID: "test-client-id",
		GITHUB_CLIENT_SECRET: "test-client-secret",
	};

	beforeEach(() => {
		jest.clearAllMocks();
		app = new Hono<{ Bindings: Bindings }>();
	});

	it("should redirect to / when no Cookie header", async () => {
		app.use("*", authMiddleware);
		app.get("/protected", (c) => c.json({ message: "protected" }));

		const res = await app.request(
			"/protected",
			{
				method: "GET",
			},
			mockEnv,
		);

		expect(res.status).toBe(302);
		expect(res.headers.get("Location")).toBe("/");
	});

	it("should redirect to / when token is missing from Cookie", async () => {
		app.use("*", authMiddleware);
		app.get("/protected", (c) => c.json({ message: "protected" }));

		const res = await app.request(
			"/protected",
			{
				method: "GET",
				headers: {
					Cookie: "other=value",
				},
			},
			mockEnv,
		);

		expect(res.status).toBe(302);
		expect(res.headers.get("Location")).toBe("/");
	});

	it("should call next() when token is valid", async () => {
		const mockPayload = {
			sub: "user-123",
			email: "test@example.com",
			name: "Test User",
			type: "access" as const,
			iat: Math.floor(Date.now() / 1000),
			exp: Math.floor(Date.now() / 1000) + 3600,
		};

		(verifyJWT as jest.MockedFunction<typeof verifyJWT>).mockResolvedValueOnce(
			mockPayload,
		);

		app.use("*", authMiddleware);
		app.get("/protected", (c) => {
			return c.json({ message: "protected" });
		});

		const res = await app.request(
			"/protected",
			{
				method: "GET",
				headers: {
					Cookie: "token=valid_token_123",
				},
			},
			mockEnv,
		);

		expect(res.status).toBe(200);
		const data = await res.json();
		expect(data).toEqual({
			message: "protected",
		});
		expect(verifyJWT).toHaveBeenCalledWith("valid_token_123", "test-secret");
	});

	it("should redirect to / when JWT verification fails", async () => {
		(verifyJWT as jest.MockedFunction<typeof verifyJWT>).mockRejectedValueOnce(
			new Error("Invalid JWT"),
		);

		app.use("*", authMiddleware);
		app.get("/protected", (c) => c.json({ message: "protected" }));

		const res = await app.request(
			"/protected",
			{
				method: "GET",
				headers: {
					Cookie: "token=invalid_token",
				},
			},
			mockEnv,
		);

		expect(res.status).toBe(302);
		expect(res.headers.get("Location")).toBe("/");
		expect(verifyJWT).toHaveBeenCalledWith("invalid_token", "test-secret");
	});

	it("should parse multiple cookies correctly", async () => {
		const mockPayload = {
			sub: "user-123",
			email: "test@example.com",
			name: "Test User",
			type: "access" as const,
			iat: Math.floor(Date.now() / 1000),
			exp: Math.floor(Date.now() / 1000) + 3600,
		};

		(verifyJWT as jest.MockedFunction<typeof verifyJWT>).mockResolvedValueOnce(
			mockPayload,
		);

		app.use("*", authMiddleware);
		app.get("/protected", (c) => c.json({ message: "protected" }));

		const res = await app.request(
			"/protected",
			{
				method: "GET",
				headers: {
					Cookie: "other=value; token=valid_token_123; another=data",
				},
			},
			mockEnv,
		);

		expect(res.status).toBe(200);
		expect(verifyJWT).toHaveBeenCalledWith("valid_token_123", "test-secret");
	});
});
