package lifecycle

import (
	"os"
	"path/filepath"
	"reflect"

	"github.com/stretchr/testify/require"
	"testing"
)

func TestTaskHostWorkspaceProjectionUsesPersistedPhysicalPositions(t *testing.T) {
	primary, secondary := 0, 1
	info := &WorkspaceInfo{WorkspaceRepositories: []WorkspaceRepositorySpec{
		{RepositoryID: "repo-beta", RepoName: "beta", BaseBranch: "main", Position: 0, TaskHostPosition: &secondary},
		{RepositoryID: "repo-alpha", RepoName: "alpha", BaseBranch: "main", Position: 1, TaskHostPosition: &primary},
	}}

	workspacePath, roots, err := taskHostWorkspaceProjection("docker", info)
	if err != nil {
		t.Fatal(err)
	}
	if workspacePath != "/workspace" {
		t.Fatalf("workspace path = %q, want /workspace", workspacePath)
	}
	want := []string{"/workspace", "/workspace/beta-main"}
	if !reflect.DeepEqual(roots, want) {
		t.Fatalf("physical roots = %v, want %v", roots, want)
	}
}

func TestTaskHostWorkspaceProjectionKeepsBorrowerSecondaryRepoNested(t *testing.T) {
	secondary := 1
	info := &WorkspaceInfo{WorkspaceRepositories: []WorkspaceRepositorySpec{{
		RepositoryID: "repo-beta", RepoName: "beta", BaseBranch: "main", Position: 0, TaskHostPosition: &secondary,
	}}}

	_, roots, err := taskHostWorkspaceProjection("docker", info)
	if err != nil {
		t.Fatal(err)
	}
	if !reflect.DeepEqual(roots, []string{"/workspace/beta-main"}) {
		t.Fatalf("secondary-only borrower roots = %v", roots)
	}
}

func TestTaskHostWorkspaceProjectionRejectsPartialPhysicalMapping(t *testing.T) {
	primary := 0
	_, _, err := taskHostWorkspaceProjection("docker", &WorkspaceInfo{
		WorkspaceRepositories: []WorkspaceRepositorySpec{
			{RepositoryID: "repo-alpha", RepoName: "alpha", BaseBranch: "main", TaskHostPosition: &primary},
			{RepositoryID: "repo-beta", RepoName: "beta", BaseBranch: "main"},
		},
	})
	if err == nil {
		t.Fatal("partial physical task-host mapping was accepted")
	}
}

// @covers AC-PLATFORM-LSP-FILE-INTELLIGENCE-001.10
func TestTaskHostWorkspaceProjectionUsesSelectedWorktrees(t *testing.T) {
	for _, multiple := range []bool{false, true} {
		name := "single"
		if multiple {
			name = "multiple with folder"
		}
		t.Run(name, func(t *testing.T) {
			source, checkout := t.TempDir(), t.TempDir()
			info := &WorkspaceInfo{ExecutorType: "worktree", WorkspacePath: checkout,
				WorkspaceRepositories: []WorkspaceRepositorySpec{{RepositoryID: "primary", RepositoryPath: source, WorktreePath: checkout, Position: 2}},
			}
			want := []string{checkout}
			if multiple {
				folder, second := t.TempDir(), t.TempDir()
				info.WorkspacePath = filepath.Dir(checkout)
				info.WorkspaceFolders = []WorkspaceFolderSpec{{LocalPath: folder, Position: 0}}
				info.WorkspaceRepositories = append(info.WorkspaceRepositories,
					WorkspaceRepositorySpec{RepositoryID: "secondary", RepositoryPath: source, WorktreePath: second, Position: 1})
				want = []string{folder, second, checkout}
			}
			before := append([]WorkspaceRepositorySpec(nil), info.WorkspaceRepositories...)
			workspace, roots, err := taskHostWorkspaceProjection("standalone", info)
			require.NoError(t, err)
			require.Equal(t, info.WorkspacePath, workspace)
			for i := range want {
				want[i], err = filepath.EvalSymlinks(want[i])
				require.NoError(t, err)
			}
			require.Equal(t, want, roots)
			require.Equal(t, before, info.WorkspaceRepositories, "projection must preserve Git source inventory")
		})
	}
}

func TestTaskHostWorkspaceProjectionPreservesLocalSources(t *testing.T) {
	source := t.TempDir()
	alias := filepath.Join(t.TempDir(), "alias")
	require.NoError(t, os.Symlink(source, alias))
	info := &WorkspaceInfo{WorkspacePath: source,
		WorkspaceFolders:      []WorkspaceFolderSpec{{LocalPath: alias}},
		WorkspaceRepositories: []WorkspaceRepositorySpec{{RepositoryPath: source}},
	}
	_, roots, err := taskHostWorkspaceProjection("standalone", info)
	require.NoError(t, err)
	canonical, err := filepath.EvalSymlinks(source)
	require.NoError(t, err)
	require.Equal(t, []string{canonical}, roots)
}

// @covers AC-PLATFORM-LSP-FILE-INTELLIGENCE-001.14
func TestTaskHostWorkspaceProjectionRejectsUnavailableWorktree(t *testing.T) {
	for _, kind := range []string{"empty", "missing", "file"} {
		t.Run(kind, func(t *testing.T) {
			source := t.TempDir()
			checkout := ""
			if kind != "empty" {
				checkout = filepath.Join(t.TempDir(), "checkout")
			}
			if kind == "file" {
				require.NoError(t, os.WriteFile(checkout, nil, 0600))
			}
			_, roots, err := taskHostWorkspaceProjection("standalone", &WorkspaceInfo{
				WorkspacePath: source, ExecutorType: "worktree",
				WorkspaceRepositories: []WorkspaceRepositorySpec{{RepositoryPath: source, WorktreeID: "selected", WorktreePath: checkout}},
			})
			require.Error(t, err, "must not fall back to the source clone")
			require.Empty(t, roots)
		})
	}
}
