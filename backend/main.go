package main

import (
	"log"
	"net/http"
	"os"

	"real-time-forum/database"
	"real-time-forum/internal/auth"
	"real-time-forum/internal/chat"
	"real-time-forum/internal/comments"
	"real-time-forum/internal/middleware"
	"real-time-forum/internal/posts"
	"real-time-forum/internal/users"
	"real-time-forum/internal/websocket"
)

const frontendDir = "../frontend"

func main() {
	// Initialize database
	err := database.InitDB("../forum.db")
	if err != nil {
		log.Fatal("Failed to initialize database:", err)
	}

	// Auth API Routes
	http.HandleFunc("POST /api/register", auth.RegisterHandler)
	http.HandleFunc("POST /api/login", auth.LoginHandler)
	http.HandleFunc("GET /api/session", users.SessionHandler)
	http.HandleFunc("GET /api/users", middleware.RequireAuth(users.UsersHandler))
	http.HandleFunc("POST /api/logout", middleware.RequireAuth(auth.LogoutHandler))

	// Posts API Routes
	http.HandleFunc("GET /api/posts", middleware.RequireAuth(posts.PostHandler))
	http.HandleFunc("POST /api/posts", middleware.RequireAuth(posts.PostHandler))
	http.HandleFunc("GET /api/posts/{id}", middleware.RequireAuth(posts.GetPostHandler))
	http.HandleFunc("POST /api/reaction", middleware.RequireAuth(posts.ReactionHandler))

	// Comments API Routes
	http.HandleFunc("GET /api/comments", middleware.RequireAuth(comments.CommentsHandler))
	http.HandleFunc("POST /api/comments", middleware.RequireAuth(comments.CommentsHandler))
	http.HandleFunc("POST /api/comments/reaction", middleware.RequireAuth(comments.ReactionHandler))

	// Chat & WebSocket Routes
	hub := websocket.NewHub()

	go hub.Run()

	http.HandleFunc("/ws", websocket.WSHandler(hub))
	http.HandleFunc("GET /chat", chat.ChatHandler)

	// Serving Frontend SPA (must be registered after specific API routes)
	fs := http.FileServer(http.Dir(frontendDir))

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if _, err := os.Stat(frontendDir + r.URL.Path); os.IsNotExist(err) {
			r.URL.Path = "/"
		}

		fs.ServeHTTP(w, r)
	})
	port := ":8080"
	log.Printf("Server is running on http://localhost%s\n", port)

	log.Println("Server started at http://localhost:8080")

	err = http.ListenAndServe(":8080", nil)
	if err != nil {
		log.Fatal(err)
	}
}
