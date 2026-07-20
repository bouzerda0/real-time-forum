let ws = null;
const listeners = new Set();

export function connectWebSocket(onMessage, onError) {
    if (onMessage) listeners.add(onMessage);
    if (ws && ws.readyState === WebSocket.OPEN) return ws;
    ws = new WebSocket(`${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/ws`);
    ws.onmessage = (e) => {
        try {
            const data = JSON.parse(e.data);
            listeners.forEach(cb => cb(data));
        } catch (err) { console.error(err); }
    };
    ws.onerror = onError || console.error;
    ws.onclose = () => { ws = null; };
    return ws;
}

export function sendWebSocketMessage(receiverId, content) {
    const myId = +(JSON.parse(localStorage.getItem('currentUser') || '{}').id || 0);
    if (ws?.readyState !== WebSocket.OPEN || !myId || Number(receiverId) === myId) return false;
    ws.send(JSON.stringify({ ReceiverID: Number(receiverId), Content: content }));
    return true;
}

export function closeWebSocket() {
    ws?.close();
    ws = null;
    listeners.clear();
}
