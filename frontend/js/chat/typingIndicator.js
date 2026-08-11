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

export function showTypingIndicator(senderId, senderName) {
    if (window.currentChatUser !== senderId) return;

    const msgCont = document.getElementById("messages");
    if (msgCont && !document.getElementById("typing-indicator")) {
        const name = senderName || getUserById(senderId)?.nickname || "Someone";
        msgCont.insertAdjacentHTML("beforeend", `
            <div id="typing-indicator" class="typing-wrapper">
                <span class="typing-username">${name} is typing</span>
                <div class="typing-indicator-box">
                    <span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>
                </div>
            </div>
        `);
        msgCont.scrollTop = msgCont.scrollHeight;
    }
}

export function hideTypingIndicator(senderId) {
    if (window.currentChatUser === senderId) {
        document.getElementById("typing-indicator")?.remove();
    }
}
