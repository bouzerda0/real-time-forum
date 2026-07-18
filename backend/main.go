package main

import (
	"log"
	"net/http"

	"real-time-forum/database"
	"real-time-forum/internal/posts"
	"real-time-forum/internal/websocket"
)

func main() {
	// Initialize database
	err := database.InitDB("../forum.db")
	if err != nil {
		log.Fatal("Failed to initialize database:", err)
	}

	// Serve frontend files
	fs := http.FileServer(http.Dir("./frontend"))
	http.Handle("/", fs)

	// API Routes
	http.HandleFunc("/posts", posts.PostHandler)
	http.HandleFunc("/posts/{id}", posts.GetPostHandler)

	hub := websocket.NewHub()

	go hub.Run()

	http.HandleFunc("/ws", websocket.WSHandler(hub))
	
	log.Println("Server started at http://localhost:8080")

	err = http.ListenAndServe(":8080", nil)
	if err != nil {
		log.Fatal(err)
	}
}
