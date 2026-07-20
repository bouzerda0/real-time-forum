package posts

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"real-time-forum/internal/models"
)

func PostHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodPost:
		userID, err := GetUserID(r)
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		var post models.Post
		if err := json.NewDecoder(r.Body).Decode(&post); err != nil {
			http.Error(w, http.StatusText(400), http.StatusBadRequest)
			return
		}
		defer r.Body.Close()

		if !ValidatePostInput(post) {
			http.Error(w, http.StatusText(400), http.StatusBadRequest)
			return
		}

		post.UserID = userID
		post.CreatedAt = time.Now()

		if err := CreatePost(post); err != nil {
			fmt.Println("CreatePost error:", err)
			http.Error(w, http.StatusText(500), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(post)

	case http.MethodGet:
		userID, _ := GetUserID(r)
		category := r.URL.Query().Get("category")
		// Filter by category if specified
		posts, err := GetAllPosts(category, userID)
		if err != nil {

			http.Error(w, http.StatusText(500), http.StatusInternalServerError)
			return
		}
		if posts == nil {
			posts = []models.Post{}
		}
		w.Header().Set("Content-Type", "application/json")

		err = json.NewEncoder(w).Encode(posts)
		if err != nil {
			http.Error(w, http.StatusText(500), http.StatusInternalServerError)
			return
		}

	default:
		http.Error(w, http.StatusText(405), http.StatusMethodNotAllowed)
	}
}

func GetPostHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, http.StatusText(405), http.StatusMethodNotAllowed)
		return
	}
	idstring := r.PathValue("id")
	post_id, err := strconv.Atoi(idstring)
	if err != nil {
		http.Error(w, http.StatusText(400), http.StatusBadRequest)
		return
	}
	userID, _ := GetUserID(r)
	post, err := GetPostByID(post_id, userID)
	if err != nil {
		http.Error(w, http.StatusText(404), http.StatusNotFound)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	err = json.NewEncoder(w).Encode(post)
	if err != nil {
		http.Error(w, http.StatusText(405), http.StatusMethodNotAllowed)
		return
	}
}
