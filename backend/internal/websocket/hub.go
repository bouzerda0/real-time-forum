package websocket

import (
	"encoding/json"
	"fmt"
	"log"
	"sync"
	"time"

	"real-time-forum/internal/chat"
)

var GlobalHub *Hub

type Hub struct {
	mu         sync.RWMutex
	Clients    map[int]*Client
	Register   chan *Client
	Unregister chan *Client
	Messages   chan ChatMessage
}

// NewHub creates a new Hub and initializes all required fields.
func NewHub() *Hub {
	h := &Hub{
		Clients:    make(map[int]*Client),
		Register:   make(chan *Client),
		Unregister: make(chan *Client),
		Messages:   make(chan ChatMessage),
	}
	GlobalHub = h
	return h
}

func (h *Hub) IsOnline(userID int) bool {
	if h == nil {
		return false
	}
	h.mu.RLock()
	defer h.mu.RUnlock()
	_, ok := h.Clients[userID]
	return ok
}

func (h *Hub) broadcastStatus(userID int, online bool) {
	msg := ChatMessage{
		Type:   "status",
		UserID: userID,
		Online: online,
	}
	data, err := json.Marshal(msg)
	if err != nil {
		return
	}
	h.mu.RLock()
	for _, client := range h.Clients {
		select {
		case client.Send <- data:
		default:
		}
	}
	h.mu.RUnlock()
}

func (h *Hub) Run() {
	for {
		select {

		case client := <-h.Register:
			h.mu.Lock()
			h.Clients[client.UserID] = client
			h.mu.Unlock()
			h.broadcastStatus(client.UserID, true)

		case msg := <-h.Messages:
			// Validate the message before processing it.
			if !chat.Checkmessage(msg.Content) || msg.SenderID == msg.ReceiverID {
				continue
			}
			if msg.CreatedAt.IsZero() {
				msg.CreatedAt = time.Now()
			}
			err := chat.SaveMessage(msg.SenderID, msg.ReceiverID, msg.Content)
			if err != nil {
				fmt.Println(err)
				continue
			}
			// Find the receiver.
			h.mu.RLock()
			receiver, ok := h.Clients[msg.ReceiverID]
			h.mu.RUnlock()
			if !ok {
				// Receiver is offline.
				continue
			}
			// Convert the message to JSON.
			data, err := json.Marshal(msg)
			if err != nil {
				log.Println("marshal error:", err)
				continue
			}

			// Send the message to the receiver.
			receiver.Send <- data

		case client := <-h.Unregister:
			h.mu.Lock()
			delete(h.Clients, client.UserID)
			h.mu.Unlock()
			h.broadcastStatus(client.UserID, false)
		}
	}
}
