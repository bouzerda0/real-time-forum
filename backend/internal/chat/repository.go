package chat

import (
	"real-time-forum/database"
	"real-time-forum/internal/models"
	"time"
)

func SaveMessage(SenderID int, ReceiverID int, Content string , created_at time.Time) error {
	_, err := database.DB.Exec(`INSERT INTO messages (sender_id ,receiver_id , content , created_at  )  
	VALUES ( ? ,? ,? , ?)`,
		SenderID, ReceiverID, Content , created_at)
	if err != nil {
		return err
	}
	return nil
}


func GetMessages(userID, otherUserID, limit, offset int) ([]models.Message, error) {
	query := `
		SELECT id, sender_id, receiver_id, content, created_at
		FROM messages
		WHERE
			(sender_id = ? AND receiver_id = ?)
			OR
			(sender_id = ? AND receiver_id = ?)
		ORDER BY created_at DESC
		LIMIT ? OFFSET ?;
	`

	rows, err := database.DB.Query(
		query,
		userID, otherUserID,
		otherUserID, userID,
		limit, offset,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	messages := []models.Message{}

	for rows.Next() {
		var msg models.Message

		err := rows.Scan(
			&msg.ID,
			&msg.SenderID,
			&msg.ReceiverID,
			&msg.Content,
			&msg.CreatedAt,
		)
		if err != nil {
			return nil, err
		}

		messages = append(messages, msg)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return messages, nil
}


func UserExists(userID int) (bool, error) {
	var count int

	err := database.DB.QueryRow(
		"SELECT COUNT(*) FROM users WHERE id = ?",
		userID,
	).Scan(&count)

	if err != nil {
		return false, err
	}

	return count > 0, nil
}