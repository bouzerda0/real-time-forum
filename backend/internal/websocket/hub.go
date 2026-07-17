package websocket

type Hub struct {
	Clients    map[int]*Client
	Register   chan *Client
	Unregister chan *Client
}

// NewHub creates a new Hub and initializes all required fields.
func NewHub() *Hub {
	return &Hub{
		Clients:    make(map[int]*Client),
		Register:   make(chan *Client),
		Unregister: make(chan *Client),
	}
}

func (h *Hub) Run() {
	for {
		select {

		case client := <-h.Register:
			h.Clients[client.UserID] = client

		case client := <-h.Unregister:
			delete(h.Clients, client.UserID)
		}
	}
}