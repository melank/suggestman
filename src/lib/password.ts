// Password hashing and verification utilities using SHA-256

/**
 * SHA-256 でパスワードをハッシュ化
 * @param password プレーンテキストのパスワード
 * @returns ハッシュ化されたパスワード (hex 文字列)
 */
export async function hashPassword(password: string): Promise<string> {
	const encoder = new TextEncoder();
	const data = encoder.encode(password);
	const hashBuffer = await crypto.subtle.digest("SHA-256", data);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	const hashHex = hashArray
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
	return hashHex;
}

/**
 * パスワードを検証
 * @param password プレーンテキストのパスワード
 * @param hash 保存されているハッシュ
 * @returns パスワードが一致する場合 true
 */
export async function verifyPassword(
	password: string,
	hash: string,
): Promise<boolean> {
	const passwordHash = await hashPassword(password);
	return passwordHash === hash;
}

/**
 * パスワードの強度をチェック
 * @param password パスワード
 * @returns 強度チェックの結果
 */
export function validatePasswordStrength(password: string): {
	valid: boolean;
	errors: string[];
} {
	const errors: string[] = [];

	if (password.length < 8) {
		errors.push("パスワードは8文字以上である必要があります");
	}

	if (!/[a-z]/.test(password)) {
		errors.push("パスワードには小文字を含める必要があります");
	}

	if (!/[A-Z]/.test(password)) {
		errors.push("パスワードには大文字を含める必要があります");
	}

	if (!/[0-9]/.test(password)) {
		errors.push("パスワードには数字を含める必要があります");
	}

	return {
		valid: errors.length === 0,
		errors,
	};
}
