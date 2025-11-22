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

export default app;
