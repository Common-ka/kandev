package sshconnections

import (
	"context"
	"encoding/json"
	"github.com/jmoiron/sqlx"
	"time"
)

func (s *Service) AdoptConnection(ctx context.Context, executorID, digest, id, stamp string) error {
	actor, err := s.authorize(ctx)
	if err != nil {
		return err
	}
	return s.store.write(ctx, func(tx *sqlx.Tx) error {
		config, kind, err := executorConfigIn(ctx, tx, executorID)
		if err != nil {
			return err
		}
		if kind != executorKindSSH || configDigest(config) != digest || config[ConnectionConfigKey] != "" {
			return ErrConflict
		}
		preview, err := previewLegacy(config)
		if err != nil {
			return err
		}
		route, err := routeIn(ctx, tx, id)
		if err != nil {
			return err
		}
		if stamp == "" || route.Stamp != stamp {
			return ErrConflict
		}
		if err = matchAdoptionIn(ctx, tx, preview, route); err != nil {
			return err
		}
		for _, key := range []string{sshHostConfigKey, "ssh_port", "ssh_user", "ssh_host_alias", "ssh_host_fingerprint", "ssh_identity_source", "ssh_identity_file", "ssh_proxy_jump"} {
			delete(config, key)
		}
		config[ConnectionConfigKey] = id
		config["ssh_connection_stamp"] = stamp
		if err = s.BindExecutorIn(ctx, tx, executorID, kind, config); err != nil {
			return err
		}
		data, err := json.Marshal(config)
		if err != nil {
			return err
		}
		if _, err = tx.ExecContext(ctx, tx.Rebind(`UPDATE executors SET config=?,updated_at=? WHERE id=? AND deleted_at IS NULL`), string(data), time.Now().UTC(), executorID); err != nil {
			return err
		}
		return audit(ctx, tx, actor, executorID, "executor.adopt", "saved")
	})
}
func matchAdoptionIn(ctx context.Context, tx *sqlx.Tx, preview AdoptionPreview, route Route) error {
	if err := matchAdoptionHopIn(ctx, tx, preview.Destination, route.Destination); err != nil {
		return err
	}
	if (preview.Bastion == nil) != (route.Bastion == nil) {
		return ErrInvalidRoute
	}
	if preview.Bastion != nil {
		return matchAdoptionHopIn(ctx, tx, *preview.Bastion, *route.Bastion)
	}
	return nil
}
func matchAdoptionHopIn(ctx context.Context, tx *sqlx.Tx, expected AdoptionTarget, c Connection) error {
	if c.Host != expected.Host || c.Port != expected.Port || c.User != expected.User {
		return ErrInvalidRoute
	}
	if expected.Fingerprint != "" && expected.Fingerprint != c.Fingerprint {
		return ErrTrust
	}
	identity, err := identityIn(ctx, tx, c.IdentityID)
	if err != nil {
		return err
	}
	if identity.Kind != expected.IdentityKind || identity.Reference != expected.IdentityReference {
		return ErrInvalidIdentity
	}
	return nil
}
