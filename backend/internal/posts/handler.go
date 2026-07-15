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
	// userid, err := GetUserID(r)
	// if err != nil {
	// 	http.Error(w, http.StatusText(500), http.StatusInternalServerError)
	// 	return
	// }
	if r.Method == http.MethodPost {
		

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

		post.UserID = 1
		post.CreatedAt = time.Now()

		if err := CreatePost(post); err != nil {
			fmt.Println("CreatePost error:", err)
			http.Error(w, http.StatusText(500), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(post) // أو غير object صغير زعما {"message": "post created"}
	} else if r.Method == http.MethodGet {
		// MERGE: Added category filter logic
		category := r.URL.Query().Get("category")
		// MERGE: Added category filter logic
		posts, err := GetAllPosts(category)
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
	} else {
		http.Error(w, http.StatusText(405), http.StatusMethodNotAllowed)
		return
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
	post, err := GetPostByID(post_id)
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