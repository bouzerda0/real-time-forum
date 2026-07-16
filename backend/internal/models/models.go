package models

import "time"

type User struct {
	ID        int
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
	Nickname     string    `json:"nickname"`
	Content      string    `json:"content"`
	CreatedAt    time.Time `json:"created_at"`
	Likes        int       `json:"likes"`
	Dislikes     int       `json:"dislikes"`
	UserReaction *int      `json:"user_reaction"`
}

type Like struct {
	ID        int
	UserID    int
	PostID    int
	Reaction  int
	CreatedAt time.Time
}

type Message struct {
	ID         int
	SenderID   int
	ReceiverID int
	Content    string
	CreatedAt  time.Time
}
