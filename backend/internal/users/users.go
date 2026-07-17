package users

import (
	"encoding/json"
	"net/http"

	"real-time-forum/database"
)

type PublicUser struct {
	ID       int    `json:"id"`
	Name     string `json:"name"`
	Nickname string `json:"nickname"`
	Role     string `json:"role"`
}

func UsersHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	rows, err := database.DB.Query("SELECT id, nickname FROM users ORDER BY id ASC")
	if err != nil {
		http.Error(w, "Error fetching users", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var users []PublicUser
	for rows.Next() {
		var u PublicUser
		if err := rows.Scan(&u.ID, &u.Nickname); err != nil {
			http.Error(w, "Error scanning users", http.StatusInternalServerError)
			return
		}
		u.Name = u.Nickname
		if u.ID == 1 {
			u.Role = "Senior Member"
		} else {
			u.Role = "Member"
		}
		users = append(users, u)
	}

	if users == nil {
		users = []PublicUser{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(users)
}
