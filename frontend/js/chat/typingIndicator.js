import { sendWebSocketMessage } from "../websocket.js";
import { getUserById } from "./onlineUsers.js";

let typingTimeout = null;
let isTyping = false;

// 1. Event Triggers & Debouncing
export function handleTyping(receiverId) {
    if (!receiverId) return;

    if (!isTyping) {
        isTyping = true;
        sendTypingEvent(receiverId, true);
    }

    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
        isTyping = false;
        sendTypingEvent(receiverId, false);
    }, 1500); // 1.5s delay
}

export function handleStopTyping(receiverId) {
    if (isTyping && receiverId) {
        isTyping = false;
        clearTimeout(typingTimeout);
        sendTypingEvent(receiverId, false);
    }
}

// Send the typing event to the backend
function sendTypingEvent(receiverId, status) {
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
    const payload = {
        itemType: "typing",
        receiver_id: Number(receiverId),
        senderName: currentUser.nickname || currentUser.username || "User",
        isTyping: status
    };
    
    import("../websocket.js").then(({ sendWebSocketEvent }) => {
        sendWebSocketEvent(payload);
    });
}

// 2. UI & Display Rules
export function showTypingIndicator(senderId, senderName) {
    if (!senderName) {
        const user = getUserById(senderId);
        senderName = user ? user.nickname : "Someone";
    }

    // A. Inside the Active Chat Window
    if (window.currentChatUser === senderId) {
        const messagesContainer = document.getElementById("messages");
        let chatInd = document.getElementById("typing-indicator");
        if (!chatInd && messagesContainer) {
            chatInd = document.createElement("div");
            chatInd.id = "typing-indicator";
            chatInd.className = "typing-wrapper";
            chatInd.innerHTML = `
  <span class="typing-username">${senderName} is typing</span>
  <div class="typing-indicator-box">
    <span class="typing-dot"></span>
    <span class="typing-dot"></span>
    <span class="typing-dot"></span>
  </div>
`;
            messagesContainer.appendChild(chatInd);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }

    // B. Outside the Chat (Users Sidebar)
    const userItem = document.querySelector(`.person[data-user-id="${senderId}"]`);
    if (userItem) {
        // Toggle the pre-existing structure
        const sidebarInd = userItem.querySelector(".sidebar-typing-status");
        if (sidebarInd) {
            sidebarInd.classList.add("active");
        }
    }
}

export function hideTypingIndicator(senderId) {
    // 4. Cleanup & UX
    if (window.currentChatUser === senderId) {
        const chatInd = document.getElementById("typing-indicator");
        if (chatInd) chatInd.remove();
    }

    const userItem = document.querySelector(`.person[data-user-id="${senderId}"]`);
    if (userItem) {
        // Hide the status
        const sidebarInd = userItem.querySelector(".sidebar-typing-status");
        if (sidebarInd) {
            sidebarInd.classList.remove("active");
        }
    }
}
