package middleware

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

func AuthMiddleware(c *gin.Context) {
	cookie, err := c.Cookie("auth")
	if err != nil {
		log.Println(err)
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Error couldn't get the cookie for auth"})
		return
	}

	c.Set("cookie", cookie)
}

func JSONParserMiddleware(c *gin.Context) {
	var info map[string]string
	err := json.NewDecoder(c.Request.Body).Decode(&info)
	if err != nil {
		log.Println(err)
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "Error unable to decode the json info"})
		return
	}

	for k, v := range info {
		c.Set(k, v)
	}
}
