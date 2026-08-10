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

// this struct represents a WebSocket hub that manages connected clients and broadcasts messages to them.
type Hub struct {
	mu         sync.RWMutex
	Clients    map[int][]*Client
	Register   chan *Client
	Unregister chan *Client
	Messages   chan ChatMessage
}

// NewHub creates a new Hub and initializes all required fields.
func NewHub() *Hub {
	h := &Hub{
		Clients:    make(map[int][]*Client),
		Register:   make(chan *Client),
		Unregister: make(chan *Client),
		Messages:   make(chan ChatMessage),
	}
	GlobalHub = h
	return h
}

// IsOnline checks if a user with the given userID is currently connected to the hub.
func (h *Hub) IsOnline(userID int) bool {
	// If the hub is nil, return false (user is not online).
	if h == nil {
		return false
	}
	// Acquire a read lock to safely check user presence in the map without data races
	h.mu.RLock()
	defer h.mu.RUnlock()
	clients := h.Clients[userID]
	return len(clients) > 0
}

// broadcastStatus sends a status message to all connected clients indicating whether a user is online or offline.
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
	// lock the hub's mutex for reading to safely iterate over the connected clients without data races
	h.mu.RLock()
	// Broadcast the status message to all connected clients.
	for _, clients := range h.Clients {
		for _, client := range clients {
			client.Send <- data
		}
	}

	h.mu.RUnlock()
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.Register:
			h.mu.Lock()
			wasOffline := len(h.Clients[client.UserID]) == 0
			h.Clients[client.UserID] = append(
				h.Clients[client.UserID],
				client,
			)
			h.mu.Unlock()
			if wasOffline {
				h.broadcastStatus(client.UserID, true)
			}

		case msg := <-h.Messages:
			// Validate the message before processing it.
			if !chat.Checkmessage(msg.Content) || msg.SenderID == msg.ReceiverID {
				continue
			}
			receiverexist, err := chat.UserExists(msg.ReceiverID)
			if err != nil {
				fmt.Println(err)
				continue
			}
			if !receiverexist {
				fmt.Println("receiver not exist")
				continue
			}
			if msg.CreatedAt.IsZero() {
				msg.CreatedAt = time.Now()
			}
			err = chat.SaveMessage(msg.SenderID, msg.ReceiverID, msg.Content)
			if err != nil {
				fmt.Println(err)
				continue
			}
			// Find the receiver.
			h.mu.RLock()
			receivers, ok := h.Clients[msg.ReceiverID]
			h.mu.RUnlock()
			if !ok {
				// Receiver is offline.
				continue
			}
			msg.Type = "message"
			// Convert the message to JSON.
			data, err := json.Marshal(msg)
			if err != nil {
				log.Println("marshal error:", err)
				continue
			}

			// Send the message to every open tab for the receiver.
			for _, receiver := range receivers {
				receiver.Send <- data
			}

		case client := <-h.Unregister:
			h.mu.Lock()
			isOffline := false
			if clients, ok := h.Clients[client.UserID]; ok {
				for i, c := range clients {
					if c == client {
						h.Clients[client.UserID] = append(
							clients[:i],
							clients[i+1:]...,
						)
						break
					}
				}

				if len(h.Clients[client.UserID]) == 0 {
					delete(h.Clients, client.UserID)
					isOffline = true
				}
			}
			h.mu.Unlock()
			if isOffline {
				h.broadcastStatus(client.UserID, false)
			}
		}
	}
}
