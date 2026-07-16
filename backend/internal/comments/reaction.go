package comments

import (
	"encoding/json"
	"net/http"

	"real-time-forum/database"
	"real-time-forum/internal/posts"
)

type ReactionRequest struct {
	CommentID int `json:"comment_id"`
	IsLike    int `json:"is_like"` // 1 for like, 0 for dislike
}

// ReactionHandler handles POST requests to like or dislike a comment securely and atomically.
func ReactionHandler(w http.ResponseWriter, r *http.Request) {
	userID, err := posts.GetUserID(r)
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

	// Check if the comment actually exists
	var commentExists bool
	err = database.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM comments WHERE id=?)", req.CommentID).Scan(&commentExists)
	if err != nil || !commentExists {
		http.Error(w, "Comment not found", http.StatusNotFound)
		return
	}

	// Begin atomic transaction to prevent concurrent race conditions or double likes
	tx, err := database.DB.Begin()
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	// Check existing reaction and clean up any duplicates
	rows, err := tx.Query("SELECT reaction FROM comment_likes WHERE user_id=? AND comment_id=?", userID, req.CommentID)
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
		// User clicked the same reaction again -> Undo (remove reaction completely)
		_, err = tx.Exec("DELETE FROM comment_likes WHERE user_id=? AND comment_id=?", userID, req.CommentID)
		userReaction = -1
	} else {
		// User switched reaction or first time reacting -> Clean all duplicate/old entries and insert exactly 1 row
		_, err = tx.Exec("DELETE FROM comment_likes WHERE user_id=? AND comment_id=?", userID, req.CommentID)
		if err == nil {
			_, err = tx.Exec("INSERT INTO comment_likes (user_id, comment_id, reaction) VALUES (?, ?, ?)", userID, req.CommentID, req.IsLike)
		}
		userReaction = req.IsLike
	}
	if err != nil {
		http.Error(w, "Failed to update reaction", http.StatusInternalServerError)
		return
	}

	// Count updated likes and dislikes inside the transaction
	var likes, dislikes int
	err = tx.QueryRow("SELECT COALESCE(SUM(reaction=1),0), COALESCE(SUM(reaction=0),0) FROM comment_likes WHERE comment_id=?", req.CommentID).Scan(&likes, &dislikes)
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
