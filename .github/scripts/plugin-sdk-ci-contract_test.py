"""SDK-only changes must exercise the SDK and every host consumer in CI."""

from importlib import import_module
from pathlib import Path
import re
import unittest

matcher = import_module("changed-paths")
ROOT = Path(__file__).resolve().parents[2]


class SDKSelectionTests(unittest.TestCase):
    # @covers AC-PLUGINS-SDK-DISTRIBUTION-004.1
    def test_sdk_only_changes_select_host_and_e2e(self):
        for name in ("backend-tests.yml", "e2e-tests.yml"):
            text = (ROOT / ".github/workflows" / name).read_text()
            block = re.search(r"PATTERNS: \|\n((?:            .*\n)+)", text)
            self.assertIsNotNone(block)
            paths = matcher.Filter(block[1].splitlines())
            for path in ("pluginsdk/serve.go", "pluginsdk/go.mod", "pluginsdk/go.sum",
                         "pluginsdk/proto/kandev/plugin/v1/plugin.proto", "pluginsdk/Makefile",
                         "scripts/pluginsdk/consumer-smoke.mjs",
                         ".github/scripts/plugin-sdk-ci-contract_test.py"):
                with self.subTest(workflow=name, path=path):
                    self.assertTrue(paths.includes(path), path)
            self.assertFalse(paths.includes("pluginsdk/README.md"))

    def test_sdk_has_explicit_race_vet_and_contract_checks(self):
        text = (ROOT / ".github/workflows/backend-tests.yml").read_text()
        self.assertIn("working-directory: pluginsdk", text)
        self.assertIn("go test -trimpath -race ./...", text)
        self.assertIn("go vet ./...", text)
        self.assertIn("python3 .github/scripts/plugin-sdk-ci-contract_test.py", text)

    def test_host_fixture_build_and_artifact_checks_remain_selected(self):
        backend = (ROOT / ".github/workflows/backend-tests.yml").read_text()
        e2e = (ROOT / ".github/workflows/e2e-tests.yml").read_text()
        self.assertIn("scripts/pluginsdk/check-proto-generation.mjs", backend)
        self.assertIn("scripts/pluginsdk/consumer-smoke.test.mjs", backend)
        self.assertIn("--backend-only --skip-compatibility-check", backend)
        self.assertIn("make -C apps/backend e2e-plugin-ui e2e-plugin-package", e2e)
        self.assertIn("make build-backend", e2e)

    def test_docker_builder_is_part_of_required_backend_gate(self):
        text = (ROOT / ".github/workflows/backend-tests.yml").read_text()
        self.assertIn("docker build --target go-builder -f e2e.Dockerfile", text)
        gate = text.split("  test:\n", 1)[1]
        self.assertIn("      - sdk_builder", gate)
        self.assertIn("SDK_BUILDER_RESULT: ${{ needs.sdk_builder.result }}", gate)
        self.assertIn('"sdk_builder:${SDK_BUILDER_RESULT}"', gate)

    def test_docker_build_preserves_the_backend_replacement_layout(self):
        stage = (ROOT / "e2e.Dockerfile").read_text().split("FROM node:", 1)[0]
        self.assertIn("WORKDIR /build/apps/backend", stage)
        self.assertLess(stage.index("COPY pluginsdk/ /build/pluginsdk/"), stage.index("RUN go mod download"))

    def test_caches_include_both_module_identities(self):
        for name in ("backend-tests.yml", "e2e-tests.yml"):
            text = (ROOT / ".github/workflows" / name).read_text()
            for expression in re.findall(r"hashFiles\([^\n]*apps/backend/go.mod[^\n]*\)", text):
                with self.subTest(workflow=name, expression=expression):
                    self.assertIn("pluginsdk/go.mod", expression)
                    self.assertIn("pluginsdk/go.sum", expression)


if __name__ == "__main__":
    unittest.main()
