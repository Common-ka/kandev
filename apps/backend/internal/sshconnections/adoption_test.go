package sshconnections

import (
	"errors"
	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	"testing"
)

func TestAdoptionPreservesTargetAndConflictsOnConcurrentEdit(t *testing.T) {
	s, ctx := identityService(t)
	if _, err := s.store.db.Exec(`CREATE TABLE executors(id TEXT PRIMARY KEY,type TEXT,config TEXT,updated_at TIMESTAMP,deleted_at TIMESTAMP)`); err != nil {
		t.Fatal(err)
	}
	config := `{"ssh_host":"legacy.example","ssh_user":"deploy","ssh_port":"2222","ssh_identity_source":"file","ssh_identity_file":"/tmp/legacy-key","ssh_host_fingerprint":"SHA256:legacy","ssh_shell":"zsh"}`
	if _, err := s.store.db.Exec(`INSERT INTO executors(id,type,config) VALUES ('executor','ssh',?)`, config); err != nil {
		t.Fatal(err)
	}
	preview, err := s.PreviewAdoption(ctx, "executor")
	if err != nil {
		t.Fatal(err)
	}
	route, err := s.CreateAdoptionDrafts(ctx, "executor", preview.ConfigDigest, uuid.NewString())
	if err != nil {
		t.Fatal(err)
	}
	if route.Destination.Host != "legacy.example" || route.Destination.Port != 2222 || route.Destination.Fingerprint != "SHA256:legacy" {
		t.Fatalf("changed destination: %+v", route)
	}
	if err = s.store.write(ctx, func(tx *sqlx.Tx) error {
		c := route.Destination
		c.VerifiedRoute = route.Stamp
		return putConnection(ctx, tx, c)
	}); err != nil {
		t.Fatal(err)
	}
	if _, err = s.store.db.Exec(`UPDATE executors SET config='{}' WHERE id='executor'`); err != nil {
		t.Fatal(err)
	}
	if err = s.AdoptConnection(ctx, "executor", preview.ConfigDigest, route.Destination.ID, route.Stamp); !errors.Is(err, ErrConflict) {
		t.Fatalf("concurrent edit overwritten: %v", err)
	}
	if _, err = s.store.db.Exec(`UPDATE executors SET config=? WHERE id='executor'`, config); err != nil {
		t.Fatal(err)
	}
	if err = s.AdoptConnection(ctx, "executor", preview.ConfigDigest, route.Destination.ID, route.Stamp); err != nil {
		t.Fatal(err)
	}
	var saved string
	if err = s.store.db.Get(&saved, `SELECT config FROM executors WHERE id='executor'`); err != nil {
		t.Fatal(err)
	}
	if saved == config {
		t.Fatal("not adopted")
	}
}
