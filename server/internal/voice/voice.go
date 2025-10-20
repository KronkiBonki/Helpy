package voice

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

func GetVoiceResponse(c *gin.Context) {
	cookie, err := c.Cookie("auth")
	if err != nil {
		log.Println(err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Error couldn't get the cookie for auth"})
		return
	}
}
