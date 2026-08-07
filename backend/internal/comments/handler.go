package comments

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"

	"real-time-forum/database"
	"real-time-forum/internal/auth"
	"real-time-forum/internal/models"
)

func CommentsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	switch r.Method {
	case http.MethodGet:
		uid, err := auth.GetUserID(r)
		if err != nil || uid <= 0 {
			http.Error(w, `{"error":"Unauthorized"}`, http.StatusUnauthorized)
			return
		}

		postID, err := strconv.Atoi(r.URL.Query().Get("post_id"))
		if err != nil || postID <= 0 {
			http.Error(w, `{"error":"Invalid post_id"}`, http.StatusBadRequest)
			return
		}

		list, err := byPostID(postID, uid)
		if err != nil {
			http.Error(w, `{"error":"Failed to fetch comments"}`, http.StatusInternalServerError)
			return
		}
		if list == nil {
			list = []models.Comment{}
		}

		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(list)

	case http.MethodPost:
		uid, err := auth.GetUserID(r)
		if err != nil || uid <= 0 {
			http.Error(w, `{"error":"Unauthorized"}`, http.StatusUnauthorized)
			return
		}

		var c models.Comment
		if err := json.NewDecoder(r.Body).Decode(&c); err != nil {
			http.Error(w, `{"error":"Invalid JSON"}`, http.StatusBadRequest)
			return
		}
		defer r.Body.Close()

		if c.PostID <= 0 || strings.TrimSpace(c.Content) == "" {
			http.Error(w, `{"error":"Post ID and content are required"}`, http.StatusBadRequest)
			return
		}

		var exists bool
		err = database.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM posts WHERE id=?)", c.PostID).Scan(&exists)
		if err != nil || !exists {
			http.Error(w, `{"error":"Post not found"}`, http.StatusNotFound)
			return
		}

		c.UserID = uid
		var name string
		database.DB.QueryRow("SELECT username FROM users WHERE id = ?", uid).Scan(&name)
		if name == "" {
			name = "User"
		}
		c.Username = name
		c.Nickname = name
		c.CreatedAt = time.Now()

		saved, err := CreateComment(c)
		if err != nil {
			http.Error(w, `{"error":"Failed to save comment"}`, http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(saved)

	default:
		http.Error(w, `{"error":"Method not allowed"}`, http.StatusMethodNotAllowed)
	}
}
