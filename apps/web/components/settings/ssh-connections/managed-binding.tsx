"use client";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@kandev/ui/button";
import { Input } from "@kandev/ui/input";
import { Label } from "@kandev/ui/label";
import { usePathname, useRouter } from "@/lib/routing/client-router";
import { useSSHConnections } from "@/hooks/domains/settings/use-ssh-connections";
import { testSSHConnection } from "@/lib/api/domains/ssh-api";
import type { SSHConnectionCardProps } from "../ssh-connection-card";
import { SettingsPageTemplate } from "../settings-page-template";
import { settingsActionClassName, settingsControlClassName } from "../settings-control";
import { ConnectionPicker } from "./picker";
import { flushSync } from "react-dom";
import { useSettingsSaveCoordinator } from "../settings-save-provider";
import { useSSHSetupContinuation, type SSHSetupDraft } from "./setup-continuation";
import { SSH_CONNECTIONS_SETTINGS_HREF } from "@/lib/settings/ssh-connection-settings-routes";
type ManagedBindingProps = SSHConnectionCardProps & { ownerUserId?: string };
export function ManagedBinding(props: ManagedBindingProps) {
  const { t } = useTranslation();
  const manager = useSSHConnections();
  const {
    name,
    setName,
    selected,
    setSelected,
    checked,
    setChecked,
    busy,
    error,
    route,
    ready,
    canSave,
    dirty,
    suspended,
    conflict,
    manage,
    test,
    save,
    discard,
  } = useManagedBinding(props, manager);
  return (
    <SettingsPageTemplate
      title={t("settings:sshManager.binding.title")}
      showPageChrome={false}
      saveId={props.coordinatedSaveId}
      saveRevision={`${name}:${selected}:${route?.stamp ?? ""}:${checked}`}
      isDirty={Boolean(props.coordinatedSaveId) && dirty && !suspended}
      canSave={canSave}
      saveStatus={busy ? "loading" : "idle"}
      onSave={save}
      onDiscard={discard}
    >
      <div className="space-y-4 min-w-0">
        <div className="space-y-1">
          <Label htmlFor="managed-executor-name">{t("settings:sshManager.label")}</Label>
          <Input
            id="managed-executor-name"
            className={settingsControlClassName()}
            value={name}
            disabled={busy}
            onChange={(event) => setName(event.target.value)}
          />
        </div>
        <BindingPicker
          selected={selected}
          manager={manager}
          busy={busy}
          onChange={(value) => {
            setSelected(value);
            setChecked("");
          }}
        />
        <Button
          type="button"
          variant="outline"
          className={settingsActionClassName()}
          onClick={manage}
          disabled={busy || manager.busy || conflict}
        >
          {t("settings:sshManager.binding.manage")}
        </Button>
        {conflict && <DraftConflict onDiscard={discard} />}
        {route && (
          <p className="break-all text-sm">
            {route.destination.user}@{route.destination.host}:{route.destination.port}
          </p>
        )}
        <p role="status" className="text-sm">
          {checked === route?.stamp
            ? t("settings:sshManager.binding.executorReady")
            : t("settings:sshManager.binding.notChecked")}
        </p>
        {(error || manager.error) && (
          <p role="alert" className="text-sm text-destructive">
            {t("settings:sshManager.binding.failed")}
          </p>
        )}
        <BindingActions
          busy={busy}
          ready={ready && !conflict}
          canSave={canSave}
          coordinated={Boolean(props.coordinatedSaveId)}
          test={test}
          save={save}
        />
      </div>
    </SettingsPageTemplate>
  );
}

function useManagedBinding(
  props: ManagedBindingProps,
  manager: ReturnType<typeof useSSHConnections>,
) {
  const draft = useBindingDraft(props);
  const { name, selected, conflict, initial, flow } = draft;
  const [checked, setChecked] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const route = manager.routes.find((item) => item.destination.id === selected);
  const ready = route?.destination.verified_route === route?.stamp && Boolean(route);
  const canSave = Boolean(name.trim()) && ready && checked === route?.stamp && !busy && !conflict;
  const dirty = draft.changed || Boolean(route && initial.stamp !== route.stamp);
  const test = async () => {
    if (!route || conflict) return;
    setBusy(true);
    setError(false);
    setChecked("");
    try {
      const result = await testSSHConnection({
        name,
        ssh_connection_id: selected,
        expected_stamp: route.stamp,
      });
      if (result.success) setChecked(route.stamp);
      else setError(true);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };
  const save = async () => {
    if (!route || !canSave) return;
    setBusy(true);
    setError(false);
    try {
      await props.onSave({
        name,
        identity_source: "agent",
        connection_id: selected,
        connection_stamp: route.stamp,
      });
      flow.clear();
    } catch (error) {
      setError(true);
      throw error;
    } finally {
      setBusy(false);
    }
  };
  const manage = useManageConnections(
    props,
    manager.busy || busy,
    draft.snapshot,
    draft.setSuspended,
    setError,
  );
  return {
    ...draft,
    checked,
    setChecked,
    busy,
    error,
    route,
    ready,
    canSave,
    dirty,
    manage,
    test,
    save,
    discard: () => {
      draft.discard();
      setChecked("");
    },
  };
}

function BindingActions({
  busy,
  ready,
  canSave,
  coordinated,
  test,
  save,
}: {
  busy: boolean;
  ready: boolean;
  canSave: boolean;
  coordinated: boolean;
  test: () => Promise<void>;
  save: () => Promise<void>;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        variant="outline"
        className={settingsActionClassName()}
        disabled={!ready || busy}
        onClick={() => {
          void test();
        }}
      >
        {t("settings:sshManager.binding.test")}
      </Button>
      {!coordinated && (
        <Button
          type="button"
          className={settingsActionClassName()}
          disabled={!canSave}
          onClick={() => {
            void save().catch(() => undefined);
          }}
        >
          {t("common:save")}
        </Button>
      )}
    </div>
  );
}

function initialBinding(props: SSHConnectionCardProps) {
  return {
    name: props.initial?.name ?? "",
    connection: props.initial?.connection_id ?? "",
    stamp: props.initial?.connection_stamp ?? "",
  };
}

function useManageConnections(
  props: ManagedBindingProps,
  busy: boolean,
  draft: SSHSetupDraft,
  setSuspended: (value: boolean) => void,
  setError: (value: boolean) => void,
) {
  const flow = useSSHSetupContinuation();
  const router = useRouter();
  const coordinator = useSettingsSaveCoordinator();
  return () => {
    if (busy || coordinator.exclusiveBusy || coordinator.status === "saving") return;
    if (
      coordinator.contributorStates.some(
        (item) => item.isDirty && item.id !== props.coordinatedSaveId,
      )
    ) {
      setError(true);
      return;
    }
    flushSync(() => {
      flow.begin(draft);
      setSuspended(true);
    });
    let navigated = false;
    router.push(SSH_CONNECTIONS_SETTINGS_HREF, {
      onNavigated: () => {
        navigated = true;
      },
    });
    if (!navigated) {
      coordinator.cancelPendingNavigation();
      flow.clear();
      setSuspended(false);
      setError(true);
    }
  };
}

function DraftConflict({ onDiscard }: { onDiscard: () => void }) {
  const { t } = useTranslation();
  return (
    <div role="alert" className="space-y-2 text-sm text-destructive">
      <p>{t("settings:sshManager.binding.draftConflict")}</p>
      <Button
        type="button"
        variant="outline"
        className={settingsActionClassName()}
        onClick={onDiscard}
      >
        {t("settings:sshManager.binding.reloadDraft")}
      </Button>
    </div>
  );
}

function BindingPicker({
  selected,
  manager,
  busy,
  onChange,
}: {
  selected: string;
  manager: ReturnType<typeof useSSHConnections>;
  busy: boolean;
  onChange: (id: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <ConnectionPicker
      id="managed-executor-connection"
      label={t("settings:sshManager.binding.connection")}
      value={selected}
      disabled={busy || manager.busy}
      onChange={onChange}
      options={[
        { value: "", label: t("settings:sshManager.selectConnection") },
        ...manager.routes
          .filter(
            (item) =>
              item.destination.verified_route === item.stamp || item.destination.id === selected,
          )
          .map((item) => ({ value: item.destination.id, label: item.destination.name })),
      ]}
    />
  );
}

function useBindingDraft(props: ManagedBindingProps) {
  const initial = initialBinding(props);
  const flow = useSSHSetupContinuation();
  const editor = usePathname();
  const restored = flow.draft?.editor === editor ? flow.draft : null;
  const baseline = JSON.stringify(initial);
  const conflict = Boolean(restored && restored.baseline !== baseline);
  const [name, setName] = useState(restored?.name ?? initial.name);
  const [selected, setSelected] = useState(restored?.connection ?? initial.connection);
  const [suspended, setSuspended] = useState(false);
  useEffect(() => {
    if (restored) document.getElementById("managed-executor-connection")?.focus();
  }, [restored]);
  return {
    initial,
    flow,
    name,
    setName,
    selected,
    setSelected,
    conflict,
    suspended,
    setSuspended,
    changed: name !== initial.name || selected !== initial.connection,
    snapshot: {
      editor,
      name,
      connection: selected,
      baseline,
      ownerUserId: props.ownerUserId ?? "",
    },
    discard: () => {
      flow.clear();
      setName(initial.name);
      setSelected(initial.connection);
    },
  };
}
