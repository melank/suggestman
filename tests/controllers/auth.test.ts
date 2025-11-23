import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import type { Context } from "hono";
import type { Bindings } from "../../src/types/bindings";
import { AuthController } from "../../src/controllers/auth";

describe("AuthController", () => {
	describe("logout", () => {
		it("should set cookie with Max-Age=0 and redirect to /", async () => {
			// モックのContext を作成
			const mockContext = {
				header: jest.fn(),
				redirect: jest.fn((url: string) => ({
					status: 302,
					headers: new Headers({ Location: url }),
				})),
			} as unknown as Context<{ Bindings: Bindings }>;

			// ログアウトを実行
			await AuthController.logout(mockContext);

			// Cookie が削除されることを確認
			expect(mockContext.header).toHaveBeenCalledWith(
				"Set-Cookie",
				"token=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0",
			);

			// / にリダイレクトされることを確認
			expect(mockContext.redirect).toHaveBeenCalledWith("/");
		});
	});
});
