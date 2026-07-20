export const socket = new WebSocket("ws://localhost:8080/ws");

socket.onopen = () => {
    console.log("WebSocket Connected");
};

socket.onclose = () => {
    console.log("WebSocket Closed");
};

socket.onerror = (err) => {
    console.log(err);
};
