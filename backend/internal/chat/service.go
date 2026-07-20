package chat

import (
	"strings"
)

func Checkmessage(Message string) bool {
	if len(strings.TrimSpace(Message)) == 0 {
		return false
	}
	if len(strings.TrimSpace(Message)) > 1000 {
		return false
	}
	return true
}
