package posts

import (
	"strings"

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
		return false
	}

	if len(strings.TrimSpace(post.Content)) == 0 || len(strings.TrimSpace(post.Content)) > 4500 {
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
