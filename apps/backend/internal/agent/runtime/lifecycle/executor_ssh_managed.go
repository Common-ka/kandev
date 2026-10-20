package lifecycle

import (
	"context"
	"github.com/kandev/kandev/internal/sshconnections"
	"golang.org/x/crypto/ssh"
)

const (
	MetadataKeySSHConnectionID              = "ssh_connection_id"
	MetadataKeySSHRouteStamp                = "ssh_route_stamp"
	MetadataKeySSHIdentityGeneration        = "ssh_identity_generation"
	MetadataKeySSHBastionIdentityGeneration = "ssh_bastion_identity_generation"
)

type ManagedSSHConnections interface {
	AdmitRuntime(context.Context, string, string, string) (sshconnections.RuntimeSnapshot, error)
	DialRuntime(context.Context, sshconnections.RuntimeSnapshot) (*ssh.Client, error)
}

func (r *SSHExecutor) SetManagedConnections(resolver ManagedSSHConnections) {
	r.managedConnections = resolver
}

func (r *SSHExecutor) dialSession(ctx context.Context, sessionID string, md map[string]interface{}, allowAdmission bool) (*SSHTarget, *ssh.Client, error) {
	id := getMetadataString(md, MetadataKeySSHConnectionID)
	if id == "" {
		target, err := r.targetFromMetadata(md)
		if err != nil {
			return nil, nil, err
		}
		client, err := dialSSH(ctx, target)
		return target, client, err
	}
	if r.managedConnections == nil {
		return nil, nil, sshconnections.ErrDisabled
	}
	stamp := getMetadataString(md, MetadataKeySSHRouteStamp)
	if stamp == "" && !allowAdmission {
		return nil, nil, sshconnections.ErrConflict
	}
	snapshot, err := r.managedConnections.AdmitRuntime(ctx, sessionID, id, stamp)
	if err != nil {
		return nil, nil, err
	}
	if stamp != "" && (getMetadataString(md, MetadataKeySSHIdentityGeneration) != snapshot.IdentityGeneration || getMetadataString(md, MetadataKeySSHBastionIdentityGeneration) != snapshot.BastionIdentityGeneration) {
		return nil, nil, sshconnections.ErrConflict
	}
	md[MetadataKeySSHRouteStamp] = snapshot.Stamp
	md[MetadataKeySSHIdentityGeneration] = snapshot.IdentityGeneration
	md[MetadataKeySSHBastionIdentityGeneration] = snapshot.BastionIdentityGeneration
	c := snapshot.Destination
	target := &SSHTarget{Host: c.Host, Port: c.Port, User: c.User, PinnedFingerprint: c.Fingerprint}
	client, err := r.managedConnections.DialRuntime(ctx, snapshot)
	if err != nil && stamp == "" {
		delete(md, MetadataKeySSHRouteStamp)
		delete(md, MetadataKeySSHIdentityGeneration)
		delete(md, MetadataKeySSHBastionIdentityGeneration)
	}
	return target, client, err
}
func copyManagedSSHMetadata(dst, src map[string]interface{}) {
	for _, key := range []string{MetadataKeySSHConnectionID, MetadataKeySSHRouteStamp, MetadataKeySSHIdentityGeneration, MetadataKeySSHBastionIdentityGeneration} {
		if value, ok := src[key]; ok {
			dst[key] = value
		}
	}
}
