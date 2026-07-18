package main

import (
	"log"
	"net/http"
	"os"
	"path/filepath"

	"real-time-forum/database"
	"real-time-forum/internal/auth"
	"real-time-forum/internal/comments"
	"real-time-forum/internal/middleware"
	"real-time-forum/internal/posts"
	"real-time-forum/internal/users"
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
	http.HandleFunc("GET /api/session", users.SessionHandler)
	http.HandleFunc("GET /api/users", users.UsersHandler)
	http.HandleFunc("POST /api/logout", middleware.RequireAuth(auth.LogoutHandler))

	// Posts API Routes
	http.HandleFunc("GET /api/posts", posts.PostHandler)
	http.HandleFunc("POST /api/posts", middleware.RequireAuth(posts.PostHandler))
	http.HandleFunc("GET /api/posts/{id}", posts.GetPostHandler)
	http.HandleFunc("POST /api/reaction", middleware.RequireAuth(posts.ReactionHandler))

	// Comments API Routes
	http.HandleFunc("GET /api/comments", comments.CommentsHandler)
	http.HandleFunc("POST /api/comments", middleware.RequireAuth(comments.CommentsHandler))
	http.HandleFunc("POST /api/comments/reaction", middleware.RequireAuth(comments.ReactionHandler))

	// Serving Frontend SPA (must be registered after specific API routes)
	fs := http.FileServer(http.Dir(frontendDir))
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		// If the file exists on disk, serve it directly (CSS, JS, images, etc.)
		if _, err := os.Stat(filepath.Join(frontendDir, r.URL.Path)); err == nil {
			fs.ServeHTTP(w, r)
			return
		}
		// Otherwise, serve index.html for SPA client-side routing
		http.ServeFile(w, r, filepath.Join(frontendDir, "index.html"))
	})

	port := ":8080"
	log.Printf("🚀 Server is running on http://localhost%s\n", port)

	err = http.ListenAndServe(port, nil)
	if err != nil {
		log.Fatal("Server failed to start:", err)
	}
}
