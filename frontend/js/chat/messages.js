import { ApiRequest } from "../api.js";
import { getUserById } from "./onlineUsers.js";
import { autoScroll, formatMessageTime } from "./chatHelpers.js";

const CHAT_PAGE_SIZE = 10;

export const messagesContainer = document.getElementById("sidebar-messages");

// Pagination state of the current conversation (window.currentChatUser = open user id)
let messageOffset = 0;
let isLoadingMore = false;
let hasMore = true;
// Live message that arrived while the initial history was still loading
let pendingLiveMessage = null;

export function resetMessages() {
    messageOffset = 0;
    hasMore = true;
    pendingLiveMessage = null;
    messagesContainer.innerHTML = "";
}

// Load the last 10 messages of the current conversation
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
                appendMessage(pendingLiveMessage);
            } else if (messageOffset === 0) {
                messagesContainer.innerHTML = '<div class="chat-empty">No messages yet, say hi!</div>';
            }
        } else {
            hasMore = messages.length === CHAT_PAGE_SIZE;
            renderMessages(messages, messagesContainer);
            messageOffset += messages.length;
            // The live message is not part of the fetched batch → append it on top
            if (pendingTime > newestTime) {
                appendMessage(pendingLiveMessage);
            }
        }

        pendingLiveMessage = null;
        autoScroll(messagesContainer);
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

// Load 10 older messages when scrolling to the top
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

// Render API results oldest first because the API returns newest first
export function renderMessages(messages, container) {
    [...messages]
        .reverse()
        .forEach((message) => appendMessage(message, container));
}

export function appendMessage(message, container = messagesContainer) {
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

export function senderNickname(senderId) {
    const user = getUserById(senderId);
    return user ? user.nickname : "User";
}

export function removeEmptyMessage() {
    messagesContainer.querySelector(".chat-empty")?.remove();
}

// Keep a live message until the initial history request finishes
export function queueLiveMessage(message) {
    if (!isLoadingMore || messageOffset !== 0) return false;

    pendingLiveMessage = message;
    return true;
}
