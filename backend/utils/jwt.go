package utils

import (
	"gossip-backend/config"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

func GenerateToken(userID int, username string) (string, error) {
	claims := jwt.MapClaims{
		"id":       userID,
		"username": username,
		"exp":      time.Now().Add(time.Hour * 24).Unix(), // 1 day expiry
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(config.JwtSecret)
}
