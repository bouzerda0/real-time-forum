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

// ReadPump reads messages from the WebSocket connection and sends them to the hub's Messages channel.
func (c *Client) ReadPump() {
	defer func() {
		c.Hub.Unregister <- c
		c.Conn.Close()
	}()

	for {
		var msg ChatMessage
		// if an error occurs while reading a JSON message from the WebSocket connection, log the error and break the loop to close the connection.
		err := c.Conn.ReadJSON(&msg)
		if err != nil {
			log.Println("read error:", err)
			break
		}
		// set the SenderID of the message to the UserID of the client and send the message to the hub's Messages channel for broadcasting to other clients.
		msg.SenderID = c.UserID
		c.Hub.Messages <- HubMessage{
			Client: c,
			Msg:    msg,
		}
	}
}

// WritePump writes messages from the hub's Messages channel to the WebSocket connection.
func (c *Client) WritePump() {
	defer func() {
		c.Conn.Close()
	}()

	for {
		// read a message from the client's Send channel. If the channel is closed, return to exit the loop and close the connection.
		message, ok := <-c.Send

		if !ok {
			return
		}

		// write the message to the WebSocket connection. If an error occurs, log the error and return to exit the loop and close the connection.
		err := c.Conn.WriteMessage(1, message)
		if err != nil {
			log.Println("write error:", err)
			return
		}
	}
}
