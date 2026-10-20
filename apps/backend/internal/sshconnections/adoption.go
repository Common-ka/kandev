package sshconnections

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"github.com/kandev/kandev/internal/sshtransport"
	"os"
	"strconv"
)

type AdoptionTarget struct {
	Host              string `json:"host"`
	Port              int    `json:"port"`
	User              string `json:"user"`
	Fingerprint       string `json:"fingerprint"`
	IdentityKind      string `json:"identity_kind"`
	IdentityReference string `json:"identity_reference"`
}
type AdoptionPreview struct {
	ConfigDigest string          `json:"config_digest"`
	Destination  AdoptionTarget  `json:"destination"`
	Bastion      *AdoptionTarget `json:"bastion,omitempty"`
}

func configDigest(config map[string]string) string {
	data, _ := json.Marshal(config)
	sum := sha256.Sum256(data)
	return hex.EncodeToString(sum[:])
}
func (s *Service) PreviewAdoption(ctx context.Context, id string) (AdoptionPreview, error) {
	if _, err := s.authorize(ctx); err != nil {
		return AdoptionPreview{}, err
	}
	tx, err := s.store.db.BeginTxx(ctx, nil)
	if err != nil {
		return AdoptionPreview{}, err
	}
	defer func() { _ = tx.Rollback() }()
	config, kind, err := executorConfigIn(ctx, tx, id)
	if err != nil {
		return AdoptionPreview{}, err
	}
	if kind != executorKindSSH || config[ConnectionConfigKey] != "" {
		return AdoptionPreview{}, ErrInvalidRoute
	}
	return previewLegacy(config)
}
func previewLegacy(config map[string]string) (AdoptionPreview, error) {
	port, err := strconv.Atoi(config["ssh_port"])
	if config["ssh_port"] != "" && err != nil {
		return AdoptionPreview{}, ErrInvalidRoute
	}
	target, err := sshtransport.ResolveSSHTarget(sshtransport.SSHConnConfig{HostAlias: config["ssh_host_alias"], Host: config[sshHostConfigKey], Port: port, User: config["ssh_user"], IdentitySource: sshtransport.SSHIdentitySource(config["ssh_identity_source"]), IdentityFile: config["ssh_identity_file"], ProxyJump: config["ssh_proxy_jump"], PinnedFingerprint: config["ssh_host_fingerprint"]})
	if err != nil {
		return AdoptionPreview{}, ErrInvalidRoute
	}
	out := AdoptionPreview{ConfigDigest: configDigest(config), Destination: adoptionTarget(target)}
	bastion, err := sshtransport.ResolveSingleBastion(target)
	if err != nil {
		return AdoptionPreview{}, ErrInvalidRoute
	}
	if bastion != nil {
		b := adoptionTarget(bastion)
		b.Fingerprint = ""
		out.Bastion = &b
	}
	return out, nil
}
func adoptionTarget(target *sshtransport.SSHTarget) AdoptionTarget {
	reference := target.IdentityFile
	if target.IdentitySource == sshtransport.SSHIdentitySourceAgent {
		reference = target.IdentityAgent
		if reference == "" {
			reference = os.Getenv("SSH_AUTH_SOCK")
		}
	}
	return AdoptionTarget{Host: target.Host, Port: target.Port, User: target.User, Fingerprint: target.PinnedFingerprint, IdentityKind: string(target.IdentitySource), IdentityReference: reference}
}
