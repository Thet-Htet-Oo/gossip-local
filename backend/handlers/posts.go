package handlers

import (
	"fmt"
	"gossip-backend/db"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

type Post struct {
	ID        int       `json:"id"`
	Title     string    `json:"title"`
	Content   string    `json:"content"`
	Username  string    `json:"username"`
	TopicID   int       `json:"topic_id"`
	CreatedAt time.Time `json:"created_at"`
}

// Get all posts
func GetPosts(c *gin.Context) {
	rows, err := db.DB.Query(`
		SELECT p.id, p.title, p.content, u.username, p.topic_id, p.created_at
		FROM posts p
		LEFT JOIN users u ON p.user_id = u.id
		ORDER BY p.created_at DESC
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db error"})
		return
	}
	defer rows.Close()

	posts := []Post{}
	for rows.Next() {
		var p Post
		if err := rows.Scan(&p.ID, &p.Title, &p.Content, &p.Username, &p.TopicID, &p.CreatedAt); err != nil {
			continue
		}
		posts = append(posts, p)
	}

	c.JSON(http.StatusOK, posts)
}

// Create new post
func CreatePost(c *gin.Context) {
	var input struct {
		Title   string `json:"title"`
		Content string `json:"content"`
		UserID  int    `json:"user_id"`
		TopicID int    `json:"topic_id"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	var id int
	var createdAt time.Time
	var username string
	err := db.DB.QueryRow(
		"INSERT INTO posts (title, content, user_id, topic_id) VALUES ($1, $2, $3, $4) RETURNING id, created_at",
		input.Title, input.Content, input.UserID, input.TopicID,
	).Scan(&id, &createdAt)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db error"})
		return
	}

	err = db.DB.QueryRow("SELECT username FROM users WHERE id = $1", input.UserID).Scan(&username)
	if err != nil {
		username = "Unknown"
	}

	c.JSON(http.StatusOK, gin.H{
		"id":         id,
		"title":      input.Title,
		"content":    input.Content,
		"user_id":    input.UserID,
		"username":   username,
		"topic_id":   input.TopicID,
		"created_at": createdAt,
	})
}

// Add this function to handlers/posts.go
func DeletePost(c *gin.Context) {
	postID := c.Param("id")
	userID := c.Query("user_id") // Get user_id from query parameter

	// First check if the post belongs to the user
	var ownerID int
	err := db.DB.QueryRow("SELECT user_id FROM posts WHERE id = $1", postID).Scan(&ownerID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Post not found"})
		return
	}

	// Convert userID to int for comparison
	var reqUserID int
	fmt.Sscanf(userID, "%d", &reqUserID)

	if ownerID != reqUserID {
		c.JSON(http.StatusForbidden, gin.H{"error": "You can only delete your own posts"})
		return
	}

	// Delete the post (comments will be deleted automatically due to CASCADE)
	_, err = db.DB.Exec("DELETE FROM posts WHERE id = $1", postID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete post"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Post deleted successfully"})
}

// Add this function to get posts by user
func GetUserPosts(c *gin.Context) {
	userID := c.Param("user_id")

	rows, err := db.DB.Query(`
        SELECT p.id, p.title, p.content, u.username, p.topic_id, p.created_at
        FROM posts p
        LEFT JOIN users u ON p.user_id = u.id
        WHERE p.user_id = $1
        ORDER BY p.created_at DESC
    `, userID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db error"})
		return
	}
	defer rows.Close()

	posts := []Post{}
	for rows.Next() {
		var p Post
		if err := rows.Scan(&p.ID, &p.Title, &p.Content, &p.Username, &p.TopicID, &p.CreatedAt); err != nil {
			continue
		}
		posts = append(posts, p)
	}

	c.JSON(http.StatusOK, posts)
}

// Post Like
func GetPostLikes(c *gin.Context) {
	postID := c.Param("post_id")

	var count int
	err := db.DB.QueryRow("SELECT COUNT(*) FROM post_likes WHERE post_id = $1", postID).Scan(&count)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db error"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"likes": count})
}

func ToggleLike(c *gin.Context) {
	postID := c.Param("post_id")

	var input struct {
		UserID int `json:"user_id"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	// Check if like exists
	var exists bool
	err := db.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM post_likes WHERE post_id=$1 AND user_id=$2)", postID, input.UserID).Scan(&exists)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db error"})
		return
	}

	if exists {
		// Unlike
		_, err = db.DB.Exec("DELETE FROM post_likes WHERE post_id=$1 AND user_id=$2", postID, input.UserID)
	} else {
		// Like
		_, err = db.DB.Exec("INSERT INTO post_likes (post_id, user_id) VALUES ($1, $2)", postID, input.UserID)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db error"})
		return
	}

	// Return updated like count
	var count int
	db.DB.QueryRow("SELECT COUNT(*) FROM post_likes WHERE post_id = $1", postID).Scan(&count)
	c.JSON(http.StatusOK, gin.H{"likes": count, "liked": !exists})
}
