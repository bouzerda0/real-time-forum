package middleware

import (
	"context"
	"net/http"
	"time"

	"real-time-forum/database"
)

func RequireAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		cookie, err := r.Cookie("session_token")
		if err != nil || cookie.Value == "" {
			clearCookie(w)
			SendJSONError(w, "Unauthorized. Please login.", http.StatusUnauthorized)
			return
		}

		var userID int
		query := "SELECT user_id FROM user_sessions WHERE session_token = ? AND expires_at > ?"
		err = database.DB.QueryRow(query, cookie.Value, time.Now()).Scan(&userID)
		if err != nil {
			clearCookie(w)
			SendJSONError(w, "Unauthorized. Please login.", http.StatusUnauthorized)
			return
		}
		// add the user id to the request context
		ctx := context.WithValue(r.Context(), "userID", userID)
		next.ServeHTTP(w, r.WithContext(ctx))
	}
}
