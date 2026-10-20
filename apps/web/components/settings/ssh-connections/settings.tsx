"use client";
import { useRouter, useSearchParams } from "@/lib/routing/client-router";
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
import { AdoptionFinish } from "./adoption";
const path = "/settings/ssh-connections";
export function SSHConnectionsSettings() {
  const enabled = useFeature("sshConnectionManager");
  const admin = useIsAdmin();
  const { t } = useTranslation();
  if (!enabled || !admin) return <p>{t("settings:sshManager.unavailable")}</p>;
  return <SSHConnectionsContent />;
}
function useManagerNavigation() {
  const router = useRouter();
  const search = useSearchParams();
  const identities = search.get("tab") === "identities";
  const query = new URLSearchParams();
  for (const key of ["adopt_executor", "adopt_digest", "adopt_connection", "return_connection"]) {
    const value = search.get(key);
    if (value) query.set(key, value);
  }
  const suffix = query.size ? `&${query}` : "";
  const base = `${path}?tab=${identities ? "identities" : "connections"}${suffix}`;
  return {
    identities,
    selected: search.get("id"),
    creating: search.get("new") === "1",
    adoptExecutor: search.get("adopt_executor"),
    adoptDigest: search.get("adopt_digest"),
    adoptConnection: search.get("adopt_connection"),
    returnConnection: search.get("return_connection"),
    select: (id: string) => router.push(`${base}&id=${encodeURIComponent(id)}`),
    back: () => router.push(base),
    create: () => router.push(`${base}&new=1`),
    showConnections: () => router.push(`${path}?tab=connections${suffix}`),
    showIdentities: () => router.push(`${path}?tab=identities${suffix}`),
    createBastion: (id: string) =>
      router.push(`${path}?tab=connections&new=1&return_connection=${encodeURIComponent(id)}`),
    returnToDestination: () =>
      router.push(
        `${path}?tab=connections&id=${encodeURIComponent(search.get("return_connection") ?? "")}`,
      ),
  };
}
type ManagerNavigation = ReturnType<typeof useManagerNavigation>;
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
      {route &&
        route.destination.id === navigation.adoptConnection &&
        navigation.adoptExecutor &&
        navigation.adoptDigest && (
          <AdoptionFinish
            executorId={navigation.adoptExecutor}
            digest={navigation.adoptDigest}
            route={route}
          />
        )}
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
          onCreated={(identity) => n.select(identity.id)}
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
      />
    );
  return (
    <p className="text-sm text-muted-foreground">{t("settings:sshManager.selectConnection")}</p>
  );
}
