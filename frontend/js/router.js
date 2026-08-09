import { loginView } from '/js/auth/login.js';
import { registerView } from '/js/auth/register.js';
import { loadFeed, renderHomeFeed } from '/js/post/feed.js';
import { createPostView } from '/js/post/createPost.js';
import { loadPostCard } from '/js/post/postDetails.js';
import { updateAuthUI } from '/js/compenents/navbar.js';
import { errorView } from '/js/errorPage.js';

// route definitions
const routes = {
    '/': () => {
        const dom = document.createElement('div');
        renderHomeFeed(dom);
        return { dom, logic: loadFeed };
    },
    '/login': loginView,
    '/register': registerView,
    '/create-post': createPostView,
    '/404': errorView,
};

// auth check
async function checkAuth() {
    try {
        const res = await fetch('/api/session');
        if (res.status === 401) {
            localStorage.removeItem('isAuthenticated');
            localStorage.removeItem('currentUser');
            return false;
        }
        if (!res.ok) throw new Error();
        const { user } = await res.json();
        localStorage.setItem('isAuthenticated', 'true');
        if (user) localStorage.setItem('currentUser', JSON.stringify(user));
        return true;
    } catch {
        const cached = localStorage.getItem('isAuthenticated') === 'true';
        if (!cached) {
            localStorage.removeItem('isAuthenticated');
            localStorage.removeItem('currentUser');
        }
        return cached;
    } finally {
        updateAuthUI();
    }
}

export async function navigateTo(path) {
    window.history.pushState(null, '', path);
    await render(path);
}
window.navigateTo = navigateTo;

async function render(path) {
    const isAuthRoute = path === '/login' || path === '/register';
    const isAuthed = await checkAuth();

    if (!isAuthed && !isAuthRoute) return navigateTo('/login');
    if (isAuthed && isAuthRoute) return navigateTo('/');

    const hide = isAuthRoute ? 'none' : '';
    document.querySelector('.left-menu')?.style.setProperty('display', hide);
    document.getElementById('chatSidebar')?.style.setProperty('display', hide);
    document.querySelector('.top-bar')?.style.setProperty('display', hide);
    if (isAuthRoute) document.getElementById('contentLayout')?.classList.remove('chat-active');

    const main = document.querySelector('.main-content');
    if (main) {
        main.style.marginLeft = hide ? '0' : '';
        main.style.width = hide ? '100%' : '';
    }

    const app = document.getElementById('app');
    if (!app) return;

    if (isAuthRoute) {
        app.style.padding = '20px';
        app.style.maxWidth = 'none';
        app.style.display = 'flex';
        app.style.alignItems = 'center';
        app.style.justifyContent = 'center';
        app.style.minHeight = '100vh';
        app.style.boxSizing = 'border-box';
    } else {
        app.style.padding = '';
        app.style.maxWidth = '';
        app.style.display = '';
        app.style.alignItems = '';
        app.style.justifyContent = '';
        app.style.minHeight = '';
        app.style.boxSizing = '';
    }

    if (path.startsWith('/post/')) {
        const id = Number(path.split('/')[2]);
        if (id) {
            app.innerHTML = '<div id="feed" class="feed-container"></div>';
            return loadPostCard(id);
        }
    }

    const route = routes[path] || errorView;
    const view = route();
    app.innerHTML = '';
    app.appendChild(view.dom);
    view.logic?.();
}

export function init() {
    window.addEventListener('popstate', () => render(location.pathname));

    document.body.addEventListener('click', (e) => {
        const a = e.target.closest('a[href]');
        if (!a) return;
        e.preventDefault();
        navigateTo(a.pathname);
    });

    render(location.pathname);
}
