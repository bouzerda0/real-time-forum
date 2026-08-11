import { updateOnlineUsers, loadUsers } from "./chat/onlineUsers.js";
import { updateChatMessages } from "./chat/chat.js";

let socket = null;

// Connect the WebSocket (no-op when already open or connecting)
export function connectWebSocket() {
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
        return;
    }

    socket = new WebSocket("ws://localhost:8080/ws");
    socket.onopen = () => {
        console.log("WebSocket connection established");
    };
    socket.onerror = (error) => {
        console.error("WebSocket error:", error);
    };
    socket.onmessage = handleWebSocketMessage;
    socket.onclose = () => {
        console.log("WebSocket connection closed");
    };
}

// Entry point used by the top-bar once the user is authenticated
export function initOnlineSocket() {
    connectWebSocket();
    loadUsers();
}
window.initOnlineSocket = initOnlineSocket;

// Send a private message through the WebSocket connection
export function sendWebSocketMessage(receiverId, content) {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;

    socket.send(JSON.stringify({ receiverId, content }));
}

function handleWebSocketMessage(event) {
    const message = JSON.parse(event.data);

    if (message.type === "status") {
        updateOnlineUsers(message);
    } else if (message.type === "message") {
        updateChatMessages(message);
    } else if (message.type === "typing" || message.itemType === "typing") {
        import("./chat/typingIndicator.js").then((module) => {
            if (message.isTyping) {
                module.showTypingIndicator(message.senderId, message.senderName);
            } else {
                module.hideTypingIndicator(message.senderId);
            }
        });

        // Add this inside the existing socket.onmessage typing handler:
        const sidebarTypingEl = document.getElementById(`sidebar-typing-${message.senderId}`);
        if (sidebarTypingEl) {
            sidebarTypingEl.style.display = message.isTyping ? 'block' : 'none';
        }
    }
}

export function sendWebSocketEvent(payload) {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify(payload));
}

export function closeWebSocket() {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
    }
}
