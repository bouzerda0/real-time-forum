import { LoginView } from '/js/auth/login.js';
import { RegisterView } from '/js/auth/register.js';
import { loadFeed, renderHomeFeed } from '/js/post/feed.js';
import { CreatePostView } from '/js/post/createPost.js';
import { loadPostCard } from '/js/post/postDetails.js';
import { updateAuthUI } from '/js/compenents/navbar.js';

const routes = {
    '/': () => {
        const dom = document.createElement('div');
        renderHomeFeed(dom);
        return {
            dom,
            logic: async () => {
                await loadFeed();
            }
        };
    },
    '/login': LoginView,
    '/register': RegisterView,
    '/create-post': CreatePostView
};

async function checkSession() {
    try {
        const response = await fetch('/api/session');
        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('isAuthenticated', 'true');
            if (data.user) {
                localStorage.setItem('currentUser', JSON.stringify(data.user));
            }
            updateAuthUI();
            return true;
        } else {
            localStorage.removeItem('isAuthenticated');
            localStorage.removeItem('currentUser');
            updateAuthUI();
            return false;
        }
    } catch (error) {
        // Fallback to local storage if network is briefly unavailable
        return localStorage.getItem('isAuthenticated') === 'true';
    }
}

window.navigateTo = async (path) => {
    window.history.pushState({}, path, window.location.origin + path);
    await render(path);
};

async function render(path) {
    const isAuthPage = path === '/login' || path === '/register';
    const isAuthenticated = await checkSession();

    // Route guards
    if (!isAuthenticated && !isAuthPage) {
        window.navigateTo('/login');
        return;
    }

    if (isAuthenticated && isAuthPage) {
        window.navigateTo('/');
        return;
    }

    // Layout adjustments for auth pages
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

    updateAuthUI();

    if (!app) return;

    if (path.startsWith('/post/')) {
        const postId = Number(path.split('/')[2]);
        if (postId && !isNaN(postId)) {
            app.innerHTML = '<div id="feed-container"></div>';
            await loadPostCard(postId);
            return;
        }
    }

    const route = routes[path];
    if (!route) {
        app.innerHTML = `
            <div style="text-align: center; padding: 60px;">
                <h1 style="font-size: 36px; color: #0f172a;">404</h1>
                <p style="color: #64748b; margin-top: 8px;">Page not found</p>
            </div>
        `;
        return;
    }

    if (typeof route === 'function') {
        const view = route();
        app.innerHTML = '';
        app.appendChild(view.dom);
        if (view.logic) view.logic();
    } else {
        app.innerHTML = route;
    }
}

export function initRouter() {
    window.addEventListener('popstate', () => {
        render(window.location.pathname);
    });

    // Initial render
    render(window.location.pathname);
}
