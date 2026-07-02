# Real-Time Forum SPA

A professional, real-time communication platform built as a **Single Page Application (SPA)** using **Go**, **SQLite**, and **WebSockets**. This project implements a central WebSocket management system via **Shared Workers** to ensure seamless, real-time interactions across browser tabs.

---

## 🚀 Features
*   **Authentication:** Secure registration and login with session management.
*   **Content Creation:** Ability to create posts with categories and leave comments.
*   **Real-Time Chat:** Private messaging system with live status (Online/Offline) and notification synchronization.
*   **Performance:** Optimized message loading using **Throttle** and **Debounce** techniques.
*   **Architecture:** SPA design with a central **Shared Worker** to manage WebSocket connections efficiently.

---

## 🛠 Tech Stack
*   **Backend:** Go (Golang), `gorilla/websocket`, `go-sqlite3`, `bcrypt`.
*   **Frontend:** Vanilla JavaScript (ES6+), HTML5, CSS3 (No frameworks).
*   **Database:** SQLite.
*   **Browser API:** Shared Worker, WebSockets, DOM API.

---

## 🏗 Project Architecture
```text
real-time-forum/
├── cmd/
│   └── main.go          # Entry point
├── internal/
│   ├── auth/            # Session & Login logic
│   ├── database/        # SQLite setup & queries
│   ├── websocket/       # Hub and socket management
│   └── models/          # Data structures
├── web/
│   ├── static/          # CSS, JS (worker, utils, router)
│   └── index.html       # Single Page entry
└── forum.db             # Database file