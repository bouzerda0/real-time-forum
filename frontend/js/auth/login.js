export function LoginView() {
    // Create the UI (DOM Elements)
    const mainContainer = document.createElement('div');
    mainContainer.className = 'disc-card';

    const pageTitle = document.createElement('h2');
    pageTitle.textContent = 'Login';

    const errorMessage = document.createElement('div');
    errorMessage.id = 'login-error';

    const loginForm = document.createElement('form');
    loginForm.id = 'loginForm';
    loginForm.style.cssText = 'display: flex; flex-direction: column; gap: 1rem;';

    // --- Username or Email Field ---
    const usernameBox = document.createElement('div');
    const usernameLabel = document.createElement('label');
    usernameLabel.textContent = 'Username or Email';
    const usernameInput = document.createElement('input');
    usernameInput.type = 'text';
    usernameInput.id = 'identify';
    usernameInput.required = true;
    usernameBox.append(usernameLabel, usernameInput);

    // --- Password Field ---
    const passwordBox = document.createElement('div');
    const passwordLabel = document.createElement('label');
    passwordLabel.textContent = 'Password';
    const passwordInput = document.createElement('input');
    passwordInput.type = 'password';
    passwordInput.id = 'password';
    passwordInput.required = true;
    passwordBox.append(passwordLabel, passwordInput);

    // --- Submit Button ---
    const loginButton = document.createElement('button');
    loginButton.type = 'submit';
    loginButton.className = 'btn-create';
    loginButton.textContent = 'Sign In';

    // Put all form parts together inside the form
    loginForm.append(usernameBox, passwordBox, loginButton);

    // --- Sign Up Link ---
    const signupText = document.createElement('p');
    signupText.style.cssText = 'margin-top: 1rem; font-size: 0.875rem; text-align: center;';
    signupText.textContent = "Don't have an account? ";

    const signupLink = document.createElement('a');
    signupLink.href = '/register';
    signupLink.textContent = 'Register';

    // Stop the browser from reloading when the link is clicked
    signupLink.addEventListener('click', (e) => {
        e.preventDefault();
        window.navigateTo('/register');
    });

    signupText.appendChild(signupLink);

    // Put everything inside the main container
    mainContainer.append(pageTitle, errorMessage, loginForm, signupText);

    // The Logic (Events and API Calls)
    const logic = () => {
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