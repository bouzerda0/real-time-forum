package auth

import (
	"crypto/rand"
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"log"
	"net/http"
	"time"

	"real-time-forum/database"

	"golang.org/x/crypto/bcrypt"
)

const (
	SessionDuration = 24 * time.Hour
)

type LoginRequest struct {
	Identifier string `json:"identify"`
	Password   string `json:"password"`
}

type APIResponse struct {
	Status  string `json:"status"`
	Message string `json:"message"`
}

// creates a random secret code
func generateSessionToken() string {
	b := make([]byte, 32)
	rand.Read(b)
	return base64.URLEncoding.EncodeToString(b)
}

func LoginHandler(w http.ResponseWriter, r *http.Request) {

	w.Header().Set("Content-Type", "application/json")

	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		json.NewEncoder(w).Encode(APIResponse{Status: "error", Message: "Method not allowed"})
		return
	}

	cookie, err := r.Cookie("session_token")

	if err == nil && cookie != nil && cookie.Value != "" {
		var dbToken string
		var expiresAt time.Time
		errDB := database.DB.QueryRow("SELECT session_token, expires_at FROM user_sessions WHERE session_token = ?", cookie.Value).Scan(&dbToken, &expiresAt)
		// if we find cookie
		if errDB == nil {
			if time.Now().Before(expiresAt) {
				http.Redirect(w, r, "/", http.StatusSeeOther)
				return
			} else {
				database.DB.Exec("DELETE FROM user_sessions WHERE session_token = ?", cookie.Value)
			}
		}
	}

	var req LoginRequest
	err = json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(APIResponse{Status: "error", Message: "Invalid request formatting"})
		return
	}

	var dbID int
	var dbNickname, dbEmail, dbFirstName, dbLastName string
	var dbPasswordHash string

	// Check if this user exists in the database by email or nickname
	err = database.DB.QueryRow(
		"SELECT id, nickname, email, COALESCE(first_name, ''), COALESCE(last_name, ''), password FROM users WHERE email = ? OR nickname = ?",
		req.Identifier, req.Identifier,
	).Scan(&dbID, &dbNickname, &dbEmail, &dbFirstName, &dbLastName, &dbPasswordHash)
	if err != nil {
		if err == sql.ErrNoRows {
			w.WriteHeader(http.StatusUnauthorized)
			json.NewEncoder(w).Encode(APIResponse{Status: "error", Message: "Invalid nickname/email or password."})
			return
		}
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(APIResponse{Status: "error", Message: "Server error"})
		return
	}

	// verify password
	err = bcrypt.CompareHashAndPassword([]byte(dbPasswordHash), []byte(req.Password))
	if err != nil {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(APIResponse{Status: "error", Message: "Invalid nickname/email or password."})
		return
	}

	// delete old sessions
	deleteQuery := "DELETE FROM user_sessions WHERE user_id = ?"
	_, err = database.DB.Exec(deleteQuery, dbID)
	if err != nil {
		log.Println("Error deleting old sessions:", err)
	}

	// Create a Session Token
	sessionToken := generateSessionToken()
	expirationTime := time.Now().Add(SessionDuration)
	// Save the token in the 'user_sessions' table in our Database
	_, err = database.DB.Exec("INSERT INTO user_sessions (user_id, session_token, expires_at) VALUES (?, ?, ?)", dbID, sessionToken, expirationTime)
	if err != nil {
		log.Println("Error saving session to DB:", err)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(APIResponse{Status: "error", Message: "Error creating session, try again later"})
		return
	}

	// Create a cookie
	newCookie := http.Cookie{
		Name:     "session_token",
		Value:    sessionToken,
		Expires:  expirationTime,
		HttpOnly: true,
		Path:     "/",
	}
	http.SetCookie(w, &newCookie)

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":  "success",
		"message": "Logged in successfully",
		"user": map[string]interface{}{
			"id":         dbID,
			"nickname":   dbNickname,
			"email":      dbEmail,
			"first_name": dbFirstName,
			"last_name":  dbLastName,
		},
	})
}
