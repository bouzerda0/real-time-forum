const routes = {
    '/': `<h1>Explore the Forum</h1><p>Welcome to the main dashboard.</p>`,
    '/login': `<h1>Login</h1><p>Form goes here...</p>`,
    '/register': `<h1>Register</h1><p>Registration form here...</p>`,
    '/create-post': `<h1>Create Post</h1><p>Post form here...</p>`
};

window.navigateTo = (path) => {
    window.history.pushState({}, path, window.location.origin + path);
    render(path);
};

function render(path) {
    const app = document.getElementById('app');
    
    if (routes[path]) {
        app.innerHTML = routes[path];
    } else {
        app.innerHTML = `<h1>404</h1><p>Page not found</p>`;
    }
}

window.addEventListener('popstate', () => {
    render(window.location.pathname);
});

render(window.location.pathname);