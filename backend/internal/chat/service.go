package chat

import (
	"real-time-forum/internal/models"
	"strings"
)

func Checkmessage(Message models.Message)bool {
	if (len(strings.TrimSpace(Message.Content)) == 0) {
		return false
	}
	if (len(strings.TrimSpace(Message.Content)) > 1000) {
		return  false 
	}
	return true
}
