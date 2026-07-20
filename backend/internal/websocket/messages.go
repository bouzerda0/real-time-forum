package websocket

import "time"

type ChatMessage struct {
    SenderID   int
    ReceiverID int
    Content    string
    CreatedAt  time.Time
}
