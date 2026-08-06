# 💬 Real-Time Forum

A modern, high-performance **Real-Time Forum & Messaging Single Page Application (SPA)** built with a **Go** backend and a lightweight **Vanilla JavaScript** frontend. 

Features real-time private messaging via WebSockets, session-based authentication, interactive posts, categories, comments, and reactions.

---

## ✨ Features

- 🔐 **User Authentication**: Secure Registration, Login, and Session handling using HttpOnly cookies.
- ⚡ **Real-Time Private Chat**: One-on-one instant messaging powered by WebSockets.
- 🟢 **Live Online/Offline Status**: Instant presence indicators for active forum members.
- 📌 **Forum Feed & Categories**: Filter posts by categories (General, Tech, Gaming, etc.) or liked content.
- 💬 **Interactive Posts & Comments**: Create posts, leave comments, and react with likes/dislikes.
- 📱 **Responsive SPA Design**: Mobile-friendly sidebar drawer and clean dashboard interface built without heavy frameworks.

---

## 🛠️ Tech Stack

- **Backend**: Go (`net/http`, `database/sql`, WebSockets)
- **Database**: SQLite3
- **Frontend**: Vanilla JavaScript (ES Modules, History API SPA router), CSS3, HTML5

---

## 🚀 Quick Start

### Prerequisites

- [Go](https://golang.org/doc/install) (version 1.20+)
- SQLite3 driver support (`gcc` for `go-sqlite3`)

### Installation & Execution

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/real-time-forum.git
   cd real-time-forum
   ```

2. **Run the backend server:**
   ```bash
   cd backend
   go run .
   ```

3. **Access the application:**
   Open your browser and navigate to `http://localhost:8080`

---

## 📁 Project Structure

```
real-time-forum/
├── backend/
│   ├── cmd/
│   ├── database/         # SQLite DB initialization & migrations
│   ├── internal/         # Core application logic
│   │   ├── auth/         # Authentication handlers
│   │   ├── chat/         # Chat & messaging logic
│   │   ├── comments/     # Post comments handler
│   │   ├── middleware/   # Auth middleware guards
│   │   ├── posts/        # Post creation & reaction logic
│   │   ├── users/        # User profile & status handlers
│   │   └── websocket/    # WebSocket hub & client connections
│   ├── go.mod
│   └── main.go           # Application entry point
├── frontend/
│   ├── assets/css/       # Modular CSS styling
│   ├── js/               # Vanilla JS modules & SPA router
│   └── index.html        # Single Page Application root
└── README.md
```

---

## 📝 License

This project is open-source and available under the [MIT License](LICENSE).
