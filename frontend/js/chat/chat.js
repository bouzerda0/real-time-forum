import { connectWebSocket, sendWebSocketMessage, closeWebSocket } from "../websocket.js";

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

        // Connect WebSocket and handle incoming messages
        connectWebSocket((message) => {
            appendMessage(messagesContainer, message);
        });

        // Handle sending messages
        chatForm.addEventListener("submit", (e) => {
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
        });
    };

    return { dom: container, logic };
}

function appendMessage(container, message) {
    if (!container) return;

    const msgElement = document.createElement("div");
    msgElement.className = `chat-message ${message.isSelf ? "self" : "other"}`;

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
