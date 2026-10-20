package sshconnections

import "github.com/gin-gonic/gin"

func registerAdoptionRoutes(group *gin.RouterGroup, s *Service) {
	group.GET("/executors/:id/adoption-preview", func(c *gin.Context) {
		value, err := s.PreviewAdoption(c.Request.Context(), c.Param("id"))
		respond(c, value, err)
	})
	group.POST("/executors/:id/adoption-drafts", func(c *gin.Context) {
		var req struct {
			Digest    string `json:"expected_config_digest"`
			RequestID string `json:"request_id"`
		}
		if !decode(c, &req) {
			return
		}
		value, err := s.CreateAdoptionDrafts(c.Request.Context(), c.Param("id"), req.Digest, req.RequestID)
		respond(c, value, err)
	})
	group.POST("/executors/:id/adopt-connection", func(c *gin.Context) {
		var req struct {
			Digest       string `json:"expected_config_digest"`
			ConnectionID string `json:"connection_id"`
			Stamp        string `json:"expected_stamp"`
		}
		if !decode(c, &req) {
			return
		}
		err := s.AdoptConnection(c.Request.Context(), c.Param("id"), req.Digest, req.ConnectionID, req.Stamp)
		respond(c, gin.H{"adopted": err == nil}, err)
	})
}
