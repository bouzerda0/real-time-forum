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

    feedContainer.innerHTML = "";

    const container = document.createElement("div");
    container.className = "empty-feed";

    const title = document.createElement("h2");
    title.textContent = "No Posts Yet";

    const message = document.createElement("p");
    message.textContent = "Be the first to create a post.";

    container.appendChild(title);
    container.appendChild(message);

    feedContainer.appendChild(container);
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

    footer.appendChild(date);
    footer.appendChild(comments);

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