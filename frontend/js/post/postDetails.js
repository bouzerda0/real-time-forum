import { ApiRequest } from "../api.js";
import { createReaction } from "./reactionPost.js";
import { renderCommentsSection } from "../comment/comment.js";


export async function loadPostCard(postId) {
    const container = document.getElementById("feed-container");

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



