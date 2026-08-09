import { ApiRequest } from "../api.js";

const usersList = document.getElementById("users-list");

let usersCache = [];

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

        // Only re-render when the rendered user set actually changed.
        // Re-rendering on every navigation/sidebar-open would wipe the
        // unread-notification dots on existing items.
        const renderedIds = new Set(
            [...usersList.querySelectorAll(".person")].map((el) => el.dataset.userId)
        );
        const needsRender =
            users.length !== renderedIds.size ||
            users.some((u) => !renderedIds.has(String(u.id)));

        if (needsRender) renderUsers(users);

        // Re-sync dots/counter after any re-render (idempotent)
        updateNotificationCount();
    } catch (error) {
        console.error("Failed to load users:", error);
        const { showError } = await import("../errorPage.js");
        showError(error.status || 500);
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
        userItem.classList.add("person");
        userItem.dataset.userId = user.id;

        const avatar = document.createElement("div");
        avatar.classList.add("profile-pic");
        avatar.textContent = user.nickname.charAt(0).toUpperCase();

        const meta = document.createElement("div");
        meta.classList.add("person-info");

        const name = document.createElement("span");
        name.classList.add("name");
        name.textContent = user.nickname;

        meta.appendChild(name);

        const status = document.createElement("span");
        status.classList.add("green-dot");
        status.classList.add(user.online ? "online" : "offline");

        avatar.appendChild(status);
        userItem.appendChild(avatar);
        userItem.appendChild(meta);

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

    const status = userItem.querySelector(".green-dot");
    status.classList.toggle("online", message.online);
    status.classList.toggle("offline", !message.online);
}

//  Move a user to the top of the list & refresh their last-message preview
export function moveUserToTop(userId, message) {
    // 1. Update the cache
    const userIndex = usersCache.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
        const user = usersCache[userIndex];
        user.lastmessage = message.createdAt;

        // Move to top of cache
        usersCache.splice(userIndex, 1);
        usersCache.unshift(user);
    }

    const userItem = usersList.querySelector(`[data-user-id="${userId}"]`);
    if (userItem) usersList.prepend(userItem);
}


let notificationUsers = new Set();

export async function showNotification(message) {
    if (message.senderId === window.currentChatUser) return;

    let userItem = usersList.querySelector(
        `[data-user-id="${message.senderId}"]`
    );
    if (!userItem) {
        await loadUsers();
        if (message.senderId === window.currentChatUser) return;

        userItem = usersList.querySelector(
            `[data-user-id="${message.senderId}"]`
        );
        if (!userItem) return;
    }

    // Don't count the same user more than once
    notificationUsers.add(message.senderId);
    userItem.classList.add("has-notification");

    updateNotificationCount();
}

function updateNotificationCount() {
    const count = document.querySelector(".notification-count");

    if (!count) return;

    notificationUsers.forEach((id) => {
        const item = usersList.querySelector(`[data-user-id="${id}"]`);
        if (!item) {
            notificationUsers.delete(id);
        } else {
            item.classList.add("has-notification");
        }
    });

    count.textContent = notificationUsers.size;
    count.style.display = notificationUsers.size > 0 ? "flex" : "none";
}

// Remove the unread badge of a conversation
export function clearNotification(userId) {
    const userItem = usersList.querySelector(
        `[data-user-id="${userId}"]`
    );

    if (!notificationUsers.has(userId)) return;

    notificationUsers.delete(userId);
    userItem?.classList.remove("has-notification");

    updateNotificationCount();
}

