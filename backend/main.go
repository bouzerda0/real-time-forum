package main

import (
	"log"
	"net/http"
	"os"
	"strings"

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
	err := database.InitDB("../forum.db")
	if err != nil {
		log.Fatal("Failed to initialize database:", err)
	}
	defer database.DB.Close()

	// Auth API Routes
	http.HandleFunc("POST /api/register", auth.RegisterHandler)
	http.HandleFunc("POST /api/login", auth.LoginHandler)
	http.HandleFunc("GET /api/session", middleware.RequireAuth(auth.SessionHandler))
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

	fs := http.FileServer(http.Dir(frontendDir))
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.Path

		// 1. serve index.html with 200 OK for known SPA routes
		switch {
		case path == "/", path == "/login", path == "/register", path == "/create-post", path == "/messages", strings.HasPrefix(path, "/post/"):
			http.ServeFile(w, r, frontendDir+"/index.html")
			return
		}

		// 2. serve static files if they exist (JS, CSS, images, etc.)
		if stat, err := os.Stat(frontendDir + path); err == nil && !stat.IsDir() {
			fs.ServeHTTP(w, r)
			return
		}

		// 3. serve index.html with 404 Not Found for unknown routes
		w.WriteHeader(http.StatusNotFound)
		indexFile, _ := os.ReadFile(frontendDir + "/index.html")
		w.Write(indexFile)
	})
	port := ":8080"
	log.Printf("Server is running on http://localhost%s\n", port)

	err = http.ListenAndServe(port, nil)
	if err != nil {
		log.Fatal("Server failed to start:", err)
	}
}
