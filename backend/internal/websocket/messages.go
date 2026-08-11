package websocket

import "time"

type ChatMessage struct {
	Type        string    `json:"type"`
	ItemType    string    `json:"itemType,omitempty"`
	UserID      int       `json:"userId"`
	Online      bool      `json:"online"`
	SenderID    int       `json:"senderId"`
	SenderName  string    `json:"senderName,omitempty"`
	ReceiverID  int       `json:"receiverId"`
	Receiver_ID int       `json:"receiver_id,omitempty"`
	Content     string    `json:"content"`
	CreatedAt   time.Time `json:"createdAt"`
	IsTyping    bool      `json:"isTyping,omitempty"`
}