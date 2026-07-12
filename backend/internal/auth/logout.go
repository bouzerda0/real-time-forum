package auth

import (
	"encoding/json"
	"log"
	"net/http"

	"real-time-forum/database"
)

// LogoutHandler handles the user logout process
func LogoutHandler(w http.ResponseWriter, r *http.Request) {

	w.Header().Set("Content-Type", "application/json")

	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		json.NewEncoder(w).Encode(APIResponse{Status: "error", Message: "Method not allowed"})
		return
	}

	//  Get the session cookie from the user's browser
	cookie, err := r.Cookie("session_token")

	//  If the cookie exists, delete the session from the database
	if err == nil && cookie.Value != "" {

		query := "DELETE FROM user_sessions WHERE session_token = ?"
		_, err := database.DB.Exec(query, cookie.Value)

		if err != nil {
			log.Println("Error deleting session from DB:", err)
		}
	}

	// Create a "dead" cookie to delete the old one in the browser
	deletedCookie := &http.Cookie{
		Name:     "session_token",
		Value:    "",   // Empty value
		Path:     "/",  // Must match the original cookie path
		MaxAge:   -1,   // -1 tells the browser to delete it immediately!
		HttpOnly: true, // Keeps it secure from JavaScript
	}

	// 4. Send this "dead" cookie to the user's browser
	http.SetCookie(w, deletedCookie)

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(APIResponse{
		Status:  "success",
		Message: "Logged out successfully",
	})
}
