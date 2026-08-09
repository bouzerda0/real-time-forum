import { ApiRequest } from '/js/api.js';

export function registerView() {
    const container = document.createElement('div');
    container.className = 'login-box';
    container.innerHTML = `
        <h2>Create Account</h2>
        <div class="subtitle">Join the Forum community</div>
        <div id="register-error-text"></div>
        <form id="registerForm" style="display: flex; flex-direction: column; gap: 1rem;">
            <div>
                <label for="username">username</label>
                <input type="text" id="username" placeholder="e.g. cyber_samurai" required minlength="3" maxlength="25" />
            </div>
            <div class="flex-row">
                <div>
                    <label for="firstName">First Name</label>
                    <input type="text" id="firstName" placeholder="First Name" required />
                </div>
                <div>
                    <label for="lastName">Last Name</label>
                    <input type="text" id="lastName" placeholder="Last Name" required />
                </div>
            </div>
            <div class="flex-row">
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
            <button type="submit" class="new-post-btn">Create Account</button>
        </form>
        <p style="margin-top: 1.5rem; font-size: 0.875rem; text-align: center;">
            Already have an account? <a href="/login" id="login-link">Sign In</a>
        </p>
    `;

    const logic = () => {
        const [form, errBox, btn] = ['#registerForm', '#register-error-text', 'button[type="submit"]'].map(s => container.querySelector(s));
        const getVal = id => container.querySelector(id).value.trim();

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            errBox.textContent = '';
            btn.disabled = true;
            btn.textContent = 'Creating account...';

            const payload = {
                username: getVal('#username'),
                first_name: getVal('#firstName'),
                last_name: getVal('#lastName'),
                age: parseInt(getVal('#age'), 10),
                gender: container.querySelector('#gender').value,
                email: getVal('#email'),
                password: container.querySelector('#password').value
            };

            try {
                const data = await ApiRequest('/api/register', {
                    method: 'POST',
                    body: payload
                });

                window.navigateTo('/login');
            } catch (error) {
                if (error.status === 400 || error.status === 409) {
                    errBox.textContent = 'Registration failed. Please check your details and try again.';
                } else {
                    const { showError } = await import("../errorPage.js");
                    showError(error.status || 500);
                }
            } finally {
                btn.disabled = false;
                btn.textContent = 'Create Account';
            }
        });
    };

    return { dom: container, logic };
}
