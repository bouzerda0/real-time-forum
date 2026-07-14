import { ApiRequest } from "../api.js";

const AVAILABLE_CATEGORIES = [
    "General",
    "Technology",
    "Programming",
    "Gaming",
    "Science",
    "Education"
];

export function createPost() {
    const createButton = document.querySelector(".btn-create");
    if (!createButton) return;

    createButton.addEventListener("click", renderCreatePost);
}

function renderCreatePost() {
    const app = document.getElementById("feed-container");

    if (!app) return;

    app.replaceChildren(createPostForm());
}

function createPostForm() {
    const form = document.createElement("form");
    form.className = "post-box";
    form.id = "create-post-form";

    form.addEventListener("submit", handleCreatePost);

    // Title
    const title = document.createElement("input");
    title.type = "text";
    title.id = "post-title";
    title.className = "post-title";
    title.placeholder = "Enter post title";
    title.required = true;
    const categories = createCategorySection()
    // Content
    const content = document.createElement("textarea");
    content.id = "post-content";
    content.className = "post-content";
    content.placeholder = "Write your post...";
    content.required = true;

    // Submit Button
    const submit = document.createElement("button");
    submit.type = "submit";
    submit.className = "post-submit";
    submit.textContent = "Create Post";

    form.append(
        title,
        categories,
        content,
        submit
    );

    return form;
}

async function handleCreatePost(event) {
    event.preventDefault();

    const title = document.getElementById("post-title").value.trim();
    const content = document.getElementById("post-content").value.trim();

    const categories = Array.from(
        document.querySelectorAll('input[name="post-categories"]:checked')
    ).map(checkbox => checkbox.value);
    
    if (!title || !content || categories.length === 0) {
        console.log("hers is the error")
        alert("Please fill all fields.");
        return;
    }

    const post = {
        title,
        content,
        categories,
    };
   

    try {
        await ApiRequest("/posts", {
            method: "POST",
            body: post,
        });

        console.log("Post created successfully.");
    } catch (error) {
        alert("Failed to create post.");
    }
}



function createCategorySection() {
    const container = document.createElement("div");
    container.className = "post-categories-container";

    const labelTitle = document.createElement("label");
    labelTitle.className = "categories-title";
    labelTitle.textContent = "Select Categories:";
    container.appendChild(labelTitle);

    AVAILABLE_CATEGORIES.forEach(catName => {
        const itemWrapper = document.createElement("div");
        itemWrapper.className = "category-item";

        const catId = catName.toLowerCase();

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = `cat-${catId}`; catName
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