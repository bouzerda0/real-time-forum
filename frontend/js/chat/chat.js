import { ApiRequest } from "../api.js";
import { sendWebSocketMessage } from "../websocket.js";
import { getUserById, loadUsers, reorderUsers, showNotification, markRead } from "./onlineUsers.js";

const CHAT_PAGE_SIZE = 10;
const THROTTLE_MS = 300;

// Pagination state of the current conversation (window.currentChatUser = open user id)
let messageOffset = 0;
let isLoadingMore = false;
let hasMore = true;
// Live message that arrived while the initial history was still loading
let pendingLiveMessage = null;

const messagesContainer = document.getElementById("sidebar-messages");
const chatForm = document.getElementById("sidebar-chat-form");
const chatInput = document.getElementById("sidebar-chat-input");

// ─── Router view for /messages ───
export function ChatView() {
    const dom = document.createElement("div");
    dom.innerHTML = `
        <div class="empty-feed">
            <div class="empty-feed-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
            </div>
            <h2>Messages</h2>
            <p>Pick a member from the chat sidebar to start a private conversation.</p>
        </div>
    `;

    return { dom, logic: openChatSidebar };
}

// ─── Sidebar controls (called from the HTML) ───
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

// ─── Open a conversation with a user ───
export function openChat(userId, nickname) {
    window.currentChatUser = userId;

    document.getElementById("active-chat-username").textContent = nickname || "Chat";
    document.getElementById("sidebar-receiver-id").value = userId;

    // Highlight the selected user in the list
    document.querySelectorAll(".user-item.active").forEach((el) => el.classList.remove("active"));
    const selected = document.querySelector(`[data-user-id="${userId}"]`);
    if (selected) selected.classList.add("active");

    // Reset pagination state
    messageOffset = 0;
    hasMore = true;
    pendingLiveMessage = null;

    clearNotification(userId);
    switchChatView("conversation");
    messagesContainer.innerHTML = "";
    loadMessages();
    chatInput?.focus();
}
window.openChat = openChat;

// ─── Load the last 10 messages of the current conversation ───
export async function loadMessages() {
    if (!window.currentChatUser || isLoadingMore) return;

    isLoadingMore = true;
    const chatUser = window.currentChatUser;
    try {
        const messages = await ApiRequest(
            `/chat?receiver=${chatUser}&limit=${CHAT_PAGE_SIZE}&offset=${messageOffset}`
        );

        // Ignore the result if the user switched chats while it was loading
        if (chatUser !== window.currentChatUser) return;

        // /chat returns JSON null (not []) when there is no history yet
        const newestTime = messages && messages.length
            ? new Date(messages[0].createdAt).getTime()
            : 0;
        const pendingTime = pendingLiveMessage
            ? new Date(pendingLiveMessage.createdAt).getTime()
            : 0;

        if (!messages || messages.length === 0) {
            hasMore = false;
            // A live message arrived while loading but there is no history yet
            if (pendingTime > 0) {
                renderMessage(pendingLiveMessage, messagesContainer);
            } else if (messageOffset === 0) {
                messagesContainer.innerHTML = '<div class="chat-empty">No messages yet, say hi!</div>';
            }
        } else {
            hasMore = messages.length === CHAT_PAGE_SIZE;
            renderMessages(messages, messagesContainer);
            messageOffset += messages.length;
            // The live message is not part of the fetched batch → append it on top
            if (pendingTime > newestTime) {
                renderMessage(pendingLiveMessage, messagesContainer);
            }
        }

        pendingLiveMessage = null;
        autoScroll();
    } catch (error) {
        console.error("Failed to load messages:", error);
        pendingLiveMessage = null;
        if (messageOffset === 0) {
            messagesContainer.innerHTML = '<div class="chat-empty">Could not load messages.</div>';
        }
    } finally {
        isLoadingMore = false;
    }
}

// ─── Load 10 older messages when scrolling to the top (throttled) ───
export async function loadMoreMessages() {
    if (isLoadingMore || !hasMore || !window.currentChatUser) return;

    isLoadingMore = true;
    const chatUser = window.currentChatUser;
    const prevHeight = messagesContainer.scrollHeight;

    try {
        const messages = await ApiRequest(
            `/chat?receiver=${chatUser}&limit=${CHAT_PAGE_SIZE}&offset=${messageOffset}`
        );

        // Ignore the result if the user switched chats while it was loading
        if (chatUser !== window.currentChatUser) return;

        if (!messages || messages.length === 0) {
            hasMore = false;
            return;
        }

        const fragment = document.createDocumentFragment();
        renderMessages(messages, fragment);
        messagesContainer.prepend(fragment);

        // Keep the user's viewing position stable
        messagesContainer.scrollTop += messagesContainer.scrollHeight - prevHeight;
        messageOffset += messages.length;
        hasMore = messages.length === CHAT_PAGE_SIZE;
    } catch (error) {
        console.error("Failed to load older messages:", error);
    } finally {
        isLoadingMore = false;
    }
}

// ─── Render a list of messages (API returns newest first → display oldest first) ───
export function renderMessages(messages, container) {
    [...messages]
        .reverse()
        .forEach((message) => renderMessage(message, container));
}

function renderMessage(message, container) {
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
    const isSelf = message.senderId === currentUser.id;

    const bubble = document.createElement("div");
    bubble.classList.add("chat-message", isSelf ? "self" : "other");

    const sender = document.createElement("span");
    sender.classList.add("message-sender");
    sender.textContent = isSelf ? "You" : senderNickname(message.senderId);

    const content = document.createElement("span");
    content.classList.add("message-content");
    content.textContent = message.content;

    const time = document.createElement("span");
    time.classList.add("msg-time");
    time.textContent = formatMessageTime(message.createdAt);

    bubble.appendChild(sender);
    bubble.appendChild(content);
    bubble.appendChild(time);
    container.appendChild(bubble);
}

function senderNickname(senderId) {
    const user = getUserById(senderId);
    return user ? user.nickname : "User";
}

// ─── Send a private message through the WebSocket ───
export function sendMessage(event) {
    event.preventDefault();
    if (!window.currentChatUser) return;

    const content = chatInput.value.trim();
    if (!content) return;

    sendWebSocketMessage(window.currentChatUser, content);

    // Optimistically render the message and refresh the users list order
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
    const optimistic = {
        senderId: currentUser.id,
        content,
        createdAt: new Date().toISOString(),
    };
    messagesContainer.querySelector(".chat-empty")?.remove();
    renderMessage(optimistic, messagesContainer);
    updateLastMessage(optimistic);

    chatInput.value = "";
    autoScroll();
}

// ─── Handle a new real-time message received over the WebSocket ───
export function updateChatMessages(message) {
    if (!message || message.type !== "message") return;

    // Keep the users list ordered by the last message sent (Discord style)
    updateLastMessage(message);

    // Chat already open with the sender → append the message live
    if (message.senderId === window.currentChatUser) {
        // While the initial history is still loading, wait for it (avoids duplicates)
        if (isLoadingMore && messageOffset === 0) {
            pendingLiveMessage = message;
            return;
        }
        messagesContainer.querySelector(".chat-empty")?.remove();
        renderMessage(message, messagesContainer);
        if (isNearBottom()) autoScroll();
        clearNotification(message.senderId);
        return;
    }

    // Otherwise mark the sender as unread and show a toast
    showNotification(message);
    showToast(message);
}

// ─── Keep the users list ordered by the last message sent ───
export function updateLastMessage(message) {
    reorderUsers(message);
}

// ─── Scroll the conversation to the newest message ───
function autoScroll() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function isNearBottom() {
    const distance = messagesContainer.scrollHeight - messagesContainer.scrollTop - messagesContainer.clientHeight;
    return distance < 120;
}

// ─── Remove the unread badge of a conversation ───
export function clearNotification(userId) {
    markRead(userId);
}

// ─── Small clickable toast when a message arrives from another chat ───
let toastTimer = null;
function showToast(message) {
    const nickname = senderNickname(message.senderId);

    const toast = document.createElement("div");
    toast.className = "msg-toast";

    // Build the toast with textContent (message content is user-controlled → never innerHTML)
    const sender = document.createElement("strong");
    sender.textContent = nickname;
    const content = document.createElement("span");
    content.textContent = message.content;

    toast.appendChild(sender);
    toast.appendChild(document.createElement("br"));
    toast.appendChild(content);

    toast.addEventListener("click", () => {
        openChat(message.senderId, nickname);
        toast.remove();
    });

    document.body.appendChild(toast);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.remove(), 4000);
}

function formatMessageTime(dateStr) {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "";

    const time = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const isToday = date.toDateString() === new Date().toDateString();
    return isToday
        ? time
        : `${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${time}`;
}

// ─── Bind the form & throttled "load older messages" scroll ───
if (chatForm) {
    chatForm.addEventListener("submit", sendMessage);
}

// Throttle: run at most once per THROTTLE_MS (isLoadingMore also guards concurrent loads)
let scrollThrottled = false;
if (messagesContainer) {
    messagesContainer.addEventListener("scroll", () => {
        if (scrollThrottled) return;
        scrollThrottled = true;
        setTimeout(() => (scrollThrottled = false), THROTTLE_MS);

        if (messagesContainer.scrollTop <= 40) {
            loadMoreMessages();
        }
    });
}
