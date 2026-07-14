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
	ID        int       `json:"id"`
	UserID    int       `json:"user_id"`
	Nickname  string    `json:"nickname"`
	Title     string    `json:"title"`
	Category  []string  `json:"categories"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"created_at"`
}


type Comment struct {
	ID        int
	PostID    int
	UserID    int
	Content   string
	CreatedAt time.Time
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
