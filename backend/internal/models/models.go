package models

import "time"

type User struct {
	ID        int
	Username  string
	Nickname  string
	Email     string
	Password  string
	Age       int
	Gender    string
	FirstName string
	LastName  string
}

type Post struct {
	ID           int       `json:"id"`
	UserID       int       `json:"user_id"`
	Username     string    `json:"username"`
	Nickname     string    `json:"nickname"`
	Title        string    `json:"title"`
	Category     []string  `json:"categories"`
	Content      string    `json:"content"`
	CreatedAt    time.Time `json:"created_at"`
	Likes         int       `json:"likes"`
	Dislikes      int       `json:"dislikes"`
	UserReaction  *int      `json:"user_reaction"`
	CommentsCount int       `json:"comments_count"`
}

type Comment struct {
	ID           int       `json:"id"`
	PostID       int       `json:"post_id"`
	UserID       int       `json:"user_id"`
	Username     string    `json:"username"`
	Nickname     string    `json:"nickname"`
	Content      string    `json:"content"`
	CreatedAt    time.Time `json:"created_at"`
	Likes        int       `json:"likes"`
	Dislikes     int       `json:"dislikes"`
	UserReaction *int      `json:"user_reaction"`
}

type Message struct {
	ID         int       `json:"id"`
	SenderID   int       `json:"senderId"`
	ReceiverID int       `json:"receiverId"`
	Content    string    `json:"content"`
	CreatedAt  time.Time `json:"createdAt"`
}
