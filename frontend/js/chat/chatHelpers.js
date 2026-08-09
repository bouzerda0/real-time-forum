// Scroll the conversation to its newest message
export function autoScroll(container) {
    container.scrollTop = container.scrollHeight;
}

export function isNearBottom(container) {
    const distance = container.scrollHeight - container.scrollTop - container.clientHeight;
    return distance < 120;
}

export function formatMessageTime(dateStr) {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "";

    const time = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const isToday = date.toDateString() === new Date().toDateString();
    return isToday
        ? time
        : `${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${time}`;
}

let toastTimer = null;

// Show a clickable toast for a message from another conversation
export function showMessageToast(message, nickname, onClick) {
    const toast = document.createElement("div");
    toast.className = "notification";

    // Build the toast with textContent (message content is user-controlled → never innerHTML)
    const sender = document.createElement("strong");
    sender.textContent = nickname;
    const content = document.createElement("span");
    content.textContent = message.content;

    toast.appendChild(sender);
    toast.appendChild(document.createElement("br"));
    toast.appendChild(content);

    toast.addEventListener("click", () => {
        onClick();
        toast.remove();
    });

    document.body.appendChild(toast);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.remove(), 4000);
}

// Run a scroll callback at most once per delay
export function addThrottledScrollListener(container, delay, callback) {
    let throttled = false;

    container.addEventListener("scroll", () => {
        if (throttled) return;
        throttled = true;
        setTimeout(() => (throttled = false), delay);
        callback();
    });
}

