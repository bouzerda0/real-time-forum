import { closeWebSocket } from '../websocket.js';

// Always clean up & redirect, even if the API call fails
export async function performLogout() {
    try { await fetch('/api/logout', { method: 'POST' }); }
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
    const footer = document.getElementById('sidebarFooter');
    const authed = localStorage.getItem('isAuthenticated') === 'true';
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');

    // Reconnect socket on auth state change
    if (authed) window.initOnlineSocket?.();

    if (navArea) {
        if (authed) {
            // Fallback chain: pick best display name available
            const name = user.username || user.nickname || user.email?.split('@')[0] || 'User';
            navArea.innerHTML = `
                <div style="display:flex;align-items:center;gap:12px">
                    <div style="display:flex;align-items:center;gap:8px;background:#eff6ff;border:1px solid #bfdbfe;padding:6px 14px;border-radius:9999px">
                        <div class="user-rune-logo">${name[0].toUpperCase()}</div>
                        <span style="font-weight:600;font-size:13.5px;color:#1e40af">@${name}</span>
                    </div>
                    <button id="navLogoutBtn" style="background:#fee2e2;color:#dc2626;border:1px solid #fecaca;padding:7px 14px;border-radius:8px;font-weight:600;font-size:13px;cursor:pointer">Log Out</button>
                </div>`;
            navArea.querySelector('#navLogoutBtn').onclick = performLogout;
        } else {
            navArea.innerHTML = `
                <button class="btn-login" onclick="navigateTo('/login')">Login</button>
                <button class="btn-register" onclick="navigateTo('/register')">Register</button>`;
        }
    }

    // Sidebar logout — only show when authed
    if (footer) {
        if (authed) {
            footer.innerHTML = `<button class="btn-logout-sidebar" id="sidebarLogoutBtn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>Log Out</button>`;
            footer.querySelector('#sidebarLogoutBtn').onclick = performLogout;
        } else {
            footer.innerHTML = '';
        }
    }
}

// One helper to toggle sidebar open/close
function toggleSidebar(open) {
    document.querySelector('.sidebar')?.classList.toggle('open', open);
    document.getElementById('sidebarOverlay')?.classList.toggle('active', open);
}

export function initNavbar() {
    // Mobile drawer open/close
    document.getElementById('menuToggle')?.addEventListener('click', () => toggleSidebar(true));
    document.getElementById('sidebarClose')?.addEventListener('click', () => toggleSidebar(false));

    // Sync auth UI across tabs via storage events
    window.addEventListener('storage', (e) => {
        if (e.key === 'currentUser' || e.key === 'isAuthenticated') updateAuthUI();
    });
}

// Run init — handles both sync and async DOM ready states
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavbar);
} else {
    initNavbar();
}
