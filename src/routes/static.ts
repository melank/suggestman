import { Hono } from "hono";

const app = new Hono();

// dashboard.js を提供
app.get("/dashboard.js", (c) => {
	const js = `async function handleLogout() {
	try {
		const res = await fetch('/api/auth/logout', {
			method: 'POST',
			credentials: 'same-origin',
			redirect: 'manual'
		});
		// リダイレクトレスポンス(302)またはOKレスポンスの場合、ログイン画面へ
		if (res.status === 302 || res.status === 0 || res.ok) {
			window.location.href = '/';
		} else {
			console.error('Logout failed with status:', res.status);
			alert('ログアウトに失敗しました');
		}
	} catch (err) {
		console.error('Logout error:', err);
		alert('ログアウトに失敗しました: ' + err.message);
	}
}

async function handleSetPassword(e) {
	e.preventDefault();
	const error = document.getElementById('password-error');
	const success = document.getElementById('password-success');
	error.classList.remove('show');
	success.classList.remove('show');
	const password = document.getElementById('new-password').value;
	try {
		const res = await fetch('/api/auth/set-password', {
			method: 'POST',
			headers: {'Content-Type': 'application/json'},
			credentials: 'same-origin',
			body: JSON.stringify({password})
		});
		const data = await res.json();
		if (res.ok) {
			success.textContent = data.message;
			success.classList.add('show');
			document.getElementById('password-form').reset();
			setTimeout(() => window.location.reload(), 2000);
		} else {
			error.textContent = data.error;
			error.classList.add('show');
		}
	} catch (err) {
		error.textContent = 'パスワードの設定に失敗しました: ' + err.message;
		error.classList.add('show');
	}
}

async function handleGetSuggestion() {
	const button = document.getElementById('suggestion-button');
	const errorEl = document.getElementById('suggestion-error');
	const resultEl = document.getElementById('suggestion-result');

	// エラーメッセージをクリア
	errorEl.classList.remove('show');
	errorEl.textContent = '';

	// ボタンを無効化
	button.disabled = true;
	button.textContent = '提案を取得中...';

	try {
		const res = await fetch('/api/suggestions', {
			method: 'POST',
			headers: {'Content-Type': 'application/json'},
			credentials: 'same-origin',
			body: JSON.stringify({})
		});

		const data = await res.json();

		if (res.ok) {
			if (data.suggestion) {
				// 提案がある場合、表示する
				const idea = data.suggestion.idea;
				document.getElementById('suggestion-title').textContent = idea.title;
				document.getElementById('suggestion-message').textContent = data.suggestion.motivationalMessage;

				// タグを表示
				const tagsEl = document.getElementById('suggestion-tags');
				tagsEl.innerHTML = '';
				if (idea.tags && idea.tags.length > 0) {
					idea.tags.forEach(tag => {
						const tagEl = document.createElement('span');
						tagEl.className = 'suggestion-tag';
						tagEl.textContent = tag;
						tagsEl.appendChild(tagEl);
					});
				}

				// 推定時間を表示
				const timeEl = document.getElementById('suggestion-time');
				if (idea.estimated_minutes) {
					timeEl.textContent = '⏱️ 約' + idea.estimated_minutes + '分';
					timeEl.style.display = 'flex';
				} else {
					timeEl.style.display = 'none';
				}

				// メモを表示
				const noteEl = document.getElementById('suggestion-note');
				if (idea.note) {
					noteEl.textContent = idea.note;
					noteEl.style.display = 'block';
				} else {
					noteEl.style.display = 'none';
				}

				// 採用ボタンにアイデアIDを設定
				const adoptButton = document.getElementById('adopt-button');
				adoptButton.setAttribute('data-idea-id', idea.id);

				// 提案結果を表示
				resultEl.style.display = 'block';
				resultEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
			} else {
				// 提案がない場合
				errorEl.textContent = data.message || 'アイデアが登録されていません';
				errorEl.classList.add('show');
				resultEl.style.display = 'none';
			}
		} else {
			errorEl.textContent = data.error || '提案の取得に失敗しました';
			errorEl.classList.add('show');
			resultEl.style.display = 'none';
		}
	} catch (err) {
		console.error('Suggestion error:', err);
		errorEl.textContent = '提案の取得に失敗しました: ' + err.message;
		errorEl.classList.add('show');
		resultEl.style.display = 'none';
	} finally {
		// ボタンを再度有効化
		button.disabled = false;
		button.textContent = '今すぐ提案をもらう';
	}
}

async function handleAdoptIdea() {
	const adoptButton = document.getElementById('adopt-button');
	const ideaIdStr = adoptButton.getAttribute('data-idea-id');

	if (!ideaIdStr) {
		alert('アイデアIDが見つかりません');
		return;
	}

	// 文字列を数値に変換
	const ideaId = Number.parseInt(ideaIdStr, 10);
	if (Number.isNaN(ideaId)) {
		alert('無効なアイデアIDです');
		return;
	}

	// ボタンを無効化
	adoptButton.disabled = true;
	adoptButton.textContent = '採用中...';

	try {
		const res = await fetch('/api/adopted-ideas', {
			method: 'POST',
			headers: {'Content-Type': 'application/json'},
			credentials: 'same-origin',
			body: JSON.stringify({ idea_id: ideaId })
		});

		const data = await res.json();

		if (res.ok) {
			adoptButton.textContent = '✓ 採用済み';
			adoptButton.style.background = 'rgba(76, 175, 80, 0.3)';
			adoptButton.style.color = 'white';
			setTimeout(() => {
				adoptButton.disabled = false;
				adoptButton.textContent = '採用する';
				adoptButton.style.background = 'white';
				adoptButton.style.color = '#FFB347';
			}, 2000);
		} else {
			alert(data.error || 'アイデアの採用に失敗しました');
			adoptButton.disabled = false;
			adoptButton.textContent = '採用する';
		}
	} catch (err) {
		console.error('Adopt idea error:', err);
		alert('アイデアの採用に失敗しました: ' + err.message);
		adoptButton.disabled = false;
		adoptButton.textContent = '採用する';
	}
}`;

	return c.text(js, 200, {
		"Content-Type": "application/javascript",
		"Cache-Control": "no-cache, no-store, must-revalidate",
	});
});

// login.js を提供
app.get("/login.js", (c) => {
	const js = `function switchTab(tab) {
	document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
	document.querySelectorAll('.form-container').forEach(f => f.classList.remove('active'));
	if (tab === 'login') {
		document.querySelectorAll('.tab')[0].classList.add('active');
	} else {
		document.querySelectorAll('.tab')[1].classList.add('active');
	}
	document.getElementById(tab).classList.add('active');
}

async function handleLogin(e) {
	e.preventDefault();
	const error = document.getElementById('login-error');
	error.classList.remove('show');
	const email = document.getElementById('login-email').value;
	const password = document.getElementById('login-password').value;
	try {
		const res = await fetch('/api/auth/login', {
			method: 'POST',
			headers: {'Content-Type': 'application/json'},
			body: JSON.stringify({email, password})
		});
		const data = await res.json();
		if (res.ok) {
			window.location.href = data.redirect;
		} else {
			error.textContent = data.error;
			error.classList.add('show');
		}
	} catch (err) {
		error.textContent = 'ログインに失敗しました';
		error.classList.add('show');
	}
}

async function handleSignup(e) {
	e.preventDefault();
	const error = document.getElementById('signup-error');
	error.classList.remove('show');
	const name = document.getElementById('signup-name').value;
	const email = document.getElementById('signup-email').value;
	const password = document.getElementById('signup-password').value;
	try {
		const res = await fetch('/api/auth/signup', {
			method: 'POST',
			headers: {'Content-Type': 'application/json'},
			body: JSON.stringify({name, email, password})
		});
		const data = await res.json();
		if (res.ok) {
			window.location.href = data.redirect;
		} else {
			error.textContent = data.error;
			error.classList.add('show');
		}
	} catch (err) {
		error.textContent = 'サインアップに失敗しました';
		error.classList.add('show');
	}
}`;

	return c.text(js, 200, {
		"Content-Type": "application/javascript",
		"Cache-Control": "no-cache, no-store, must-revalidate",
	});
});

export default app;
