import { LoginView } from '/js/auth/login.js';

const routes = {
    '/': `<h1>Explore the Forum</h1><p>Welcome to the main dashboard.</p>`,
    '/login': LoginView,
    '/register': `<h1>Register</h1><p>Registration form here...</p>`,
    '/create-post': `<h1>Create Post</h1><p>Post form here...</p>`
};

window.navigateTo = (path) => {
    window.history.pushState({}, path, window.location.origin + path);
    render(path);
};

function render(path) {
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    // redirect unauthenticated users to /login
    if (!isAuthenticated && path !== '/login' && path !== '/register') {
        window.navigateTo('/login');
        return;
    }
    //  redirect authenticated users to / (home)
    if (isAuthenticated && (path === '/login' || path === '/register')) {
        window.navigateTo('/');
        return;
    }

    // Toggle layout: hide sidebar & navbar on auth pages
    const isAuthPage = path === '/login' || path === '/register';
    const sidebar = document.querySelector('.sidebar');
    const navbar = document.querySelector('.navbar');
    const mainArea = document.querySelector('.main');
    const app = document.getElementById('app');

    if (sidebar) sidebar.style.display = isAuthPage ? 'none' : '';
    if (navbar) navbar.style.display = isAuthPage ? 'none' : '';
    if (mainArea) {
        mainArea.style.marginLeft = isAuthPage ? '0' : '';
        mainArea.style.width = isAuthPage ? '100%' : '';
    }
    if (app) {
        app.style.padding = isAuthPage ? '0' : '';
        app.style.maxWidth = isAuthPage ? 'none' : '';
    }

    const route = routes[path];

    if (!route) {
        app.innerHTML = `<h1>404</h1><p>Page not found</p>`;
        return;
    }

    // Component-based view (returns { dom, logic })
    if (typeof route === 'function') {
        const view = route();
        app.innerHTML = '';
        app.appendChild(view.dom);
        if (view.logic) view.logic();
    } else {
        // Plain HTML string route
        app.innerHTML = route;
    }
}

window.addEventListener('popstate', () => {
    render(window.location.pathname);
});

render(window.location.pathname);