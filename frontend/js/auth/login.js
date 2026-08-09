import { ApiRequest } from '/js/api.js';

export function loginView() {
    const container = document.createElement('div');
    container.className = 'login-box';
    container.innerHTML = `
        <h2>Welcome Back</h2>
        <div class="subtitle">Sign in with your username or e-mail</div>
        <div id="login-error-text"></div>
        <form id="loginForm" style="display: flex; flex-direction: column; gap: 1rem;">
            <div>
                <label for="identify">username or E-mail</label>
                <input type="text" id="identify" placeholder="Enter username or e-mail" required />
            </div>
            <div>
                <label for="password">Password</label>
                <input type="password" id="password" placeholder="Enter password" required />
            </div>
            <button type="submit" class="new-post-btn">Sign In</button>
        </form>
        <p style="margin-top: 1.5rem; font-size: 0.875rem; text-align: center;">
            Don't have an account? <a href="/register" id="signup-link">Register</a>
        </p>
    `;

    const logic = () => {
        const [form, errBox, btn] = ['#loginForm', '#login-error-text', 'button[type="submit"]'].map(s => container.querySelector(s));

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const identify = container.querySelector('#identify').value.trim();
            const password = container.querySelector('#password').value;

            errBox.textContent = '';
            btn.disabled = true;
            btn.textContent = 'Signing in...';

            try {
                const data = await ApiRequest('/api/login', {
                    method: 'POST',
                    body: { identify, password }
                });

                localStorage.setItem('isAuthenticated', 'true');
                if (data.user) localStorage.setItem('currentUser', JSON.stringify(data.user));
                window.navigateTo('/');
            } catch (error) {
                if (error.message === "Unauthorized" || error.status === 400 || error.status === 401) {
                    errBox.textContent = 'Invalid username/email or password.';
                } else {
                    const { showError } = await import("../errorPage.js");
                    showError(error.status || 500);
                }
            } finally {
                btn.disabled = false;
                btn.textContent = 'Sign In';
            }
        });
    };

    return { dom: container, logic };
}