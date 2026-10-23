package requiredstores

import (
	"context"
	"path/filepath"
	"testing"
	"time"

	"github.com/jmoiron/sqlx"
	"github.com/stretchr/testify/require"

	"github.com/kandev/kandev/internal/db"
	"github.com/kandev/kandev/internal/startup"
)

func openSQLiteHealthPool(t *testing.T) *db.Pool {
	t.Helper()
	path := filepath.Join(t.TempDir(), "health.db")
	writer, err := db.OpenSQLite(path)
	require.NoError(t, err)
	t.Cleanup(func() { require.NoError(t, writer.Close()) })
	reader, err := db.OpenSQLiteReader(path)
	require.NoError(t, err)
	t.Cleanup(func() { require.NoError(t, reader.Close()) })
	return db.NewPool(sqlx.NewDb(writer, "sqlite3"), sqlx.NewDb(reader, "sqlite3"))
}

func factoryHealthFixture(t *testing.T) (*db.Pool, *Health, Descriptor) {
	t.Helper()
	pool := openSQLiteHealthPool(t)
	_, err := pool.Writer().Exec("CREATE TABLE health_probe (id INTEGER PRIMARY KEY)")
	require.NoError(t, err)
	descriptor := Descriptor{
		ID: "probe", OwnerPackage: "owner/probe", RequiredTables: []string{"health_probe"}, Sweep: startup.StepStoresRepositories,
	}
	tracker, err := NewTracker([]Descriptor{descriptor})
	require.NoError(t, err)
	require.NoError(t, tracker.RecordSuccess(descriptor.ID))
	health := NewHealth(tracker, pool, nil)
	require.NoError(t, health.Check(context.Background()))
	return pool, health, descriptor
}

func TestTableHealthProbeReadsWhileSQLiteWriterIsOccupied(t *testing.T) {
	pool, health, descriptor := factoryHealthFixture(t)
	holdWriter(t, pool.Writer())
	ctx, cancel := context.WithTimeout(context.Background(), time.Second)
	defer cancel()
	require.NoError(t, health.probeTables(ctx, descriptor))
	descriptor.RequiredTables = []string{"missing_table"}
	err := health.probeTables(ctx, descriptor)
	require.ErrorContains(t, err, "required table")
	require.Equal(t, "required_table_missing", classifyProbeError(err))
}

func TestHealthRetainsWriterPingFailureWithSeparateSQLiteReader(t *testing.T) {
	pool, health, _ := factoryHealthFixture(t)
	tx := holdWriter(t, pool.Writer())
	ctx, cancel := context.WithTimeout(context.Background(), 25*time.Millisecond)
	defer cancel()
	diagnostic, err := health.check(ctx)
	require.Error(t, err)
	require.Equal(t, "writer_ping", diagnostic.stage)
	require.False(t, health.Healthy())
	require.NoError(t, tx.Rollback())
	require.NoError(t, health.Check(context.Background()))
	require.True(t, health.Healthy())
}
