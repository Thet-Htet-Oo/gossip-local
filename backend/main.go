package main

import (
	"gossip-backend/db"
	"gossip-backend/handlers"
	"gossip-backend/middlewares"
	"log"
	"os"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {

	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	db.InitDB()
	defer db.DB.Close()

	gin.SetMode(gin.ReleaseMode)

	r := gin.Default()

	r.Use(cors.New(cors.Config{

		AllowOrigins: []string{
			"http://localhost:3000", // React dev server
		},
		AllowMethods: []string{
			"GET",
			"POST",
			"PUT",
			"DELETE",
			"OPTIONS", 
		},
		AllowHeaders: []string{
			"Origin",
			"Content-Type",
			"Content-Length",
			"Accept-Encoding",
			"X-CSRF-Token",
			"Authorization", 
			"Accept",
			"Cache-Control",
			"X-Requested-With",
		},
		AllowCredentials: true,           
		MaxAge:           12 * time.Hour, 
	}))

	// Public routes 
	r.POST("/login", handlers.Login)

	// Protected routes
	api := r.Group("/api")
	api.Use(middlewares.JWTAuth())
	{
		api.GET("/topics", handlers.GetTopics)
		api.POST("/topics", handlers.CreateTopic)
		api.DELETE("/topics/:id", handlers.DeleteTopic)

		api.GET("/posts", handlers.GetPosts)
		api.POST("/posts", handlers.CreatePost)
		api.DELETE("/posts/:id", handlers.DeletePost)
		api.GET("/posts/user/:user_id", handlers.GetUserPosts)

		api.GET("/comments/:post_id", handlers.GetComments)
		api.POST("/comments", handlers.CreateComment)
		api.DELETE("/comments/:id", handlers.DeleteComment)

		api.GET("/posts/:post_id/likes", handlers.GetPostLikes)
		api.POST("/posts/:post_id/like", handlers.ToggleLike)
	}

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8000"
	}

	log.Printf("Server running on http://localhost:%s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
