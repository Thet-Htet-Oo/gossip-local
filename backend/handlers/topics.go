package handlers

import (
	"fmt"
	"net/http"

	"gossip-backend/db"

	"github.com/gin-gonic/gin"
)

type Topic struct {
	ID          int    `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
}

func GetTopics(c *gin.Context) {
	rows, err := db.DB.Query("SELECT id, title, description FROM topics ORDER BY id DESC")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database error"})
		return
	}
	defer rows.Close()

	var topics []Topic

	for rows.Next() {
		var t Topic
		rows.Scan(&t.ID, &t.Title, &t.Description)
		topics = append(topics, t)
	}

	c.JSON(http.StatusOK, topics)
}

func CreateTopic(c *gin.Context) {
	var topic Topic

	if err := c.ShouldBindJSON(&topic); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	fmt.Println("Received topic:", topic)

	err := db.DB.QueryRow(
		"INSERT INTO topics (title, description) VALUES ($1,$2) RETURNING id",
		topic.Title,
		topic.Description,
	).Scan(&topic.ID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database error"})
		return
	}

	c.JSON(http.StatusOK, topic)
}

func DeleteTopic(c *gin.Context) {
	// Get topic ID from URL
	topicID := c.Param("id")

	_, err := db.DB.Exec("DELETE FROM topics WHERE id = $1", topicID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db error"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Topic deleted"})
}
