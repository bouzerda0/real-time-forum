package posts

import (
	"real-time-forum/backend/database"
	"real-time-forum/backend/internal/models"
)

func CreatePost(post models.Post) error {
	_, err := database.DB.Exec(`INSERT INTO posts (posts.user_id , posts.title , posts.content , posts.category , posts.created_at)
	 VALUES (?, ?, ? , ? ,?)`,
		post.UserID, post.Title, post.Content, post.Category, post.CreatedAt,
	)
	if err != nil {
		return err
	}
	return nil
}

func GetAllPosts() ([]models.Post, error) {
	var posts []models.Post
	rows, err := database.DB.Query(`SELECT posts.id , users.nickname ,  posts.user_id ,posts.title , posts.content , posts.category , posts.created_at
	FROM posts
	JOIN users ON posts.user_id = users.id
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var p models.Post
		err := rows.Scan(&p.ID,&p.Nickname, &p.UserID, &p.Title, &p.Content,  &p.Category, &p.CreatedAt)
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
		return  err
	}
	return  nil
}
