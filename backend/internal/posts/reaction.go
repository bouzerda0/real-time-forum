package posts

import (
	"encoding/json"
	"net/http"

	"real-time-forum/database"
)

type ReactionRequest struct {
	PostID int `json:"post_id"`
	IsLike int `json:"is_like"` // 1 for like, 0 for dislike
}

// ReactionHandler handles POST requests to like or dislike a post.
func ReactionHandler(w http.ResponseWriter, r *http.Request) {
	userID, err := GetUserID(r)
	if err != nil || userID == 0 || r.Method != http.MethodPost {
		http.Error(w, "Unauthorized or bad method", http.StatusUnauthorized)
		return
	}
	var req ReactionRequest
	if json.NewDecoder(r.Body).Decode(&req) != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	if req.IsLike != 0 && req.IsLike != 1 {
		http.Error(w, "Invalid reaction type", http.StatusBadRequest)
		return
	}

	// Check if the post actually exists
	var postExists bool
	err = database.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM posts WHERE id=?)", req.PostID).Scan(&postExists)
	if err != nil || !postExists {
		http.Error(w, "Post not found", http.StatusNotFound)
		return
	}

	// If same reaction exists, delete it (undo). Otherwise insert/replace.
	var current int
	err = database.DB.QueryRow("SELECT is_like FROM likes WHERE user_id=? AND post_id=?", userID, req.PostID).Scan(&current)
	if err == nil && current == req.IsLike {
		database.DB.Exec("DELETE FROM likes WHERE user_id=? AND post_id=?", userID, req.PostID)
	} else {
		database.DB.Exec("INSERT OR REPLACE INTO likes (user_id, post_id, is_like) VALUES (?, ?, ?)",
			userID, req.PostID, req.IsLike)
	}

	// Count updated likes and dislikes in 1 query
	var likes, dislikes int
	database.DB.QueryRow("SELECT COALESCE(SUM(is_like=1),0), COALESCE(SUM(is_like=0),0) FROM likes WHERE post_id=?", req.PostID).Scan(&likes, &dislikes)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{"status": "success", "likes": likes, "dislikes": dislikes})
}
