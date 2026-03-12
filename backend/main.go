package main

import (
	"gossip-backend/db"
	"gossip-backend/handlers"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	db.InitDB() // initialize DB

	r := gin.Default()

	// ✅ Enable CORS
	r.Use(cors.Default()) // allows all origins, methods, headers

	// Authentication route
	r.POST("/login", handlers.Login)

	// API routes
	api := r.Group("/api")
	{
		api.GET("/topics", handlers.GetTopics)
		api.POST("/topics", handlers.CreateTopic)
		api.DELETE("/topics/:id", handlers.DeleteTopic)

		api.GET("/posts", handlers.GetPosts)
		api.POST("/posts", handlers.CreatePost)
		api.GET("/posts/user/:user_id", handlers.GetUserPosts)
		api.DELETE("/posts/:id", handlers.DeletePost)

		api.GET("/comments/:post_id", handlers.GetComments)
		api.POST("/comments", handlers.CreateComment)
		api.DELETE("/comments/:id", handlers.DeleteComment)

		api.GET("/posts/:post_id/likes", handlers.GetPostLikes)
		api.POST("/posts/:post_id/like", handlers.ToggleLike)

	}

	r.Run(":8000")
}
