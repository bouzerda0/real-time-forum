package comments

import (
	"encoding/json"
	"net/http"

	"real-time-forum/database"
	"real-time-forum/internal/auth"
)

type reactionReq struct {
	CommentID int `json:"comment_id"`
	IsLike    int `json:"is_like"`
}

func ReactHandler(w http.ResponseWriter, r *http.Request) {
	uid, err := auth.GetUserID(r)
	if err != nil || uid <= 0 || r.Method != http.MethodPost {
		http.Error(w, "Unauthorized or bad method", http.StatusUnauthorized)
		return
	}

	var req reactionReq
	if json.NewDecoder(r.Body).Decode(&req) != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	if req.IsLike != 0 && req.IsLike != 1 {
		http.Error(w, "Invalid reaction type", http.StatusBadRequest)
		return
	}

	var exists bool
	err = database.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM comments WHERE id=?)", req.CommentID).Scan(&exists)
	if err != nil || !exists {
		http.Error(w, "Comment not found", http.StatusNotFound)
		return
	}

	var prev int = -1
	err = database.DB.QueryRow(
		"SELECT reaction FROM comment_likes WHERE user_id=? AND comment_id=?",
		uid, req.CommentID,
	).Scan(&prev)

	reaction := req.IsLike
	database.DB.Exec("DELETE FROM comment_likes WHERE user_id=? AND comment_id=?", uid, req.CommentID)

	if err == nil && prev == req.IsLike {
		reaction = -1
	} else {
		_, err = database.DB.Exec(
			"INSERT INTO comment_likes (user_id, comment_id, reaction) VALUES (?, ?, ?)",
			uid, req.CommentID, req.IsLike,
		)
		if err != nil {
			http.Error(w, "Failed to update reaction", http.StatusInternalServerError)
			return
		}
	}

	var likes, dislikes int
	database.DB.QueryRow(
		"SELECT COALESCE(SUM(reaction=1),0), COALESCE(SUM(reaction=0),0) FROM comment_likes WHERE comment_id=?",
		req.CommentID,
	).Scan(&likes, &dislikes)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"status":        "success",
		"likes":         likes,
		"dislikes":      dislikes,
		"user_reaction": reaction,
	})
}
