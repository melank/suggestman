import {Hono} from "hono";

const app = new Hono();

// dashboard.js を提供
app.get("/dashboard.js", (c) => {
	const js = `async function handleSetPassword(e) {
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
}`;

	return c.text(js, 200, {
		"Content-Type": "application/javascript",
		"Cache-Control": "public, max-age=3600",
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
		"Cache-Control": "public, max-age=3600",
	});
});

export default app;
