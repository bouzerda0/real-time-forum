import { LoginView } from '/js/auth/login.js';
import { RegisterView } from '/js/auth/register.js';
import { loadFeed, renderHomeFeed } from '/js/post/feed.js';
import { CreatePostView } from '/js/post/createPost.js';
import { loadPostCard } from '/js/post/postDetails.js';
import { updateAuthUI } from '/js/compenents/navbar.js';
import { ErrorPageView } from '/js/errorPage.js';
import { ChatView } from '/js/chat/chat.js';

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
    '/create-post': CreatePostView,
    '/messages': ChatView,
    '/404': ErrorPageView,
    '404': ErrorPageView
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
        // Network fallback
        return localStorage.getItem('isAuthenticated') === 'true';
    }
}

export async function navigateTo(path) {
    window.history.pushState(null, "", path);
    await render(path);
}

window.navigateTo = navigateTo;

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
    const chatSidebar = document.getElementById('chatSidebar');
    const contentLayout = document.getElementById('contentLayout');
    const navbar = document.querySelector('.navbar');
    const mainArea = document.querySelector('.main');
    const app = document.getElementById('app');

    if (sidebar) sidebar.style.display = isAuthPage ? 'none' : '';
    if (chatSidebar) chatSidebar.style.display = isAuthPage ? 'none' : '';
    // Ensure an open Members panel cannot remain active after navigating to an auth page.
    if (isAuthPage && contentLayout) contentLayout.classList.remove('chat-active');
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

    const route = routes[path] || ErrorPageView;

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

    document.body.addEventListener('click', async (e) => {
        const anchor = e.target.closest('a');
        if (!anchor) return;
        const href = anchor.getAttribute('href');
        if (!href) return;

        const isInternal = href.startsWith('/') || (anchor.origin && anchor.origin === window.location.origin);
        if (isInternal) {
            e.preventDefault();
            const targetPath = href.startsWith('/') ? href : anchor.pathname + anchor.search + anchor.hash;
            window.history.pushState(null, "", targetPath);
            await render(targetPath);
        }
    });

    render(window.location.pathname);
}
