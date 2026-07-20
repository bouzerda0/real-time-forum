package comments

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"

	"real-time-forum/database"
	"real-time-forum/internal/models"
	"real-time-forum/internal/posts"
)

func CommentsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	switch r.Method {
	case http.MethodGet:
		postIDString := r.URL.Query().Get("post_id")
		postID, err := strconv.Atoi(postIDString)
		if err != nil || postID <= 0 {
			http.Error(w, `{"error":"Invalid post_id parameter"}`, http.StatusBadRequest)
			return
		}

		userID, _ := posts.GetUserID(r)
		postComments, err := GetCommentsByPostID(postID, userID)
		if err != nil {
			http.Error(w, `{"error":"Failed to fetch comments"}`, http.StatusInternalServerError)
			return
		}

		if postComments == nil {
			postComments = []models.Comment{}
		}

		json.NewEncoder(w).Encode(postComments)

	case http.MethodPost:
		userID, err := posts.GetUserID(r)
		if err != nil || userID <= 0 {
			http.Error(w, `{"error":"Unauthorized. Please login to comment."}`, http.StatusUnauthorized)
			return
		}

		var newCommentInput models.Comment
		if err := json.NewDecoder(r.Body).Decode(&newCommentInput); err != nil {
			http.Error(w, `{"error":"Invalid JSON payload"}`, http.StatusBadRequest)
			return
		}
		defer r.Body.Close()

		if newCommentInput.PostID <= 0 || strings.TrimSpace(newCommentInput.Content) == "" {
			http.Error(w, `{"error":"Post ID and content are required"}`, http.StatusBadRequest)
			return
		}

		newCommentInput.UserID = userID

		var authorUsername string
		database.DB.QueryRow("SELECT username FROM users WHERE id = ?", userID).Scan(&authorUsername)
		if authorUsername == "" {
			authorUsername = "User"
		}
		newCommentInput.Username = authorUsername
		newCommentInput.Nickname = authorUsername
		newCommentInput.CreatedAt = time.Now()

		savedComment, err := CreateComment(newCommentInput)
		if err != nil {
			http.Error(w, `{"error":"Failed to save comment"}`, http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(savedComment)

	default:
		http.Error(w, `{"error":"Method not allowed"}`, http.StatusMethodNotAllowed)
	}
}
