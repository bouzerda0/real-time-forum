export function formatMessageTime(dateStr) {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "";

    const time = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const isToday = date.toDateString() === new Date().toDateString();
    return isToday
        ? time
        : `${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${time}`;
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

