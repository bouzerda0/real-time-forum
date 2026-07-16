package posts

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"real-time-forum/database"
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
		json.NewEncoder(w).Encode(post) // أو غير object صغير زعما {"message": "post created"}

	case http.MethodGet:
		userID, _ := GetUserID(r)
		// MERGE: Added category filter logic
		category := r.URL.Query().Get("category")
		// MERGE: Added category filter logic
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

func CommentsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	switch r.Method {
	case http.MethodGet:
		postIDStr := r.URL.Query().Get("post_id")
		postID, err := strconv.Atoi(postIDStr)
		if err != nil || postID <= 0 {
			http.Error(w, `{"error":"Invalid post_id parameter"}`, http.StatusBadRequest)
			return
		}

		comments, err := GetCommentsByPostID(postID)
		if err != nil {
			http.Error(w, `{"error":"Failed to fetch comments"}`, http.StatusInternalServerError)
			return
		}

		if comments == nil {
			comments = []models.Comment{}
		}

		json.NewEncoder(w).Encode(comments)

	case http.MethodPost:
		userID, err := GetUserID(r)
		if err != nil || userID <= 0 {
			http.Error(w, `{"error":"Unauthorized. Please login to comment."}`, http.StatusUnauthorized)
			return
		}

		var comment models.Comment
		if err := json.NewDecoder(r.Body).Decode(&comment); err != nil {
			http.Error(w, `{"error":"Invalid JSON payload"}`, http.StatusBadRequest)
			return
		}
		defer r.Body.Close()

		if comment.PostID <= 0 || strings.TrimSpace(comment.Content) == "" {
			http.Error(w, `{"error":"Post ID and content are required"}`, http.StatusBadRequest)
			return
		}

		comment.UserID = userID
		var nickname string
		database.DB.QueryRow("SELECT nickname FROM users WHERE id = ?", userID).Scan(&nickname)
		if nickname == "" {
			nickname = "User"
		}
		comment.Nickname = nickname
		comment.CreatedAt = time.Now()

		createdComment, err := CreateComment(comment)
		if err != nil {
			http.Error(w, `{"error":"Failed to save comment"}`, http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(createdComment)

	default:
		http.Error(w, `{"error":"Method not allowed"}`, http.StatusMethodNotAllowed)
	}
}
