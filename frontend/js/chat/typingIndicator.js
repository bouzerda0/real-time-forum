import { sendWebSocketEvent } from "../websocket.js";
import { getUserById } from "./onlineUsers.js";

let typingTimeout = null, isTyping = false;

function sendTypingEvent(receiverId, status) {
    const user = JSON.parse(localStorage.getItem("currentUser") || "{}");
    sendWebSocketEvent({
        itemType: "typing",
        receiver_id: Number(receiverId),
        senderName: user.nickname || user.username || "User",
        isTyping: status
    });
}

export function handleTyping(receiverId) {
    if (!receiverId) return;
    if (!isTyping) sendTypingEvent(receiverId, isTyping = true);
    
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
        if (isTyping) sendTypingEvent(receiverId, isTyping = false);
    }, 1500);
}

export function handleStopTyping(receiverId) {
    if (isTyping && receiverId) {
        clearTimeout(typingTimeout);
        sendTypingEvent(receiverId, isTyping = false);
    }
}

