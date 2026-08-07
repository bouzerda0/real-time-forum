import { ApiRequest } from "../api.js";

export function createReaction(postId, initialLikes = 0, initialDislikes = 0, initialUserReaction, itemType = "post") {
    const actionsDiv = document.createElement("div");
    actionsDiv.className = "buttons";

    // Build reaction buttons
    const buttons = [
        { isLike: 1, type: "like", icon: "👍", count: initialLikes, activeVal: 1 },
        { isLike: 0, type: "dislike", icon: "👎", count: initialDislikes, activeVal: 0 }
    ].map(({ isLike, type, icon, count, activeVal }) => {
        const btn = document.createElement("button");
        btn.className = `action-btn ${type}-btn${initialUserReaction === activeVal ? ` ${type}d` : ""}`;
        btn.setAttribute(`data-${itemType}-id`, postId);
        const countId = itemType === "post" ? `${type}s-count-${postId}` : `${type}s-count-${itemType}-${postId}`;
        btn.innerHTML = `<span class="react-icon">${icon}</span><span id="${countId}" class="react-count">${count || 0}</span>`;
        return btn;
    });

    const [likeBtn, dislikeBtn] = buttons;

    // Attach click handlers
    likeBtn.addEventListener("click", e => { e.stopPropagation(); reactToPost(postId, 1, likeBtn, dislikeBtn, itemType); });
    dislikeBtn.addEventListener("click", e => { e.stopPropagation(); reactToPost(postId, 0, likeBtn, dislikeBtn, itemType); });

    actionsDiv.append(likeBtn, dislikeBtn);
    return actionsDiv;
}

async function reactToPost(postId, isLike, likeBtn, dislikeBtn, itemType = "post") {
    if (likeBtn) likeBtn.disabled = true;
    if (dislikeBtn) dislikeBtn.disabled = true;

    const endpoint = itemType === "post" ? "/api/reaction" : "/api/comments/reaction";
    const body = itemType === "post"
        ? { post_id: Number(postId), is_like: Number(isLike) }
        : { comment_id: Number(postId), is_like: Number(isLike) };
    const likesSelector = itemType === "post" ? `[id="likes-count-${postId}"]` : `[id="likes-count-${itemType}-${postId}"]`;
    const dislikesSelector = itemType === "post" ? `[id="dislikes-count-${postId}"]` : `[id="dislikes-count-${itemType}-${postId}"]`;
    const btnSelectorAttr = `[data-${itemType}-id="${postId}"]`;

    try {
        const data = await ApiRequest(endpoint, { method: "POST", body });

        // Update counts and button styles
        if (data.likes !== undefined) document.querySelectorAll(likesSelector).forEach(el => el.textContent = data.likes);
        if (data.dislikes !== undefined) document.querySelectorAll(dislikesSelector).forEach(el => el.textContent = data.dislikes);

        if (data.user_reaction !== undefined) {
            document.querySelectorAll(`.like-btn${btnSelectorAttr}`).forEach(btn => btn.classList.toggle("liked", data.user_reaction === 1));
            document.querySelectorAll(`.dislike-btn${btnSelectorAttr}`).forEach(btn => btn.classList.toggle("disliked", data.user_reaction === 0));
        }
    } catch (err) {
        console.error("Error reacting to post/comment:", err);
        if (err?.message?.includes("401") || err?.message?.includes("Unauthorized")) {
            alert("Please login to react.");
            if (window.navigateTo) window.navigateTo("/login");
        }
    } finally {
        if (likeBtn) likeBtn.disabled = false;
        if (dislikeBtn) dislikeBtn.disabled = false;
    }
}