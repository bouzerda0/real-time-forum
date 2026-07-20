export function LoginView() {
    const mainContainer = document.createElement('div');
    mainContainer.className = 'disc-card';
    mainContainer.innerHTML = `
        <h2>Welcome Back</h2>
        <div class="subtitle">Sign in with your username or e-mail</div>
        <div id="login-error"></div>
        <form id="loginForm" style="display: flex; flex-direction: column; gap: 1rem;">
            <div>
                <label for="identify">username or E-mail</label>
                <input type="text" id="identify" placeholder="Enter username or e-mail" required />
            </div>
            <div>
                <label for="password">Password</label>
                <input type="password" id="password" placeholder="Enter password" required />
            </div>
            <button type="submit" class="btn-create">Sign In</button>
        </form>
        <p style="margin-top: 1.5rem; font-size: 0.875rem; text-align: center;">
            Don't have an account? <a href="/register" id="signup-link">Register</a>
        </p>
    `;

    const logic = () => {
        const [form, errBox, btn] = ['#loginForm', '#login-error', 'button[type="submit"]'].map(s => mainContainer.querySelector(s));

        // 1. Handle form submission
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const identify = mainContainer.querySelector('#identify').value.trim();
            const password = mainContainer.querySelector('#password').value;

            errBox.textContent = '';
            btn.disabled = true;
            btn.textContent = 'Signing in...';

            try {
                // 3. Call login API
                const res = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ identify, password })
                });
                const data = await res.json();

                // 4. Handle API response with early return
                if (!res.ok) {
                    errBox.textContent = data.message || 'Login failed. Please check your credentials.';
                    return;
                }

                // 5. Store authentication state and navigate home
                localStorage.setItem('isAuthenticated', 'true');
                if (data.user) localStorage.setItem('currentUser', JSON.stringify(data.user));
                window.navigateTo('/');
            } catch {
                errBox.textContent = 'Network error. Is the server running?';
            } finally {
                btn.disabled = false;
                btn.textContent = 'Sign In';
            }
        });
    };

    return { dom: mainContainer, logic };
}