import { closeWebSocket } from '../websocket.js';
import { ApiRequest } from '../api.js';

// Always clean up & redirect, even if the API call fails
export async function performLogout() {
    try { await ApiRequest('/api/logout', { method: 'POST' }); }
    catch (e) { console.error('Logout error:', e); }
    finally {
        closeWebSocket();
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('currentUser');
        window.navigateTo('/login');
    }
}

export function updateAuthUI() {
    const navArea = document.getElementById('navAuthArea');
    const sidebar = document.getElementById('sidebarsidebar');
    const authed = localStorage.getItem('isAuthenticated') === 'true';
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');

    // Reconnect socket
    if (authed) window.initOnlineSocket?.();

    if (navArea) {
        if (authed) {
            const name = user.username || user.nickname || user.email?.split('@')[0] || 'User';
            navArea.innerHTML = `
                <div class="auth-buttons-wrapper" style="display:flex;align-items:center;gap:12px">
                    <div style="display:flex;align-items:center;gap:8px;background:var(--light-purple);padding:6px 14px;border-radius:20px;">
                        <div class="user-avatar">${name[0].toUpperCase()}</div>
                        <span style="font-weight:600;font-size:14px;color:var(--main-purple)">@${name}</span>
                    </div>
                    <button id="navLogoutBtn" class="logout-btn">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                            <polyline points="16 17 21 12 16 7"/>
                            <line x1="21" y1="12" x2="9" y2="12"/>
                        </svg>
                        Log Out
                    </button>
                </div>`;
            navArea.querySelector('#navLogoutBtn').onclick = performLogout;
        } else {
            navArea.innerHTML = `
                <button class="btn-login" onclick="navigateTo('/login')">Login</button>
                <button class="btn-register" onclick="navigateTo('/register')">Register</button>`;
        }
    }

    // Sidebar logout 
    if (sidebar) {
        if (authed) {
            sidebar.innerHTML = `<button class="logout-btn" id="sidebarLogoutBtn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>Log Out</button>`;
            sidebar.querySelector('#sidebarLogoutBtn').onclick = performLogout;
        } else {
            sidebar.innerHTML = '';
        }
    }
}

function toggleSidebar(open) {
    document.querySelector('.left-menu')?.classList.toggle('open', open);
    document.getElementById('sidebarOverlay')?.classList.toggle('active', open);
}

export function initNavbar() {
    // Mobile drawer open/close
    document.getElementById('menuToggle')?.addEventListener('click', () => toggleSidebar(true));
    document.getElementById('sidebarClose')?.addEventListener('click', () => toggleSidebar(false));

    // Close mobile sidebar on click outside
    document.addEventListener('click', (e) => {
        const menu = document.querySelector('.left-menu');
        const toggleBtn = document.getElementById('menuToggle');
        if (menu?.classList.contains('open') && !menu.contains(e.target) && !toggleBtn?.contains(e.target)) {
            toggleSidebar(false);
        }
    });

    window.addEventListener('storage', (e) => {
        if (e.key !== 'currentUser' && e.key !== 'isAuthenticated') return;
        // Logged out in another tab -> finish a clean logout here too
        if (localStorage.getItem('isAuthenticated') !== 'true') {
            closeWebSocket();
            if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
                window.navigateTo('/login');
            }
            return;
        }
        updateAuthUI();
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavbar);
} else {
    initNavbar();
}
