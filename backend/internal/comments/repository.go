package comments

import (
	"fmt"
	"real-time-forum/database"
	"real-time-forum/internal/models"
)

// CreateComment inserts a new comment securely into the database.
func CreateComment(comment models.Comment) (models.Comment, error) {
	query := `INSERT INTO comments (post_id, user_id, content, created_at) VALUES (?, ?, ?, ?)`
	result, err := database.DB.Exec(query, comment.PostID, comment.UserID, comment.Content, comment.CreatedAt)
	if err != nil {
		return comment, fmt.Errorf("create comment: insert: %w", err)
	}

	id, err := result.LastInsertId()
	if err != nil {
		return comment, fmt.Errorf("create comment: get last insert id: %w", err)
	}

	comment.ID = int(id)
	return comment, nil
}

func GetCommentsByPostID(postID int) ([]models.Comment, error) {
	query := `
		SELECT comments.id, comments.post_id, comments.user_id, COALESCE(users.nickname, 'Anonymous'), comments.content, comments.created_at
		FROM comments
		LEFT JOIN users ON comments.user_id = users.id
		WHERE comments.post_id = ?
		ORDER BY comments.created_at ASC`

	rows, err := database.DB.Query(query, postID)
	if err != nil {
		return nil, fmt.Errorf("get comments for post %d: %w", postID, err)
	}
	defer rows.Close()

	var comments []models.Comment
	for rows.Next() {
		var comment models.Comment
		if err := rows.Scan(&comment.ID, &comment.PostID, &comment.UserID, &comment.Nickname, &comment.Content, &comment.CreatedAt); err != nil {
			return nil, fmt.Errorf("get comments: scan row: %w", err)
		}
		comments = append(comments, comment)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("get comments: row iteration: %w", err)
	}

	return comments, nil
}
