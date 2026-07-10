export function LoginView() {
    const mainContainer = document.createElement('div');
    mainContainer.className = 'disc-card';
    mainContainer.innerHTML = `
        <h2>Login</h2>
        <div id="login-error"></div>
        <form id="loginForm" style="display: flex; flex-direction: column; gap: 1rem;">
            <div>
                <label>Username or Email</label>
                <input type="text" id="identify" required />
            </div>
            <div>
                <label>Password</label>
                <input type="password" id="password" required />
            </div>
            <button type="submit" class="btn-create">Sign In</button>
        </form>
        <p style="margin-top: 1rem; font-size: 0.875rem; text-align: center;">
            Don't have an account? <a href="/register" id="signup-link">Register</a>
        </p>
    `;

    const logic = () => {
        const loginForm = mainContainer.querySelector('#loginForm');
        const errorMessage = mainContainer.querySelector('#login-error');
        const loginButton = mainContainer.querySelector('button[type="submit"]');
        const usernameInput = mainContainer.querySelector('#identify');
        const passwordInput = mainContainer.querySelector('#password');

        // Navigate to register without page reload
        mainContainer.querySelector('#signup-link').addEventListener('click', (e) => {
            e.preventDefault();
            window.navigateTo('/register');
        });

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Stop page reload

            errorMessage.textContent = ''; // Clear old errors
            loginButton.disabled = true; // Disable button while loading
            loginButton.textContent = 'Loading...';

            const identify = usernameInput.value;
            const password = passwordInput.value;

            try {
                // Send data to our Go backend
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ identify, password })
                });

                if (response.ok) {
                    // ✅ Success! Set the passport for the Router
                    localStorage.setItem('isAuthenticated', 'true');

                    // Go to home page
                    window.navigateTo('/');
                } else {
                    // Failed: Show the error message from the backend
                    const data = await response.json();
                    errorMessage.textContent = data.message || 'Login failed. Please check your credentials.';
                }
            } catch (error) {
                // Failed: Server is down or no internet
                errorMessage.textContent = 'Network error. Is the server running?';
            } finally {
                // Re-enable the button
                loginButton.disabled = false;
                loginButton.textContent = 'Sign In';
            }
        });
    };

    return { dom: mainContainer, logic };
}