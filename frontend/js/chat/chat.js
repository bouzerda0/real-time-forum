import { sendWebSocketMessage } from "../websocket.js";
import { loadUsers, reorderUsers, showNotification, markRead } from "./onlineUsers.js";
import { addThrottledScrollListener, autoScroll, isNearBottom, showMessageToast } from "./chatHelpers.js";
import {
    appendMessage,
    loadMessages,
    loadMoreMessages,
    messagesContainer,
    queueLiveMessage,
    removeEmptyMessage,
    renderMessages,
    resetMessages,
    senderNickname,
} from "./messages.js";

const THROTTLE_MS = 300;
const chatForm = document.getElementById("chat-input-box");
const chatInput = document.getElementById("sidebar-chat-input");

// Router view for /messages
export function ChatView() {
    const dom = document.createElement("div");
    dom.innerHTML = `
        <div class="no-posts">
            <div class="sad-face">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
            </div>
            <h2>Messages</h2>
            <p>Pick a member from the chat left-menu to start a private conversation.</p>
        </div>
    `;

    return { dom, logic: openChatSidebar };
}

// Sidebar controls (called from the HTML)
export function toggleChatSidebar() {
    const layout = document.getElementById("contentLayout");
    const opening = !layout.classList.contains("chat-active");

    layout.classList.toggle("chat-active");
    if (opening) {
        switchChatView("users");
        loadUsers();
    }
}
window.toggleChatSidebar = toggleChatSidebar;

export function openChatSidebar() {
    const layout = document.getElementById("contentLayout");
    if (!layout.classList.contains("chat-active")) {
        layout.classList.add("chat-active");
    }
    switchChatView("users");
    loadUsers();
}

export function switchChatView(view) {
    const usersView = document.getElementById("chat-view-users");
    const convView = document.getElementById("chat-view-conversation");

    usersView.classList.toggle("hidden", view !== "users");
    convView.classList.toggle("hidden", view !== "conversation");
}
window.switchChatView = switchChatView;

// Open a conversation with a user
export function openChat(userId, nickname) {
    window.currentChatUser = userId;

    document.getElementById("active-chat-username").textContent = nickname || "Chat";
    document.getElementById("sidebar-receiver-id").value = userId;

    document.querySelectorAll(".person.active").forEach((el) => el.classList.remove("active"));
    const selected = document.querySelector(`[data-user-id="${userId}"]`);
    if (selected) selected.classList.add("active");

    clearNotification(userId);
    switchChatView("conversation");
    resetMessages();
    loadMessages();
    chatInput?.focus();
}
window.openChat = openChat;

// Send a private message through the WebSocket
export function sendMessage(event) {
    event.preventDefault();
    if (!window.currentChatUser) return;

    const content = chatInput.value.trim();
    if (!content) return;

    sendWebSocketMessage(window.currentChatUser, content);

    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
    const optimistic = {
        senderId: currentUser.id,
        receiverId: window.currentChatUser,
        content,
        createdAt: new Date().toISOString(),
    };
    removeEmptyMessage();
    appendMessage(optimistic);
    updateLastMessage(window.currentChatUser, optimistic);

    chatInput.value = "";
    autoScroll(messagesContainer);
}

// Handle a new real-time message received over the WebSocket
export function updateChatMessages(message) {
    if (!message || message.type !== "message") return;

    updateLastMessage(message.senderId, message);

    if (message.senderId === window.currentChatUser) {
        if (queueLiveMessage(message)) return;

        removeEmptyMessage();
        appendMessage(message);
        if (isNearBottom(messagesContainer)) autoScroll(messagesContainer);
        clearNotification(message.senderId);
        return;
    }

    showNotification(message);
    const nickname = senderNickname(message.senderId);
    showMessageToast(message, nickname, () => openChat(message.senderId, nickname));
}

// Keep the users list ordered by the last message sent
export function updateLastMessage(userId, message) {
    reorderUsers(userId, message);
}

// Remove the unread badge of a conversation
export function clearNotification(userId) {
    markRead(userId);
}

if (chatForm) {
    chatForm.addEventListener("submit", sendMessage);
}

if (messagesContainer) {
    addThrottledScrollListener(messagesContainer, THROTTLE_MS, () => {
        if (messagesContainer.scrollTop <= 40) {
            loadMoreMessages();
        }
    });
}

