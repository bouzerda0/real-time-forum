package users

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"time"

	"real-time-forum/database"
	"real-time-forum/internal/websocket"
)

type PublicUser struct {
	ID          int       `json:"id"`
	Username    string    `json:"username"`
	Nickname    string    `json:"nickname"`
	Online      bool      `json:"online"`
	Lastmessage time.Time `json:"lastmessage"`
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
	currentUserID, err := GetUserID(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	// Execute the SQL query to fetch users and their last message timestamps, excluding the current user.
	rows, err := database.DB.Query(
		query,
		currentUserID,
		currentUserID,
		currentUserID,
	)
	if err != nil {
		http.Error(w, "Error fetching users", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var users []PublicUser
	for rows.Next() {
		// Create a new PublicUser instance and a variable to hold the last message timestamp.
		var u PublicUser
		// MAX(m.created_at) returns TEXT (not time.Time) because it's an aggregate result.
		// Use sql.NullString to scan the raw text, then parse it into time.Time.
		var lastMessage sql.NullString

		err := rows.Scan(
			&u.ID,
			&u.Username,
			&lastMessage,
		)
		if err != nil {
			http.Error(w, "Error scanning users", http.StatusInternalServerError)
			return
		}
		// If the last message timestamp is valid (not NULL),
		// parse the SQLite datetime text format into time.Time.
		if lastMessage.Valid {
			parsedTime, parseErr := time.Parse("2006-01-02 15:04:05", lastMessage.String)
			if parseErr == nil {
				u.Lastmessage = parsedTime
			}
		}
		u.Nickname = u.Username
		u.Online = websocket.GlobalHub.IsOnline(u.ID)
		users = append(users, u)
	}

	if users == nil {
		users = []PublicUser{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(users)
}
