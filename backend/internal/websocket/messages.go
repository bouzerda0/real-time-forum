package websocket

import "time"

type ChatMessage struct {
	Type       string    `json:"type"`
	UserID     int       `json:"userId"`
	Online     bool      `json:"online"`
	SenderID   int       `json:"senderId"`
	ReceiverID int       `json:"receiverId"`
	Content    string    `json:"content"`
	CreatedAt  time.Time `json:"createdAt"`
}