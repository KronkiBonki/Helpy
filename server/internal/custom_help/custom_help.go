package customhelp

import (
	"context"
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
)

func createCustomHelpTable(conn *pgx.Conn) error {
	_, err := conn.Exec(context.Background(), "create table if not exists custom_help(id uuid references auth(id), message text)")
	return err
}

func GetCustomHelpMessages(c *gin.Context) {
	id := c.GetString("cookie")

	conn, err := pgx.Connect(context.Background(), os.Getenv("DATABASE_URL"))
	if err != nil {
		log.Println(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error unable to connect to the database"})
		return
	}
	defer conn.Close(context.Background())

	if err = createCustomHelpTable(conn); err != nil {
		log.Println(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error unable to create a table for the custom help messages"})
		return
	}

	rows, err := conn.Query(context.Background(), "select message from custom_help where id = $1", id)
	if err != nil {
		log.Println(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error unable to get the messages from the database"})
		return
	}

	messages, err := pgx.CollectRows(rows, func(row pgx.CollectableRow) (string, error) {
		message := ""
		err := rows.Scan(&message)
		if err != nil {
			return "", err
		}

		return message, nil
	})
	if err != nil {
		log.Println(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error unable to collect the messages"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"messages": messages})
}

func CreateCustomHelpMessage(c *gin.Context) {
	id := c.GetString("cookie")
	message := c.GetString("message")

	conn, err := pgx.Connect(context.Background(), os.Getenv("DATABASE_URL"))
	if err != nil {
		log.Println(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error unable to connect to the database"})
		return
	}
	defer conn.Close(context.Background())

	_, err = conn.Exec(context.Background(), "insert into custom_help (id, message) values ($1, $2)", id, message)
	if err != nil {
		log.Println(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error unable to insert the information into the database"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": message})
}
