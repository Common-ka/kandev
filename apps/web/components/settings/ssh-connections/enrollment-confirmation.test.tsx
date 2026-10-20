import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import type { SSHManager } from "@/hooks/domains/settings/use-ssh-connections";
import type { SSHRoute } from "@/lib/types/http-ssh-connections";
import { EnrollmentPanel } from "./enrollment-panel";

const viewport = vi.hoisted(() => ({ isMobile: false, isFinePointer: true }));
vi.mock("@/hooks/use-responsive-breakpoint", () => ({
  useResponsiveBreakpoint: () => viewport,
  useTouchDrawer: () => !viewport.isFinePointer,
}));
vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
afterEach(cleanup);
const route: SSHRoute = {
  destination: {
    id: "target",
    name: "Target",
    host: "target.invalid",
    port: 22,
    user: "deploy",
    identity_id: "key",
    fingerprint: "SHA256:host",
    public_key: "ssh-ed25519 host",
    version: 1,
    revision: 1,
  },
  stamp: "route-stamp",
};
function setup() {
  const enroll = vi.fn().mockResolvedValue({});
  const manager = {
    busy: false,
    enroll,
    identities: [
      { id: "key", label: "key", public_key: "ssh-ed25519 public", fingerprint: "SHA256:key" },
    ],
  } as unknown as SSHManager;
  render(<EnrollmentPanel route={route} manager={manager} />);
  const password = screen.getByLabelText("settings:sshManager.enrollment.password");
  fireEvent.change(password, { target: { value: "one-time-fixture-password" } });
  fireEvent.click(screen.getByRole("button", { name: "settings:sshManager.enrollment.install" }));
  return { enroll, password, dialog: screen.getByRole("dialog") };
}
for (const mobile of [false, true]) {
  // @covers AC-EXECUTORS-SSH-CONNECTIONS-004.3
  it(`clears the bootstrap password when ${mobile ? "phone" : "desktop"} confirmation is cancelled`, async () => {
    viewport.isMobile = mobile;
    viewport.isFinePointer = !mobile;
    const { enroll, password, dialog } = setup();
    fireEvent.click(within(dialog).getByRole("button", { name: "common:cancel" }));
    await waitFor(() => expect((password as HTMLInputElement).value).toBe(""));
    expect(enroll).not.toHaveBeenCalled();
  });
  it(`submits the explicit password once from ${mobile ? "phone" : "desktop"} confirmation`, async () => {
    viewport.isMobile = mobile;
    viewport.isFinePointer = !mobile;
    const { enroll, password, dialog } = setup();
    fireEvent.click(
      within(dialog).getByRole("button", { name: "settings:sshManager.enrollment.install" }),
    );
    await waitFor(() => expect(enroll).toHaveBeenCalledTimes(1));
    expect(enroll.mock.calls[0][1].password).toBe("one-time-fixture-password");
    await waitFor(() => expect((password as HTMLInputElement).value).toBe(""));
  });
}
