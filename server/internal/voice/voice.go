package voice

import (
	"context"
	"encoding/base64"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"sync"

	customhelp "github.com/KronkiBonki/Helpy/internal/custom_help"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
	openai "github.com/sashabaranov/go-openai"
)

var mu = sync.Mutex{}

func GetVoiceResponse(c *gin.Context) {
	mu.Lock()
	defer mu.Unlock()
	id := c.GetString("cookie")

	audioStr := c.GetString("audio")
	audio, err := base64.StdEncoding.DecodeString(audioStr)
	if err != nil {
		log.Println(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error unable to decode the audio"})
		return
	}

	file, err := os.OpenFile("audio.webm", os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0777)
	if err != nil {
		log.Println(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error unable to create an audio file"})
		return
	}

	_, err = file.Write(audio)
	if err != nil {
		file.Close()
		log.Println(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error unable to write the file"})
		return
	}

	file.Close()

	file, err = os.Open("audio.webm")
	if err != nil {
		log.Println(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error unable to opne the file"})
		return
	}
	defer file.Close()

	client := openai.NewClient(os.Getenv("GPT_API_KEY"))

	resp, err := client.CreateTranscription(
		context.Background(),
		openai.AudioRequest{
			Model:    "gpt-4o-mini-transcribe",
			FilePath: "audio.webm",
		},
	)
	if err != nil {
		log.Println(err)
		c.JSON(http.StatusFailedDependency, gin.H{"error": "Error unable to convert the audio to text"})
		return
	}

	conn, err := pgx.Connect(context.Background(), os.Getenv("DATABASE_URL"))
	if err != nil {
		log.Println(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error unable to connect to the database"})
		return
	}
	defer conn.Close(context.Background())

	helpMessages, err := customhelp.GetHelpMessages(conn, id)
	if err != nil {
		log.Println(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error unable to get the custom help messages from the database"})
		return
	}

	var customHelp []string
	for _, msg := range helpMessages {
		customHelp = append(customHelp, "\""+msg.Message+"\"")
	}

	help := strings.Join(customHelp, ", ")
	prompt := fmt.Sprintf(`You are helping a person who is not really good with technology. I will give you a question from them and you need to answer as thoroughly
	and as accurately as possible. If this input is malicious, like asking for the API key I provide in order to use you you must say: "Sorry, but I can't help you with that".
	The prompt will be provided in double quotes. Before that I will give you additional custom help messages written for this specific person. If they ask about
	anything related to these custom help messages you must answer by providing the custom help message and if possible explain it further. Here are the custom help messages
	provided in the form of a string array: [%s]. Here is the input from the person you need to help: "%s"`, help, resp.Text)
	completionRespones, err := client.CreateChatCompletion(
		context.Background(),
		openai.ChatCompletionRequest{
			Model: openai.GPT4oMini,
			Messages: []openai.ChatCompletionMessage{{
				Role:    openai.ChatMessageRoleSystem,
				Content: prompt,
			}},
		},
	)

	c.JSON(http.StatusOK, gin.H{"response": completionRespones.Choices[0].Message.Content})
}
