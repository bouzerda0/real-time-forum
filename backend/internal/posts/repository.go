package posts

import (
	"fmt"

	"real-time-forum/backend/database"
	"real-time-forum/backend/internal/models"
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

func GetAllPosts() ([]models.Post, error) {
	var posts []models.Post
	rows, err := database.DB.Query(`SELECT posts.id , users.nickname ,  posts.user_id ,posts.title , posts.content  , posts.created_at
	FROM posts
	JOIN users ON posts.user_id = users.id
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var p models.Post
		err := rows.Scan(&p.ID, &p.Nickname, &p.UserID, &p.Title, &p.Content, &p.CreatedAt)
		if err != nil {
			return nil, err
		}
		posts = append(posts, p)
	}
	return posts, nil
}

func GetPostByID(postID int) (models.Post, error) {
	var post models.Post
	err := database.DB.QueryRow(`SELECT posts.id, users.nickname ,posts.user_id, posts.title, posts.content, posts.created_at FROM posts 
	JOIN users ON posts.user_id = users.id 
	WHERE posts.id = ?`,
		postID).Scan(
		&post.ID,
		&post.Nickname,
		&post.UserID,
		&post.Title,
		&post.Content,
		&post.CreatedAt,
	)
	if err != nil {
		return post, err
	}
	return post, nil
}

func DeletePost(post_id int) error {
	_, err := database.DB.Exec(`DELET FROM posts posts.id , users.nickname , posts.user_id ,posts.title, posts.content, posts.created_at 
		JOIN users ON posts.user_id = users.id
		WHER posts.id = ?`,
		post_id)
	if err != nil {
		return err
	}
	return nil
}
