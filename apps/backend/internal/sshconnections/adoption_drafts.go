package sshconnections

import (
	"context"
	"encoding/json"
	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
)

func (s *Service) CreateAdoptionDrafts(ctx context.Context, id, digest, requestID string) (Route, error) {
	actor, err := s.authorize(ctx)
	if err != nil {
		return Route{}, err
	}
	if _, err = uuid.Parse(requestID); err != nil {
		return Route{}, ErrInvalidRoute
	}
	var result Route
	err = s.store.write(ctx, func(tx *sqlx.Tx) error {
		config, kind, err := executorConfigIn(ctx, tx, id)
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
		c := Connection{Name: "SSH " + preview.Destination.Host, Host: preview.Destination.Host, Port: preview.Destination.Port, User: preview.Destination.User}
		// Bind retries to the original config as well as its resolved destination.
		c.Alias = id + ":" + digest
		prior, err := createConnectionRequest(ctx, tx, actor, requestID, &c)
		if err != nil {
			return err
		}
		if prior {
			result, err = routeIn(ctx, tx, c.ID)
			return err
		}
		c.Alias = config["ssh_host_alias"]
		if preview.Bastion != nil {
			b, err := createAdoptionHopIn(ctx, tx, actor, uuid.NewString(), *preview.Bastion)
			if err != nil {
				return err
			}
			c.BastionID = b.ID
		}
		destination, err := createAdoptionHopIn(ctx, tx, actor, c.ID, preview.Destination)
		if err != nil {
			return err
		}
		destination.BastionID = c.BastionID
		destination.Alias = c.Alias
		if err = putConnection(ctx, tx, destination); err != nil {
			return err
		}
		result, err = routeIn(ctx, tx, destination.ID)
		return err
	})
	return result, err
}
func createAdoptionHopIn(ctx context.Context, tx *sqlx.Tx, actor, id string, target AdoptionTarget) (Connection, error) {
	identity, _, err := makeIdentity(CreateIdentityRequest{Label: "SSH " + target.Host, Kind: target.IdentityKind, Reference: target.IdentityReference})
	if err != nil {
		return Connection{}, err
	}
	data, err := json.Marshal(identity)
	if err != nil {
		return Connection{}, err
	}
	if _, err = tx.ExecContext(ctx, tx.Rebind(`INSERT INTO ssh_identities(id,data) VALUES (?,?)`), identity.ID, string(data)); err != nil {
		return Connection{}, err
	}
	c := Connection{ID: id, Name: "SSH " + target.Host, Host: target.Host, Port: target.Port, User: target.User, IdentityID: identity.ID, Fingerprint: target.Fingerprint, Version: 1, Revision: 1}
	if err = putConnection(ctx, tx, c); err != nil {
		return Connection{}, err
	}
	if err = audit(ctx, tx, actor, identity.ID, "identity.create", "adopted_reference"); err != nil {
		return Connection{}, err
	}
	return c, audit(ctx, tx, actor, c.ID, "connection.create", "adoption_draft")
}
