import { describe, it, expect, beforeEach } from "@jest/globals";
import { generateJWT, verifyJWT, generateAccessToken } from "../../src/lib/jwt";

describe("JWT Utilities", () => {
	const secret = "test-secret-key";

	describe("generateJWT", () => {
		it("should generate a valid JWT token", async () => {
			const payload = {
				sub: "user-123",
				email: "test@example.com",
				name: "Test User",
				type: "access" as const,
			};

			const token = await generateJWT(payload, secret, 3600);

			expect(token).toBeTruthy();
			expect(typeof token).toBe("string");
			expect(token.split(".")).toHaveLength(3);
		});

		it("should include iat and exp in the payload", async () => {
			const payload = {
				sub: "user-123",
				email: "test@example.com",
				name: "Test User",
				type: "access" as const,
			};

			const token = await generateJWT(payload, secret, 3600);
			const verified = await verifyJWT(token, secret);

			expect(verified.iat).toBeDefined();
			expect(verified.exp).toBeDefined();
			expect(verified.exp - verified.iat).toBe(3600);
		});
	});

	describe("verifyJWT", () => {
		it("should verify a valid JWT token", async () => {
			const payload = {
				sub: "user-123",
				email: "test@example.com",
				name: "Test User",
				type: "access" as const,
			};

			const token = await generateJWT(payload, secret, 3600);
			const verified = await verifyJWT(token, secret);

			expect(verified.sub).toBe(payload.sub);
			expect(verified.email).toBe(payload.email);
			expect(verified.name).toBe(payload.name);
			expect(verified.type).toBe(payload.type);
		});

		it("should throw error for invalid JWT format", async () => {
			await expect(verifyJWT("invalid-token", secret)).rejects.toThrow(
				"Invalid JWT format",
			);
		});

		it("should throw error for invalid signature", async () => {
			const payload = {
				sub: "user-123",
				email: "test@example.com",
				name: "Test User",
				type: "access" as const,
			};

			const token = await generateJWT(payload, secret, 3600);
			const [header, payloadPart] = token.split(".");
			const tamperedToken = `${header}.${payloadPart}.invalid-signature`;

			await expect(verifyJWT(tamperedToken, secret)).rejects.toThrow(
				"Invalid JWT signature",
			);
		});

		it("should throw error for expired JWT", async () => {
			const payload = {
				sub: "user-123",
				email: "test@example.com",
				name: "Test User",
				type: "access" as const,
			};

			// Generate token that expires immediately
			const token = await generateJWT(payload, secret, -1);

			await expect(verifyJWT(token, secret)).rejects.toThrow("JWT has expired");
		});

		it("should throw error for JWT issued in the future", async () => {
			const payload = {
				sub: "user-123",
				email: "test@example.com",
				name: "Test User",
				type: "access" as const,
			};

			// Manually create a JWT with future iat
			const futurePayload = {
				...payload,
				iat: Math.floor(Date.now() / 1000) + 3600,
				exp: Math.floor(Date.now() / 1000) + 7200,
			};

			const header = { alg: "HS256", typ: "JWT" };
			const base64UrlEncode = (data: string) => {
				const base64 = btoa(data);
				return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
			};

			const encodedHeader = base64UrlEncode(JSON.stringify(header));
			const encodedPayload = base64UrlEncode(JSON.stringify(futurePayload));

			// Sign it with the same secret
			const encoder = new TextEncoder();
			const key = await crypto.subtle.importKey(
				"raw",
				encoder.encode(secret),
				{ name: "HMAC", hash: "SHA-256" },
				false,
				["sign"],
			);

			const data = `${encodedHeader}.${encodedPayload}`;
			const signatureBuffer = await crypto.subtle.sign(
				"HMAC",
				key,
				encoder.encode(data),
			);
			const signatureBytes = new Uint8Array(signatureBuffer);
			const signatureBase64 = btoa(String.fromCharCode(...signatureBytes))
				.replace(/\+/g, "-")
				.replace(/\//g, "_")
				.replace(/=/g, "");

			const token = `${data}.${signatureBase64}`;

			await expect(verifyJWT(token, secret)).rejects.toThrow(
				"JWT issued in the future",
			);
		});
	});

	describe("generateAccessToken", () => {
		it("should generate an access token with correct payload", async () => {
			const user = {
				id: "user-123",
				email: "test@example.com",
				name: "Test User",
			};

			const token = await generateAccessToken(user, secret);
			const verified = await verifyJWT(token, secret);

			expect(verified.sub).toBe(user.id);
			expect(verified.email).toBe(user.email);
			expect(verified.name).toBe(user.name);
			expect(verified.type).toBe("access");
		});

		it("should generate a token that expires in 1 hour", async () => {
			const user = {
				id: "user-123",
				email: "test@example.com",
				name: "Test User",
			};

			const token = await generateAccessToken(user, secret);
			const verified = await verifyJWT(token, secret);

			const expectedExpiry = verified.iat + 3600;
			expect(verified.exp).toBe(expectedExpiry);
		});
	});
});
