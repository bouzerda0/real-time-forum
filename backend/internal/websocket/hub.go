package websocket

import (
	"encoding/json"
	"fmt"
	"log"

	"real-time-forum/internal/chat"
)

type Hub struct {
	Clients    map[int]*Client
	Register   chan *Client
	Unregister chan *Client
	Messages   chan ChatMessage
}

// NewHub creates a new Hub and initializes all required fields.
func NewHub() *Hub {
	return &Hub{
		Clients:    make(map[int]*Client),
		Register:   make(chan *Client),
		Unregister: make(chan *Client),
		Messages:   make(chan ChatMessage),
	}
}

func (h *Hub) Run() {
	for {
		select {

		case client := <-h.Register:
			h.Clients[client.UserID] = client
		case msg := <-h.Messages:
			// Validate the message before processing it.
			if !chat.Checkmessage(msg.Content) {
				continue
			}
			err := chat.SaveMessage(msg.SenderID, msg.ReceiverID, msg.Content)
			if err != nil {
				fmt.Println(err)
				continue
			}
			// Find the receiver.
			receiver, ok := h.Clients[msg.ReceiverID]
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
			delete(h.Clients, client.UserID)
		}
	}
}
