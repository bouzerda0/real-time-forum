import { ApiRequest } from "../api.js";
import { loadFeed } from "./feed.js";

const AVAILABLE_CATEGORIES = [
    "General",
    "Technology",
    "Programming",
    "Gaming",
    "Science",
    "Education"
];

export function createPostView() {
    const container = document.createElement("div");
    container.style.padding = "20px 0";
    container.appendChild(createPostForm());

    return {
        dom: container,
        logic: () => { }
    };
}

function createPostForm() {
    const form = document.createElement("form");
    form.className = "create-box";
    form.id = "create-post-form";

    form.addEventListener("submit", handleCreatePost);

    // Error box
    const errBox = document.createElement("div");
    errBox.id = "post-error";
    errBox.className = "error-text";

    // Title
    const title = document.createElement("input");
    title.type = "text";
    title.id = "title";
    title.className = "title";
    title.placeholder = "Enter post title";
    title.required = true;

    const categories = createCategorySection();

    // Content
    const content = document.createElement("textarea");
    content.id = "text";
    content.className = "text";
    content.placeholder = "Write your post...";
    content.required = true;

    // Submit Button
    const submit = document.createElement("button");
    submit.type = "submit";
    submit.className = "submit-btn";
    submit.textContent = "Create Post";

    form.append(
        errBox,
        title,
        categories,
        content,
        submit
    );

    return form;
}

function showPostError(msg) {
    const errBox = document.getElementById("post-error");
    if (errBox) errBox.textContent = msg;
}

async function handleCreatePost(event) {
    event.preventDefault();
    showPostError("");

    const titleInput = document.getElementById("title");
    const contentInput = document.getElementById("text");

    const categories = Array.from(
        document.querySelectorAll('input[name="post-categories"]:checked')
    ).map(checkbox => checkbox.value);

    // Validate inputs
    if (!titleInput.value.trim() || titleInput.value.length > 150) {
        showPostError("Title must be between 1 and 150 characters.");
        return;
    }
    if (categories.length === 0) {
        showPostError("Please select at least one category.");
        return;
    }
    if (!contentInput.value.trim() || contentInput.value.length > 4500) {
        showPostError("Post content cannot exceed 4500 characters.");
        return;
    }

    const title = titleInput.value.trim();
    const content = contentInput.value.trim();


    try {
        await ApiRequest("/api/posts", {
            method: "POST",
            body: { title, content, categories },
        });

        if (window.navigateTo) {
            window.navigateTo("/");
        } else {
            await loadFeed();
        }
    } catch (error) {
        showPostError("Failed to create post. Please try again.");
    }
}

function createCategorySection() {
    const container = document.createElement("div");
    container.className = "category-list";

    const labelTitle = document.createElement("label");
    labelTitle.className = "pick-category";
    labelTitle.textContent = "Select Categories:";
    container.appendChild(labelTitle);

    AVAILABLE_CATEGORIES.forEach(catName => {
        const itemWrapper = document.createElement("div");
        itemWrapper.className = "category-option";

        const catId = catName.toLowerCase();

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = `cat-${catId}`;
        checkbox.name = "post-categories";
        checkbox.value = catName;

        const label = document.createElement("label");
        label.htmlFor = `cat-${catId}`;
        label.textContent = catName;

        itemWrapper.append(checkbox, label);
        container.appendChild(itemWrapper);
    });

    return container;
}