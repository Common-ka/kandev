const returnLabel = "settings:sshManager.binding.returnToExecutor";
const manageLabel = "settings:sshManager.binding.manage";
const unsavedName = "Unsaved name";
const nameLabel = "settings:sshManager.label";
import { defaultFeatureFlags } from "@/lib/state/slices/features/types";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { StateProvider } from "@/components/state-provider";
import { usePathname } from "@/lib/routing/client-router";
import {
  clearNavigationBlockerForTests,
  setNavigationBlocker,
} from "@/lib/routing/navigation-guard";
import type { SSHRoute } from "@/lib/types/http-ssh-connections";
import { SettingsSaveProvider, useSettingsSaveContributor } from "../settings-save-provider";
import { ManagedBinding } from "./managed-binding";
import { SetupReturnActions } from "./setup-return-actions";
import { SSHSetupContinuationProvider, useSSHSetupContinuation } from "./setup-continuation";
vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
const fixture = vi.hoisted(() => ({
  unrelated: false,
  name: "Original",
  save: vi.fn(),
  test: vi.fn(),
}));
vi.mock("@/lib/api/domains/ssh-api", () => ({
  testSSHConnection: (...args: unknown[]) => fixture.test(...args),
}));
const routes: SSHRoute[] = ["first", "second"].map((id) => ({
  destination: {
    id,
    name: id,
    host: "fixture.invalid",
    user: "build",
    port: 22,
    identity_id: "key",
    fingerprint: "pin",
    public_key: "public",
    version: 1,
    revision: 1,
    verified_route: id,
  },
  stamp: id,
}));
vi.mock("@/hooks/domains/settings/use-ssh-connections", () => ({
  useSSHConnections: () => ({ routes, identities: [], loaded: true, busy: false, error: null }),
}));
const editor = "/settings/executors/new/ssh";
const existingEditor = "/settings/executors/ssh/existing";
afterEach(() => {
  cleanup();
  clearNavigationBlockerForTests();
});
function View({ existing }: { existing: boolean }) {
  const pathname = usePathname();
  const origin = existing ? existingEditor : editor;
  return (
    <SettingsSaveProvider key={pathname}>
      <OtherDraft />
      {pathname === origin ? (
        <ManagedBinding
          initial={{ name: fixture.name, connection_id: "first", connection_stamp: "first" }}
          coordinatedSaveId={existing ? "binding" : undefined}
          onSave={fixture.save}
        />
      ) : (
        <SetupReturnActions route={routes[1]} busy={false} />
      )}
    </SettingsSaveProvider>
  );
}
function setup(existing = false, unrelated = false) {
  fixture.unrelated = unrelated;
  fixture.name = "Original";
  fixture.save.mockReset();
  fixture.test.mockResolvedValue({ success: true });
  window.history.replaceState({}, "", existing ? existingEditor : editor);
  return render(
    <StateProvider
      initialState={{ features: { ...defaultFeatureFlags, sshConnectionManager: true } }}
    >
      <SSHSetupContinuationProvider>
        <DraftProbe />
        <View existing={existing} />
      </SSHSetupContinuationProvider>
    </StateProvider>,
  );
}
const click = (name: string) => fireEvent.click(screen.getByRole("button", { name }));
function changeName() {
  fireEvent.change(screen.getByLabelText(nameLabel), { target: { value: unsavedName } });
}
// @covers AC-EXECUTORS-SSH-CONNECTIONS-004.7
it.each([false, true])("preserves the draft without saving (existing=%s)", async (existing) => {
  setup(existing);
  changeName();
  click(manageLabel);
  await waitFor(() => expect(screen.getByRole("button", { name: returnLabel })).toBeTruthy());
  click(returnLabel);
  expect((screen.getByLabelText(nameLabel) as HTMLInputElement).value).toBe(unsavedName);
  expect(fixture.save).not.toHaveBeenCalled();
});
it("requires a new executor check after an explicit connection selection", async () => {
  setup();
  click("settings:sshManager.binding.test");
  await screen.findByText("settings:sshManager.binding.executorReady");
  click(manageLabel);
  click("settings:sshManager.binding.useConnection");
  expect(
    (screen.getByLabelText("settings:sshManager.binding.connection") as HTMLSelectElement).value,
  ).toBe("second");
  expect(screen.getByRole("button", { name: "common:save" }).hasAttribute("disabled")).toBe(true);
  expect(fixture.save).not.toHaveBeenCalled();
});
it("blocks a returned draft when the server baseline changed", () => {
  setup();
  changeName();
  click(manageLabel);
  fixture.name = "Changed by another admin";
  click(returnLabel);
  expect(screen.getByRole("alert").textContent).toContain(
    "settings:sshManager.binding.draftConflict",
  );
  expect((screen.getByLabelText(nameLabel) as HTMLInputElement).value).toBe(unsavedName);
  click("settings:sshManager.binding.reloadDraft");
  expect((screen.getByLabelText(nameLabel) as HTMLInputElement).value).toBe(
    "Changed by another admin",
  );
});

function OtherDraft() {
  useSettingsSaveContributor({
    id: "other",
    revision: 1,
    isDirty: fixture.unrelated,
    save: async () => {},
    discard: () => {},
  });
  return null;
}
it("does not transfer an unrelated dirty contributor when managing connections", () => {
  setup(true, true);
  changeName();
  click(manageLabel);
  expect(window.location.pathname).toBe(existingEditor);
  expect((screen.getByLabelText(nameLabel) as HTMLInputElement).value).toBe(unsavedName);
  expect(screen.queryByRole("button", { name: returnLabel })).toBeNull();
  expect(fixture.save).not.toHaveBeenCalled();
});
it("hides Use connection when the destination readiness is stale", () => {
  const original = routes[1].destination.verified_route;
  routes[1].destination.verified_route = "old";
  try {
    setup();
    click(manageLabel);
    expect(
      screen.queryByRole("button", { name: "settings:sshManager.binding.useConnection" }),
    ).toBeNull();
    click(returnLabel);
    expect(
      (screen.getByLabelText("settings:sshManager.binding.connection") as HTMLSelectElement).value,
    ).toBe("first");
  } finally {
    routes[1].destination.verified_route = original;
  }
});

function DraftProbe() {
  const flow = useSSHSetupContinuation();
  return <output data-testid="setup-draft">{JSON.stringify(flow.draft)}</output>;
}
it("restores the editor when a navigation guard rejects the setup detour", () => {
  setup();
  changeName();
  setNavigationBlocker((intent) => intent.cancel());
  click(manageLabel);
  expect(window.location.pathname).toBe(editor);
  expect((screen.getByLabelText(nameLabel) as HTMLInputElement).value).toBe(unsavedName);
  expect(screen.getByTestId("setup-draft").textContent).toBe("null");
  expect(fixture.save).not.toHaveBeenCalled();
});
it("clears the returned continuation after a successful explicit save", async () => {
  setup();
  click(manageLabel);
  click(returnLabel);
  expect(screen.getByTestId("setup-draft").textContent).not.toBe("null");
  click("settings:sshManager.binding.test");
  await screen.findByText("settings:sshManager.binding.executorReady");
  click("common:save");
  await waitFor(() => expect(screen.getByTestId("setup-draft").textContent).toBe("null"));
  expect(fixture.save).toHaveBeenCalledTimes(1);
});
