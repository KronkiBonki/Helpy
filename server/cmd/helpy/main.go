package main

import (
	"time"

	"github.com/KronkiBonki/Helpy/internal/auth"
	customhelp "github.com/KronkiBonki/Helpy/internal/custom_help"
	"github.com/KronkiBonki/Helpy/internal/middleware"
	"github.com/KronkiBonki/Helpy/internal/voice"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:8080"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	r.GET("/auth", auth.GetAuth)
	r.GET("/cookie", auth.HasCookie)
	r.POST("/voice", middleware.AuthMiddleware, middleware.JSONParserMiddleware, voice.GetVoiceResponse)

	customHelp := r.Group("custom-help")
	customHelp.Use(middleware.AuthMiddleware)
	customHelp.GET("", customhelp.GetCustomHelpMessages)
	customHelp.POST("", middleware.JSONParserMiddleware, customhelp.CreateCustomHelpMessage)
	customHelp.PUT("/:messageID", middleware.JSONParserMiddleware, customhelp.UpdateCustomHelpMessage)
	customHelp.DELETE("/:messageID", customhelp.DeleteCustomHelpMessage)

	r.Run("localhost:42069")
}
