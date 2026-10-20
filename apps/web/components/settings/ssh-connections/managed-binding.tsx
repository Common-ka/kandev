"use client";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@kandev/ui/button";
import { Input } from "@kandev/ui/input";
import { Label } from "@kandev/ui/label";
import { useRouter } from "@/lib/routing/client-router";
import { useSSHConnections } from "@/hooks/domains/settings/use-ssh-connections";
import { testSSHConnection } from "@/lib/api/domains/ssh-api";
import type { SSHConnectionCardProps } from "../ssh-connection-card";
import { SettingsPageTemplate } from "../settings-page-template";
import { settingsActionClassName, settingsControlClassName } from "../settings-control";
import { ConnectionPicker } from "./picker";
const managerPath = "/settings/ssh-connections";
export function ManagedBinding(props: SSHConnectionCardProps) {
  const { t } = useTranslation();
  const router = useRouter();
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
      isDirty={Boolean(props.coordinatedSaveId) && dirty}
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
        <ConnectionPicker
          id="managed-executor-connection"
          label={t("settings:sshManager.binding.connection")}
          value={selected}
          disabled={busy || manager.busy}
          onChange={(value) => {
            setSelected(value);
            setChecked("");
          }}
          options={[
            { value: "", label: t("settings:sshManager.selectConnection") },
            ...manager.routes
              .filter(
                (item) =>
                  item.destination.verified_route === item.stamp ||
                  item.destination.id === selected,
              )
              .map((item) => ({ value: item.destination.id, label: item.destination.name })),
          ]}
        />
        <Button
          type="button"
          variant="outline"
          className={settingsActionClassName()}
          onClick={() => router.push(managerPath)}
        >
          {t("settings:sshManager.binding.manage")}
        </Button>
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
          ready={ready}
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
  props: SSHConnectionCardProps,
  manager: ReturnType<typeof useSSHConnections>,
) {
  const initial = initialBinding(props);
  const [name, setName] = useState(initial.name);
  const [selected, setSelected] = useState(initial.connection);
  const [checked, setChecked] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const route = manager.routes.find((item) => item.destination.id === selected);
  const ready = route?.destination.verified_route === route?.stamp && Boolean(route);
  const canSave = Boolean(name.trim()) && ready && checked === route?.stamp && !busy;
  const dirty =
    name !== initial.name ||
    selected !== initial.connection ||
    Boolean(route && initial.stamp !== route.stamp);
  const test = async () => {
    if (!route) return;
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
    } catch (error) {
      setError(true);
      throw error;
    } finally {
      setBusy(false);
    }
  };
  return {
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
    test,
    save,
    discard: () => {
      setName(initial.name);
      setSelected(initial.connection);
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
