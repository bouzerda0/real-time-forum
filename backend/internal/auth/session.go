package auth

import (
	"fmt"
	"net/http"
	"time"

	"real-time-forum/database"
)

//  extracts logged-in user ID from session token.
func GetUserID(r *http.Request) (int, error) {
	cookie, err := r.Cookie("session_token")
	if err != nil {
		return 0, fmt.Errorf("no cookie found")
	}

	var userID int
	var expiresAt time.Time

	err = database.DB.QueryRow("SELECT user_id, expires_at FROM user_sessions WHERE session_token = ?", cookie.Value).Scan(&userID, &expiresAt)
	if err != nil {
		return 0, fmt.Errorf("invalid session token")
	}

	if time.Now().After(expiresAt) {
		return 0, fmt.Errorf("session expired")
	}

	return userID, nil
}
