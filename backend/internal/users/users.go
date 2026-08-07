package users

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"time"

	"real-time-forum/database"
	"real-time-forum/internal/auth"
	"real-time-forum/internal/websocket"
)

type user struct {
	ID          int       `json:"id"`
	Username    string    `json:"username"`
	Nickname    string    `json:"nickname"`
	Online      bool      `json:"online"`
	LastMessage time.Time `json:"lastmessage"`
}

const query = `
SELECT u.id, u.username, MAX(m.created_at) AS last_message FROM users u
LEFT JOIN messages m
ON ((m.sender_id = ? AND m.receiver_id = u.id) OR (m.sender_id = u.id AND m.receiver_id = ?))
WHERE u.id != ?
GROUP BY u.id, u.username
ORDER BY last_message DESC;`

func UsersHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	userID, err := auth.GetUserID(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	rows, err := database.DB.Query(query, userID, userID, userID)
	if err != nil {
		http.Error(w, "Error fetching users", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var list []user
	for rows.Next() {
		var u user
		var lastMsg sql.NullString

		if err := rows.Scan(&u.ID, &u.Username, &lastMsg); err != nil {
			http.Error(w, "Error scanning users", http.StatusInternalServerError)
			return
		}

		if lastMsg.Valid {
			if t, err := time.Parse("2006-01-02 15:04:05", lastMsg.String); err == nil {
				u.LastMessage = t
			}
		}

		u.Nickname = u.Username
		u.Online = websocket.GlobalHub.IsOnline(u.ID)
		list = append(list, u)
	}

	if list == nil {
		list = []user{}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(list)
}
