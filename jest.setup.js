// Jest setup file to suppress expected console errors during tests

// テスト実行中の想定内のエラーログを抑制
const originalConsoleError = console.error;

global.console.error = (...args) => {
	// 想定内のエラーメッセージをフィルタリング
	const message = args[0]?.toString() || "";

	const expectedErrors = [
		"JWT verification failed",
		"GitHub token error",
		"No access token in response",
		"GitHub API error",
		"Failed to fetch ideas",
	];

	// 想定内のエラーの場合は出力を抑制
	if (expectedErrors.some((expected) => message.includes(expected))) {
		return;
	}

	// その他のエラーは通常通り出力
	originalConsoleError(...args);
};
