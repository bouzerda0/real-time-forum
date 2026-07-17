package posts

import (
	"fmt"
	"strings"

	"real-time-forum/database"
	"real-time-forum/internal/models"
)

const postSelectSQL = `
	SELECT 
		posts.id, users.nickname, posts.user_id, posts.title, posts.content, posts.created_at, group_concat(categories.name),
		(SELECT COALESCE(SUM(reaction=1), 0) FROM likes WHERE post_id = posts.id) as likes_count,
		(SELECT COALESCE(SUM(reaction=0), 0) FROM likes WHERE post_id = posts.id) as dislikes_count,
		(SELECT reaction FROM likes WHERE post_id = posts.id AND user_id = ? LIMIT 1) as user_reaction,
		(SELECT COUNT(*) FROM comments WHERE post_id = posts.id) as comments_count
	FROM posts
	JOIN users ON posts.user_id = users.id
	LEFT JOIN post_categories ON posts.id = post_categories.post_id
	LEFT JOIN categories ON post_categories.category_id = categories.id`

// CreatePost inserts a new post along with its associated category links.
func CreatePost(post models.Post) error {
	result, err := database.DB.Exec(`
		INSERT INTO posts (user_id, title, content, created_at)
		VALUES (?, ?, ?, ?)`,
		post.UserID, post.Title, post.Content, post.CreatedAt,
	)
	if err != nil {
		return fmt.Errorf("insert post: %w", err)
	}

	postID, err := result.LastInsertId()
	if err != nil {
		return fmt.Errorf("get last insert id: %w", err)
	}

	for _, category := range post.Category {
		var categoryID int
		if err := database.DB.QueryRow(`SELECT id FROM categories WHERE name = ?`, category).Scan(&categoryID); err != nil {
			return fmt.Errorf("lookup category %q: %w", category, err)
		}
		if _, err := database.DB.Exec(`INSERT INTO post_categories (post_id, category_id) VALUES (?, ?)`, postID, categoryID); err != nil {
			return fmt.Errorf("link category %q: %w", category, err)
		}
	}
	return nil
}

// GetAllPosts retrieves all posts filtered by optional category and includes user reaction status.
func GetAllPosts(category string, userID int) ([]models.Post, error) {
	query, args := postSelectSQL, []any{userID}

	switch strings.ToLower(strings.TrimSpace(category)) {
	case "liked", "liked posts":
		query += `
			WHERE posts.id IN (
				SELECT post_id FROM likes WHERE user_id = ? AND reaction = 1
			)`
		args = append(args, userID)
	case "", "all":
		// No additional filtering required.
	default:
		query += `
			WHERE posts.id IN (
				SELECT post_id FROM post_categories
				JOIN categories ON post_categories.category_id = categories.id
				WHERE categories.name = ?
			)`
		args = append(args, category)
	}
	query += ` GROUP BY posts.id ORDER BY posts.created_at DESC`

	rows, err := database.DB.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var posts []models.Post
	for rows.Next() {
		post, err := scanPost(rows)
		if err != nil {
			return nil, err
		}
		posts = append(posts, post)
	}
	return posts, rows.Err()
}

// GetPostByID fetches a single post along with its categories and user reaction status.
func GetPostByID(postID int, userID int) (models.Post, error) {
	query := postSelectSQL + `
		WHERE posts.id = ?
		GROUP BY posts.id`

	return scanPost(database.DB.QueryRow(query, userID, postID))
}

// DeletePost removes a post by ID from the database.
func DeletePost(postID int) error {
	_, err := database.DB.Exec(`DELETE FROM posts WHERE id = ?`, postID)
	return err
}

type rowScanner interface {
	Scan(dest ...any) error
}

// scanPost extracts a single post model from a SQL row scanner.
func scanPost(s rowScanner) (models.Post, error) {
	var (
		post           models.Post
		categoryString *string
		userReaction   *int
	)
	err := s.Scan(
		&post.ID,
		&post.Nickname,
		&post.UserID,
		&post.Title,
		&post.Content,
		&post.CreatedAt,
		&categoryString,
		&post.Likes,
		&post.Dislikes,
		&userReaction,
		&post.CommentsCount,
	)
	if err != nil {
		return post, err
	}
	post.UserReaction = userReaction
	post.Category = parseCategories(categoryString)
	return post, nil
}

// parseCategories splits a comma-separated category string into a slice of strings.
func parseCategories(categoryString *string) []string {
	if categoryString != nil && *categoryString != "" {
		return strings.Split(*categoryString, ",")
	}
	return []string{}
}

