package voice

import (
	"context"
	"log"
	"net/http"
	"os"
	"sync"

	"github.com/gin-gonic/gin"
	openai "github.com/sashabaranov/go-openai"
)

// O4 Mini
var mu = sync.Mutex{}

func GetVoiceResponse(c *gin.Context) {
	mu.Lock()
	defer mu.Unlock()

	audioI8 := c.GetInt8Slice("audio")
	var audio []byte
	for _, tone := range audioI8 {
		audio = append(audio, byte(tone))
	}

	file, err := os.OpenFile("audio.mp3", os.O_CREATE|os.O_WRONLY, 0777)
	if err != nil {
		log.Println(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error unable to create an audio file"})
		return
	}
	defer file.Close()

	_, err = file.Write(audio)
	if err != nil {
		log.Println(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error unable to write the file"})
		return
	}

	client := openai.NewClient(os.Getenv("GPT_API_KEY"))

	resp, err := client.CreateTranscription(
		context.Background(),
		openai.AudioRequest{
			Model:    openai.Whisper1,
			FilePath: "audio.mp3",
		},
	)
	if err != nil {
		log.Println(err)
		c.JSON(http.StatusFailedDependency, gin.H{"error": "Error unable to convert the audio to text"})
		return
	}

	completionRespones, err := client.CreateChatCompletion(
		context.Background(),
		openai.ChatCompletionRequest{
			Model: openai.GPT4oMini,
			Messages: []openai.ChatCompletionMessage{{
				Role:    openai.ChatMessageRoleAssistant,
				Content: resp.Text,
			}},
		},
	)

	c.JSON(http.StatusOK, gin.H{"response": completionRespones.Choices[0].Message.Content})
}
