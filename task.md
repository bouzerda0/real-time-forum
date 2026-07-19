# Forum Project — My Responsibilities Blueprint

**Developer:** Mohammed Sarar
**Module:** Posts, Comments, Private Chat, WebSocket & Frontend Integration

## Objective

My responsibility is to build the complete communication system of the forum, starting from the database and ending with the user interface.

Every feature must follow this architecture:

```
Database
   ↓
Repository
   ↓
Service
   ↓
Handler (API)
   ↓
Frontend
   ↓
User
```

## Project Roadmap

| Phase | Deliverables |
|-------|--------------|
| **Phase 1** | Backend Posts · Frontend Feed · Frontend Create Post |
| **Phase 2** | Backend Comments · Frontend Post Details · Frontend Comments |
| **Phase 3** | WebSocket · Online Users |
| **Phase 4** | Private Chat Backend · Private Chat Frontend |

---

## Phase 1 — Posts

### Goal
Users can:
- View all posts
- Create a post
- Open a post
- View post details

### Backend

**Step 1 — Database**

Verify the `posts` table contains:
- `id`
- `user_id`
- `title`
- `content`
- `category`
- `created_at`

**Step 2 — Repository**

File: `internal/posts/repository.go`

Tasks:
- [ ] `CreatePost()`
- [ ] `GetAllPosts()`
- [ ] `GetPostByID()`
- [ ] `DeletePost()` *(if required)*

Responsibilities: Execute SQL queries, return data — no validation.

**Step 3 — Service**

File: `internal/posts/service.go`

Tasks:
- [ ] Validate title
- [ ] Validate content
- [ ] Validate category
- [ ] Check authenticated user
- [ ] Call repository

Responsibilities: Business logic only.

**Step 4 — Handler**

File: `internal/posts/handler.go`

Tasks:
- [ ] Parse request
- [ ] Read JSON
- [ ] Read cookie
- [ ] Call service
- [ ] Return JSON

Routes:
```
POST /posts
GET  /posts
GET  /posts/:id
```

**Step 5 — Testing**

Test using: Browser, Postman, curl

Verify:
- [ ] Create post
- [ ] Fetch all posts
- [ ] Fetch single post
- [ ] Error responses

### Frontend — Feed

File: `frontend/js/post/feed.js`

Tasks:
- [ ] Load posts
- [ ] Loading state
- [ ] Error state
- [ ] Empty state
- [ ] Render posts

Each post card shows:
- Username
- Category
- Title
- Content preview
- Date
- Number of comments

### Frontend — Create Post

File: `frontend/js/post/createPost.js`

Tasks:
- [ ] Build form
- [ ] Validate inputs
- [ ] Send API request
- [ ] Refresh feed

---

## Phase 2 — Comments

### Goal
Each post has comments.

### Backend

**Database**

Table: `comments`

Columns:
- `id`
- `post_id`
- `user_id`
- `content`
- `created_at`

**Repository**

File: `internal/comments/repository.go`

Tasks:
- [ ] `CreateComment()`
- [ ] `GetCommentsByPost()`

**Service**

File: `internal/comments/service.go`

Tasks:
- [ ] Validate comment
- [ ] Check post exists
- [ ] Call repository

**Handler**

File: `internal/comments/handler.go`

Routes:
```
POST /posts/:id/comments
GET  /posts/:id/comments
```

### Frontend — Post Details

File: `frontend/js/post/postDetails.js`

Tasks:
- [ ] Load post
- [ ] Render post
- [ ] Load comments
- [ ] Render comments

### Frontend — Comments

File: `frontend/js/comment/comment.js`

Tasks:
- [ ] Comment form
- [ ] Submit comment
- [ ] Refresh comments

---

## Phase 3 — WebSocket

### Goal
Real-time communication.

### Backend

**Hub**

File: `internal/websocket/hub.go`

Tasks:
- [ ] Register client
- [ ] Unregister client
- [ ] Broadcast messages
- [ ] Private messages

**Client**

File: `internal/websocket/client.go`

Tasks:
- [ ] Read messages
- [ ] Write messages
- [ ] Close connection

**Messages**

File: `internal/websocket/messages.go`

Task: Create message models.

---

## Phase 4 — Online Users

### Backend

Tasks:
- [ ] Track connected users
- [ ] Remove offline users
- [ ] Broadcast online users

### Frontend

File: `frontend/js/chat/onlineUsers.js`

Tasks:
- [ ] Receive user list
- [ ] Update sidebar
- [ ] Show online status

---

## Phase 5 — Private Chat

### Backend

**Database**

Table: `messages`

Columns:
- `id`
- `sender_id`
- `receiver_id`
- `content`
- `created_at`

**Repository**

File: `internal/chat/repository.go`

Tasks:
- [ ] `SaveMessage()`
- [ ] `GetConversation()`

**Service**

File: `internal/chat/service.go`

Tasks:
- [ ] Validate message
- [ ] Save message
- [ ] Send through WebSocket

**Handler**

File: `internal/chat/handler.go`

Route:
```
GET /chat/:userID
```

Purpose: Return conversation history.

### Frontend

File: `frontend/js/chat/chat.js`

Tasks:
- [ ] Load conversation
- [ ] Render messages
- [ ] Send message
- [ ] Receive message
- [ ] Auto scroll

---

## API Checklist

**Posts**
- [ ] `POST /posts`
- [ ] `GET /posts`
- [ ] `GET /posts/:id`

**Comments**
- [ ] `POST /posts/:id/comments`
- [ ] `GET /posts/:id/comments`

**Chat**
- [ ] `GET /chat/:userID`

**WebSocket**
- [ ] Connect
- [ ] Send message
- [ ] Receive message
- [ ] Broadcast online users

---

## Final Checklist

### Backend
- [ ] Posts Repository
- [ ] Posts Service
- [ ] Posts Handler
- [ ] Comments Repository
- [ ] Comments Service
- [ ] Comments Handler
- [ ] WebSocket Hub
- [ ] WebSocket Client
- [ ] Online Users
- [ ] Chat Repository
- [ ] Chat Service
- [ ] Chat Handler

### Frontend
- [ ] Feed
- [ ] Create Post
- [ ] Post Details
- [ ] Comments
- [ ] Chat Window
- [ ] Online Users Sidebar
- [ ] WebSocket Integration

---

## Recommended Development Order

1. ✅ Posts Backend
2. ✅ Feed Frontend
3. ✅ Create Post Frontend
4. ✅ Comments Backend
5. ✅ Post Details Frontend
6. ✅ Comments Frontend
7. ✅ WebSocket Infrastructure
8. ✅ Online Users
9. ✅ Private Chat Backend
10. ✅ Private Chat Frontend
11. ✅ End-to-End Testing
12. ✅ Bug Fixes & Code Cleanup
13. ✅ Documentation & Final Review

---

## ⚠️ Important Recommendation

**Before writing any frontend code for a feature, make sure its backend is complete and tested.**

For example:
- Finish and test the Posts API before building the Feed.
- Finish and test the Comments API before building the comments UI.
- Finish the WebSocket infrastructure before implementing the chat interface.

This approach makes debugging much easier and keeps the project progressing in a predictable, maintainable way.


Frontend

↓

WebSocket

↓

ReadPump()

↓

Hub

↓

Service.SendMessage()

↓

Repository.SaveMessage()

↓

إذا كان المستقبل Online

↓

receiver.Send

↓

WritePump()

↓

Frontend