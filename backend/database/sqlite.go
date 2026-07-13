package database

import (
	"database/sql"
	"log"
	"os"
	_ "github.com/mattn/go-sqlite3"
)

var DB *sql.DB

func InitDB(){
	var err error
	DB, err = sql.Open("sqlite3", "./forum.db")
	if err != nil {
		log.Fatal("Unable to open database:", err)
	}
	
	createTable, err := os.ReadFile("backend/database/schema.sql")
	if err != nil {
		log.Fatal("Unable to read schema file:", err)
	}

	_, err = DB.Exec(string(createTable))
	if err != nil {
	log.Fatal("Unable to create table:", err)
	}

}