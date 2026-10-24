import { describe, expect, it } from "vitest";
import { sshConnectionSettingsPath } from "./ssh-connection-settings-routes";

// @covers AC-EXECUTORS-SSH-CONNECTIONS-005.6
describe("SSH setup links", () => {
  it("keeps adoption and bastion context across identity creation and return", () => {
    const state = new URLSearchParams({
      tab: "connections",
      id: "target/a",
      adopt_executor: "executor/a",
      adopt_digest: "digest",
      adopt_connection: "target/a",
      return_connection: "outer",
    });
    const created = new URL(
      sshConnectionSettingsPath(state, {
        tab: "identities",
        id: null,
        new: "1",
        return_identity_connection: "target/a",
      }),
      "http://localhost",
    );
    expect(created.pathname).toBe("/settings/executors/ssh-connections");
    const returned = new URL(
      sshConnectionSettingsPath(created.searchParams, {
        tab: "connections",
        id: "target/a",
        new: null,
        return_identity_connection: null,
      }),
      "http://localhost",
    );
    expect(Object.fromEntries(returned.searchParams)).toEqual(Object.fromEntries(state));
  });
  it("does not propagate unrecognized or credential-bearing query fields", () => {
    const href = sshConnectionSettingsPath(
      new URLSearchParams("password=secret&tab=identities&id=a"),
    );
    expect(href).toBe("/settings/executors/ssh-connections?tab=identities&id=a");
  });
});
