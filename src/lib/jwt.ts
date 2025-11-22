// JWT Token Generation and Verification Utilities

import type { JWTPayload } from "../types/bindings";

// Base64URL エンコード（JWT用）
function base64UrlEncode(data: ArrayBuffer | string): string {
	const bytes =
		typeof data === "string" ? new TextEncoder().encode(data) : data;
	const base64 = btoa(String.fromCharCode(...new Uint8Array(bytes)));
	return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

// Base64URL デコード
function base64UrlDecode(str: string): Uint8Array {
	const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
	const padding = "=".repeat((4 - (base64.length % 4)) % 4);
	const binary = atob(base64 + padding);
	return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

// HMAC-SHA256 署名の生成
async function sign(data: string, secret: string): Promise<string> {
	const encoder = new TextEncoder();
	const key = await crypto.subtle.importKey(
		"raw",
		encoder.encode(secret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	);

	const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));

	return base64UrlEncode(signature);
}

// HMAC-SHA256 署名の検証
async function verify(
	data: string,
	signature: string,
	secret: string,
): Promise<boolean> {
	const expectedSignature = await sign(data, secret);
	return signature === expectedSignature;
}

// JWT の生成
export async function generateJWT(
	payload: Omit<JWTPayload, "iat" | "exp">,
	secret: string,
	expiresIn: number, // 秒単位
): Promise<string> {
	const now = Math.floor(Date.now() / 1000);

	const fullPayload: JWTPayload = {
		...payload,
		iat: now,
		exp: now + expiresIn,
	};

	// Header
	const header = {
		alg: "HS256",
		typ: "JWT",
	};

	const encodedHeader = base64UrlEncode(JSON.stringify(header));
	const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));

	const data = `${encodedHeader}.${encodedPayload}`;
	const signature = await sign(data, secret);

	return `${data}.${signature}`;
}

// JWT の検証
export async function verifyJWT(
	token: string,
	secret: string,
): Promise<JWTPayload> {
	const parts = token.split(".");
	if (parts.length !== 3) {
		throw new Error("Invalid JWT format");
	}

	const [encodedHeader, encodedPayload, signature] = parts;

	// 署名の検証
	const data = `${encodedHeader}.${encodedPayload}`;
	const isValid = await verify(data, signature, secret);

	if (!isValid) {
		throw new Error("Invalid JWT signature");
	}

	// Payload のデコード
	const payloadBytes = base64UrlDecode(encodedPayload);
	const payloadStr = new TextDecoder().decode(payloadBytes);
	const payload: JWTPayload = JSON.parse(payloadStr);

	// 有効期限のチェック
	const now = Math.floor(Date.now() / 1000);
	if (payload.exp < now) {
		throw new Error("JWT has expired");
	}

	// 発行日時のチェック
	if (payload.iat > now) {
		throw new Error("JWT issued in the future");
	}

	return payload;
}

// Access Token の生成（1時間有効）
export async function generateAccessToken(
	user: { id: string; email: string; name: string },
	secret: string,
): Promise<string> {
	return generateJWT(
		{
			sub: user.id,
			email: user.email,
			name: user.name,
			type: "access",
		},
		secret,
		3600, // 1時間
	);
}

// Refresh Token の生成（30日間有効）
export async function generateRefreshToken(
	userId: string,
	sessionId: string,
	secret: string,
): Promise<string> {
	return generateJWT(
		{
			sub: userId,
			email: "", // Refresh token には含めない
			name: "", // Refresh token には含めない
			type: "refresh",
			sessionId,
		},
		secret,
		2592000, // 30日間
	);
}
