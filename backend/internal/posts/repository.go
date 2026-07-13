package posts

import (
	"real-time-forum/database"
	"real-time-forum/internal/models"
)

func CreatePost(post models.Post) error {
	_, err := database.DB.Exec(`INSERT INTO posts (user_id, title, content, category, created_at)
	 VALUES (?, ?, ?, ?, ?)`,
		post.UserID, post.Title, post.Content, post.Category, post.CreatedAt,
	)
	if err != nil {
		return err
	}
	return nil
}

func GetAllPosts(category string) ([]models.Post, error) {
	var posts []models.Post
	query := `SELECT 
		posts.id, 
		COALESCE(users.username, 'Anonymous'), 
		posts.user_id, 
		COALESCE(posts.title, ''), 
		COALESCE(posts.content, ''), 
		COALESCE(posts.category, 'General'), 
		COALESCE(posts.created_at, ''),
		COALESCE(SUM(CASE WHEN likes.is_like = 1 THEN 1 ELSE 0 END), 0),
		COALESCE(SUM(CASE WHEN likes.is_like = 0 THEN 1 ELSE 0 END), 0)
	FROM posts
	LEFT JOIN users ON posts.user_id = users.id
	LEFT JOIN likes ON posts.id = likes.post_id`

	var args []any
	if category != "" && category != "all" {
		query += " WHERE posts.category = ?"
		args = append(args, category)
	}
	query += `
	GROUP BY posts.id
	ORDER BY posts.created_at DESC`

	rows, err := database.DB.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var p models.Post
		err := rows.Scan(&p.ID, &p.Nickname, &p.UserID, &p.Title, &p.Content, &p.Category, &p.CreatedAt, &p.Likes, &p.Dislikes)
		if err != nil {
			return nil, err
		}
		posts = append(posts, p)
	}
	return posts, nil
}

func GetPostByID(postID int) (models.Post, error) {
	var post models.Post
	err := database.DB.QueryRow(`SELECT 
		posts.id, 
		COALESCE(users.username, 'Anonymous'), 
		posts.user_id, 
		COALESCE(posts.title, ''), 
		COALESCE(posts.content, ''), 
		COALESCE(posts.category, 'General'), 
		COALESCE(posts.created_at, ''),
		COALESCE(SUM(CASE WHEN likes.is_like = 1 THEN 1 ELSE 0 END), 0),
		COALESCE(SUM(CASE WHEN likes.is_like = 0 THEN 1 ELSE 0 END), 0)
	FROM posts 
	LEFT JOIN users ON posts.user_id = users.id 
	LEFT JOIN likes ON posts.id = likes.post_id
	WHERE posts.id = ?
	GROUP BY posts.id`,
		postID).Scan(
		&post.ID,
		&post.Nickname,
		&post.UserID,
		&post.Title,
		&post.Content,
		&post.Category,
		&post.CreatedAt,
		&post.Likes,
		&post.Dislikes,
	)
	if err != nil {
		return post, err
	}
	return post, nil
}

func DeletePost(post_id int) error {
	_, err := database.DB.Exec("DELETE FROM posts WHERE id = ?", post_id)

	if err != nil {
		return err
	}
	return nil
}
