package websocket

import "time"

type ChatMessage struct {
    Type       string    `json:"Type,omitempty"`
    UserID     int       `json:"UserID,omitempty"`
    Online     bool      `json:"Online,omitempty"`
    SenderID   int       `json:"SenderID,omitempty"`
    ReceiverID int       `json:"ReceiverID,omitempty"`
    Content    string    `json:"Content,omitempty"`
    CreatedAt  time.Time `json:"CreatedAt,omitempty"`
}
