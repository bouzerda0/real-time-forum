package models

import "time"

type User struct {
	ID        int
	username  string
	Email     string
	Password  string
	Age       int
	Gender    string
	FirstName string
	LastName  string
}

type Post struct {
	ID        int
	UserID    int
	Nickname string
	Title     string
	Content   string
	Category  string
	CreatedAt time.Time
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
