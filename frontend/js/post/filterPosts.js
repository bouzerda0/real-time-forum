import { ApiRequest } from "../api.js";
import { showEmpty, renderPosts } from "./feed.js";

export async function filterByCategory(category) {
    const feed = document.getElementById("feed-container");
    feed.innerHTML = "<p>Loading...</p>";

    let url = "/posts";
    if (category !== "all") {
        url = `/posts?category=${encodeURIComponent(category)}`;
    }

    try {
        const posts = await ApiRequest(url);

        if (!posts || posts.length === 0) {
            showEmpty();
            return;
        }

        renderPosts(posts); 
    } catch (error) {
        console.error("Error fetching filtered posts:", error);
        feed.innerHTML = "<p>Error loading posts.</p>";
    }
}