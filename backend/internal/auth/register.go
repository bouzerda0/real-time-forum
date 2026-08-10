package auth

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"regexp"
	"strings"

	"real-time-forum/database"

	"golang.org/x/crypto/bcrypt"
)

var (
	usernameRegex = regexp.MustCompile(`^[a-zA-Z0-9_]{3,25}$`)
	emailRegex    = regexp.MustCompile(`^[^@\s]+@[^@\s]+\.[^@\s]+$`)
)

type RegisterReq struct {
	Username  string `json:"username"`
	Age       int    `json:"age"`
	Gender    string `json:"gender"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Email     string `json:"email"`
	Password  string `json:"password"`
}

func RegisterHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		json.NewEncoder(w).Encode(apiResponse{Status: "error", Message: "Method not allowed"})
		return
	}

	var req RegisterReq
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(apiResponse{Status: "error", Message: "Invalid request formatting"})
		return
	}

	req.Username = strings.TrimSpace(req.Username)
	req.FirstName = strings.TrimSpace(req.FirstName)
	req.LastName = strings.TrimSpace(req.LastName)
	req.Gender = strings.TrimSpace(req.Gender)
	req.Email = strings.TrimSpace(req.Email)

	if !usernameRegex.MatchString(req.Username) {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(apiResponse{Status: "error", Message: "username must contain only letters, numbers, and underscores (3-25 chars)."})
		return
	}

	if req.Age < 13 || req.Age > 120 {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(apiResponse{Status: "error", Message: "Please enter a valid age (must be at least 13 years old)."})
		return
	}

	if req.Gender != "Male" && req.Gender != "Female" {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(apiResponse{Status: "error", Message: "Gender must be either Male or Female."})
		return
	}

	if req.FirstName == "" {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(apiResponse{Status: "error", Message: "First name is required."})
		return
	}

	if req.LastName == "" {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(apiResponse{Status: "error", Message: "Last name is required."})
		return
	}

	if !emailRegex.MatchString(req.Email) {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(apiResponse{Status: "error", Message: "Please enter a valid email address."})
		return
	}

	var existingID int
	err = database.DB.QueryRow("SELECT id FROM users WHERE email = ? OR username = ?", req.Email, req.Username).Scan(&existingID)
	if err != sql.ErrNoRows {
		w.WriteHeader(http.StatusConflict)
		json.NewEncoder(w).Encode(apiResponse{Status: "error", Message: "Email or username already exists"})
		return
	}

	if strings.TrimSpace(req.Password) == "" {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(apiResponse{Status: "error", Message: "Password cannot be empty or consist only of spaces."})
		return
	}

	if req.Password != strings.TrimSpace(req.Password) {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(apiResponse{Status: "error", Message: "Password cannot start or end with a space."})
		return
	}

	if len(req.Password) > 72 {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(apiResponse{Status: "error", Message: "Password is too long! (72 characters max)"})
		return
	}
	if len(req.Password) < 8 {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(apiResponse{Status: "error", Message: "Password is too short! (8 characters minimum)"})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		log.Println("Bcrypt hash error:", err)
		json.NewEncoder(w).Encode(apiResponse{Status: "error", Message: "Error creating account, try again later"})
		return
	}

	_, err = database.DB.Exec(
		"INSERT INTO users (username, email, password, age, gender, first_name, last_name) VALUES (?, ?, ?, ?, ?, ?, ?)",
		req.Username, req.Email, string(hashedPassword), req.Age, req.Gender, req.FirstName, req.LastName,
	)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		log.Println("Database insert error:", err)
		json.NewEncoder(w).Encode(apiResponse{Status: "error", Message: "Could not create account"})
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(apiResponse{
		Status:  "success",
		Message: "Account created successfully. Please login.",
	})
}
