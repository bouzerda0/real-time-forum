package comments

import (
	"fmt"

	"real-time-forum/database"
	"real-time-forum/internal/models"
)

// inserts a new comment into the DB.
func CreateComment(comment models.Comment) (models.Comment, error) {
	query := `INSERT INTO comments (post_id, user_id, content, created_at) VALUES (?, ?, ?, ?)`
	res, err := database.DB.Exec(query, comment.PostID, comment.UserID, comment.Content, comment.CreatedAt)
	if err != nil {
		return comment, fmt.Errorf("create comment: insert: %w", err)
	}

	id, err := res.LastInsertId()
	if err != nil {
		return comment, fmt.Errorf("last insert id: %w", err)
	}

	comment.ID = int(id)
	return comment, nil
}

func byPostID(postID, userID int) ([]models.Comment, error) {
	rows, err := database.DB.Query(`
		SELECT
			c.id, c.post_id, c.user_id,
			COALESCE(u.username, 'Anonymous'),
			c.content, c.created_at,
			(SELECT COUNT(*) FROM comment_likes WHERE comment_id = c.id AND reaction = 1),
			(SELECT COUNT(*) FROM comment_likes WHERE comment_id = c.id AND reaction = 0),
			(SELECT reaction FROM comment_likes WHERE comment_id = c.id AND user_id = ?)
		FROM comments c
		LEFT JOIN users u ON c.user_id = u.id
		WHERE c.post_id = ?
		ORDER BY c.created_at ASC
	`, userID, postID)
	if err != nil {
		return nil, fmt.Errorf("query comments: %w", err)
	}
	defer rows.Close()

	var out []models.Comment
	for rows.Next() {
		var c models.Comment
		err := rows.Scan(
			&c.ID, &c.PostID, &c.UserID, &c.Username,
			&c.Content, &c.CreatedAt,
			&c.Likes, &c.Dislikes, &c.UserReaction,
		)
		if err != nil {
			return nil, fmt.Errorf("scan comment: %w", err)
		}
		c.Nickname = c.Username
		out = append(out, c)
	}
	return out, rows.Err()
}
