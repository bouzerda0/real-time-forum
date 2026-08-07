import { ApiRequest } from "../api.js";
import { createReaction } from "../post/reactionPost.js";

export const escapeHTML = (str) =>
    String(str ?? "").replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[m]);

const fetchComments = (postId) => ApiRequest(`/api/comments?post_id=${postId}`);

const submitComment = async (postId, content) => {
    const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ post_id: Number(postId), content })
    });

    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || data.message || "Failed to submit comment.");
    }
    return res.json();
};

function createComment(c) {
    const node = document.createElement("div");
    node.className = "single-comment";

    const header = document.createElement("strong");
    header.textContent = c.username || c.Username || c.nickname || c.Nickname || "Anonymous";

    const content = document.createElement("p");
    content.textContent = c.content || c.Content || "";

    const id = c.id || c.ID || 0;
    const reactions = createReaction(id, c.likes || 0, c.dislikes || 0, c.user_reaction, "comment");
    reactions.style.marginTop = "8px";

    node.append(header, content, reactions);
    return node;
}

export async function renderComments(postId, container) {
    if (!container) return;
    const comments = await fetchComments(postId).catch(() => []);

    container.innerHTML = `
        <div class="comment-list">
            <h4>Comments</h4>
            <div id="clist-${postId}"></div>
            <div id="cerr-${postId}" class="error-text" style="color:red; margin:5px 0;"></div>
            <form id="cform-${postId}" style="margin-top:10px">
                <textarea id="cinput-${postId}" placeholder="Write a reply..." required rows="2" style="width:100%"></textarea>
                <button type="submit" style="margin-top:5px">Reply</button>
            </form>
        </div>`;

    const list = container.querySelector(`#clist-${postId}`);
    const errNode = container.querySelector(`#cerr-${postId}`);
    const form = container.querySelector(`#cform-${postId}`);
    const input = container.querySelector(`#cinput-${postId}`);
    const btn = form.querySelector(`button[type="submit"]`);

    if (Array.isArray(comments)) {
        comments.forEach(c => list.appendChild(createComment(c)));
    }

    form.onsubmit = async (e) => {
        e.preventDefault();
        errNode.textContent = "";
        const text = input.value.trim();

        if (!text || text.length > 4500) {
            errNode.textContent = "Comment cannot be empty or exceed 4500 characters.";
            return;
        }

        try {
            btn.disabled = true;
            btn.textContent = "Sending...";

            const newComment = await submitComment(postId, text);
            list.appendChild(createComment(newComment));
            input.value = "";

        } catch (err) {
            errNode.textContent = err.message;
            const msg = err.message.toLowerCase();
            if (msg.includes("401") || msg.includes("unauthorized") || msg.includes("login")) {
                if (window.navigateTo) window.navigateTo("/login");
            }
        } finally {
            btn.disabled = false;
            btn.textContent = "Reply";
        }
    };
}
