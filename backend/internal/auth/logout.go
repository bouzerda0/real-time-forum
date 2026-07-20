package auth

import (
	"encoding/json"
	"log"
	"net/http"

	"real-time-forum/database"
)

//  clears user session and cookie.
func LogoutHandler(w http.ResponseWriter, r *http.Request) {

	w.Header().Set("Content-Type", "application/json")

	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		json.NewEncoder(w).Encode(APIResponse{Status: "error", Message: "Method not allowed"})
		return
	}

	cookie, err := r.Cookie("session_token")

	// Delete session from database
	if err == nil && cookie.Value != "" {

		query := "DELETE FROM user_sessions WHERE session_token = ?"
		_, err := database.DB.Exec(query, cookie.Value)

		if err != nil {
			log.Println("Error deleting session from DB:", err)
		}
	}

	// Expire session cookie immediately
	deletedCookie := &http.Cookie{
		Name:     "session_token",
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
	}

	http.SetCookie(w, deletedCookie)

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(APIResponse{
		Status:  "success",
		Message: "Logged out successfully",
	})
}
