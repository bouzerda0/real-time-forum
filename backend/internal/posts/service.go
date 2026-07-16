package posts

import (
	"fmt"
	"net/http"
	"strings"

	"real-time-forum/database"
	"real-time-forum/internal/models"
)

var categories = []string{
	"General",
	"Technology",
	"Programming",
	"Gaming",
	"Science",
	"Education",
}

func ValidatePostInput(post models.Post) bool {
	if len(strings.TrimSpace(post.Title)) == 0 || len(strings.TrimSpace(post.Title)) > 150 {
		return false
	}

	if len(post.Category) == 0 {
		return false
	}
	if !checkCategories(categories, post.Category) {
		fmt.Println("=2")
		return false
	}

	if len(strings.TrimSpace(post.Content)) == 0 || len(strings.TrimSpace(post.Content)) > 4500 {
		fmt.Println("=3")
		return false
	}
	return true
}

func checkCategories(categories []string, selected []string) bool {
	for _, sel := range selected {
		found := false

		for _, cat := range categories {
			if cat == sel {
				found = true
				break
			}
		}

		if !found {
			return false
		}
	}

	return true
}

func GetUserID(r *http.Request) (int, error) {
	// Get the cookie named session_token from the user's request
	cookie, err := r.Cookie("session_token")
	if err != nil {
		return 0, err
	}
	// take the value of the cookie
	token := cookie.Value

	var userID int
	// Query the database to find the user_id associated with the session_token
	err = database.DB.QueryRow("SELECT user_id FROM user_sessions  WHERE session_token = ?", token).Scan(&userID)
	if err != nil {
		return 0, err
	}
	return userID, nil
}
