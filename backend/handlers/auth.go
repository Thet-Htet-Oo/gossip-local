package handlers

import (
	"database/sql"
	"net/http"

	"gossip-backend/db"
	"gossip-backend/utils"

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

	if err := c.ShouldBindJSON(&req); err != nil || req.Username == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid username"})
		return
	}

	var user User
	err := db.DB.QueryRow(
		"SELECT id, username FROM users WHERE username=$1",
		req.Username,
	).Scan(&user.ID, &user.Username)

	if err == sql.ErrNoRows {
		err = db.DB.QueryRow(
			"INSERT INTO users (username) VALUES ($1) RETURNING id, username",
			req.Username,
		).Scan(&user.ID, &user.Username)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "cannot create user", "details": err.Error()})
			return
		}
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database error", "details": err.Error()})
		return
	}

	// Generate JWT
	token, err := utils.GenerateToken(user.ID, user.Username)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "cannot generate token", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"user":  user,
		"token": token,
	})
}
