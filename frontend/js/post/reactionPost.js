import { ApiRequest } from "../api.js";

export function createReaction(postId, initialLikes, initialDislikes, initialUserReaction) {
    // div to store actions
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'post-actions';

    // Like button
    const likeBtn = document.createElement('button');
    likeBtn.className = 'btn-react like-btn';
    likeBtn.setAttribute('data-post-id', postId);
    if (initialUserReaction === 1) {
        likeBtn.classList.add('liked');
    }

    const likeIcon = document.createElement('span');
    likeIcon.className = 'react-icon';
    likeIcon.textContent = '👍';

    const likesSpan = document.createElement('span');
    likesSpan.id = `likes-count-${postId}`;
    likesSpan.className = 'react-count';
    likesSpan.textContent = initialLikes || 0;

    likeBtn.appendChild(likeIcon);
    likeBtn.appendChild(likesSpan);

    // Dislike button
    const dislikeBtn = document.createElement('button');
    dislikeBtn.className = 'btn-react dislike-btn';
    dislikeBtn.setAttribute('data-post-id', postId);
    if (initialUserReaction === 0) {
        dislikeBtn.classList.add('disliked');
    }

    const dislikeIcon = document.createElement('span');
    dislikeIcon.className = 'react-icon';
    dislikeIcon.textContent = '👎';

    const dislikesSpan = document.createElement('span');
    dislikesSpan.id = `dislikes-count-${postId}`;
    dislikesSpan.className = 'react-count';
    dislikesSpan.textContent = initialDislikes || 0;

    dislikeBtn.appendChild(dislikeIcon);
    dislikeBtn.appendChild(dislikesSpan);

    likeBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        reactToPost(postId, 1, likeBtn, dislikeBtn);
    });

    dislikeBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        reactToPost(postId, 0, likeBtn, dislikeBtn);
    });

    // add buttons to the div
    actionsDiv.appendChild(likeBtn);
    actionsDiv.appendChild(dislikeBtn);

    // return the div
    return actionsDiv;
}

async function reactToPost(postId, isLike, likeBtn, dislikeBtn) {
    if (likeBtn) likeBtn.disabled = true;
    if (dislikeBtn) dislikeBtn.disabled = true;
    try {
        const data = await ApiRequest("/api/reaction", {
            method: "POST",
            body: { post_id: Number(postId), is_like: Number(isLike) }
        });

        document.querySelectorAll(`[id="likes-count-${postId}"]`).forEach(el => {
            if (data.likes !== undefined) el.textContent = data.likes;
        });
        document.querySelectorAll(`[id="dislikes-count-${postId}"]`).forEach(el => {
            if (data.dislikes !== undefined) el.textContent = data.dislikes;
        });

        if (data.user_reaction !== undefined) {
            document.querySelectorAll(`.like-btn[data-post-id="${postId}"]`).forEach(btn => {
                btn.classList.toggle('liked', data.user_reaction === 1);
            });
            document.querySelectorAll(`.dislike-btn[data-post-id="${postId}"]`).forEach(btn => {
                btn.classList.toggle('disliked', data.user_reaction === 0);
            });
        }
    } catch (err) {
        console.error("Error reacting to post:", err);
        if (err && err.message && (err.message.includes("401") || err.message.includes("Unauthorized"))) {
            alert("Please login to react to posts.");
            if (window.navigateTo) window.navigateTo("/login");
        }
    } finally {
        if (likeBtn) likeBtn.disabled = false;
        if (dislikeBtn) dislikeBtn.disabled = false;
    }
}