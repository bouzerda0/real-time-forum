package database

import (
	"database/sql"
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

	createTable, err := os.ReadFile("database/schema.sql")
	if err != nil {
		return err
	}

	_, err = DB.Exec(string(createTable))
	if err != nil {
		return err
	}

	return nil
}
