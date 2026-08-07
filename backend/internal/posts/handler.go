package posts

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"real-time-forum/internal/auth"
	"real-time-forum/internal/models"
)

func PostHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodPost:
		userID, err := auth.GetUserID(r)
		if err != nil {
			w.WriteHeader(http.StatusUnauthorized)
			json.NewEncoder(w).Encode(map[string]string{"error": "Unauthorized"})
			return
		}

		var post models.Post
		if err := json.NewDecoder(r.Body).Decode(&post); err != nil {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "Bad Request"})
			return
		}
		defer r.Body.Close()

		if !ValidatePostInput(post) {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "Invalid Input"})
			return
		}

		post.UserID = userID
		post.CreatedAt = time.Now()

		if err := CreatePost(post); err != nil {
			fmt.Println("CreatePost error:", err)
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "Internal Server Error"})
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(post)

	case http.MethodGet:
		userID, _ := auth.GetUserID(r)
		category := r.URL.Query().Get("category")
		// Filter by category if specified
		posts, err := GetAllPosts(category, userID)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "Internal Server Error"})
			return
		}
		if posts == nil {
			posts = []models.Post{}
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		err = json.NewEncoder(w).Encode(posts)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "Internal Server Error"})
			return
		}

	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
		json.NewEncoder(w).Encode(map[string]string{"error": "Method Not Allowed"})
	}
}

func GetPostHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		json.NewEncoder(w).Encode(map[string]string{"error": "Method Not Allowed"})
		return
	}
	idstring := r.PathValue("id")
	post_id, err := strconv.Atoi(idstring)
	if err != nil {
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": "Post not found or invalid ID"})
		return
	}
	userID, _ := auth.GetUserID(r)
	post, err := GetPostByID(post_id, userID)
	if err != nil {
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": "Post not found"})
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	err = json.NewEncoder(w).Encode(post)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Internal Server Error"})
		return
	}
}
