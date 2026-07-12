export function LoginView() {
    const mainContainer = document.createElement('div');
    mainContainer.className = 'disc-card';
    mainContainer.innerHTML = `
        <h2>Welcome Back</h2>
        <div class="subtitle">Sign in with your nickname or e-mail</div>
        <div id="login-error"></div>
        <form id="loginForm" style="display: flex; flex-direction: column; gap: 1rem;">
            <div>
                <label for="identify">Nickname or E-mail</label>
                <input type="text" id="identify" placeholder="Enter nickname or e-mail" required />
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
        const loginForm = mainContainer.querySelector('#loginForm');
        const errorMessage = mainContainer.querySelector('#login-error');
        const loginButton = mainContainer.querySelector('button[type="submit"]');
        const identifyInput = mainContainer.querySelector('#identify');
        const passwordInput = mainContainer.querySelector('#password');

        mainContainer.querySelector('#signup-link').addEventListener('click', (e) => {
            e.preventDefault();
            window.navigateTo('/register');
        });

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            errorMessage.textContent = '';
            loginButton.disabled = true;
            loginButton.textContent = 'Signing in...';

            const identify = identifyInput.value.trim();
            const password = passwordInput.value;

            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ identify, password })
                });

                const data = await response.json();

                if (response.ok) {
                    localStorage.setItem('isAuthenticated', 'true');
                    if (data.user) {
                        localStorage.setItem('currentUser', JSON.stringify(data.user));
                    }
                    window.navigateTo('/');
                } else {
                    errorMessage.textContent = data.message || 'Login failed. Please check your credentials.';
                }
            } catch (error) {
                errorMessage.textContent = 'Network error. Is the server running?';
            } finally {
                loginButton.disabled = false;
                loginButton.textContent = 'Sign In';
            }
        });
    };

    return { dom: mainContainer, logic };
}