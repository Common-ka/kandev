package sshconnections

import (
	"context"
	"github.com/jmoiron/sqlx"
)

const ConnectionConfigKey = "ssh_connection_id"

// BindExecutorIn runs inside the executor writer's transaction. The shared graph
// lock serializes binding with connection deletion and transport changes.
func (s *Service) BindExecutorIn(ctx context.Context, tx *sqlx.Tx, executorID, executorType string, config map[string]string) error {
	if _, err := tx.ExecContext(ctx, `UPDATE ssh_connection_lock SET revision=revision+1 WHERE id=1`); err != nil {
		return err
	}
	var existing int
	if err := tx.GetContext(ctx, &existing, tx.Rebind(`SELECT COUNT(*) FROM ssh_connection_refs WHERE owner_type='executor' AND owner_id=?`), executorID); err != nil {
		return err
	}
	id := config[ConnectionConfigKey]
	if id == "" && existing == 0 {
		return nil
	}
	actor, err := s.authorize(ctx)
	if err != nil {
		return err
	}
	if id == "" {
		if _, err = tx.ExecContext(ctx, tx.Rebind(`DELETE FROM ssh_connection_refs WHERE owner_type='executor' AND owner_id=?`), executorID); err != nil {
			return err
		}
		return audit(ctx, tx, actor, executorID, "executor.unbind", "saved")
	}
	route, err := readyExecutorRouteIn(ctx, tx, executorID, executorType, config)
	if err != nil {
		return err
	}

	_, err = tx.ExecContext(ctx, tx.Rebind(`INSERT INTO ssh_connection_refs(owner_type,owner_id,connection_id,route_stamp) VALUES ('executor',?,?,?) ON CONFLICT(owner_type,owner_id) DO UPDATE SET connection_id=excluded.connection_id,route_stamp=excluded.route_stamp`), executorID, id, route.Stamp)
	if err != nil {
		return err
	}
	return audit(ctx, tx, actor, executorID, "executor.bind", "saved")
}

func readyExecutorRouteIn(ctx context.Context, tx *sqlx.Tx, executorID, executorType string, config map[string]string) (Route, error) {
	if executorType != executorKindSSH || executorID == "" {
		return Route{}, ErrInvalidRoute
	}
	for _, key := range []string{sshHostConfigKey, "ssh_port", "ssh_user", "ssh_host_alias", "ssh_host_fingerprint", "ssh_identity_source", "ssh_identity_file", "ssh_proxy_jump"} {
		if _, present := config[key]; present {
			return Route{}, ErrInvalidRoute
		}
	}
	route, err := routeIn(ctx, tx, config[ConnectionConfigKey])
	if err != nil {
		return Route{}, err
	}
	if route.Destination.VerifiedRoute != route.Stamp || config["ssh_connection_stamp"] != route.Stamp {
		return Route{}, ErrInvalidRoute
	}
	if route.Bastion != nil {
		bastion, err := routeIn(ctx, tx, route.Bastion.ID)
		if err != nil {
			return Route{}, err
		}
		if bastion.Destination.VerifiedRoute != bastion.Stamp {
			return Route{}, ErrInvalidRoute
		}
	}
	return route, nil
}
