import { ApiRequest } from "../api.js";
import { createReaction } from "./reactionPost.js";
import { renderCommentsSection } from "../comment/comment.js";


export async function loadPostCard(postId) {
    const container = document.getElementById("feed");

    try {
        const post = await ApiRequest(`/api/posts/${postId}`);
        container.replaceChildren();

        container.appendChild(createPostDetails(post));
    } catch (error) {
        const { ErrorPageView } = await import("../errorPage.js");
        const errorView = ErrorPageView();
        container.replaceChildren(errorView.dom);
        if (errorView.logic) errorView.logic();
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
    button.id = "back-btn"
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



