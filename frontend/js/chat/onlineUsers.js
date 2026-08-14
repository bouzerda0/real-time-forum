import { ApiRequest } from "../api.js";

const usersList = document.getElementById("users-list");
let usersCache = [];

export async function loadUsers() {
    try {
        const users = await ApiRequest("/api/users");
        if (!users?.length) {
            usersList.innerHTML = "";
            usersCache = [];
            return;
        }
        usersCache = users;
        sortUsers(usersCache);
        renderUsers(usersCache);
    } catch (error) {
        const { showError } = await import("../errorPage.js");
        showError(error.status || 500);
    }
}

export const getUserById = id => usersCache.find(u => u.id == id);

function renderUsers(users) {
    usersList.innerHTML = "";
    users.forEach(user => {
        const item = document.createElement("div");
        item.className = "person";
        item.dataset.userId = user.id;
        item.innerHTML = `
            <div class="profile-pic">
                ${user.nickname.charAt(0).toUpperCase()}
                <span class="green-dot ${user.online ? "online" : "offline"}"></span>
            </div>
            <div class="person-info" id="sidebar-user-${user.id}" style="display: flex; flex-direction: column;">
                <span class="name username">${user.nickname}</span>
                <div id="sidebar-typing-${user.id}" style="display: none; transform: scale(0.7); transform-origin: left; margin-top: 2px;">
                    <div class="typing-indicator-box">
                        <span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>
                    </div>
                </div>
            </div>
        `;
        item.onclick = () => window.openChat(user.id, user.nickname);
        usersList.appendChild(item);
    });
}

const hasMsg = u => u.lastmessage && u.lastmessage !== "0001-01-01T00:00:00Z";
const sortUsers = users => users.sort((a, b) => {
    const aMsg = hasMsg(a), bMsg = hasMsg(b);
    if (aMsg && bMsg) return new Date(b.lastmessage) - new Date(a.lastmessage);
    if (aMsg) return -1;
    if (bMsg) return 1;
    return a.nickname.localeCompare(b.nickname);
});

export function updateOnlineUsers({ userId, online }) {
    const dot = usersList.querySelector(`[data-user-id="${userId}"] .green-dot`);
    if (dot) {
        dot.classList.toggle("online", online);
        dot.classList.toggle("offline", !online);
    }
}

export function moveUserToTop(userId, { createdAt }) {
    const idx = usersCache.findIndex(u => u.id === userId);
    if (idx !== -1) {
        usersCache[idx].lastmessage = createdAt;
        usersCache.unshift(usersCache.splice(idx, 1)[0]);
    }
    const item = usersList.querySelector(`[data-user-id="${userId}"]`);
    if (item) usersList.prepend(item);
}

export function showChatNotification(senderId, senderName) {
    document.getElementById("chat-notification")?.remove();
    const notif = document.createElement("div");
    notif.id = "chat-notification";
    notif.className = "chat-notification";
    notif.style.cursor = "pointer";
    notif.innerHTML = `<span class="chat-notification-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></span><span class="chat-notification-text">New message from ${senderName}</span>`;

    notif.onclick = () => {
        if (window.openChat) window.openChat(senderId, senderName);
        notif.remove();
    };

    document.body.appendChild(notif);
    setTimeout(() => notif.remove(), 4000);
}