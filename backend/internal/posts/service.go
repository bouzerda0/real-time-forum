package posts

import (
	"strings"

	"real-time-forum/backend/internal/models"
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

	if (!checkCategories(categories , post.Category)) {
		return  false
	}

	if len(strings.TrimSpace(post.Content)) == 0 || len(strings.TrimSpace(post.Content)) > 4500 {
		return false
	}
	return true
}

func checkCategories(arr []string, category string) bool {
	for _, v := range arr {
		if v == category {
			return true
		}
	}
	return false
}