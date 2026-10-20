package sshconnections

import (
	"context"
	"errors"
	"testing"
)

func TestExecutorProbeRequiresEnabledSavedBinding(t *testing.T) {
	if _, _, _, err := NewService(false, nil, nil).OpenExecutor(context.Background(), "executor"); !errors.Is(err, ErrDisabled) {
		t.Fatalf("disabled probe: %v", err)
	}
	s, ctx := identityService(t)
	if _, err := s.store.db.Exec(`CREATE TABLE executors(id TEXT PRIMARY KEY,type TEXT,config TEXT,deleted_at TIMESTAMP)`); err != nil {
		t.Fatal(err)
	}
	if _, err := s.store.db.Exec(`INSERT INTO executors(id,type,config) VALUES ('legacy','ssh','{"ssh_host":"arbitrary"}')`); err != nil {
		t.Fatal(err)
	}
	if _, _, _, err := s.OpenExecutor(ctx, "legacy"); !errors.Is(err, ErrInvalidRoute) {
		t.Fatalf("inline config accepted: %v", err)
	}
	if _, _, _, err := s.OpenExecutor(ctx, "missing"); !errors.Is(err, ErrNotFound) {
		t.Fatalf("unknown executor: %v", err)
	}
}
