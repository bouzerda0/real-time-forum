import { ApiRequest } from "../api.js";

export function createReaction(postId, initialLikes, initialDislikes) {
    // div to store actions
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'post-actions';

    // Like button
    const likeBtn = document.createElement('button');
    likeBtn.className = 'btn-react like-btn';

    const likeIcon = document.createElement('span');
    likeIcon.className = 'react-icon';
    likeIcon.textContent = '👍';

    const likesSpan = document.createElement('span');
    likesSpan.id = `likes-count-${postId}`;
    likesSpan.className = 'react-count';
    likesSpan.textContent = initialLikes || 0;

    likeBtn.appendChild(likeIcon);
    likeBtn.appendChild(likesSpan);

    likeBtn.addEventListener('click', function () {
        reactToPost(postId, 1, this);
    });

    // Dislike button
    const dislikeBtn = document.createElement('button');
    dislikeBtn.className = 'btn-react dislike-btn';

    const dislikeIcon = document.createElement('span');
    dislikeIcon.className = 'react-icon';
    dislikeIcon.textContent = '👎';

    const dislikesSpan = document.createElement('span');
    dislikesSpan.id = `dislikes-count-${postId}`;
    dislikesSpan.className = 'react-count';
    dislikesSpan.textContent = initialDislikes || 0;

    dislikeBtn.appendChild(dislikeIcon);
    dislikeBtn.appendChild(dislikesSpan);

    dislikeBtn.addEventListener('click', function () {
        reactToPost(postId, 0, this);
    });

    // add buttons to the div
    actionsDiv.appendChild(likeBtn);
    actionsDiv.appendChild(dislikeBtn);

    // return the div
    return actionsDiv;
}

async function reactToPost(postId, isLike, btn) {
    if (btn) btn.disabled = true;
    try {
        const data = await ApiRequest("/api/reaction", {
            method: "POST",
            body: { post_id: Number(postId), is_like: Number(isLike) }
        });

        const likesEl = document.getElementById(`likes-count-${postId}`);
        const dislikesEl = document.getElementById(`dislikes-count-${postId}`);

        if (likesEl && data.likes !== undefined) likesEl.textContent = data.likes;
        if (dislikesEl && data.dislikes !== undefined) dislikesEl.textContent = data.dislikes;
    } catch (err) {
        console.error("Error reacting to post:", err);
    } finally {
        if (btn) btn.disabled = false;
    }
}