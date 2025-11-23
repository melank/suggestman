export default {
	preset: "ts-jest/presets/default-esm",
	testEnvironment: "node",
	extensionsToTreatAsEsm: [".ts", ".tsx"],
	moduleNameMapper: {
		"^(\\.{1,2}/.*)\\.js$": "$1",
	},
	transform: {
		"^.+\\.tsx?$": [
			"ts-jest",
			{
				useESM: true,
				tsconfig: "tsconfig.test.json",
			},
		],
	},
	testMatch: ["<rootDir>/tests/**/*.test.ts"],
	collectCoverageFrom: [
		"src/**/*.{ts,tsx}",
		"!src/**/*.d.ts",
		"!src/types/**",
		"!src/views/**",
	],
	coverageDirectory: "coverage",
	coverageReporters: ["text", "lcov", "html"],
	moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
};
