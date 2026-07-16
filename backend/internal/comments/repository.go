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

func GetCommentsByPostID(postID int, userID int) ([]models.Comment, error) {
	query := `
		SELECT 
			comments.id, comments.post_id, comments.user_id, COALESCE(users.nickname, 'Anonymous'), comments.content, comments.created_at,
			(SELECT COALESCE(SUM(reaction=1), 0) FROM comment_likes WHERE comment_id = comments.id) as likes_count,
			(SELECT COALESCE(SUM(reaction=0), 0) FROM comment_likes WHERE comment_id = comments.id) as dislikes_count,
			(SELECT reaction FROM comment_likes WHERE comment_id = comments.id AND user_id = ? LIMIT 1) as user_reaction
		FROM comments
		LEFT JOIN users ON comments.user_id = users.id
		WHERE comments.post_id = ?
		GROUP BY comments.id
		ORDER BY comments.created_at ASC`

	rows, err := database.DB.Query(query, userID, postID)
	if err != nil {
		return nil, fmt.Errorf("get comments for post %d: %w", postID, err)
	}
	defer rows.Close()

	var comments []models.Comment
	for rows.Next() {
		var comment models.Comment
		var userReact *int
		if err := rows.Scan(&comment.ID, &comment.PostID, &comment.UserID, &comment.Nickname, &comment.Content, &comment.CreatedAt, &comment.Likes, &comment.Dislikes, &userReact); err != nil {
			return nil, fmt.Errorf("get comments: scan row: %w", err)
		}
		comment.UserReaction = userReact
		comments = append(comments, comment)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("get comments: row iteration: %w", err)
	}

	return comments, nil
}
