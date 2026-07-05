package auth

import (
	"fmt"
	"net/http"
	"time"

	"real-time-forum/database"
)

//  checks the cookie and returns the logged-in User's ID
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

	//  R
	//return the user's ID
	return userID, nil
}
