import type { FC } from "hono/jsx";

type DashboardPageProps = {
	user: {
		name: string;
		email: string;
	};
	hasPassword: boolean;
};

export const DashboardPage: FC<DashboardPageProps> = ({
	user,
	hasPassword,
}) => {
	return (
		<html lang="ja">
			<head>
				<meta charset="UTF-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
				<title>Suggestman - ダッシュボード</title>
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
						}
						.header {
							background: white;
							border-bottom: 1px solid #e0e0e0;
							padding: 1rem 2rem;
						}
						.header-top {
							display: flex;
							justify-content: space-between;
							align-items: center;
							margin-bottom: 1rem;
						}
						.header-welcome {
							font-size: 1.1rem;
							color: #666;
						}
						.header-welcome strong {
							color: #333;
						}
						.logo {
							font-size: 1.5rem;
							font-weight: bold;
							color: #FFB347;
						}
						.user-info {
							display: flex;
							align-items: center;
							gap: 1rem;
						}
						.user-name {
							font-weight: 600;
							color: #333;
						}
						.logout-btn {
							padding: 0.5rem 1rem;
							background: #f0f0f0;
							border: none;
							border-radius: 0.5rem;
							cursor: pointer;
							font-size: 0.9rem;
							transition: background 0.2s;
						}
						.logout-btn:hover {
							background: #e0e0e0;
						}
						.container {
							max-width: 1200px;
							margin: 2rem auto;
							padding: 0 2rem;
						}
						.section {
							background: white;
							padding: 2rem;
							border-radius: 1rem;
							box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
							margin-bottom: 2rem;
						}
						.section h2 {
							font-size: 1.5rem;
							color: #333;
							margin-bottom: 1rem;
						}
						.suggestion-button {
							width: 100%;
							padding: 1.5rem;
							background: #FFB347;
							color: white;
							border: none;
							border-radius: 0.75rem;
							font-size: 1.2rem;
							font-weight: 600;
							cursor: pointer;
							transition: background 0.2s, transform 0.2s;
						}
						.suggestion-button:hover {
							background: #FFA030;
							transform: translateY(-2px);
						}
						.placeholder {
							text-align: center;
							color: #999;
							padding: 2rem;
						}
						.warning-banner {
							background: #fff3cd;
							border-left: 4px solid #ffc107;
							padding: 1rem;
							margin-bottom: 2rem;
							border-radius: 0.5rem;
						}
						.warning-banner h3 {
							color: #856404;
							font-size: 1.1rem;
							margin-bottom: 0.5rem;
						}
						.warning-banner p {
							color: #856404;
							margin-bottom: 1rem;
						}
						.password-form {
							margin-top: 1rem;
						}
						.password-form input {
							width: 100%;
							padding: 0.75rem;
							border: 1px solid #ddd;
							border-radius: 0.5rem;
							margin-bottom: 1rem;
							font-size: 1rem;
						}
						.password-form input:focus {
							outline: none;
							border-color: #FFB347;
						}
						.password-form button {
							padding: 0.75rem 1.5rem;
							background: #FFB347;
							color: white;
							border: none;
							border-radius: 0.5rem;
							font-size: 1rem;
							font-weight: 600;
							cursor: pointer;
							transition: background 0.2s;
						}
						.password-form button:hover {
							background: #FFA030;
						}
						.success-message {
							color: #28a745;
							background: #d4edda;
							padding: 0.75rem;
							border-radius: 0.5rem;
							margin-bottom: 1rem;
							display: none;
						}
						.success-message.show {
							display: block;
						}
						.error-message {
							color: #dc3545;
							background: #f8d7da;
							padding: 0.75rem;
							border-radius: 0.5rem;
							margin-bottom: 1rem;
							display: none;
						}
						.error-message.show {
							display: block;
						}
						.suggestion-card {
							background: linear-gradient(135deg, #FFB347 0%, #FFA030 100%);
							color: white;
							padding: 2rem;
							border-radius: 1rem;
							box-shadow: 0 4px 12px rgba(255, 179, 71, 0.3);
						}
						.suggestion-title {
							font-size: 1.8rem;
							margin-bottom: 1rem;
							font-weight: bold;
						}
						.suggestion-message {
							font-size: 1.1rem;
							margin-bottom: 1.5rem;
							opacity: 0.95;
						}
						.suggestion-details {
							display: flex;
							gap: 1rem;
							margin-bottom: 1rem;
							flex-wrap: wrap;
						}
						.suggestion-tags {
							display: flex;
							gap: 0.5rem;
							flex-wrap: wrap;
						}
						.suggestion-tag {
							background: rgba(255, 255, 255, 0.3);
							padding: 0.25rem 0.75rem;
							border-radius: 1rem;
							font-size: 0.9rem;
						}
						.suggestion-time {
							display: flex;
							align-items: center;
							gap: 0.5rem;
							background: rgba(255, 255, 255, 0.3);
							padding: 0.25rem 0.75rem;
							border-radius: 1rem;
							font-size: 0.9rem;
						}
						.suggestion-note {
							background: rgba(255, 255, 255, 0.2);
							padding: 1rem;
							border-radius: 0.5rem;
							font-size: 0.95rem;
							margin-top: 1rem;
						}
						.suggestion-button:disabled {
							background: #ccc;
							cursor: not-allowed;
							transform: none;
						}
					`}
				</style>
				<script src="/static/dashboard.js" defer />
			</head>
			<body>
				<div class="header">
					<div class="header-top">
						<div class="logo">Suggestman</div>
						<div class="user-info">
							<span class="user-name">{user.name}</span>
							<button class="logout-btn" onclick="handleLogout()" type="button">
								ログアウト
							</button>
						</div>
					</div>
					<div class="header-welcome">
						ようこそ、<strong>{user.name}さん</strong>。今日は何をしますか？
					</div>
				</div>

				<div class="container">
					{!hasPassword ? (
						<div class="warning-banner">
							<h3>⚠️ パスワードが設定されていません</h3>
							<p>
								GitHub
								でログインしたアカウントには、パスワードが設定されていません。
								メールアドレスでもログインできるように、パスワードを設定することをお勧めします。
							</p>
							<div id="password-success" class="success-message" />
							<div id="password-error" class="error-message" />
							<form
								id="password-form"
								class="password-form"
								onsubmit="handleSetPassword(event); return false;"
							>
								<input
									type="password"
									id="new-password"
									placeholder="新しいパスワード（8文字以上、大小文字・数字を含む）"
									required
									minLength={8}
								/>
								<button type="submit">パスワードを設定</button>
							</form>
						</div>
					) : null}

					<div class="section">
						<h2>提案を受け取る</h2>
						<div id="suggestion-error" class="error-message" />
						<button
							id="suggestion-button"
							class="suggestion-button"
							onclick="handleGetSuggestion()"
							type="button"
						>
							今すぐ提案をもらう
						</button>
					</div>

					<div id="suggestion-result" class="section" style="display: none;">
						<h2>あなたへの提案</h2>
						<div class="suggestion-card">
							<h3
								id="suggestion-title"
								class="suggestion-title"
								aria-label="提案タイトル"
							/>
							<p id="suggestion-message" class="suggestion-message" />
							<div class="suggestion-details">
								<div id="suggestion-tags" class="suggestion-tags" />
								<div id="suggestion-time" class="suggestion-time" />
							</div>
							<div id="suggestion-note" class="suggestion-note" />
						</div>
					</div>

					<div class="section">
						<h2>最近のアイデア</h2>
						<div class="placeholder">まだアイデアが登録されていません</div>
					</div>
				</div>
			</body>
		</html>
	);
};
