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
	Messages   chan HubMessage
}
type HubMessage struct {
	Client *Client
	Msg    ChatMessage
}

// NewHub creates a new Hub and initializes all required fields.
func NewHub() *Hub {
	h := &Hub{
		Clients:    make(map[int][]*Client),
		Register:   make(chan *Client),
		Unregister: make(chan *Client),
		Messages:   make(chan HubMessage),
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

		case hubmsg := <-h.Messages:
			msg := hubmsg.Msg
			senderClient := hubmsg.Client

			// Route typing event directly to the receiver without saving it
			if msg.ItemType == "typing" || msg.Type == "typing" {
				recId := msg.Receiver_ID
				if recId == 0 {
					recId = msg.ReceiverID
				}
				msg.Type = "typing"
				msg.SenderID = senderClient.UserID
				data, err := json.Marshal(msg)
				if err != nil {
					log.Println("marshal error:", err)
					continue
				}

				h.mu.RLock()
				receivers := append([]*Client(nil), h.Clients[recId]...)
				h.mu.RUnlock()

				for _, receiver := range receivers {
					receiver.Send <- data
				}
				continue
			}

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

			msg.Type = "message"

			data, err := json.Marshal(msg)
			if err != nil {
				log.Println("marshal error:", err)
				continue
			}

			h.mu.RLock()
			receivers := append([]*Client(nil), h.Clients[msg.ReceiverID]...)
			senders := append([]*Client(nil), h.Clients[msg.SenderID]...)
			h.mu.RUnlock()

			// Send to every tab of the receiver.
			for _, receiver := range receivers {
				receiver.Send <- data
			}

			// Send to other tabs of the sender,
			// but NOT the tab that originally sent the message.
			for _, sender := range senders {
				if sender != senderClient {
					sender.Send <- data
				}
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
