package database

import (
	"database/sql"
	"log"
	"os"

	_ "github.com/mattn/go-sqlite3"
)

var DB *sql.DB

func InitDB(dbPath string) error {
	var err error
	DB, err = sql.Open("sqlite3", dbPath)
	if err != nil {
		return err
	}

	_, err = DB.Exec("PRAGMA foreign_keys = ON;")
	if err != nil {
		log.Fatal("Failed to enable foreign keys:", err)
	}
	createTable, err := os.ReadFile("database/schema.sql")
	if err != nil {
		return err
	}

	_, err = DB.Exec(string(createTable))
	if err != nil {
		return err
	}

	// Migrate column if table existed with username column previously
	DB.Exec("ALTER TABLE users RENAME COLUMN username TO nickname;")

	return nil
}