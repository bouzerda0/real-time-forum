let socket = null;
export function connectWebSocket() {
    // Create a new WebSocket connection to the server by sending  a request for upgrade to the WebSocket protocol
    // start the handshake process with the  server 
    socket = new WebSocket('ws://localhost:8080/ws');
    socket.onopen = () => {
        console.log('the upgrade to the WebSocket protocol was successful');
    }

    socket.onerror = (error) => {
        console.error('WebSocket error:', error);
    }
    socket.onmessage = (event) => {
        handleWebSocketMessage(event);
    };
    socket.onclose = () => {
        console.log('WebSocket connection closed:');
    }

}
// Function to send a message through the WebSocket connection
export function sendwebsocketMessage(receiverId, content) {
    // Check if the WebSocket connection is open before sending the message
    if (!socket || socket.readyState !== WebSocket.OPEN) {
        return
    }
    const message = {
        ReceiverID: receiverId,
        Content: content,
    }
    // Convert the message object to a JSON string and send it through the WebSocket connection
    const jsonMessage = JSON.stringify(message);
    // Send the JSON message through the WebSocket connection
    socket.send(jsonMessage);
}


function handleWebSocketMessage(event) {
    // Parse the incoming message from the WebSocket server
    const message = JSON.parse(event.data)
    if (message.Type === "status") {
        window.updateOnlineUsers?.(message);
    }
    if (message.Type === "message") {
        window.updateChatMessages?.(message);
    }   
}