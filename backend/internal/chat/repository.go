package chat

import (
	"real-time-forum/database"
	"real-time-forum/internal/models"
)

func SaveMessage(SenderID int, ReceiverID int, Content string) error {
	_, err := database.DB.Exec(`INSERT INTO messages (sender_id ,receiver_id , content )  
	VALUES ( ? ,? ,?)`,
		SenderID, ReceiverID, Content)
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

	var messages []models.Message

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