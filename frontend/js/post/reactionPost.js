import { ApiRequest } from "../api.js";

export function createReaction(itemId, initialLikes = 0, initialDislikes = 0, userReaction, itemType = "post") {
    const actionsDiv = document.createElement("div");
    actionsDiv.className = "buttons";

    let likeId, dislikeId;
    if (itemType === "post") {
        likeId = `likes-count-${itemId}`;
        dislikeId = `dislikes-count-${itemId}`;
    } else {
        likeId = `likes-count-comment-${itemId}`;
        dislikeId = `dislikes-count-comment-${itemId}`;
    }

    const likedClass = userReaction === 1 ? "liked" : "";
    const dislikedClass = userReaction === 0 ? "disliked" : "";

    actionsDiv.innerHTML = `
        <button class="action-btn like-btn ${likedClass}" data-${itemType}-id="${itemId}">
            <span class="react-icon">👍</span>
            <span id="${likeId}" class="react-count">${initialLikes || 0}</span>
        </button>
        <button class="action-btn dislike-btn ${dislikedClass}" data-${itemType}-id="${itemId}">
            <span class="react-icon">👎</span>
            <span id="${dislikeId}" class="react-count">${initialDislikes || 0}</span>
        </button>
    `;

    const likeBtn = actionsDiv.querySelector(".like-btn");
    const dislikeBtn = actionsDiv.querySelector(".dislike-btn");

    likeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        reactToPost(itemId, 1, likeBtn, dislikeBtn, itemType);
    });

    dislikeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        reactToPost(itemId, 0, likeBtn, dislikeBtn, itemType);
    });

    return actionsDiv;
}

async function reactToPost(itemId, isLike, likeBtn, dislikeBtn, itemType = "post") {
    likeBtn.disabled = true;
    dislikeBtn.disabled = true;

    let endpoint, body, likeId, dislikeId;

    if (itemType === "post") {
        endpoint = "/api/reaction";
        body = { post_id: Number(itemId), is_like: isLike };
        likeId = `likes-count-${itemId}`;
        dislikeId = `dislikes-count-${itemId}`;
    } else {
        endpoint = "/api/comments/reaction";
        body = { comment_id: Number(itemId), is_like: isLike };
        likeId = `likes-count-comment-${itemId}`;
        dislikeId = `dislikes-count-comment-${itemId}`;
    }

    try {
        const data = await ApiRequest(endpoint, { method: "POST", body });

        if (data.likes !== undefined) {
            document.querySelectorAll(`[id="${likeId}"]`).forEach(el => el.textContent = data.likes);
        }
        if (data.dislikes !== undefined) {
            document.querySelectorAll(`[id="${dislikeId}"]`).forEach(el => el.textContent = data.dislikes);
        }

        if (data.user_reaction !== undefined) {
            document.querySelectorAll(`.like-btn[data-${itemType}-id="${itemId}"]`).forEach(btn => {
                btn.classList.toggle("liked", data.user_reaction === 1);
            });
            document.querySelectorAll(`.dislike-btn[data-${itemType}-id="${itemId}"]`).forEach(btn => {
                btn.classList.toggle("disliked", data.user_reaction === 0);
            });
        }
    } catch (err) {
        console.error("Error reacting:", err);
        if (err.message === "Unauthorized") {
            alert("Please login to react.");
            if (window.navigateTo) window.navigateTo("/login");
        } else {
            const { showError } = await import("../errorPage.js");
            showError(err.status || 500);
        }
    } finally {
        likeBtn.disabled = false;
        dislikeBtn.disabled = false;
    }
}