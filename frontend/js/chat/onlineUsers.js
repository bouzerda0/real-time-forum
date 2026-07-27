import { ApiRequest } from "../api.js"
// 1 . Load users
// 2. update the online users list in the UI
// 3. sort the users list
// 4. click on a user to start a chat
// 5. notify the user when a new message is received
 const usersList = document.getElementById("users-list");

export async function loadUsers() {
    try {
        // Request all users from the backend
        const users = await ApiRequest("/api/users");

        // If there are no users, clear the list
        if (!users || users.length === 0) {
            usersList.innerHTML = "";
            return;
        }

        // Sort users before rendering
        sortUsers(users);

        // Render the users in the UI
        renderUsers(users);

    } catch (error) {
        console.error("Failed to load users:", error);
    }
}

function renderUsers(users) {

    // Remove old users before rendering again
    usersList.replaceChildren();

    // Create one element for each user
    users.forEach(user => {
        // Main user container
        const userItem = document.createElement("div");
        userItem.classList.add("user-item");
        userItem.dataset.userId = user.id;

        // Online/Offline indicator
        const status = document.createElement("span");
        status.classList.add("user-status");

        if (user.online) {
            status.classList.add("online");
        } else {
            status.classList.add("offline");
        }
        const avatar = document.createElement("div");
        avatar.classList.add("user-avatar");
        avatar.textContent = user.nickname.charAt(0).toUpperCase();
        // User name
        const username = document.createElement("span");
        username.classList.add("user-name");
        username.textContent = user.nickname;

        // Build the HTML structure
        userItem.appendChild(status);
        userItem.appendChild(username);
        userItem.appendChild(avatar);

        // Add the user to the list
        usersList.appendChild(userItem);
    });
}


export function updateOnlineUsers(message) {
    // Find the user element by its ID
    const userItem = document.querySelector(
        `[data-user-id="${message.userId}"]`
    );

    // If the user is not in the list, do nothing
    if (!userItem) {
        return;
    }

    // Find the status indicator
    const status = userItem.querySelector(".user-status");

    // Update the user's status
    if (message.online) {
        status.classList.remove("offline");
        status.classList.add("online");
    } else {
        status.classList.remove("online");
        status.classList.add("offline");
    }
}

function sortUsers(users) {
    return users.sort((a, b) => {
        // Check if the users have exchanged messages
        const aHasMessage = a.lastmessage !== "0001-01-01T00:00:00Z";
        const bHasMessage = b.lastmessage !== "0001-01-01T00:00:00Z";

        // Both users have messages → sort by newest message first
        if (aHasMessage && bHasMessage) {
            return new Date(b.lastmessage) - new Date(a.lastmessage);
        }

        // Only A has messages → A comes first
        if (aHasMessage) {
            return -1;
        }

        // Only B has messages → B comes first
        if (bHasMessage) {
            return 1;
        }

        // Neither has messages → sort alphabetically
        return a.nickname.localeCompare(b.nickname);
    });
}