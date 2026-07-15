import { ApiRequest } from "../api.js";

export const escapeHTML = (str) =>
    String(str ?? "").replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[m]);

export const fetchComments = (postId) => ApiRequest(`/api/comments?post_id=${postId}`);

export const submitComment = (postId, content) =>
    ApiRequest("/api/comments", { method: "POST", body: { post_id: Number(postId), content } });

const commentItemHTML = (c) => `
    <div class="comment-item">
        <strong>${escapeHTML(c.nickname || c.Nickname || "Anonymous")}</strong>
        <p>${escapeHTML(c.content || c.Content || "")}</p>
    </div>
`;

export async function renderCommentsSection(postId, container) {
    if (!container) return;
    const comments = await fetchComments(postId).catch(() => []);

    container.innerHTML = `
        <div class="comments-section">
            <h4>Comments</h4>
            <div id="comments-list-${postId}">
                ${Array.isArray(comments) ? comments.map(commentItemHTML).join("") : ""}
            </div>
            <form id="reply-form-${postId}" style="margin-top: 10px;">
                <textarea id="reply-input-${postId}" placeholder="Write a reply..." required rows="2" style="width:100%;"></textarea>
                <button type="submit" style="margin-top: 5px;">Reply</button>
            </form>
        </div>
    `;

    container.querySelector(`#reply-form-${postId}`).addEventListener("submit", async (e) => {
        e.preventDefault();
        const input = container.querySelector(`#reply-input-${postId}`);
        const content = input.value.trim();
        if (!content) return;

        await submitComment(postId, content);
        input.value = "";

        const user = JSON.parse(localStorage.getItem("currentUser") || "{}");
        const newComment = { nickname: user.nickname || user.username || "You", content };
        container.querySelector(`#comments-list-${postId}`).insertAdjacentHTML("beforeend", commentItemHTML(newComment));
    });
}

