package posts

import (
	"fmt"
	"strings"

	"real-time-forum/database"
	"real-time-forum/internal/models"
)

func CreatePost(post models.Post) error {
	result, err := database.DB.Exec(`
        INSERT INTO posts (user_id, title, content, created_at)
        VALUES (?, ?, ?, ?)`,
		post.UserID, post.Title, post.Content, post.CreatedAt,
	)
	if err != nil {
		fmt.Println("insert post error:", err)
		return err
	}
	postID, err := result.LastInsertId()
	if err != nil {
		fmt.Println("last insert id error:", err)
		return err
	}

	for _, category := range post.Category {
		var categoryID int
		err = database.DB.QueryRow(`SELECT id FROM categories WHERE name = ?`, category).Scan(&categoryID)
		if err != nil {
			fmt.Println("category lookup error:", err, "category:", category)
			return err
		}
		_, err = database.DB.Exec(`INSERT INTO post_categories (post_id, category_id) VALUES (?, ?)`, postID, categoryID)
		if err != nil {
			fmt.Println("insert post_category error:", err)
			return err
		}
	}
	return nil
}

// MERGE: Added category filter logic
func GetAllPosts(category string, userID int) ([]models.Post, error) {
	var posts []models.Post
	query := `SELECT posts.id, users.nickname, posts.user_id, posts.title, posts.content, posts.created_at, group_concat(categories.name),
		(SELECT COALESCE(SUM(reaction=1), 0) FROM likes WHERE post_id = posts.id) as likes_count,
		(SELECT COALESCE(SUM(reaction=0), 0) FROM likes WHERE post_id = posts.id) as dislikes_count,
		(SELECT reaction FROM likes WHERE post_id = posts.id AND user_id = ? LIMIT 1) as user_reaction
	FROM posts
	JOIN users ON posts.user_id = users.id
	LEFT JOIN post_categories ON posts.id = post_categories.post_id
	LEFT JOIN categories ON post_categories.category_id = categories.id`

	var args []any
	args = append(args, userID)

	if category != "" && category != "all" {
		// MERGE: Added category filter logic
		query += ` WHERE posts.id IN (
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
	for rows.Next() {
		var p models.Post
		var catsString *string
		var userReact *int
		err := rows.Scan(&p.ID, &p.Nickname, &p.UserID, &p.Title, &p.Content, &p.CreatedAt, &catsString, &p.Likes, &p.Dislikes, &userReact)
		if err != nil {
			return nil, err
		}
		p.UserReaction = userReact
		if catsString != nil && *catsString != "" {
			// MERGE: Added category filter logic
			p.Category = strings.Split(*catsString, ",")
		} else {
			// MERGE: Added category filter logic
			p.Category = []string{}
		}
		posts = append(posts, p)
	}
	return posts, nil
}

func GetPostByID(postID int, userID int) (models.Post, error) {
	var post models.Post
	var catsString *string
	var userReact *int
	err := database.DB.QueryRow(`SELECT posts.id, users.nickname, posts.user_id, posts.title, posts.content, posts.created_at, group_concat(categories.name),
		(SELECT COALESCE(SUM(reaction=1), 0) FROM likes WHERE post_id = posts.id),
		(SELECT COALESCE(SUM(reaction=0), 0) FROM likes WHERE post_id = posts.id),
		(SELECT reaction FROM likes WHERE post_id = posts.id AND user_id = ? LIMIT 1)
	FROM posts 
	JOIN users ON posts.user_id = users.id 
	LEFT JOIN post_categories ON posts.id = post_categories.post_id
	LEFT JOIN categories ON post_categories.category_id = categories.id
	WHERE posts.id = ?
	GROUP BY posts.id`,
		userID, postID).Scan(
		&post.ID,
		&post.Nickname,
		&post.UserID,
		&post.Title,
		&post.Content,
		&post.CreatedAt,
		&catsString,
		&post.Likes,
		&post.Dislikes,
		&userReact,
	)
	if err != nil {
		return post, err
	}
	post.UserReaction = userReact
	if catsString != nil && *catsString != "" {
		// MERGE: Added category filter logic
		post.Category = strings.Split(*catsString, ",")
	} else {
		// MERGE: Added category filter logic
		post.Category = []string{}
	}
	return post, nil
}

func DeletePost(postID int) error {
	_, err := database.DB.Exec(`DELETE FROM posts WHERE id = ?`, postID)
	return err
}

// CreateComment inserts a new comment into the comments table securely using placeholders.
func CreateComment(comment models.Comment) error {
	query := `INSERT INTO comments (post_id, user_id, content, created_at) VALUES (?, ?, ?, ?)`
	_, err := database.DB.Exec(query, comment.PostID, comment.UserID, comment.Content, comment.CreatedAt)
	return err
}

// GetCommentsByPostID fetches all comments for a post and joins users to get the author nickname.
func GetCommentsByPostID(postID int) ([]models.Comment, error) {
	query := `
		SELECT comments.id, comments.post_id, comments.user_id, users.nickname, comments.content, comments.created_at
		FROM comments
		JOIN users ON comments.user_id = users.id
		WHERE comments.post_id = ?
		ORDER BY comments.created_at ASC`

	rows, err := database.DB.Query(query, postID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var comments []models.Comment
	for rows.Next() {
		var c models.Comment
		if err := rows.Scan(&c.ID, &c.PostID, &c.UserID, &c.Nickname, &c.Content, &c.CreatedAt); err != nil {
			return nil, err
		}
		comments = append(comments, c)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return comments, nil
}
