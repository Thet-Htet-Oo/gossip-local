package handlers

import (
	"database/sql"
	"net/http"

	"gossip-backend/db"

	"github.com/gin-gonic/gin"
)

type LoginRequest struct {
	Username string `json:"username"`
}

type User struct {
	ID       int    `json:"id"`
	Username string `json:"username"`
}

func Login(c *gin.Context) {
	var req LoginRequest

	// Validate request
	if err := c.ShouldBindJSON(&req); err != nil || req.Username == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid username"})
		return
	}

	var user User

	// Check if user exists
	err := db.DB.QueryRow(
		"SELECT id, username FROM users WHERE username=$1",
		req.Username,
	).Scan(&user.ID, &user.Username)

	if err == sql.ErrNoRows {
		// Create user if not exists
		err = db.DB.QueryRow(
			"INSERT INTO users (username) VALUES ($1) RETURNING id, username",
			req.Username,
		).Scan(&user.ID, &user.Username)

		if err != nil {
			// Log the exact DB error
			c.JSON(http.StatusInternalServerError, gin.H{"error": "cannot create user", "details": err.Error()})
			return
		}
	} else if err != nil {
		// Some other database error
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database error", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, user)
}
