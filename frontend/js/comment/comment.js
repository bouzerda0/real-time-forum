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

    const reactions = createReaction(c.id || c.ID || 0, c.likes || 0, c.dislikes || 0, c.user_reaction, "comment");
    reactions.style.marginTop = "8px";

    item.append(header, content, reactionUI);
    return item;
}

export async function renderCommentsSection(postId, container) {
    if (!container) return;
    const comments = await fetchComments(postId).catch(() => []);

    container.innerHTML = `
        <div class="comments-section">
            <h4>Comments</h4>
            <div id="clist-${postId}"></div>
            <div id="cerr-${postId}" class="form-error"></div>
            <form id="cform-${postId}" style="margin-top:10px">
                <textarea id="cinput-${postId}" placeholder="Write a reply..." required rows="2" style="width:100%"></textarea>
                <button type="submit" style="margin-top:5px">Reply</button>
            </form>
        </div>`;

    const commentsList = container.querySelector(`#comments-list-${postId}`);
    if (Array.isArray(comments)) {
        comments.forEach(c => commentsList.appendChild(createCommentItem(c)));
    }

    const errBox = container.querySelector(`#cerr-${postId}`);

    container.querySelector(`#cform-${postId}`).onsubmit = async (e) => {
        e.preventDefault();
        errBox.textContent = "";

        const input = container.querySelector(`#cinput-${postId}`);
        const text = input.value.trim();

        if (!text || text.length > 4500) {
            errBox.textContent = "Comment cannot exceed 4500 characters.";
            return;
        }

        try {
            const createdComment = await submitComment(postId, content);
            input.value = "";
            const comment = (res?.id || res?.ID)
                ? res
                : { id: 0, nickname: JSON.parse(localStorage.getItem("currentUser") || "{}").nickname || "You", content: text };
            list.appendChild(createCommentItem(comment));
        } catch (err) {
            const is401 = err?.message?.includes("401") || err?.message?.includes("Unauthorized");
            errBox.textContent = is401 ? "Please login to comment." : "Failed to submit comment.";
            if (is401 && window.navigateTo) window.navigateTo("/login");
        }
    };
}
