package main

import (
	"fmt"
	"log"
	"net/http"

	"real-time-forum/backend/database"
	"real-time-forum/backend/internal/posts"
)

func main() {
	database.InitDB()

	fs := http.FileServer(http.Dir("./web/static"))
	http.Handle("/static/", http.StripPrefix("/static/", fs))
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprint(w, "home page")
	})
	http.HandleFunc("/posts" ,posts.PostHandler)
	http.HandleFunc("/posts/{id}" , posts.GetPostHandler)
	log.Println("Starting server on http://localhost:8080")

	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}
