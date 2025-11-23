import { describe, it, expect, jest } from "@jest/globals";
import type { Context } from "hono";
import type { Bindings } from "../../src/types/bindings";
import { HomeController } from "../../src/controllers/home";

describe("HomeController", () => {
	describe("health", () => {
		it("should return health check response", async () => {
			const mockJson = jest.fn((data) => ({ data }));
			const mockContext = {
				json: mockJson,
			} as unknown as Context<{ Bindings: Bindings }>;

			await HomeController.health(mockContext);

			const callArg = (mockJson.mock.calls[0] as unknown[])[0] as Record<
				string,
				unknown
			>;
			expect(callArg).toHaveProperty("message", "Hello, Suggestman!");
			expect(callArg).toHaveProperty("timestamp");
			expect(typeof callArg.timestamp).toBe("string");
		});
	});
});
