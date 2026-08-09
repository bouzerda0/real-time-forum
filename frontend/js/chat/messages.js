import { ApiRequest } from "../api.js";
import { getUserById } from "./onlineUsers.js";
import { formatMessageTime } from "./chatHelpers.js";

const CHAT_PAGE_SIZE = 10;

export const messagesContainer = document.getElementById("messages");

// Pagination state for the current conversation
let messageOffset = 0;
let isLoadingMore = false;
let hasMore = true;

// Reset the current conversation
export function resetMessages() {
    messageOffset = 0;
    hasMore = true;
    messagesContainer.innerHTML = "";
}

// Load the first 10 messages of the current conversation
export async function loadMessages() {
    if (!window.currentChatUser || isLoadingMore) return;

    isLoadingMore = true;
    const chatUser = window.currentChatUser;

    try {
        const messages = await ApiRequest(
            `/chat?receiver=${chatUser}&limit=${CHAT_PAGE_SIZE}&offset=${messageOffset}`
        );

        // User changed the chat while the request was loading
        if (chatUser !== window.currentChatUser) return;

        if (!messages || messages.length === 0) {
            hasMore = false;
            return;
        }

        hasMore = messages.length === CHAT_PAGE_SIZE;
        messageOffset += messages.length;

        renderMessages(messages, messagesContainer)

    } catch (error) {
        console.error("Failed to load messages:", error);

        if (messageOffset === 0) {
            const { showError } = await import("../errorPage.js");
            showError(error.status || 500);
        }

    } finally {
        isLoadingMore = false;
    }
}

// Load 10 older messages when scrolling to the top
export async function loadMoreMessages() {
    if (isLoadingMore || !hasMore || !window.currentChatUser) return;

    isLoadingMore = true;
    const chatUser = window.currentChatUser;
    const previousHeight = messagesContainer.scrollHeight;

    try {
        const messages = await ApiRequest(
            `/chat?receiver=${chatUser}&limit=${CHAT_PAGE_SIZE}&offset=${messageOffset}`
        );

        // User changed the chat while the request was loading
        if (chatUser !== window.currentChatUser) return;

        if (!messages || messages.length === 0) {
            hasMore = false;
            return;
        }

        const fragment = document.createDocumentFragment();

        renderMessages(messages, fragment);
        messagesContainer.prepend(fragment);

        // Keep the user's scroll position stable
        messagesContainer.scrollTop +=
            messagesContainer.scrollHeight - previousHeight;

        messageOffset += messages.length;
        hasMore = messages.length === CHAT_PAGE_SIZE;

    } catch (error) {
        console.error("Failed to load older messages:", error);

    } finally {
        isLoadingMore = false;
    }
}

// API returns newest messages first.
// Reverse them so the oldest message is rendered first.
export function renderMessages(messages, container) {
    [...messages]
        .reverse()
        .forEach((message) => appendMessage(message, container));
}

// Add one message to the container
export function appendMessage(message, container = messagesContainer) {
    const currentUser = JSON.parse(
        localStorage.getItem("currentUser") || "{}"
    );

    const isSelf = message.senderId === currentUser.id;

    const bubble = document.createElement("div");
    bubble.classList.add(
        "chat-bubble",
        isSelf ? "self" : "other"
    );

    const sender = document.createElement("span");
    sender.classList.add("sender-name");
    sender.textContent = isSelf
        ? "You"
        : senderNickname(message.senderId);

    const content = document.createElement("span");
    content.classList.add("chat-text");
    content.textContent = message.content;

    const time = document.createElement("span");
    time.classList.add("msg-time");
    time.textContent = formatMessageTime(message.createdAt);

    bubble.appendChild(sender);
    bubble.appendChild(content);
    bubble.appendChild(time);

    container.appendChild(bubble);
}

// Get the sender nickname
export function senderNickname(senderId) {
    const user = getUserById(senderId);

    return user ? user.nickname : "User";
}

