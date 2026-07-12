package auth

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"real-time-forum/database"
)

// checks the cookie and returns the logged-in User's ID
func GetUserIDFromCookie(r *http.Request) (int, error) {
	//  does the user have a session cookie
	cookie, err := r.Cookie("session_token")
	if err != nil {
		return 0, fmt.Errorf("no cookie found")
	}

	var userID int
	var expiresAt time.Time

	//  does this token exist in our database
	err = database.DB.QueryRow("SELECT user_id, expires_at FROM user_sessions WHERE session_token = ?", cookie.Value).Scan(&userID, &expiresAt)
	if err != nil {
		return 0, fmt.Errorf("invalid session token")
	}

	//  is the session expired
	if time.Now().After(expiresAt) {
		return 0, fmt.Errorf("session expired")
	}

	//return the user's ID
	return userID, nil
}

func SessionHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	userID, err := GetUserIDFromCookie(r)
	if err != nil {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"status":  "error",
			"message": "Unauthorized. Please login.",
		})
		return
	}

	var username, email, firstName, lastName string
	err = database.DB.QueryRow(
		"SELECT username, email, COALESCE(first_name, ''), COALESCE(last_name, '') FROM users WHERE id = ?",
		userID,
	).Scan(&username, &email, &firstName, &lastName)
	if err != nil {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"status":  "error",
			"message": "User not found.",
		})
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status": "success",
		"user": map[string]interface{}{
			"id":         userID,
			"username":   username,
			"email":      email,
			"first_name": firstName,
			"last_name":  lastName,
		},
	})
}
