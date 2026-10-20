package sshconnections

import (
	"context"
	"encoding/json"
	"github.com/jmoiron/sqlx"
	"golang.org/x/crypto/ssh"
	"time"
)

type RuntimeSnapshot struct {
	SessionID string
	Route
	IdentityGeneration        string
	BastionIdentityGeneration string
}

// AdmitRuntime is an internal lifecycle capability, reached after task/session
// authorization. The saved session binding, never caller routing fields, selects
// credentials. A durable reference protects the route before any remote effects.
func (s *Service) AdmitRuntime(ctx context.Context, sessionID, id, stamp string) (RuntimeSnapshot, error) {
	if !s.enabled {
		return RuntimeSnapshot{}, ErrDisabled
	}
	if sessionID == "" || id == "" {
		return RuntimeSnapshot{}, ErrInvalidRoute
	}
	var snapshot RuntimeSnapshot
	err := s.store.write(ctx, func(tx *sqlx.Tx) error {
		route, err := routeIn(ctx, tx, id)
		if err != nil {
			return err
		}
		if stamp != "" && stamp != route.Stamp {
			return ErrConflict
		}
		var refs []struct {
			ConnectionID string `db:"connection_id"`
			Stamp        string `db:"route_stamp"`
		}
		if err = tx.SelectContext(ctx, &refs, tx.Rebind(`SELECT connection_id,route_stamp FROM ssh_connection_refs WHERE owner_type IN ('runtime','runtime_pending') AND owner_id=?`), sessionID); err != nil {
			return err
		}
		if len(refs) > 0 && (refs[0].ConnectionID != id || refs[0].Stamp != route.Stamp) {
			return ErrConflict
		}
		if len(refs) == 0 {
			if err = admitRuntimeReferenceIn(ctx, tx, sessionID, id, stamp, route); err != nil {
				return err
			}
		}

		snapshot, err = runtimeSnapshotIn(ctx, tx, sessionID, route)
		return err
	})
	return snapshot, err
}
func validateRuntimeBinding(ctx context.Context, tx *sqlx.Tx, sessionID, id string, route Route) error {
	var data string
	if err := tx.GetContext(ctx, &data, tx.Rebind(`SELECT e.config FROM executors e JOIN task_sessions s ON s.executor_id=e.id WHERE s.id=? AND e.deleted_at IS NULL`), sessionID); err != nil {
		return ErrInvalidRoute
	}
	var config map[string]string
	if json.Unmarshal([]byte(data), &config) != nil || config[ConnectionConfigKey] != id {
		return ErrInvalidRoute
	}
	if route.Destination.VerifiedRoute != route.Stamp {
		return ErrInvalidRoute
	}
	if route.Bastion != nil {
		b, err := routeIn(ctx, tx, route.Bastion.ID)
		if err != nil {
			return err
		}
		if b.Destination.VerifiedRoute != b.Stamp {
			return ErrBastionNotReady
		}
	}
	return nil
}
func runtimeSnapshotIn(ctx context.Context, tx *sqlx.Tx, sessionID string, route Route) (RuntimeSnapshot, error) {
	out := RuntimeSnapshot{SessionID: sessionID, Route: route}
	identity, err := identityIn(ctx, tx, route.Destination.IdentityID)
	if err != nil {
		return out, ErrCredential
	}
	out.IdentityGeneration = identity.Generation
	if route.Bastion != nil {
		identity, err = identityIn(ctx, tx, route.Bastion.IdentityID)
		if err != nil {
			return out, ErrCredential
		}
		out.BastionIdentityGeneration = identity.Generation
	}
	return out, nil
}

func (s *Service) DialRuntime(ctx context.Context, snapshot RuntimeSnapshot) (*ssh.Client, error) {
	current, err := s.AdmitRuntime(ctx, snapshot.SessionID, snapshot.Destination.ID, snapshot.Stamp)
	if err != nil {
		return nil, err
	}
	if current.IdentityGeneration != snapshot.IdentityGeneration || current.BastionIdentityGeneration != snapshot.BastionIdentityGeneration {
		return nil, ErrConflict
	}
	client, err := s.dialProtectedRoute(ctx, current.Route)
	if err != nil {
		s.releasePendingRuntime(ctx, snapshot.SessionID)
		return nil, err
	}
	if err = s.confirmRuntime(ctx, snapshot); err != nil {
		_ = client.Close()
		return nil, err
	}
	return client, nil
}

// ReleaseRuntimeIn accompanies deletion of the retained executor record. A
// stopped resumable record keeps its reference until the record is deleted.
func (s *Service) ReleaseRuntimeIn(ctx context.Context, tx *sqlx.Tx, sessionID string) error {
	if _, err := tx.ExecContext(ctx, `UPDATE ssh_connection_lock SET revision=revision+1 WHERE id=1`); err != nil {
		return err
	}
	_, err := tx.ExecContext(ctx, tx.Rebind(`DELETE FROM ssh_connection_refs WHERE owner_type IN ('runtime','runtime_pending') AND owner_id=?`), sessionID)
	return err
}

func admitRuntimeReferenceIn(ctx context.Context, tx *sqlx.Tx, sessionID, id, stamp string, route Route) error {
	if stamp != "" {
		return ErrConflict
	}
	if err := validateRuntimeBinding(ctx, tx, sessionID, id, route); err != nil {
		return err
	}
	_, err := tx.ExecContext(ctx, tx.Rebind(`INSERT INTO ssh_connection_refs(owner_type,owner_id,connection_id,route_stamp) VALUES ('runtime_pending',?,?,?)`), sessionID, id, route.Stamp)
	return err
}

// ValidateSession checks local prerequisites without authenticating remotely.
// Admission rechecks under the graph lock immediately before dialing.
func (s *Service) ValidateSession(ctx context.Context, sessionID string) error {
	tx, err := s.store.db.BeginTxx(ctx, nil)
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback() }()
	var row struct {
		ID     string `db:"id"`
		Type   string `db:"type"`
		Config string `db:"config"`
	}
	if err = tx.GetContext(ctx, &row, tx.Rebind(`SELECT e.id,e.type,e.config FROM executors e JOIN task_sessions s ON s.executor_id=e.id WHERE s.id=? AND e.deleted_at IS NULL`), sessionID); err != nil {
		return ErrNotFound
	}
	var config map[string]string
	if err = json.Unmarshal([]byte(row.Config), &config); err != nil {
		return ErrInvalidRoute
	}
	if config[ConnectionConfigKey] == "" {
		return nil
	}
	if !s.enabled {
		return ErrDisabled
	}
	_, err = readyExecutorRouteIn(ctx, tx, row.ID, row.Type, config)
	return err
}

func (s *Service) confirmRuntime(ctx context.Context, snapshot RuntimeSnapshot) error {
	return s.store.write(ctx, func(tx *sqlx.Tx) error {
		var count int
		if err := tx.GetContext(ctx, &count, tx.Rebind(`SELECT COUNT(*) FROM ssh_connection_refs WHERE owner_type IN ('runtime','runtime_pending') AND owner_id=? AND connection_id=? AND route_stamp=?`), snapshot.SessionID, snapshot.Destination.ID, snapshot.Stamp); err != nil {
			return err
		}
		if count != 1 {
			return ErrConflict
		}
		_, err := tx.ExecContext(ctx, tx.Rebind(`UPDATE ssh_connection_refs SET owner_type='runtime' WHERE owner_type='runtime_pending' AND owner_id=?`), snapshot.SessionID)
		return err
	})
}

func (s *Service) releasePendingRuntime(ctx context.Context, sessionID string) {
	cleanupCtx, cancel := context.WithTimeout(context.WithoutCancel(ctx), 5*time.Second)
	defer cancel()
	_ = s.store.write(cleanupCtx, func(tx *sqlx.Tx) error {
		_, err := tx.ExecContext(cleanupCtx, tx.Rebind(`DELETE FROM ssh_connection_refs WHERE owner_type='runtime_pending' AND owner_id=?`), sessionID)
		return err
	})
}
