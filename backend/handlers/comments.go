package handlers

import (
	"fmt"
	"gossip-backend/db"
	"net/http"
	"time" // Add this import

	"github.com/gin-gonic/gin"
)

type Comment struct {
	ID              int       `json:"id"` // Change to time.Time
	PostID          int       `json:"post_id"`
	UserID          int       `json:"user_id"`
	Username        string    `json:"username"`
	Content         string    `json:"content"`
	CreatedAt       time.Time `json:"created_at"`
	ParentCommentID *int      `json:"parent_comment_id"`
}

func GetComments(c *gin.Context) {
	postID := c.Param("post_id")

	rows, err := db.DB.Query(`
	SELECT c.id, c.post_id, c.user_id, u.username, c.content, c.parent_comment_id, c.created_at
	FROM comments c
	LEFT JOIN users u ON c.user_id = u.id
	WHERE c.post_id=$1
	ORDER BY c.created_at ASC
	`, postID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close() // Don't forget to close rows!

	var comments []Comment

	for rows.Next() {
		var comment Comment
		// Check for errors during scan
		if err := rows.Scan(
			&comment.ID,
			&comment.PostID,
			&comment.UserID,
			&comment.Username,
			&comment.Content,
			&comment.CreatedAt,
			&comment.ParentCommentID,
		); err != nil {
			continue // Skip this comment if there's an error
		}

		comments = append(comments, comment)
	}

	c.JSON(http.StatusOK, comments)
}

func CreateComment(c *gin.Context) {
	var comment Comment

	if err := c.ShouldBindJSON(&comment); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input"})
		return
	}

	var created Comment

	err := db.DB.QueryRow(`
	INSERT INTO comments (post_id, user_id, content, parent_comment_id)
	VALUES ($1,$2,$3,$4)
	RETURNING id, post_id, user_id, content, parent_comment_id, created_at
	`,
		comment.PostID,
		comment.UserID,
		comment.Content,
		comment.ParentCommentID,
	).Scan(
		&created.ID,
		&created.PostID,
		&created.UserID,
		&created.Content,
		&created.ParentCommentID,
		&created.CreatedAt,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	db.DB.QueryRow(
		"SELECT username FROM users WHERE id=$1",
		created.UserID,
	).Scan(&created.Username)

	c.JSON(http.StatusOK, created)
}

// Add this function to handlers/comments.go
func DeleteComment(c *gin.Context) {
	commentID := c.Param("id")
	userID := c.Query("user_id") // Get user_id from query parameter

	// First check if the comment belongs to the user
	var ownerID int
	err := db.DB.QueryRow("SELECT user_id FROM comments WHERE id = $1", commentID).Scan(&ownerID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Comment not found"})
		return
	}

	// Convert userID to int for comparison
	var reqUserID int
	fmt.Sscanf(userID, "%d", &reqUserID)

	if ownerID != reqUserID {
		c.JSON(http.StatusForbidden, gin.H{"error": "You can only delete your own comments"})
		return
	}

	// Delete the comment
	_, err = db.DB.Exec("DELETE FROM comments WHERE id = $1", commentID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete comment"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Comment deleted successfully"})
}
