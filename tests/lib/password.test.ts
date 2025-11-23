import { describe, it, expect } from "@jest/globals";
import {
	hashPassword,
	verifyPassword,
	validatePasswordStrength,
} from "../../src/lib/password";

describe("Password Utilities", () => {
	describe("hashPassword", () => {
		it("should hash a password", async () => {
			const password = "MySecurePassword123";
			const hash = await hashPassword(password);

			expect(hash).toBeTruthy();
			expect(typeof hash).toBe("string");
			expect(hash.length).toBe(64); // SHA-256 produces 64 hex characters
		});

		it("should produce consistent hashes for the same password", async () => {
			const password = "MySecurePassword123";
			const hash1 = await hashPassword(password);
			const hash2 = await hashPassword(password);

			expect(hash1).toBe(hash2);
		});

		it("should produce different hashes for different passwords", async () => {
			const password1 = "MySecurePassword123";
			const password2 = "DifferentPassword456";

			const hash1 = await hashPassword(password1);
			const hash2 = await hashPassword(password2);

			expect(hash1).not.toBe(hash2);
		});
	});

	describe("verifyPassword", () => {
		it("should verify a correct password", async () => {
			const password = "MySecurePassword123";
			const hash = await hashPassword(password);

			const isValid = await verifyPassword(password, hash);

			expect(isValid).toBe(true);
		});

		it("should reject an incorrect password", async () => {
			const password = "MySecurePassword123";
			const wrongPassword = "WrongPassword456";
			const hash = await hashPassword(password);

			const isValid = await verifyPassword(wrongPassword, hash);

			expect(isValid).toBe(false);
		});

		it("should reject password with incorrect hash", async () => {
			const password = "MySecurePassword123";
			const incorrectHash = "0".repeat(64);

			const isValid = await verifyPassword(password, incorrectHash);

			expect(isValid).toBe(false);
		});
	});

	describe("validatePasswordStrength", () => {
		it("should validate a strong password", () => {
			const password = "MySecurePassword123";

			const result = validatePasswordStrength(password);

			expect(result.valid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		it("should reject password shorter than 8 characters", () => {
			const password = "Short1A";

			const result = validatePasswordStrength(password);

			expect(result.valid).toBe(false);
			expect(result.errors).toContain(
				"パスワードは8文字以上である必要があります",
			);
		});

		it("should reject password without lowercase letters", () => {
			const password = "UPPERCASE123";

			const result = validatePasswordStrength(password);

			expect(result.valid).toBe(false);
			expect(result.errors).toContain(
				"パスワードには小文字を含める必要があります",
			);
		});

		it("should reject password without uppercase letters", () => {
			const password = "lowercase123";

			const result = validatePasswordStrength(password);

			expect(result.valid).toBe(false);
			expect(result.errors).toContain(
				"パスワードには大文字を含める必要があります",
			);
		});

		it("should reject password without numbers", () => {
			const password = "NoNumbersHere";

			const result = validatePasswordStrength(password);

			expect(result.valid).toBe(false);
			expect(result.errors).toContain(
				"パスワードには数字を含める必要があります",
			);
		});

		it("should return all errors for a very weak password", () => {
			const password = "weak";

			const result = validatePasswordStrength(password);

			expect(result.valid).toBe(false);
			expect(result.errors).toHaveLength(3);
			expect(result.errors).toContain(
				"パスワードは8文字以上である必要があります",
			);
			expect(result.errors).toContain(
				"パスワードには大文字を含める必要があります",
			);
			expect(result.errors).toContain(
				"パスワードには数字を含める必要があります",
			);
		});

		it("should accept password with special characters", () => {
			const password = "MyP@ssw0rd!";

			const result = validatePasswordStrength(password);

			expect(result.valid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});
	});
});
