package handlers

import (
	"gossip-backend/db"
	"net/http"
	"strconv"
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
		TopicID int    `json:"topic_id"`
	}

	// Get user ID from context
	userIDValue, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var userID int
	switch v := userIDValue.(type) {
	case float64:
		userID = int(v)
	case int:
		userID = v
	default:
		c.JSON(http.StatusInternalServerError, gin.H{"error": "invalid user ID type"})
		return
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	var id int
	var createdAt time.Time
	err := db.DB.QueryRow(
		"INSERT INTO posts (title, content, user_id, topic_id) VALUES ($1, $2, $3, $4) RETURNING id, created_at",
		input.Title, input.Content, userID, input.TopicID,
	).Scan(&id, &createdAt)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db error: " + err.Error()})
		return
	}

	var username string
	err = db.DB.QueryRow("SELECT username FROM users WHERE id = $1", userID).Scan(&username)
	if err != nil {
		username = "Unknown"
	}

	c.JSON(http.StatusOK, gin.H{
		"id":         id,
		"title":      input.Title,
		"content":    input.Content,
		"user_id":    userID,
		"username":   username,
		"topic_id":   input.TopicID,
		"created_at": createdAt,
	})
}

// function to handlers/posts.go
func DeletePost(c *gin.Context) {
	postIDStr := c.Param("id")
	postID, err := strconv.Atoi(postIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid post ID"})
		return
	}

	userIDValue, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var reqUserID int
	switch v := userIDValue.(type) {
	case float64:
		reqUserID = int(v)
	case int:
		reqUserID = v
	default:
		c.JSON(http.StatusInternalServerError, gin.H{"error": "invalid user ID type"})
		return
	}

	// Check if the post belongs to the user
	var ownerID int
	err = db.DB.QueryRow("SELECT user_id FROM posts WHERE id = $1", postID).Scan(&ownerID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Post not found"})
		return
	}

	if ownerID != reqUserID {
		c.JSON(http.StatusForbidden, gin.H{"error": "You can only delete your own posts"})
		return
	}

	// Delete the post (comments deleted via CASCADE)
	_, err = db.DB.Exec("DELETE FROM posts WHERE id = $1", postID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete post"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Post deleted successfully"})
}

// function to get posts by user
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
	postId := c.Param("post_id")

	userID, exists := c.Get("userID")

	var likes int
	var liked bool

	// Get total likes count
	err := db.DB.QueryRow(
		"SELECT COUNT(*) FROM post_likes WHERE post_id = $1",
		postId,
	).Scan(&likes)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database error"})
		return
	}

	if exists {
		var userIDInt int
		switch v := userID.(type) {
		case float64:
			userIDInt = int(v)
		case int:
			userIDInt = v
		default:
			userIDInt = 0
		}

		err = db.DB.QueryRow(
			"SELECT EXISTS(SELECT 1 FROM post_likes WHERE post_id = $1 AND user_id = $2)",
			postId, userIDInt,
		).Scan(&liked)

		if err != nil {
			liked = false
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"likes": likes,
		"liked": liked,
	})
}

func ToggleLike(c *gin.Context) {
	postIDStr := c.Param("post_id")
	postID, err := strconv.Atoi(postIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid post ID"})
		return
	}

	userIDValue, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var userID int
	switch v := userIDValue.(type) {
	case float64:
		userID = int(v)
	case int:
		userID = v
	default:
		c.JSON(http.StatusInternalServerError, gin.H{"error": "invalid user ID type"})
		return
	}

	var liked bool
	err = db.DB.QueryRow(
		"SELECT EXISTS(SELECT 1 FROM post_likes WHERE post_id=$1 AND user_id=$2)",
		postID, userID,
	).Scan(&liked)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db error: " + err.Error()})
		return
	}

	if liked {
		// Unlike
		_, err = db.DB.Exec("DELETE FROM post_likes WHERE post_id=$1 AND user_id=$2", postID, userID)
	} else {
		// Like
		_, err = db.DB.Exec("INSERT INTO post_likes (post_id, user_id) VALUES ($1, $2)", postID, userID)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db error: " + err.Error()})
		return
	}

	var count int
	err = db.DB.QueryRow("SELECT COUNT(*) FROM post_likes WHERE post_id=$1", postID).Scan(&count)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db error: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"likes": count, "liked": !liked})
}
