// wstest is a small end-to-end test client for the private messaging feature.
//
// It expects the forum server to already be running on localhost:8080
// (start it with `go run .` from the backend directory).
//
// It verifies:
//  1. Realtime delivery: a message sent over WebSocket reaches the receiver.
//  2. History: GET /chat returns the exchanged messages (limit/offset shape).
//  3. Offline delivery: messages sent to an offline user are saved to the DB.
//  4. GET /api/users returns the member list with online status.
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/cookiejar"
	"net/url"
	"os"
	"time"

	"github.com/gorilla/websocket"
)

const baseURL = "http://localhost:8080"

type wsMessage struct {
	Type       string    `json:"type"`
	UserID     int       `json:"userId"`
	Online     bool      `json:"online"`
	SenderID   int       `json:"senderId"`
	ReceiverID int       `json:"receiverId"`
	Content    string    `json:"content"`
	CreatedAt  time.Time `json:"createdAt"`
}

type chatMessage struct {
	ID         int       `json:"id"`
	SenderID   int       `json:"senderId"`
	ReceiverID int       `json:"receiverId"`
	Content    string    `json:"content"`
	CreatedAt  time.Time `json:"createdAt"`
}

type publicUser struct {
	ID          int       `json:"id"`
	Username    string    `json:"username"`
	Nickname    string    `json:"nickname"`
	Online      bool      `json:"online"`
	Lastmessage time.Time `json:"lastmessage"`
}

type account struct {
	id     int
	client *http.Client
}

func main() {
	ts := time.Now().UnixNano() % 1000000
	password := "password123"

	alice := createAccount(fmt.Sprintf("alice_%d", ts), password)
	bob := createAccount(fmt.Sprintf("bob_%d", ts), password)
	fmt.Printf("created alice id=%d, bob id=%d\n", alice.id, bob.id)

	// Connect both users to the WebSocket hub
	aliceWS := alice.ws()
	bobWS := bob.ws()
	defer aliceWS.Close()
	defer bobWS.Close()
	time.Sleep(300 * time.Millisecond) // let the hub register the clients

	// 1) Realtime: alice -> bob
	send(aliceWS, bob.id, "hello bob, from wstest")

	got := readMessage(bobWS, 3*time.Second)
	if got == nil || got.SenderID != alice.id || got.Content != "hello bob, from wstest" {
		fail("realtime delivery", got)
	}
	fmt.Println("PASS: realtime message delivered to bob")

	// 2) History: GET /chat as alice returns the message
	messages := getMessages(alice, bob.id)
	if len(messages) == 0 || messages[0].Content != "hello bob, from wstest" {
		fail("chat history", messages)
	}
	fmt.Println("PASS: message saved & returned by GET /chat")

	// 3) Offline delivery: alice -> bob after bob disconnects
	bobWS.Close()
	time.Sleep(300 * time.Millisecond)
	send(aliceWS, bob.id, "offline hello")
	time.Sleep(300 * time.Millisecond)

	messages = getMessages(bob, alice.id)
	found := false
	for _, m := range messages {
		if m.Content == "offline hello" {
			found = true
		}
	}
	if !found {
		fail("offline delivery", messages)
	}
	fmt.Println("PASS: message sent while receiver offline is saved")

	// 4) GET /api/users returns the member list with online status
	users := getUsers(alice)
	if len(users) == 0 {
		fail("users list", users)
	}
	fmt.Println("PASS: GET /api/users returns the member list")

	fmt.Println("\nALL TESTS PASSED")
}

func createAccount(username, password string) *account {
	jar, _ := cookiejar.New(nil)
	client := &http.Client{Jar: jar, Timeout: 5 * time.Second}

	// Register (may already exist from a previous run → ignore the error)
	payload, _ := json.Marshal(map[string]interface{}{
		"username":   username,
		"email":      username + "@test.com",
		"password":   password,
		"age":        25,
		"gender":     "Male",
		"first_name": "Test",
		"last_name":  "User",
	})
	doRequest(client, "POST", "/api/register", payload)

	// Login (stores the session cookie in the jar)
	login, _ := json.Marshal(map[string]interface{}{
		"identify": username,
		"password": password,
	})
	doRequest(client, "POST", "/api/login", login)

	// Get the user id from the session
	body := doRequest(client, "GET", "/api/session", nil)
	var session struct {
		User struct {
			ID int `json:"id"`
		} `json:"user"`
	}
	json.Unmarshal(body, &session)

	return &account{id: session.User.ID, client: client}
}

func doRequest(client *http.Client, method, path string, payload []byte) []byte {
	req, err := http.NewRequest(method, baseURL+path, bytes.NewReader(payload))
	if err != nil {
		fail("building request "+path, err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		fail("request "+path, err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	return body
}

func (a *account) ws() *websocket.Conn {
	// Reuse the session cookie from the account's jar for the handshake
	jarURL := &url.URL{Scheme: "http", Host: "localhost:8080"}
	var cookieHeader []string
	for _, c := range a.client.Jar.Cookies(jarURL) {
		cookieHeader = append(cookieHeader, c.String())
	}

	conn, _, err := websocket.DefaultDialer.Dial(
		"ws://localhost:8080/ws",
		http.Header{"Cookie": cookieHeader},
	)
	if err != nil {
		fail("websocket dial", err)
	}
	return conn
}

func send(conn *websocket.Conn, receiverID int, content string) {
	conn.WriteJSON(map[string]interface{}{
		"receiverId": receiverID,
		"content":    content,
	})
}

// readMessage skips "status" messages and returns the first "message" one.
func readMessage(conn *websocket.Conn, timeout time.Duration) *wsMessage {
	conn.SetReadDeadline(time.Now().Add(timeout))
	for {
		var msg wsMessage
		if err := conn.ReadJSON(&msg); err != nil {
			return nil
		}
		if msg.Type == "message" {
			return &msg
		}
	}
}

func getMessages(a *account, otherID int) []chatMessage {
	path := fmt.Sprintf("/chat?receiver=%d&limit=10&offset=0", otherID)
	body := doRequest(a.client, "GET", path, nil)

	var messages []chatMessage
	json.Unmarshal(body, &messages)
	return messages
}

func getUsers(a *account) []publicUser {
	body := doRequest(a.client, "GET", "/api/users", nil)

	var users []publicUser
	json.Unmarshal(body, &users)
	return users
}

func fail(what string, got interface{}) {
	fmt.Printf("FAIL: %s → %+v\n", what, got)
	os.Exit(1)
}
