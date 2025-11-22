import type { FC } from "hono/jsx";

type DashboardPageProps = {
	user: {
		name: string;
		email: string;
	};
};

export const DashboardPage: FC<DashboardPageProps> = ({ user }) => {
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
							color: #667eea;
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
							background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
							color: white;
							border: none;
							border-radius: 0.75rem;
							font-size: 1.2rem;
							font-weight: 600;
							cursor: pointer;
							transition: transform 0.2s;
						}
						.suggestion-button:hover {
							transform: translateY(-2px);
						}
						.placeholder {
							text-align: center;
							color: #999;
							padding: 2rem;
						}
					`}
				</style>
			</head>
			<body>
				<div class="header">
					<div class="logo">Suggestman</div>
					<div class="user-info">
						<span class="user-name">{user.name}</span>
						<button
							class="logout-btn"
							onclick="document.cookie='token=; Max-Age=0; Path=/'; location.href='/'"
							type="button"
						>
							ログアウト
						</button>
					</div>
				</div>

				<div class="container">
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
