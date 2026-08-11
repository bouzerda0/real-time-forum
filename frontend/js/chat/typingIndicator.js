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

