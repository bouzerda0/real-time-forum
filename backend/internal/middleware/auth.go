package middleware

import (
	"context"
	"encoding/json"
	"net/http"
	"real-time-forum/internal/users"
)

func AuthMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {

		userID, err := users.GetUserIDFromCookie(r)

		if err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			json.NewEncoder(w).Encode(map[string]string{
				"status":  "error",
				"message": "Unauthorized. Please login.",
			})
			return
		}
		ctx := context.WithValue(r.Context(), "userID", userID)
		next.ServeHTTP(w, r.WithContext(ctx))
	}
}
