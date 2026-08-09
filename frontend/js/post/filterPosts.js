import { ApiRequest } from "../api.js";
import { showEmpty, renderPosts } from "./feed.js";

export async function filterByCategory(category) {
    const feed = document.getElementById("feed");
    if (feed) feed.innerHTML = "<p>Loading...</p>";

    document.querySelectorAll('.menu-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-cat') === category) {
            btn.classList.add('active');
        }
    });

    let url = "/api/posts";
    if (category !== "all") {
        url = `/api/posts?category=${encodeURIComponent(category)}`;
    }

    try {
        let posts = await ApiRequest(url);

        if (Array.isArray(posts) && category === "liked") {
            posts = posts.filter(p => p.user_reaction === 1 || p.UserReaction === 1);
        }

        if (!posts || posts.length === 0) {
            if (feed) showEmpty(category);
            return;
        }

        if (feed) renderPosts(posts);
    } catch (error) {
        console.error("Error fetching filtered posts:", error);
        if (feed) {
            const { showError } = await import("../errorPage.js");
            showError(error.status || 500);
        }
    }
}
