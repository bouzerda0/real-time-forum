import { ApiRequest } from "../api.js";

const usersList = document.getElementById("users-list");

// Cache of the last fetched users (used to resolve nicknames for incoming messages)
let usersCache = [];
// Users that currently have unread messages (kept across re-renders)
const notifiedUsers = new Set();

// 1. Load all users from the backend
export async function loadUsers() {
    try {
        const users = await ApiRequest("/api/users");

        if (!users || users.length === 0) {
            usersList.innerHTML = "";
            usersCache = [];
            return;
        }

        usersCache = users;
        sortUsers(users);
        renderUsers(users);
    } catch (error) {
        console.error("Failed to load users:", error);
    }
}

// Lookup a user by id (used to display the sender name of a message)
export function getUserById(id) {
    return usersCache.find((user) => user.id === id);
}

// 2. Render the list of users in the UI
function renderUsers(users) {
    usersList.replaceChildren();

    users.forEach((user) => {
        const userItem = document.createElement("div");
        userItem.classList.add("user-item");
        userItem.dataset.userId = user.id;

        const avatar = document.createElement("div");
        avatar.classList.add("user-avatar");
        avatar.textContent = user.nickname.charAt(0).toUpperCase();

        const meta = document.createElement("div");
        meta.classList.add("user-meta");

        const name = document.createElement("span");
        name.classList.add("user-name");
        name.textContent = user.nickname;

        const lastMsg = document.createElement("span");
        lastMsg.classList.add("user-lastmsg");
        lastMsg.textContent = hasLastMessage(user)
            ? formatRelativeTime(user.lastmessage)
            : "New member";

        meta.appendChild(name);
        meta.appendChild(lastMsg);

        const status = document.createElement("span");
        status.classList.add("user-status");
        status.classList.add(user.online ? "online" : "offline");

        userItem.appendChild(avatar);
        userItem.appendChild(meta);
        userItem.appendChild(status);

        if (notifiedUsers.has(user.id)) {
            userItem.classList.add("has-notification");
        }

        // 4. Click on a user to start a chat
        userItem.addEventListener("click", () => {
            window.openChat(user.id, user.nickname);
        });

        usersList.appendChild(userItem);
    });
}

// 3. Sort the users list (by last message, alphabetically for new users)
function sortUsers(users) {
    return users.sort((a, b) => {
        const aHasMsg = hasLastMessage(a);
        const bHasMsg = hasLastMessage(b);

        if (aHasMsg && bHasMsg) {
            return new Date(b.lastmessage) - new Date(a.lastmessage);
        }
        if (aHasMsg) return -1;
        if (bHasMsg) return 1;

        return a.nickname.localeCompare(b.nickname);
    });
}

function hasLastMessage(user) {
    return user.lastmessage && user.lastmessage !== "0001-01-01T00:00:00Z";
}

// Update the online/offline indicator of a user
export function updateOnlineUsers(message) {
    const userItem = usersList.querySelector(`[data-user-id="${message.userId}"]`);
    if (!userItem) return;

    const status = userItem.querySelector(".user-status");
    status.classList.toggle("online", message.online);
    status.classList.toggle("offline", !message.online);
}

// 5. Move a user to the top of the list & refresh their last-message preview (Discord style)
export function reorderUsers(message) {
    const userItem = usersList.querySelector(`[data-user-id="${message.senderId}"]`);
    if (!userItem) return;

    const preview = userItem.querySelector(".user-lastmsg");
    if (preview) {
        const content = message.content || "";
        preview.textContent = content
            ? content.length > 30 ? `${content.slice(0, 30)}…` : content
            : formatRelativeTime(message.createdAt);
    }

    usersList.prepend(userItem);
}

// 6. Notify the user when a new message is received
export function showNotification(message) {
    // If the chat with the sender is already open, don't notify
    if (message.senderId === window.currentChatUser) return;

    const userItem = usersList.querySelector(`[data-user-id="${message.senderId}"]`);
    if (!userItem) return;

    notifiedUsers.add(message.senderId);
    userItem.classList.add("has-notification");
}

// Remove the unread badge of a conversation
export function markRead(userId) {
    console.log("is called")
    notifiedUsers.delete(userId);
    const userItem = usersList.querySelector(`[data-user-id="${userId}"]`);
    if (userItem) userItem.classList.remove("has-notification");
}

function formatRelativeTime(dateStr) {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "";

    const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
    if (minutes < 1) return "now";
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
