package sshconnections

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/kandev/kandev/internal/sshtransport"
	"golang.org/x/crypto/ssh"
	"sync"
	"time"
)

// OpenExecutor is an internal capability for probes of saved executors. HTTP
// callers must authorize management before invoking it; background callers use
// their server-owned executor inventory. No caller routing overrides are used.
func (s *Service) OpenExecutor(ctx context.Context, executorID string) (*ssh.Client, *sshtransport.SSHTarget, func(), error) {
	empty := func() {}
	if !s.enabled {
		return nil, nil, empty, ErrDisabled
	}
	return s.openProbe(ctx, func(tx *sqlx.Tx) (Route, error) {
		config, kind, err := executorConfigIn(ctx, tx, executorID)
		if err != nil {
			return Route{}, err
		}
		if config[ConnectionConfigKey] == "" {
			return Route{}, ErrInvalidRoute
		}
		return readyExecutorRouteIn(ctx, tx, executorID, kind, config)
	})
}

func (s *Service) openProbe(ctx context.Context, resolve func(*sqlx.Tx) (Route, error)) (*ssh.Client, *sshtransport.SSHTarget, func(), error) {
	empty := func() {}
	owner := uuid.NewString()
	var route Route
	err := s.store.write(ctx, func(tx *sqlx.Tx) error {
		var err error
		route, err = resolve(tx)
		if err != nil {
			return err
		}
		_, err = tx.ExecContext(ctx, tx.Rebind(`INSERT INTO ssh_connection_refs(owner_type,owner_id,connection_id,route_stamp) VALUES ('probe',?,?,?)`), owner, route.Destination.ID, route.Stamp)
		return err
	})
	if err != nil {
		return nil, nil, empty, err
	}
	release := sync.OnceFunc(func() {
		cleanupCtx, cancel := context.WithTimeout(context.WithoutCancel(ctx), 5*time.Second)
		defer cancel()
		_ = s.store.write(cleanupCtx, func(tx *sqlx.Tx) error {
			_, err := tx.ExecContext(cleanupCtx, tx.Rebind(`DELETE FROM ssh_connection_refs WHERE owner_type='probe' AND owner_id=?`), owner)
			return err
		})
	})
	client, err := s.dialProtectedRoute(ctx, route)
	if err != nil {
		release()
		return nil, nil, empty, transportFailure(err)
	}
	c := route.Destination
	target := &sshtransport.SSHTarget{Host: c.Host, Port: c.Port, User: c.User, PinnedFingerprint: c.Fingerprint}
	cleanup := sync.OnceFunc(func() { _ = client.Close(); release() })
	return client, target, cleanup, nil
}
func executorConfigIn(ctx context.Context, tx *sqlx.Tx, id string) (map[string]string, string, error) {
	var row struct {
		Config string `db:"config"`
		Type   string `db:"type"`
	}
	err := tx.GetContext(ctx, &row, tx.Rebind(`SELECT config,type FROM executors WHERE id=? AND deleted_at IS NULL`), id)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, "", ErrNotFound
	}
	if err != nil {
		return nil, "", err
	}
	var config map[string]string
	if err = json.Unmarshal([]byte(row.Config), &config); err != nil {
		return nil, "", ErrInvalidRoute
	}
	return config, row.Type, nil
}
func (s *Service) dialProtectedRoute(ctx context.Context, route Route) (*ssh.Client, error) {
	destination, cleanup, err := s.hop(ctx, route.Destination)
	if err != nil {
		return nil, err
	}
	defer cleanup()
	var bastion *sshtransport.Hop
	if route.Bastion != nil {
		hop, closeHop, err := s.hop(ctx, *route.Bastion)
		if err != nil {
			return nil, err
		}
		defer closeHop()
		bastion = &hop
	}
	return sshtransport.DialRoute(ctx, destination, bastion)
}

func (s *Service) OpenExecutorForManagement(ctx context.Context, id string) (*ssh.Client, *sshtransport.SSHTarget, func(), error) {
	if _, err := s.authorize(ctx); err != nil {
		return nil, nil, func() {}, err
	}
	return s.OpenExecutor(ctx, id)
}

func (s *Service) OpenConnectionForManagement(ctx context.Context, id, stamp string) (*ssh.Client, *sshtransport.SSHTarget, func(), error) {
	if _, err := s.authorize(ctx); err != nil {
		return nil, nil, func() {}, err
	}
	return s.openProbe(ctx, func(tx *sqlx.Tx) (Route, error) {
		route, err := routeIn(ctx, tx, id)
		if err != nil {
			return Route{}, err
		}
		if stamp == "" || route.Stamp != stamp {
			return Route{}, ErrConflict
		}
		if route.Destination.VerifiedRoute != route.Stamp {
			return Route{}, ErrInvalidRoute
		}
		return route, nil
	})
}
