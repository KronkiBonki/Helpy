package main

import (
	"github.com/KronkiBonki/Helpy/internal/auth"
	customhelp "github.com/KronkiBonki/Helpy/internal/custom_help"
	"github.com/KronkiBonki/Helpy/internal/middleware"
	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()

	r.GET("/auth", auth.GetAuth)

	customHelp := r.Group("custom-help")
	customHelp.Use(middleware.AuthMiddleware)
	customHelp.GET("", customhelp.GetCustomHelpMessages)
	customHelp.POST("", middleware.JSONParserMiddleware, customhelp.CreateCustomHelpMessage)

	r.Run("localhost:42069")
}
