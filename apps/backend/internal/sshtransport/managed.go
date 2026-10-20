package sshtransport

import (
	"context"
	"errors"
	"fmt"
	"golang.org/x/crypto/ssh"
	"net"
	"strconv"
)

const destinationHop = "destination"

// Hop contains the resolved endpoint and credentials for one explicitly trusted host.
type Hop struct {
	Host        string
	Port        int
	User        string
	Fingerprint string
	Auth        []ssh.AuthMethod
}

// HopError identifies the failed hop while retaining its cause for internal classification.
type HopError struct {
	Hop string
	Err error
}

func (e *HopError) Error() string { return fmt.Sprintf("ssh %s: %v", e.Hop, e.Err) }
func (e *HopError) Unwrap() error { return e.Err }

func (h Hop) address() string { return net.JoinHostPort(h.Host, strconv.Itoa(h.Port)) }
func (h Hop) config() (*ssh.ClientConfig, error) {
	if h.Host == "" || h.Port < 1 || h.Port > 65535 || h.User == "" {
		return nil, errors.New("invalid endpoint")
	}
	if h.Fingerprint == "" {
		return nil, errors.New("host trust required")
	}
	return &ssh.ClientConfig{User: h.User, Auth: h.Auth, Timeout: sshDialTimeout, HostKeyCallback: func(_ string, _ net.Addr, key ssh.PublicKey) error {
		got := SSHFingerprint(key)
		if got != h.Fingerprint {
			return &HostKeyMismatchError{Expected: h.Fingerprint, Got: got}
		}
		return nil
	}}, nil
}

// DialRoute authenticates each hop independently without reading SSH configuration.
func DialRoute(ctx context.Context, destination Hop, bastion *Hop) (*ssh.Client, error) {
	cfg, err := destination.config()
	if err != nil {
		return nil, &HopError{destinationHop, err}
	}
	return dialConfigured(ctx, destination, cfg, bastion)
}

func dialConfigured(ctx context.Context, destination Hop, cfg *ssh.ClientConfig, bastion *Hop) (*ssh.Client, error) {
	ctx, cancel := context.WithTimeout(ctx, sshDialTimeout)
	defer cancel()
	if bastion == nil {
		client, err := dialDirect(ctx, destination.address(), cfg)
		if err != nil {
			return nil, &HopError{destinationHop, err}
		}
		return client, nil
	}
	bc, err := bastion.config()
	if err != nil {
		return nil, &HopError{"bastion", err}
	}
	b, err := dialDirect(ctx, bastion.address(), bc)
	if err != nil {
		return nil, &HopError{"bastion", err}
	}
	tunnel, err := b.DialContext(ctx, "tcp", destination.address())
	if err != nil {
		_ = b.Close()
		return nil, &HopError{destinationHop, err}
	}
	owned := &sshProxyJumpConn{Conn: tunnel, bastion: b}
	conn, ch, r, err := handshakeWithDeadline(ctx, owned, destination.address(), cfg)
	if err != nil {
		_ = owned.Close()
		return nil, &HopError{destinationHop, err}
	}
	client := ssh.NewClient(conn, ch, r)
	go func() { _ = client.Wait(); _ = owned.Close() }()
	return client, nil
}

// Observe captures a host key during key exchange and aborts before authentication.
func Observe(ctx context.Context, destination Hop, bastion *Hop) (ssh.PublicKey, error) {
	destination.Fingerprint = "observation"
	cfg, err := destination.config()
	if err != nil {
		return nil, err
	}
	cfg.Auth = nil
	observed := errors.New("host key observed")
	var key ssh.PublicKey
	cfg.HostKeyCallback = func(_ string, _ net.Addr, k ssh.PublicKey) error { key = k; return observed }
	_, err = dialConfigured(ctx, destination, cfg, bastion)
	if errors.Is(err, observed) && key != nil {
		return key, nil
	}
	return nil, err
}
