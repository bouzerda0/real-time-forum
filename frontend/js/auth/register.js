export function RegisterView() {
    const mainContainer = document.createElement('div');
    mainContainer.className = 'disc-card';
    mainContainer.innerHTML = `
        <h2>Create Account</h2>
        <div class="subtitle">Join the Real-Time Forum premium community</div>
        <div id="register-error"></div>
        <form id="registerForm" style="display: flex; flex-direction: column; gap: 1rem;">
            <div>
                <label for="username">username</label>
                <input type="text" id="username" placeholder="e.g. cyber_samurai" required minlength="3" maxlength="25" />
            </div>
            <div class="form-row">
                <div>
                    <label for="firstName">First Name</label>
                    <input type="text" id="firstName" placeholder="First Name" required />
                </div>
                <div>
                    <label for="lastName">Last Name</label>
                    <input type="text" id="lastName" placeholder="Last Name" required />
                </div>
            </div>
            <div class="form-row">
                <div>
                    <label for="age">Age</label>
                    <input type="number" id="age" placeholder="21" min="13" max="120" required />
                </div>
                <div>
                    <label for="gender">Gender</label>
                    <select id="gender" required>
                        <option value="" disabled selected>Select gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                    </select>
                </div>
            </div>
            <div>
                <label for="email">E-mail Address</label>
                <input type="email" id="email" placeholder="you@example.com" required />
            </div>
            <div>
                <label for="password">Password</label>
                <input type="password" id="password" placeholder="At least 8 characters" required minlength="8" />
            </div>
            <button type="submit" class="btn-create">Create Account</button>
        </form>
        <p style="margin-top: 1.5rem; font-size: 0.875rem; text-align: center;">
            Already have an account? <a href="/login" id="login-link">Sign In</a>
        </p>
    `;

    const logic = () => {
        const registerForm = mainContainer.querySelector('#registerForm');
        const errorMessage = mainContainer.querySelector('#register-error');
        const registerButton = mainContainer.querySelector('button[type="submit"]');

        const usernameInput = mainContainer.querySelector('#username');
        const firstNameInput = mainContainer.querySelector('#firstName');
        const lastNameInput = mainContainer.querySelector('#lastName');
        const ageInput = mainContainer.querySelector('#age');
        const genderSelect = mainContainer.querySelector('#gender');
        const emailInput = mainContainer.querySelector('#email');
        const passwordInput = mainContainer.querySelector('#password');

        mainContainer.querySelector('#login-link').addEventListener('click', (e) => {
            e.preventDefault();
            window.navigateTo('/login');
        });

        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            errorMessage.textContent = '';
            registerButton.disabled = true;
            registerButton.textContent = 'Creating account...';

            const payload = {
                username: usernameInput.value.trim(),
                first_name: firstNameInput.value.trim(),
                last_name: lastNameInput.value.trim(),
                age: parseInt(ageInput.value, 10),
                gender: genderSelect.value,
                email: emailInput.value.trim(),
                password: passwordInput.value
            };

            try {
                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const data = await response.json();

                if (response.ok) {
                    window.navigateTo('/login');
                } else {
                    errorMessage.textContent = data.message || 'Registration failed. Please try again.';
                }
            } catch (error) {
                errorMessage.textContent = 'Network error. Is the server running?';
            } finally {
                registerButton.disabled = false;
                registerButton.textContent = 'Create Account';
            }
        });
    };

    return { dom: mainContainer, logic };
}
