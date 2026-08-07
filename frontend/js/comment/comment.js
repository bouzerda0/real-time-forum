import { ApiRequest } from "../api.js";
import { createReaction } from "../post/reactionPost.js";

export const escapeHTML = (str) =>
    String(str ?? "").replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[m]);

export const fetchComments = (postId) => ApiRequest(`/api/comments?post_id=${postId}`);

export const submitComment = async (postId, content) => {
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

function createCommentItem(c) {
    const item = document.createElement("div");
    item.className = "single-comment";

    const header = document.createElement("strong");
    header.textContent = c.username || c.Username || c.nickname || c.Nickname || "Anonymous";

    const content = document.createElement("p");
    content.textContent = c.content || c.Content || "";

    const commentId = c.id || c.ID || 0;
    const reactions = createReaction(commentId, c.likes || 0, c.dislikes || 0, c.user_reaction, "comment");
    reactions.style.marginTop = "8px";

    item.append(header, content, reactions);
    return item;
}

export async function renderCommentsSection(postId, container) {
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

    const commentsList = container.querySelector(`#clist-${postId}`);
    const errBox = container.querySelector(`#cerr-${postId}`);
    const form = container.querySelector(`#cform-${postId}`);
    const input = container.querySelector(`#cinput-${postId}`);
    const submitBtn = form.querySelector(`button[type="submit"]`);

    if (Array.isArray(comments)) {
        comments.forEach(c => commentsList.appendChild(createCommentItem(c)));
    }

    form.onsubmit = async (e) => {
        e.preventDefault();
        errBox.textContent = "";
        const text = input.value.trim();

        if (!text || text.length > 4500) {
            errBox.textContent = "Comment cannot be empty or exceed 4500 characters.";
            return;
        }

        try {
            submitBtn.disabled = true;
            submitBtn.textContent = "Sending...";

            const createdComment = await submitComment(postId, text);
            commentsList.appendChild(createCommentItem(createdComment));
            input.value = "";

        } catch (err) {
            errBox.textContent = err.message;

            const msgLower = err.message.toLowerCase();
            if (msgLower.includes("401") || msgLower.includes("unauthorized") || msgLower.includes("login")) {
                if (window.navigator) window.navigator("/login");
            }
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = "Reply";
        }
    };
}
