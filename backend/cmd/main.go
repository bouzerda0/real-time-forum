package main

import (
	"log"
	"net/http"

	"real-time-forum/backend/database"
	"real-time-forum/backend/internal/posts"
)

func main() {
	// Initialize database
	database.InitDB()

	// Serve frontend files
	fs := http.FileServer(http.Dir("./frontend"))
	http.Handle("/", fs)

	// API Routes
	http.HandleFunc("/posts", posts.PostHandler)
	http.HandleFunc("/posts/{id}", posts.GetPostHandler)

	log.Println("Server started at http://localhost:8080")

	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		log.Fatal(err)
	}
}