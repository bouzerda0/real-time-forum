package chat

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

	"real-time-forum/internal/posts"
)

func ChatHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Println("is called")
	if r.Method != http.MethodGet {
		http.Error(w, http.StatusText(http.StatusMethodNotAllowed), http.StatusMethodNotAllowed)
		return
	}
	sender, err := posts.GetUserID(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	fmt.Println(sender)
	receiverstr := r.URL.Query().Get("receiver")
	limitstr := r.URL.Query().Get("limit")
	offsetstr := r.URL.Query().Get("offset")
	receiver, err := strconv.Atoi(receiverstr)
	if err != nil {
		http.Error(w, http.StatusText(400), http.StatusBadRequest)
		return
	}
	limit, err := strconv.Atoi(limitstr)
	if err != nil {
		http.Error(w, http.StatusText(400), http.StatusBadRequest)
		return
	}
	offset, err := strconv.Atoi(offsetstr)
	if err != nil {
		http.Error(w, http.StatusText(400), http.StatusBadRequest)
		return
	}
	messages, err := GetMessages(sender, receiver, limit, offset)
	if err != nil {
		http.Error(w, http.StatusText(500), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")

	err = json.NewEncoder(w).Encode(messages)
	if err != nil {
		http.Error(w, http.StatusText(500), http.StatusInternalServerError)
		return
	}
}
