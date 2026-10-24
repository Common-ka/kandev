"use client";
import { useManagerNavigation, type ManagerNavigation } from "./use-manager-navigation";
import { SetupReturnActions } from "./setup-return-actions";
import { useTranslation } from "react-i18next";
import { Button } from "@kandev/ui/button";
import { useFeature } from "@/hooks/domains/features/use-feature";
import { useIsAdmin } from "@/hooks/domains/auth/use-is-admin";
import { useSSHConnections, type SSHManager } from "@/hooks/domains/settings/use-ssh-connections";
import { useResponsiveBreakpoint } from "@/hooks/use-responsive-breakpoint";
import { SettingsPageHeader } from "../settings-typography";
import { settingsActionClassName } from "../settings-control";
import { IdentityForm } from "./identity-form";
import { IdentityDetails } from "./identity-details";
import { ConnectionDetails } from "./connection-details";
import type { SSHRoute } from "@/lib/types/http-ssh-connections";
import { AdoptionFinish } from "./adoption";
export function SSHConnectionsSettings() {
  const enabled = useFeature("sshConnectionManager");
  const admin = useIsAdmin();
  const { t } = useTranslation();
  if (!enabled || !admin) return <p>{t("settings:sshManager.unavailable")}</p>;
  return <SSHConnectionsContent />;
}
function SSHConnectionsContent() {
  const manager = useSSHConnections();
  const navigation = useManagerNavigation();
  const { t } = useTranslation();
  const { isMobile } = useResponsiveBreakpoint();
  const details = navigation.creating || Boolean(navigation.selected);
  const route = manager.routes.find((item) => item.destination.id === navigation.selected);
  return (
    <div className="space-y-5 min-w-0 pb-[env(safe-area-inset-bottom)]">
      <SettingsPageHeader
        title={t("settings:sshManager.title")}
        description={t("settings:sshManager.description")}
      />
      <ManagerReturn navigation={navigation} route={route} busy={manager.busy} />
      <ManagerTabs navigation={navigation} />
      <ManagerError manager={manager} />
      {!manager.loaded && !manager.error && <p role="status">{t("settings:sshManager.loading")}</p>}
      {navigation.returnConnection && (
        <Button
          variant="outline"
          className={settingsActionClassName()}
          onClick={navigation.returnToDestination}
        >
          {t("settings:sshManager.returnToDestination")}
        </Button>
      )}
      <ManagerAdoption navigation={navigation} route={route} />
      {manager.loaded && (
        <div className="grid min-w-0 gap-5 md:grid-cols-[14rem_minmax(0,1fr)]">
          {(!isMobile || !details) && <ManagerList manager={manager} navigation={navigation} />}
          {(!isMobile || details) && (
            <div className="space-y-4 min-w-0">
              {isMobile && (
                <Button
                  variant="ghost"
                  className={settingsActionClassName()}
                  onClick={navigation.back}
                >
                  {t("settings:sshManager.back")}
                </Button>
              )}
              <ManagerDetail manager={manager} navigation={navigation} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
function ManagerTabs({ navigation: n }: { navigation: ManagerNavigation }) {
  const { t } = useTranslation();
  return (
    <nav className="flex flex-wrap gap-2" aria-label={t("settings:sshManager.title")}>
      <Button
        variant={n.identities ? "outline" : "secondary"}
        className={settingsActionClassName()}
        onClick={n.showConnections}
      >
        {t("settings:sshManager.connections")}
      </Button>
      <Button
        variant={n.identities ? "secondary" : "outline"}
        className={settingsActionClassName()}
        onClick={n.showIdentities}
      >
        {t("settings:sshManager.identities")}
      </Button>
    </nav>
  );
}
function ManagerError({ manager }: { manager: SSHManager }) {
  const { t } = useTranslation();
  if (!manager.error) return null;
  return (
    <div role="alert" className="rounded-md border border-destructive p-3 text-sm">
      {t(`settings:sshManager.errors.${manager.error}`, {
        defaultValue: t("settings:sshManager.errors.ssh_operation_failed"),
      })}
      <Button
        variant="outline"
        className={settingsActionClassName("ml-2")}
        disabled={manager.busy}
        onClick={() => {
          void manager.reload().catch(() => undefined);
        }}
      >
        {t("settings:sshManager.reload")}
      </Button>
    </div>
  );
}
function ManagerList({
  manager,
  navigation: n,
}: {
  manager: SSHManager;
  navigation: ManagerNavigation;
}) {
  const { t } = useTranslation();
  const items = n.identities
    ? manager.identities.map((item) => ({ id: item.id, label: item.label }))
    : manager.routes.map((item) => ({ id: item.destination.id, label: item.destination.name }));
  return (
    <div className="space-y-3 min-w-0">
      <Button
        className={settingsActionClassName("w-full")}
        onClick={n.create}
        disabled={manager.busy}
      >
        {t(n.identities ? "settings:sshManager.newIdentity" : "settings:sshManager.newConnection")}
      </Button>
      {items.length === 0 && (
        <p className="text-sm text-muted-foreground">
          {t(
            n.identities
              ? "settings:sshManager.emptyIdentities"
              : "settings:sshManager.emptyConnections",
          )}
        </p>
      )}
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.id}>
            <Button
              variant={n.selected === item.id ? "secondary" : "ghost"}
              className={settingsActionClassName(
                "w-full justify-start whitespace-normal break-words text-left",
              )}
              aria-current={n.selected === item.id ? "page" : undefined}
              onClick={() => n.select(item.id)}
            >
              {item.label}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
function ManagerDetail({
  manager,
  navigation: n,
}: {
  manager: SSHManager;
  navigation: ManagerNavigation;
}) {
  const { t } = useTranslation();
  if (n.identities) {
    if (n.creating)
      return (
        <IdentityForm
          manager={manager}
          onCreated={(identity) => n.identityCreated(identity.id)}
          onCancel={n.back}
        />
      );
    const identity = manager.identities.find((item) => item.id === n.selected);
    if (identity)
      return (
        <IdentityDetails
          key={identity.id}
          identity={identity}
          manager={manager}
          onDeleted={n.back}
        />
      );
    return (
      <p className="text-sm text-muted-foreground">
        {t("settings:sshManager.selectIdentityDetails")}
      </p>
    );
  }
  const route = manager.routes.find((item) => item.destination.id === n.selected);
  if (n.creating || route)
    return (
      <ConnectionDetails
        key={route?.destination.id ?? "new"}
        route={route}
        manager={manager}
        onSaved={(saved) => n.select(saved.destination.id)}
        onDeleted={n.back}
        onCreateBastion={(saved) => n.createBastion(saved.destination.id)}
        onCreateIdentity={(saved) => n.createIdentity(saved.destination.id)}
      />
    );
  return (
    <p role={n.selected ? "alert" : undefined} className="text-sm text-muted-foreground">
      {t(
        n.selected
          ? "settings:sshManager.recordUnavailable"
          : "settings:sshManager.selectConnection",
      )}
    </p>
  );
}

function ManagerReturn({
  navigation: n,
  route,
  busy,
}: {
  navigation: ManagerNavigation;
  route?: SSHRoute;
  busy: boolean;
}) {
  const selectable = !n.identities && !n.creating && !n.returnConnection;
  return <SetupReturnActions route={selectable ? route : undefined} busy={busy} />;
}
function ManagerAdoption({
  navigation: n,
  route,
}: {
  navigation: ManagerNavigation;
  route?: SSHRoute;
}) {
  if (!route || route.destination.id !== n.adoptConnection || !n.adoptExecutor || !n.adoptDigest)
    return null;
  return <AdoptionFinish executorId={n.adoptExecutor} digest={n.adoptDigest} route={route} />;
}
