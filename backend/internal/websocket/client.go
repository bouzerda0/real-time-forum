package websocket

import (
	"log"

	"github.com/gorilla/websocket"
)

type Client struct {
	UserID int
	Hub    *Hub
	Conn   *websocket.Conn
	Send   chan []byte
}

func (c *Client) ReadPump() {
	defer func() {
		c.Hub.Unregister <- c
		c.Conn.Close()
	}()

	for {
		var msg ChatMessage

		err := c.Conn.ReadJSON(&msg)
		if err != nil {
			log.Println("read error:", err)
			break
		}
		msg.SenderID = c.UserID
		c.Hub.Messages <- msg
	}
}


func (c *Client) WritePump() {
	defer func() {
		c.Conn.Close()
	}()

	for {
		message, ok := <-c.Send

		if !ok {
			return
		}

		err := c.Conn.WriteMessage(1, message)
		if err != nil {
			log.Println("write error:", err)
			return
		}
	}
}