package main

import (
	"log"
	"net/http"
	"os"
	"path/filepath"

	"real-time-forum/database"
	"real-time-forum/internal/auth"
	"real-time-forum/internal/middleware"
)

const frontendDir = "../frontend"

func main() {
	err := database.InitDB("../database.db")
	if err != nil {
		log.Fatal("Failed to initialize database:", err)
	}
	defer database.DB.Close()

	// API Routes
	http.HandleFunc("/api/register", auth.RegisterHandler)
	http.HandleFunc("/api/login", auth.LoginHandler)
	http.HandleFunc("/api/session", auth.SessionHandler)

	// Protected Routes
	http.HandleFunc("/api/logout", middleware.AuthMiddleware(auth.LogoutHandler))

	// Serving Frontend SPA
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

	// start server
	port := ":8080"
	log.Printf("🚀 Server is running on http://localhost%s\n", port)

	err = http.ListenAndServe(port, nil)
	if err != nil {
		log.Fatal("Server failed to start:", err)
	}
}

