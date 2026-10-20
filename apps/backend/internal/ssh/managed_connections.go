package ssh

import (
	"context"
	"errors"
	"github.com/kandev/kandev/internal/sshconnections"
	"github.com/kandev/kandev/internal/sshtransport"
	"github.com/kandev/kandev/internal/task/models"
	"golang.org/x/crypto/ssh"
	"net/http"
)

type ManagedConnections interface {
	OpenConnectionForManagement(context.Context, string, string) (*ssh.Client, *sshtransport.SSHTarget, func(), error)
	OpenExecutorForManagement(context.Context, string) (*ssh.Client, *sshtransport.SSHTarget, func(), error)
}

func (h *Handler) openExecutor(ctx context.Context, id string) (*ssh.Client, *sshtransport.SSHTarget, func(), int, error) {
	empty := func() {}
	executor, err := h.executorFetcher.GetExecutor(ctx, id)
	if err != nil {
		status := http.StatusInternalServerError
		if errors.Is(err, models.ErrExecutorNotFound) {
			status = http.StatusNotFound
		}
		return nil, nil, empty, status, err
	}
	if executor != nil && executor.Config[sshconnections.ConnectionConfigKey] != "" {
		if h.managedConnections == nil {
			return nil, nil, empty, http.StatusServiceUnavailable, sshconnections.ErrDisabled
		}
		client, target, cleanup, err := h.managedConnections.OpenExecutorForManagement(ctx, id)
		status := http.StatusOK
		if err != nil {
			status = http.StatusBadGateway
		}
		if errors.Is(err, sshconnections.ErrForbidden) {
			status = http.StatusForbidden
		}
		return client, target, cleanup, status, err
	}
	target, status, err := h.resolveSSHTarget(ctx, id)
	if err != nil {
		return nil, nil, empty, status, err
	}
	client, err := sshtransport.DialSSH(ctx, target)
	if err != nil {
		return nil, nil, empty, http.StatusBadGateway, err
	}
	return client, target, func() { _ = client.Close() }, http.StatusOK, nil
}

func (h *Handler) testOpen(ctx context.Context, req TestRequest, result *TestResult) (*ssh.Client, func(), error) {
	if req.ConnectionID == "" {
		target, err := h.testResolveTarget(req, result)
		if err != nil {
			return nil, func() {}, err
		}
		client, err := h.testHandshake(ctx, target, result)
		if err != nil {
			return nil, func() {}, err
		}
		return client, func() { _ = client.Close() }, nil
	}
	if h.managedConnections == nil {
		result.Error = sshconnections.ErrDisabled.Error()
		return nil, func() {}, sshconnections.ErrDisabled
	}
	if req.Host != "" || req.HostAlias != "" || req.Port != 0 || req.User != "" || req.IdentitySrc != "" || req.IdentityFile != "" || req.ProxyJump != "" {
		result.Error = sshconnections.ErrInvalidRoute.Error()
		return nil, func() {}, sshconnections.ErrInvalidRoute
	}
	client, target, cleanup, err := h.managedConnections.OpenConnectionForManagement(ctx, req.ConnectionID, req.Stamp)
	if err != nil {
		result.Error = err.Error()
		return nil, func() {}, err
	}
	result.Fingerprint = target.PinnedFingerprint
	result.Steps = append(result.Steps, TestStep{Name: "SSH handshake", Success: true})
	return client, cleanup, nil
}
