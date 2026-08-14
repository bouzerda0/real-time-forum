import { ApiRequest } from "../api.js";
import { createReaction } from "./reactionPost.js";
import { renderComments } from "../comment/comment.js";


export async function loadPostCard(postId) {
    const container = document.getElementById("feed");

    try {
        const post = await ApiRequest(`/api/posts/${postId}`);
        container.replaceChildren();

        container.appendChild(createPostDetails(post));
    } catch (error) {
        const { showError } = await import("../errorPage.js");
        showError(error.status || 404);
    }
}

function createPostDetails(post) {
    const card = document.createElement("div");
    card.className = "view-post";
    card.id = "main-post"
    const nickname = document.createElement('div')
    nickname.textContent = post.nickname || post.Nickname || "Anonymous"
    nickname.id = "author-tag"

    const title = document.createElement("div");
    title.textContent = post.title;
    title.id = "post-title"

    const content = document.createElement("div");
    content.textContent = post.content;
    content.id = "post-body"

    const reactionsUI = createReaction(post.id, post.likes || 0, post.dislikes || 0);

    const backBtn = createBackButton();

    const commentsContainer = document.createElement("div");
    commentsContainer.className = "comments-area";
    commentsContainer.style.marginTop = "20px";
    renderComments(post.id, commentsContainer);

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
    button.id = "back-btn"
    button.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg> Home`;

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



