export function RegisterView() {
    const mainContainer = document.createElement('div');
    mainContainer.className = 'disc-card';
    mainContainer.innerHTML = `
        <h2>Register</h2>
        <div id="register-error"></div>
        <form id="registerForm" style="display: flex; flex-direction: column; gap: 1rem;">
            <div>
                <label>Username</label>
                <input type="text" id="username" required />
            </div>
            <div>
                <label>Email</label>
                <input type="email" id="email" required />
            </div>
            <div>
                <label>Password</label>
                <input type="password" id="password" required />
            </div>
            <button type="submit" class="btn-create">Sign Up</button>
        </form>
        <p style="margin-top: 1rem; font-size: 0.875rem; text-align: center;">
            Already have an account? <a href="/login" id="login-link">Login</a>
        </p>
    `;

    const logic = () => {
        const registerForm = mainContainer.querySelector('#registerForm');
        const errorMessage = mainContainer.querySelector('#register-error');
        const registerButton = mainContainer.querySelector('button[type="submit"]');
        const usernameInput = mainContainer.querySelector('#username');
        const emailInput = mainContainer.querySelector('#email');
        const passwordInput = mainContainer.querySelector('#password');

        // Navigate to login without page reload
        mainContainer.querySelector('#login-link').addEventListener('click', (e) => {
            e.preventDefault();
            window.navigateTo('/login');
        });

        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            errorMessage.textContent = '';
            registerButton.disabled = true;
            registerButton.textContent = 'Loading...';

            const username = usernameInput.value;
            const email = emailInput.value;
            const password = passwordInput.value;

            try {
                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, email, password })
                });

                const data = await response.json();

                if (response.ok) {
                    // ✅ Success! Redirect to login
                    window.navigateTo('/login');
                } else {
                    errorMessage.textContent = data.message || 'Registration failed. Please try again.';
                }
            } catch (error) {
                errorMessage.textContent = 'Network error. Is the server running?';
            } finally {
                registerButton.disabled = false;
                registerButton.textContent = 'Sign Up';
            }
        });
    };

    return { dom: mainContainer, logic };
}
