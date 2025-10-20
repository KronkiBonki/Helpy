package auth

import (
	"context"
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
)

func CreateAuthTable(conn *pgx.Conn) error {
	_, err := conn.Exec(context.Background(), "create table if not exists auth (id uuid primary key default gen_random_uuid())")
	return err
}

func GetAuth(c *gin.Context) {
	conn, err := pgx.Connect(context.Background(), os.Getenv("DATABASE_URL"))
	if err != nil {
		log.Println(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error unable to connect to the database"})
		return
	}
	defer conn.Close(context.Background())

	if err = CreateAuthTable(conn); err != nil {
		log.Println(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error unable to create a table for auth"})
		return
	}

	id := ""
	err = conn.QueryRow(context.Background(), "insert into auth default values returning id").Scan(&id)
	if err != nil {
		log.Println(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error couldn't get the id"})
		return
	}

	c.SetCookie("auth", id, 0, "/", "", false, true)
}

func HasCookie(c *gin.Context) {
	_, err := c.Cookie("auth")
	if err != nil {
		log.Println(err)
		c.JSON(http.StatusOK, gin.H{"cookie": false})
		return
	}

	c.JSON(http.StatusOK, gin.H{"cookie": true})
}
