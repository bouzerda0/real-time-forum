import { LoginView } from '/js/auth/login.js';
import { RegisterView } from '/js/auth/register.js';
import { loadFeed, renderHomeFeed } from '/js/post/feed.js';
import { filterByCategory } from '/js/post/filterPosts.js';
import { CreatePostView } from '/js/post/createPost.js';
import { loadPostCard } from '/js/post/postDetails.js';

window.filterByCategory = filterByCategory;

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
            return true;
        } else {
            localStorage.removeItem('isAuthenticated');
            localStorage.removeItem('currentUser');
            return false;
        }
    } catch (error) {
        // Fallback to local storage if network is briefly unavailable
        return localStorage.getItem('isAuthenticated') === 'true';
    }
}

async function performLogout() {
    try {
        await fetch('/api/logout', { method: 'POST' });
    } catch (error) {
        console.error('Logout request error:', error);
    } finally {
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('currentUser');
        window.navigateTo('/login');
    }
}

window.navigateTo = async (path) => {
    window.history.pushState({}, path, window.location.origin + path);
    await render(path);
};

function updateAuthUI() {
    const navAuthArea = document.getElementById('navAuthArea');
    const sidebarFooter = document.getElementById('sidebarFooter');
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

    if (navAuthArea) {
        if (isAuthenticated) {
            const initial = (currentUser.username || 'U').charAt(0).toUpperCase();
            navAuthArea.innerHTML = `
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="display: flex; align-items: center; gap: 8px; background: #eff6ff; border: 1px solid #bfdbfe; padding: 6px 14px; border-radius: 9999px;">
                        <div style="width: 24px; height: 24px; border-radius: 50%; background: #8b5cf6; color: white; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700;">
                            ${initial}
                        </div>
                        <span style="font-weight: 600; font-size: 13.5px; color: #1e40af;">@${currentUser.username || 'User'}</span>
                    </div>
                    <button id="navLogoutBtn" style="background: #fee2e2; color: #dc2626; border: 1px solid #fecaca; padding: 7px 14px; border-radius: 8px; font-weight: 600; font-size: 13px; cursor: pointer; transition: all 0.2s;">
                        Log Out
                    </button>
                </div>
            `;
            const logoutBtn = navAuthArea.querySelector('#navLogoutBtn');
            if (logoutBtn) logoutBtn.addEventListener('click', performLogout);
        } else {
            navAuthArea.innerHTML = `
                <button class="btn-login" onclick="navigateTo('/login')">Login</button>
                <button class="btn-register" onclick="navigateTo('/register')">Register</button>
            `;
        }
    }

    if (sidebarFooter) {
        if (isAuthenticated) {
            sidebarFooter.innerHTML = `
                <button id="sidebarLogoutBtn" style="background: none; border: none; cursor: pointer; width: 100%; text-align: left; padding: 0.6rem 0.5rem; font-weight: 600; font-size: 0.9rem; color: #dc2626; display: flex; align-items: center; gap: 8px;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                    Log Out
                </button>
            `;
            const sbLogoutBtn = sidebarFooter.querySelector('#sidebarLogoutBtn');
            if (sbLogoutBtn) sbLogoutBtn.addEventListener('click', performLogout);
        } else {
            sidebarFooter.innerHTML = '';
        }
    }
}

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

window.addEventListener('popstate', () => {
    render(window.location.pathname);
});

// Initial render
render(window.location.pathname);
