export async function performLogout() {
    try {
        await fetch('/api/logout', { method: 'POST' });
    } catch (error) {
        console.error('Logout request error:', error);
    } finally {
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('currentUser');
        if (window.navigateTo) {
            window.navigateTo('/login');
        } else {
            window.location.href = '/login';
        }
    }
}

export function updateAuthUI() {
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

// Initialize sidebar toggle events
export function initNavbar() {
    const menuToggle = document.getElementById('menuToggle');
    const sidebarClose = document.getElementById('sidebarClose');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('sidebarOverlay');

    if (menuToggle && sidebar && overlay) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.add('open');
            overlay.classList.add('active');
        });
    }

    if (sidebarClose && sidebar && overlay) {
        sidebarClose.addEventListener('click', () => {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
        });
    }
}

// Run initNavbar on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavbar);
} else {
    initNavbar();
}
