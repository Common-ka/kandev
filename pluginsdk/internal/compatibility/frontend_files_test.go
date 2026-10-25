package compatibility

import (
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/stretchr/testify/require"
)

// @covers AC-PLUGINS-SDK-DISTRIBUTION-002.2
func TestLargeFrontendLockfiles(t *testing.T) {
	for _, manager := range []string{"npm", "pnpm"} {
		t.Run(manager, func(t *testing.T) {
			root, pkg := frontendFixture(t)
			lockName := "package-lock.json"
			if manager == "pnpm" {
				root, pkg = pnpmFrontendFixture(t)
				lockName = "pnpm-lock.yaml"
			}
			path := filepath.Join(root, lockName)
			data, err := os.ReadFile(path)
			require.NoError(t, err)
			// Whitespace is valid in both formats and grows the file without changing SDK evidence.
			require.NoError(t, os.WriteFile(path, append(data, []byte(strings.Repeat(" \n", 600_000))...), 0600))
			record, err := ResolveFrontend(root, pkg)
			require.NoError(t, err)
			require.Equal(t, releasedRecord(), record)
			file, err := os.OpenFile(path, os.O_WRONLY, 0600)
			require.NoError(t, err)
			require.NoError(t, file.Truncate(32<<20+1))
			require.NoError(t, file.Close())
			_, err = ResolveFrontend(root, pkg)
			require.ErrorContains(t, err, "exceeds")
		})
	}
}

// @covers AC-PLUGINS-SDK-DISTRIBUTION-002.2
func TestFrontendMetadataRemainsBounded(t *testing.T) {
	for _, name := range []string{"package.json", "sdk-release.json"} {
		t.Run(name, func(t *testing.T) {
			root, pkg := frontendFixture(t)
			require.NoError(t, os.WriteFile(filepath.Join(pkg, name), []byte(strings.Repeat(" ", 1<<20+1)), 0600))
			_, err := ResolveFrontend(root, pkg)
			require.ErrorContains(t, err, "exceeds")
		})
	}
}

// @covers AC-PLUGINS-SDK-DISTRIBUTION-002.2
func TestFrontendCheckoutSymlink(t *testing.T) {
	for _, manager := range []string{"npm", "pnpm"} {
		t.Run(manager, func(t *testing.T) {
			root, pkg := frontendFixture(t)
			if manager == "pnpm" {
				root, pkg = pnpmFrontendFixture(t)
			}
			alias := filepath.Join(t.TempDir(), "checkout")
			require.NoError(t, os.Symlink(root, alias))
			relative := filepath.Join("node_modules", "@kandev", "plugin-sdk")
			for _, requested := range []string{relative, filepath.Join(alias, relative)} {
				record, err := ResolveFrontend(alias, requested)
				require.NoError(t, err)
				require.Equal(t, releasedRecord(), record)
			}
			// A checkout alias must not permit a separately linked SDK package.
			actual, err := filepath.EvalSymlinks(pkg)
			require.NoError(t, err)
			outside := filepath.Join(t.TempDir(), "sdk")
			require.NoError(t, os.Rename(actual, outside))
			if manager == "pnpm" {
				require.NoError(t, os.Remove(pkg))
			}
			require.NoError(t, os.Symlink(outside, pkg))
			_, err = ResolveFrontend(alias, relative)
			require.ErrorContains(t, err, "local substitution")
		})
	}
}
