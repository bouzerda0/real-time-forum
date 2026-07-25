package websocket

import (
	"fmt"
	"net/http"

	"real-time-forum/internal/posts"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func WSHandler(hub *Hub) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		fmt.Println("WebSocket connection requested")
		userID, err := posts.GetUserID(r)
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			fmt.Println("upgrade error:", err)
			return
		}

		client := &Client{
			UserID: userID,
			Hub:    hub,
			Conn:   conn,
			Send:   make(chan []byte, 256),
		}

		hub.Register <- client
		go client.WritePump()
		go client.ReadPump()
	}
}
