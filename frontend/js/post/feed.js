import { ApiRequest } from "../api.js"

export async function leadfeed() {
    const feed = document.getElementById("feed-container");

    feed.innerHTML = "<p>Loading...</p>";
        const posts = await ApiRequest("/posts");

        if (posts.length === 0) {
            showEmpty();
            return;
        }

        renderPosts(posts);

  
}

function showEmpty() {
    const feedContainer = document.getElementById("feed-container");

    feedContainer.innerHTML = `
        <div class="empty-feed">
            <h2>No Posts Yet</h2>
            <p>Be the first to create a post.</p>
        </div>
    `;
}

function renderPosts(posts) {
    const feedContainer = document.getElementById("feed-container");

    feedContainer.innerHTML = "";

    posts.forEach(post => {
        const postCard = createPostCard(post);
        feedContainer.appendChild(postCard);
    });
}

function createPostCard(post) {
    const article = document.createElement("article");

    article.className = "post-card";

    article.innerHTML = `
    <div class="post-header">
        <span class="post-user">${post.Nickname}</span>
        <span class="post-category">${post.Category}</span>
    </div>

    <h2 class="post-title">${post.Title}</h2>

    <p class="post-content">
        ${post.Content}
    </p>

    <div class="post-footer">
        <span>${formatDate(post.CreatedAt)}</span>
        <span>0 Comments</span>
    </div>
`;

    return article;
}

function formatDate(date) {
    return new Date(date).toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}