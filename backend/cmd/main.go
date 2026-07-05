package main

import (
	"log"
	"net/http"

	"real-time-forum/database"
	"real-time-forum/internal/auth"
	"real-time-forum/internal/middleware"
)

func main() {
	err := database.InitDB("../database.db")
	if err != nil {
		log.Fatal("Failed to initialize database:", err)
	}
	defer database.DB.Close()

	//  API Routes
	http.HandleFunc("/api/register", auth.RegisterHandler)
	http.HandleFunc("/api/login", auth.LoginHandler)

	// Middleware
	http.HandleFunc("/api/logout", middleware.AuthMiddleware(auth.LogoutHandler))

	// 3. Serving Frontend SPA
	fs := http.FileServer(http.Dir("../../frontend"))

	http.Handle("/", fs)

	// start server
	port := ":8080"
	log.Printf("🚀 Server is running on http://localhost%s\n", port)

	err = http.ListenAndServe(port, nil)
	if err != nil {
		log.Fatal("Server failed to start:", err)
	}
}
