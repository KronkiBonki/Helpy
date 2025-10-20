package customhelp

import (
	"context"
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
)

// O4 Mini

type Message struct {
	ID      int    `json:"id"`
	Message string `json:"message"`
}

func createCustomHelpTable(conn *pgx.Conn) error {
	_, err := conn.Exec(context.Background(), "create table if not exists custom_help(id serial primary key, user_id uuid references auth(id), message text)")
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

	rows, err := conn.Query(context.Background(), "select id, message from custom_help where user_id = $1", id)
	if err != nil {
		log.Println(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error unable to get the messages from the database"})
		return
	}

	messages, err := pgx.CollectRows(rows, func(row pgx.CollectableRow) (*Message, error) {
		msg := Message{}
		err := rows.Scan(&msg.ID, &msg.Message)
		if err != nil {
			return nil, err
		}

		return &msg, nil
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

	_, err = conn.Exec(context.Background(), "insert into custom_help (user_id, message) values ($1, $2) returning id", id, message)
	if err != nil {
		log.Println(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error unable to insert the information into the database"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": message})
}

func UpdateCustomHelpMessage(c *gin.Context) {
	userID := c.GetString("cookie")
	messageID := c.GetInt("id")
	message := c.Param("message")

	conn, err := pgx.Connect(context.Background(), os.Getenv("DATABASE_URL"))
	if err != nil {
		log.Println(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error unable to connect to the database"})
		return
	}
	defer conn.Close(context.Background())

	msg := Message{ID: messageID}
	err = conn.QueryRow(context.Background(), "update custom_help set message = $1, where id = $2 and user_id = $3 returning message", message, userID, messageID).Scan(&msg.Message)
	if err != nil {
		log.Println(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error unabel to update the information in the database"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": msg})
}

func DeleteCustomHelpMessage(c *gin.Context) {
	userID := c.GetString("cookie")
	messageID := c.Param("messageID")

	conn, err := pgx.Connect(context.Background(), os.Getenv("DATABASE_URL"))
	if err != nil {
		log.Println(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error unable to connect to the database"})
		return
	}
	defer conn.Close(context.Background())

	_, err = conn.Exec(context.Background(), "delete from custom_help where user_id = $1, id = $2", userID, messageID)
	if err != nil {
		log.Println(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error unable to remove the information from the database"})
		return
	}

	c.JSON(http.StatusOK, nil)
}
