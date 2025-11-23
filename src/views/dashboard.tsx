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
							background: #f5f5f5;
							min-height: 100vh;
						}
						.header {
							background: white;
							border-bottom: 1px solid #e0e0e0;
							padding: 1rem 2rem;
							display: flex;
							justify-content: space-between;
							align-items: center;
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
						.welcome {
							background: white;
							padding: 2rem;
							border-radius: 1rem;
							box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
							margin-bottom: 2rem;
						}
						.welcome h1 {
							font-size: 2rem;
							color: #333;
							margin-bottom: 0.5rem;
						}
						.welcome p {
							color: #666;
							font-size: 1rem;
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
					`}
				</style>
				<script src="/static/dashboard.js" defer></script>
			</head>
			<body>
				<div class="header">
					<div class="logo">Suggestman</div>
					<div class="user-info">
						<span class="user-name">{user.name}</span>
						<button
							class="logout-btn"
							onclick="handleLogout()"
							type="button"
						>
							ログアウト
						</button>
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

					<div class="welcome">
						<h1>ようこそ、{user.name}さん</h1>
						<p>今日は何をしますか？</p>
					</div>

					<div class="section">
						<h2>提案を受け取る</h2>
						<button
							class="suggestion-button"
							onclick="alert('提案機能は開発中です')"
							type="button"
						>
							今すぐ提案をもらう
						</button>
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
