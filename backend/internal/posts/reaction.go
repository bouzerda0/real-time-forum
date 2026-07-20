package posts

import (
	"encoding/json"
	"net/http"

	"real-time-forum/database"
)

type ReactionRequest struct {
	PostID int `json:"post_id"`
	IsLike int `json:"is_like"` // 1 = like, 0 = dislike
}

// ReactionHandler handles post likes and dislikes atomically.
func ReactionHandler(w http.ResponseWriter, r *http.Request) {
	userID, err := GetUserID(r)
	if err != nil || userID <= 0 || r.Method != http.MethodPost {
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

	// Verify post exists
	var postExists bool
	err = database.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM posts WHERE id=?)", req.PostID).Scan(&postExists)
	if err != nil || !postExists {
		http.Error(w, "Post not found", http.StatusNotFound)
		return
	}

	// Begin atomic transaction
	tx, err := database.DB.Begin()
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	// Check existing reaction
	rows, err := tx.Query("SELECT reaction FROM likes WHERE user_id=? AND post_id=?", userID, req.PostID)
	var existingCount int
	var existingReaction int = -1
	if err == nil {
		for rows.Next() {
			var r int
			if rows.Scan(&r) == nil {
				existingCount++
				existingReaction = r
			}
		}
		rows.Close()
	}

	userReaction := -1
	if existingCount > 0 && existingReaction == req.IsLike {
		// Undo reaction
		_, err = tx.Exec("DELETE FROM likes WHERE user_id=? AND post_id=?", userID, req.PostID)
		userReaction = -1
	} else {
		// Insert or switch reaction
		_, err = tx.Exec("DELETE FROM likes WHERE user_id=? AND post_id=?", userID, req.PostID)
		if err == nil {
			_, err = tx.Exec("INSERT INTO likes (user_id, post_id, reaction) VALUES (?, ?, ?)", userID, req.PostID, req.IsLike)
		}
		userReaction = req.IsLike
	}
	if err != nil {
		http.Error(w, "Failed to update reaction", http.StatusInternalServerError)
		return
	}

	// Recalculate reaction counts
	var likes, dislikes int
	err = tx.QueryRow("SELECT COALESCE(SUM(reaction=1),0), COALESCE(SUM(reaction=0),0) FROM likes WHERE post_id=?", req.PostID).Scan(&likes, &dislikes)
	if err != nil {
		http.Error(w, "Failed to count reactions", http.StatusInternalServerError)
		return
	}

	if err = tx.Commit(); err != nil {
		http.Error(w, "Failed to commit transaction", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"status":        "success",
		"likes":         likes,
		"dislikes":      dislikes,
		"user_reaction": userReaction,
	})
}
