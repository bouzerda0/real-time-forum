package auth

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"regexp"
	"strings"
	"time"

	"real-time-forum/database"

	"golang.org/x/crypto/bcrypt"
)

var (
	usernameRegex = regexp.MustCompile(`^[a-zA-Z0-9_]{4,20}$`)
	emailRegex    = regexp.MustCompile(`^[^@\s]+@[^@\s]+\.[^@\s]+$`)
)

type RegisterRequest struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

func RegisterHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	cookie, err := r.Cookie("session_token")
	if err == nil && cookie != nil && cookie.Value != "" {
		var dbToken string
		var expiresAt time.Time
		errDB := database.DB.QueryRow("SELECT session_token, expires_at FROM user_sessions WHERE session_token = ?", cookie.Value).Scan(&dbToken, &expiresAt)

		if errDB == nil {
			if time.Now().Before(expiresAt) {
				w.WriteHeader(http.StatusOK)
				json.NewEncoder(w).Encode(APIResponse{Status: "error", Message: "You are already logged in"})
				return
			} else {
				database.DB.Exec("DELETE FROM user_sessions WHERE session_token = ?", cookie.Value)
			}
		}
	}

	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		json.NewEncoder(w).Encode(APIResponse{Status: "error", Message: "Method not allowed"})
		return
	}

	var req RegisterRequest
	err = json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(APIResponse{Status: "error", Message: "Invalid request formatting"})
		return
	}

	if !usernameRegex.MatchString(req.Username) {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(APIResponse{Status: "error", Message: "Username must contain only letters and numbers (4-20 chars)."})
		return
	}

	if !emailRegex.MatchString(req.Email) {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(APIResponse{Status: "error", Message: "Please enter a valid email address."})
		return
	}

	var existingID int
	err = database.DB.QueryRow("SELECT id FROM users WHERE email = ? OR username = ?", req.Email, req.Username).Scan(&existingID)
	if err != sql.ErrNoRows {
		w.WriteHeader(http.StatusConflict)
		json.NewEncoder(w).Encode(APIResponse{Status: "error", Message: "Email or Username already exists"})
		return
	}

	if strings.TrimSpace(req.Password) == "" {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(APIResponse{Status: "error", Message: "Password cannot be empty or consist only of spaces."})
		return
	}

	if req.Password != strings.TrimSpace(req.Password) {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(APIResponse{Status: "error", Message: "Password cannot start or end with a space."})
		return
	}

	if len(req.Password) > 72 {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(APIResponse{Status: "error", Message: "Password is too long! (72 characters max)"})
		return
	}
	if len(req.Password) < 8 {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(APIResponse{Status: "error", Message: "Password is too short! (8 characters minimum)"})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		log.Println("Bcrypt hash error:", err)
		json.NewEncoder(w).Encode(APIResponse{Status: "error", Message: "Error creating account, try again later"})
		return
	}

	_, err = database.DB.Exec("INSERT INTO users (username, email, password) VALUES (?, ?, ?)", req.Username, req.Email, string(hashedPassword))
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		log.Println("Database insert error:", err)
		json.NewEncoder(w).Encode(APIResponse{Status: "error", Message: "Could not create account"})
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(APIResponse{
		Status:  "success",
		Message: "Account created successfully. Please login.",
	})
}
