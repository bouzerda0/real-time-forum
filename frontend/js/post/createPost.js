import { ApiRequest } from "../api.js";

const AVAILABLE_CATEGORIES = [
    "General",
    "Technology",
    "Programming",
    "Gaming",
    "Science",
    "Education"
];

export function CreatePostView() {
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

    const categories = createCategorySection();

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

    const selectedCategoryEl = document.querySelector('input[name="post-category"]:checked');
    const category = selectedCategoryEl ? selectedCategoryEl.value : "";

    if (!title || !content || !category) {
        alert("Please fill all fields and select a category.");
        return;
    }

    const post = {
        title,
        content,
        category,
    };

    try {
        await ApiRequest("/posts", {
            method: "POST",
            body: post,
        });

        console.log("Post created successfully.");
        if (window.navigateTo) {
            window.navigateTo("/");
        }
    } catch (error) {
        console.error(error);
        alert("Failed to create post.");
    }
}

function createCategorySection() {
    const container = document.createElement("div");
    container.className = "post-categories-container";

    const labelTitle = document.createElement("label");
    labelTitle.className = "categories-title";
    labelTitle.textContent = "Select Category:";
    container.appendChild(labelTitle);

    AVAILABLE_CATEGORIES.forEach((catName, index) => {
        const itemWrapper = document.createElement("div");
        itemWrapper.className = "category-item";

        const catId = catName.toLowerCase();

        const radio = document.createElement("input");
        radio.type = "radio";
        radio.id = `cat-${catId}`;
        radio.name = "post-category";
        radio.value = catName;
        if (index === 0) {
            radio.checked = true;
        }

        const label = document.createElement("label");
        label.htmlFor = `cat-${catId}`;
        label.textContent = catName;

        itemWrapper.append(radio, label);
        container.appendChild(itemWrapper);
    });

    return container;
}