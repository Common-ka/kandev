package sshtransport

import (
	"context"
	"crypto/ed25519"
	"crypto/rand"
	"errors"
	"golang.org/x/crypto/ssh"
	"io"
	"net"
	"strconv"
	"sync/atomic"
	"testing"
)

func managedServer(t *testing.T, forward ...string) (Hop, *atomic.Int32) {
	t.Helper()
	_, key, err := ed25519.GenerateKey(rand.Reader)
	if err != nil {
		t.Fatal(err)
	}
	signer, err := ssh.NewSignerFromKey(key)
	if err != nil {
		t.Fatal(err)
	}
	auth := new(atomic.Int32)
	cfg := &ssh.ServerConfig{PasswordCallback: func(_ ssh.ConnMetadata, password []byte) (*ssh.Permissions, error) {
		auth.Add(1)
		expected := "secret"
		if len(forward) > 0 {
			expected = "bastion-secret"
		}
		if string(password) != expected {
			return nil, errors.New("incorrect credential")
		}
		return nil, nil
	}}
	cfg.AddHostKey(signer)
	l, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = l.Close() })
	go func() {
		for {
			c, e := l.Accept()
			if e != nil {
				return
			}
			go func() {
				defer func() { _ = c.Close() }()
				s, ch, r, e := ssh.NewServerConn(c, cfg)
				if e != nil {
					return
				}
				defer func() { _ = s.Close() }()
				go ssh.DiscardRequests(r)
				for channel := range ch {
					if len(forward) == 0 || channel.ChannelType() != "direct-tcpip" {
						_ = channel.Reject(ssh.Prohibited, "unsupported")
						continue
					}
					peer, err := net.Dial("tcp", forward[0])
					if err != nil {
						_ = channel.Reject(ssh.ConnectionFailed, "unreachable")
						continue
					}
					stream, requests, err := channel.Accept()
					if err != nil {
						_ = peer.Close()
						continue
					}
					go ssh.DiscardRequests(requests)
					go func() {
						defer func() { _ = peer.Close() }()
						defer func() { _ = stream.Close() }()
						_, _ = io.Copy(peer, stream)
					}()
					go func() {
						defer func() { _ = peer.Close() }()
						defer func() { _ = stream.Close() }()
						_, _ = io.Copy(stream, peer)
					}()
				}
			}()
		}
	}()
	host, port, _ := net.SplitHostPort(l.Addr().String())
	p, _ := strconv.Atoi(port)
	return Hop{Host: host, Port: p, User: "user", Fingerprint: ssh.FingerprintSHA256(signer.PublicKey()), Auth: []ssh.AuthMethod{ssh.Password("secret")}}, auth
}

func TestManagedRouteTrustBeforeAuthentication(t *testing.T) {
	for _, mode := range []string{"trusted", "changed", "untrusted"} {
		t.Run(mode, func(t *testing.T) {
			hop, auth := managedServer(t)
			if mode == "changed" {
				hop.Fingerprint = "SHA256:changed"
			}
			if mode == "untrusted" {
				hop.Fingerprint = ""
			}
			client, err := DialRoute(context.Background(), hop, nil)
			if mode == "trusted" {
				if err != nil {
					t.Fatal(err)
				}
				_ = client.Close()
				if auth.Load() != 1 {
					t.Fatalf("auth calls = %d", auth.Load())
				}
				return
			}
			if err == nil {
				_ = client.Close()
				t.Fatal("untrusted host connected")
			}
			if auth.Load() != 0 {
				t.Fatal("sent credentials before host trust")
			}
		})
	}
}

func TestObserveDoesNotAuthenticate(t *testing.T) {
	hop, auth := managedServer(t)
	hop.Fingerprint = ""
	key, err := Observe(context.Background(), hop, nil)
	if err != nil {
		t.Fatal(err)
	}
	if key == nil || auth.Load() != 0 {
		t.Fatal("observation must capture a key without sending credentials")
	}
}

func TestManagedProxyJumpUsesIndependentCredentialsAndPins(t *testing.T) {
	destination, destinationAuth := managedServer(t)
	bastion, bastionAuth := managedServer(t, destination.address())
	bastion.Auth = []ssh.AuthMethod{ssh.Password("bastion-secret")}
	client, err := DialRoute(context.Background(), destination, &bastion)
	if err != nil {
		t.Fatal(err)
	}
	_ = client.Close()
	if destinationAuth.Load() != 1 || bastionAuth.Load() != 1 {
		t.Fatal("both hops must authenticate")
	}
	bastion.Fingerprint = "SHA256:changed"
	if _, err = DialRoute(context.Background(), destination, &bastion); err == nil {
		t.Fatal("changed bastion accepted")
	}
	if destinationAuth.Load() != 1 || bastionAuth.Load() != 1 {
		t.Fatal("credentials sent after bastion trust failure")
	}
}
