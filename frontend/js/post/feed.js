import { ApiRequest } from "../api.js"
import { createReaction } from "./reactionPost.js"

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

export function showEmpty() {
    const feedContainer = document.getElementById("feed-container");

    feedContainer.innerHTML = "";

    const container = document.createElement("div");
    container.className = "empty-feed";

    const iconContainer = document.createElement("div");
    iconContainer.className = "empty-feed-icon";
    iconContainer.innerHTML = `
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
    `;

    const title = document.createElement("h2");
    title.textContent = "No Posts Yet";

    const message = document.createElement("p");
    message.textContent = "Be the first to create a post and start a conversation in this category.";

    const createBtn = document.createElement("button");
    createBtn.className = "empty-feed-btn";
    createBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        <span>Create First Post</span>
    `;
    createBtn.onclick = () => window.navigateTo ? window.navigateTo('/create-post') : null;

    container.appendChild(iconContainer);
    container.appendChild(title);
    container.appendChild(message);
    container.appendChild(createBtn);

    feedContainer.appendChild(container);
}

export function renderPosts(posts) {
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

    // Header
    const header = document.createElement("div");
    header.className = "post-header";

    const user = document.createElement("span");
    user.className = "post-user";
    user.textContent = post.Nickname;

    const category = document.createElement("span");
    category.className = "post-category";
    category.textContent = post.Category;

    header.appendChild(user);
    header.appendChild(category);

    // Title
    const title = document.createElement("h2");
    title.className = "post-title";
    title.textContent = post.Title;

    // Content
    const content = document.createElement("p");
    content.className = "post-content";
    content.textContent = post.Content;

    // Footer
    const footer = document.createElement("div");
    footer.className = "post-footer";

    const date = document.createElement("span");
    date.textContent = formatDate(post.CreatedAt);

    const comments = document.createElement("span");
    comments.textContent = "0 Comments";

    const reactionsUI = createReaction(post.ID || post.Id || post.id, post.Likes || 0, post.Dislikes || 0);

    footer.appendChild(date);
    footer.appendChild(comments);
    footer.appendChild(reactionsUI);

    // Build article
    article.appendChild(header);
    article.appendChild(title);
    article.appendChild(content);
    article.appendChild(footer);

    return article;
}

function formatDate(date) {
    return new Date(date).toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}