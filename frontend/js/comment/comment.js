// comments rendering
import { ApiRequest } from "../api.js";
import { createReaction } from "../post/reactionPost.js";

export const escapeHTML = (str) =>
    String(str ?? "").replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[m]);

export const fetchComments = (postId) => ApiRequest(`/api/comments?post_id=${postId}`);

export const submitComment = (postId, content) =>
    ApiRequest("/api/comments", { method: "POST", body: { post_id: Number(postId), content } });

function createCommentItem(c) {
    const item = document.createElement("div");
    item.className = "comment-item";

    const header = document.createElement("strong");
    header.textContent = c.nickname || c.Nickname || "Anonymous";

    const content = document.createElement("p");
    content.textContent = c.content || c.Content || "";

    const reactionUI = createReaction(c.id || c.ID || 0, c.likes || 0, c.dislikes || 0, c.user_reaction, "comment");
    reactionUI.style.marginTop = "8px";

    item.append(header, content, reactionUI);
    return item;
}

export async function renderCommentsSection(postId, container) {
    if (!container) return;
    const comments = await fetchComments(postId).catch(() => []);

    container.innerHTML = `
        <div class="comments-section">
            <h4>Comments</h4>
            <div id="comments-list-${postId}"></div>
            <form id="reply-form-${postId}" style="margin-top: 10px;">
                <textarea id="reply-input-${postId}" placeholder="Write a reply..." required rows="2" style="width:100%;"></textarea>
                <button type="submit" style="margin-top: 5px;">Reply</button>
            </form>
        </div>
    `;

    const commentsList = container.querySelector(`#comments-list-${postId}`);
    if (Array.isArray(comments)) {
        comments.forEach(c => commentsList.appendChild(createCommentItem(c)));
    }

    container.querySelector(`#reply-form-${postId}`).addEventListener("submit", async (e) => {
        e.preventDefault();
        const input = container.querySelector(`#reply-input-${postId}`);
        const content = input.value.trim();
        if (!content) return;

        try {
            const createdComment = await submitComment(postId, content);
            input.value = "";

            if (createdComment && (createdComment.id || createdComment.ID)) {
                commentsList.appendChild(createCommentItem(createdComment));
            } else {
                const user = JSON.parse(localStorage.getItem("currentUser") || "{}");
                const newComment = { id: 0, nickname: user.nickname || user.username || "You", content };
                commentsList.appendChild(createCommentItem(newComment));
            }
        } catch (error) {
            console.error("Error submitting comment:", error);
            if (error && error.message && (error.message.includes("401") || error.message.includes("Unauthorized"))) {
                alert("Please login to comment.");
                if (window.navigateTo) window.navigateTo("/login");
            } else {
                alert("Failed to submit comment. Please try again.");
            }
        }
    });
}
