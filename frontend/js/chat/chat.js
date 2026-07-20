import { connectWebSocket, sendWebSocketMessage, closeWebSocket } from "../websocket.js";

const handleChatMessage = (message) => {
    const messagesContainer = document.querySelector("#messages-container");
    if (messagesContainer) appendMessage(messagesContainer, message);
};

export function ChatView() {
    const container = document.createElement("div");
    container.className = "chat-container";
    container.innerHTML = `
        <div class="chat-header">
            <h3>Real-Time Chat</h3>
            <input type="number" id="receiver-id" placeholder="Receiver User ID" min="1" required />
        </div>
        <div id="messages-container" class="messages-container"></div>
        <form id="chat-form" class="chat-form">
            <input type="text" id="chat-input" placeholder="Type a message..." required autocomplete="off" />
            <button type="submit" id="send-btn">Send</button>
        </form>
    `;

    const logic = () => {
        const messagesContainer = container.querySelector("#messages-container");
        const chatForm = container.querySelector("#chat-form");
        const chatInput = container.querySelector("#chat-input");
        const receiverInput = container.querySelector("#receiver-id");

        // Connect WebSocket with single top-level handler
        connectWebSocket(handleChatMessage);

        // Handle sending messages
        chatForm.onsubmit = (e) => {
            e.preventDefault();
            const content = chatInput.value.trim();
            const receiverId = receiverInput.value.trim();

            if (!content || !receiverId) return;

            const sent = sendWebSocketMessage(receiverId, content);
            if (sent) {
                // Append locally sent message
                appendMessage(messagesContainer, {
                    SenderID: "You",
                    Content: content,
                    isSelf: true
                });
                chatInput.value = "";
            } else {
                alert("WebSocket is not connected.");
            }
        };
    };

    return { dom: container, logic };
}

function appendMessage(container, message) {
    if (!container || (message.ID && container.querySelector(`[data-msg-id="${message.ID}"]`))) return;

    const msgElement = document.createElement("div");
    msgElement.className = `chat-message ${message.isSelf ? "self" : "other"}`;
    if (message.ID) msgElement.dataset.msgId = message.ID;

    const sender = message.isSelf ? "You" : (message.SenderUsername || message.sender || message.username || document.getElementById('active-chat-username')?.textContent || "User");
    msgElement.innerHTML = `
        <span class="message-sender">${sender}:</span>
        <span class="message-content">${escapeText(message.Content || "")}</span>
    `;

    container.appendChild(msgElement);
    container.scrollTop = container.scrollHeight;
}

function escapeText(str) {
    const p = document.createElement("p");
    p.textContent = str;
    return p.innerHTML;
}
