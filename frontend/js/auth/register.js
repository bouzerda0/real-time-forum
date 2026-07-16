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
        const [form, errBox, btn] = ['#registerForm', '#register-error', 'button[type="submit"]'].map(s => mainContainer.querySelector(s));
        const getVal = id => mainContainer.querySelector(id).value.trim();

        // 1. Handle navigation to login
        mainContainer.querySelector('#login-link').addEventListener('click', (e) => {
            e.preventDefault();
            window.navigateTo('/login');
        });

        // 2. Handle registration form submission
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            errBox.textContent = '';
            btn.disabled = true;
            btn.textContent = 'Creating account...';

            // 3. Extract form payload
            const payload = {
                username: getVal('#username'),
                first_name: getVal('#firstName'),
                last_name: getVal('#lastName'),
                age: parseInt(getVal('#age'), 10),
                gender: mainContainer.querySelector('#gender').value,
                email: getVal('#email'),
                password: mainContainer.querySelector('#password').value
            };

            try {
                // 4. Call registration API
                const res = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();

                // 5. Handle API response with early return
                if (!res.ok) {
                    errBox.textContent = data.message || 'Registration failed. Please try again.';
                    return;
                }

                window.navigateTo('/login');
            } catch {
                errBox.textContent = 'Network error. Is the server running?';
            } finally {
                btn.disabled = false;
                btn.textContent = 'Create Account';
            }
        });
    };

    return { dom: mainContainer, logic };
}
