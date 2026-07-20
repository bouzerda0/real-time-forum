package main

import (
	"log"
	"net/http"

	"real-time-forum/database"
	"real-time-forum/internal/auth"
	"real-time-forum/internal/chat"
	"real-time-forum/internal/posts"
	"real-time-forum/internal/users"
	"real-time-forum/internal/websocket"
	// "real-time-forum/internal/websocket"
)

func main() {
	// Initialize database
	err := database.InitDB("../forum.db")
	if err != nil {
		log.Fatal("Failed to initialize database:", err)
	}

	// Serve frontend files
	fs := http.FileServer(http.Dir("../frontend"))
	http.Handle("/", fs)
	// API Routes

	http.HandleFunc("/api/session", users.SessionHandler)
	http.HandleFunc("/api/login", auth.LoginHandler)
	http.HandleFunc("/api/register", auth.RegisterHandler)
	http.HandleFunc("/api/logout", auth.LogoutHandler)

	http.HandleFunc("/posts", posts.PostHandler)
	http.HandleFunc("/posts/{id}", posts.GetPostHandler)
	http.HandleFunc("/chat", chat.ChatHandler)
	hub := websocket.NewHub()

	go hub.Run()

	http.HandleFunc("/ws", websocket.WSHandler(hub))

	log.Println("Server started at http://localhost:8080")

	err = http.ListenAndServe(":8080", nil)
	if err != nil {
		log.Fatal(err)
	}
}
