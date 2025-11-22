import type { FC } from "hono/jsx";

export const LoginPage: FC = () => {
	return (
		<html lang="ja">
			<head>
				<meta charset="UTF-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
				<title>Suggestman - ログイン</title>
				<style>
					{`
						* {
							margin: 0;
							padding: 0;
							box-sizing: border-box;
						}
						body {
							font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
							background: linear-gradient(135deg, #FFF4D6 0%, #FFD670 100%);
							min-height: 100vh;
							display: flex;
							align-items: center;
							justify-content: center;
						}
						.container {
							background: white;
							padding: 3rem;
							border-radius: 1rem;
							box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
							max-width: 400px;
							width: 90%;
						}
						h1 {
							font-size: 2rem;
							color: #333;
							margin-bottom: 0.5rem;
							text-align: center;
						}
						.subtitle {
							color: #666;
							text-align: center;
							margin-bottom: 2rem;
							font-size: 0.9rem;
						}
						.login-button {
							width: 100%;
							padding: 1rem;
							background: #24292e;
							color: white;
							border: none;
							border-radius: 0.5rem;
							font-size: 1rem;
							font-weight: 600;
							cursor: pointer;
							transition: background 0.2s;
							display: flex;
							align-items: center;
							justify-content: center;
							gap: 0.5rem;
						}
						.login-button:hover {
							background: #1a1f23;
						}
						.login-button svg {
							width: 20px;
							height: 20px;
							fill: white;
						}
						.tabs {
							display: flex;
							gap: 1rem;
							margin-bottom: 2rem;
						}
						.tab {
							flex: 1;
							padding: 0.75rem;
							background: #f0f0f0;
							border: none;
							border-radius: 0.5rem;
							cursor: pointer;
							font-size: 1rem;
							font-weight: 600;
							transition: background 0.2s;
						}
						.tab.active {
							background: #FFB347;
							color: white;
						}
						.form-container {
							display: none;
						}
						.form-container.active {
							display: block;
						}
						.form-group {
							margin-bottom: 1.5rem;
						}
						.form-group label {
							display: block;
							margin-bottom: 0.5rem;
							color: #333;
							font-weight: 600;
						}
						.form-group input {
							width: 100%;
							padding: 0.75rem;
							border: 1px solid #ddd;
							border-radius: 0.5rem;
							font-size: 1rem;
						}
						.form-group input:focus {
							outline: none;
							border-color: #FFB347;
						}
						.submit-button {
							width: 100%;
							padding: 1rem;
							background: #FFB347;
							color: white;
							border: none;
							border-radius: 0.5rem;
							font-size: 1rem;
							font-weight: 600;
							cursor: pointer;
							transition: background 0.2s, transform 0.2s;
						}
						.submit-button:hover {
							background: #FFA030;
							transform: translateY(-2px);
						}
						.divider {
							margin: 2rem 0;
							text-align: center;
							color: #999;
							position: relative;
						}
						.divider::before,
						.divider::after {
							content: "";
							position: absolute;
							top: 50%;
							width: 40%;
							height: 1px;
							background: #ddd;
						}
						.divider::before {
							left: 0;
						}
						.divider::after {
							right: 0;
						}
						.error {
							color: #dc3545;
							margin-bottom: 1rem;
							padding: 0.75rem;
							background: #f8d7da;
							border-radius: 0.5rem;
							display: none;
						}
						.error.show {
							display: block;
						}
					`}
				</style>
				<script src="/static/login.js"></script>
			</head>
			<body>
				<div class="container">
					<h1>Suggestman</h1>
					<p class="subtitle">本当にやりたいことを、今すぐに。</p>

					<div class="tabs">
						<button
							class="tab active"
							onclick="switchTab('login')"
							type="button"
						>
							ログイン
						</button>
						<button class="tab" onclick="switchTab('signup')" type="button">
							サインアップ
						</button>
					</div>

					<div id="login" class="form-container active">
						<div id="login-error" class="error" />
						<form onsubmit="handleLogin(event)">
							<div class="form-group">
								<label for="login-email">メールアドレス</label>
								<input type="email" id="login-email" required />
							</div>
							<div class="form-group">
								<label for="login-password">パスワード</label>
								<input type="password" id="login-password" required />
							</div>
							<button class="submit-button" type="submit">
								ログイン
							</button>
						</form>

						<div class="divider">または</div>

						<button
							class="login-button"
							onclick="location.href='/api/auth/github'"
							type="button"
						>
							<svg
								viewBox="0 0 16 16"
								xmlns="http://www.w3.org/2000/svg"
								role="img"
								aria-label="GitHub"
							>
								<title>GitHub</title>
								<path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
							</svg>
							GitHub でログイン
						</button>
					</div>

					<div id="signup" class="form-container">
						<div id="signup-error" class="error" />
						<form onsubmit="handleSignup(event)">
							<div class="form-group">
								<label for="signup-name">名前</label>
								<input type="text" id="signup-name" required />
							</div>
							<div class="form-group">
								<label for="signup-email">メールアドレス</label>
								<input type="email" id="signup-email" required />
							</div>
							<div class="form-group">
								<label for="signup-password">パスワード</label>
								<input
									type="password"
									id="signup-password"
									required
									minLength={8}
									placeholder="8文字以上、大小文字・数字を含む"
								/>
							</div>
							<button class="submit-button" type="submit">
								サインアップ
							</button>
						</form>

						<div class="divider">または</div>

						<button
							class="login-button"
							onclick="location.href='/api/auth/github'"
							type="button"
						>
							<svg
								viewBox="0 0 16 16"
								xmlns="http://www.w3.org/2000/svg"
								role="img"
								aria-label="GitHub"
							>
								<title>GitHub</title>
								<path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
							</svg>
							GitHub でサインアップ
						</button>
					</div>
				</div>
			</body>
		</html>
	);
};
