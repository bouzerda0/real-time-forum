import { ApiRequest } from "../api.js";
import { loadFeed } from "./feed.js";
import { createReaction } from "./reactionPost.js";


export async function loadPostCard(postId) {
    const container = document.getElementById("feed-container");

    try {
        const post = await ApiRequest(`/posts/${postId}`);
        container.replaceChildren();

        container.appendChild(createPostDetails(post));

    } catch (error) {
        container.innerHTML = "<p>Error loading post.</p>";
        console.error(error);
    }
}

function createPostDetails(post) {
    const card = document.createElement("div");
    card.className = "post-details";
    card.id = "postcard"
    const nickname = document.createElement('div')
    nickname.textContent = post.nickname || post.Nickname || "Anonymous"
    nickname.id = "nicknamecard"

    const title = document.createElement("div");
    title.textContent = post.title;
    title.id = "titel-card"

    const content = document.createElement("div");
    content.textContent = post.content;
    content.id = "content-card"

    const reactionsUI = createReaction(post.id, post.likes || 0, post.dislikes || 0);

    const backBtn = createBackButton();

    const commentsContainer = document.createElement("div");
    commentsContainer.className = "post-comments-container";
    commentsContainer.style.marginTop = "20px";
    renderCommentsSection(post.id, commentsContainer);

    card.append(
        backBtn,
        nickname,
        title,
        content,
        reactionsUI,
        commentsContainer
    );

    return card;
}

function createBackButton() {
    const button = document.createElement("button");
    button.id = "backhomebuttom"
    button.textContent = "← Home";

    button.addEventListener("click", () => {
        if (window.navigateTo) {
            window.navigateTo("/");
        } else {
            history.pushState(null, "", "/");
            window.dispatchEvent(new PopStateEvent("popstate"));
        }
    });

    return button;
}


// comments rendering
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

        try {
            const createdComment = await submitComment(postId, content);
            input.value = "";

            if (createdComment && (createdComment.id || createdComment.ID)) {
                container.querySelector(`#comments-list-${postId}`).insertAdjacentHTML("beforeend", commentItemHTML(createdComment));
            } else {
                const user = JSON.parse(localStorage.getItem("currentUser") || "{}");
                const newComment = { nickname: user.nickname || user.username || "You", content };
                container.querySelector(`#comments-list-${postId}`).insertAdjacentHTML("beforeend", commentItemHTML(newComment));
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

