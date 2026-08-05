package users

import (
	"encoding/json"
	"net/http"

	"real-time-forum/database"
	"real-time-forum/internal/auth"
)

// GetUserID extracts logged-in user ID from session token using auth package.
func GetUserID(r *http.Request) (int, error) {
	return auth.GetUserID(r)
}

func SessionHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	userID, err := auth.GetUserID(r)
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
			"nickname":   username,
			"email":      email,
			"first_name": firstName,
			"last_name":  lastName,
		},
	})
}
