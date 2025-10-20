package main

import (
	"github.com/KronkiBonki/Helpy/internal/auth"
	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()

	r.GET("/auth", auth.GetAuth)

	r.Run("localhost:42069")
}
