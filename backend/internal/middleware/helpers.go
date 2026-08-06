package middleware

import (
	"encoding/json"
	"net/http"
)

func clearCookie(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:     "session_token",
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
	})
}

// SendJSONError writes a JSON error response with the correct HTTP status code.
// Always call this instead of manually writing status + encoding separately —
// it guarantees WriteHeader is called BEFORE the body is written.
func SendJSONError(w http.ResponseWriter, message string, statusCode int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(map[string]string{
		"status":  "error",
		"message": message,
	})
}
