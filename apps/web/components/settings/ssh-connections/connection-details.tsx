"use client";
import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@kandev/ui/button";
import { Input } from "@kandev/ui/input";
import { Label } from "@kandev/ui/label";
import type {
  ManagedSSHConnection,
  SSHObservation,
  SSHRoute,
} from "@/lib/types/http-ssh-connections";
import type { SSHManager } from "@/hooks/domains/settings/use-ssh-connections";
import { generateUUID } from "@/lib/uuid";
import { useReturnedIdentity } from "./use-returned-identity";
import { useSettingsSaveCoordinator } from "../settings-save-provider";
import { SettingsPageTemplate } from "../settings-page-template";
import { settingsActionClassName, settingsControlClassName } from "../settings-control";
import { ConnectionPicker } from "./picker";
import { PrerequisitePanel } from "./prerequisite-panel";
import { EnrollmentPanel } from "./enrollment-panel";
import { ManagerConfirmation } from "./confirmation";
const empty: ManagedSSHConnection = {
  id: "",
  name: "",
  host: "",
  port: 22,
  user: "",
  identity_id: "",
  fingerprint: "",
  public_key: "",
  version: 0,
  revision: 0,
};
function editable(c: ManagedSSHConnection) {
  return JSON.stringify([c.name, c.host, c.port, c.user, c.identity_id, c.bastion_id ?? ""]);
}
export function ConnectionDetails({
  route,
  manager,
  onSaved,
  onDeleted,
  onCreateBastion,
  onCreateIdentity,
}: {
  route?: SSHRoute;
  manager: SSHManager;
  onSaved: (route: SSHRoute) => void;
  onDeleted: () => void;
  onCreateBastion?: (route: SSHRoute) => void;
  onCreateIdentity?: (route: SSHRoute) => void;
}) {
  const { t } = useTranslation();
  const { form, requestId, dirty, update, saveDraft, discard } = useConnectionDraft(route, manager);
  const [observation, setObservation] = useState<SSHObservation | null>(null);
  const save = async () => {
    const saved = await saveDraft();
    onSaved(saved);
  };
  const createRelated = useCreateRelated(saveDraft);
  const unavailableIdentity = useReturnedIdentity(manager.identities, (id) =>
    update("identity_id", id),
  );
  const savedAndClean = Boolean(route) && !dirty;
  return (
    <SettingsPageTemplate
      title={t("settings:sshManager.connections")}
      showPageChrome={false}
      saveId={`ssh-connection:${form.id || requestId}`}
      saveRevision={editable(form)}
      isDirty={dirty}
      canSave={Boolean(form.name.trim()) && !manager.busy}
      saveStatus={manager.busy ? "loading" : "idle"}
      onSave={save}
      onDiscard={discard}
    >
      <ConnectionFields
        form={form}
        manager={manager}
        update={update}
        createIdentity={onCreateIdentity ? () => createRelated(onCreateIdentity) : undefined}
      />
      {unavailableIdentity && (
        <p role="alert" className="text-sm text-destructive">
          {t("settings:sshManager.recordUnavailable")}
        </p>
      )}
      {onCreateBastion && (
        <Button
          type="button"
          variant="outline"
          className={settingsActionClassName("mt-4")}
          disabled={manager.busy || !form.name.trim()}
          onClick={() => createRelated(onCreateBastion)}
        >
          {t("settings:sshManager.createBastion")}
        </Button>
      )}
      {!route || dirty ? (
        <p className="mt-4 text-sm text-muted-foreground">{t("settings:sshManager.saveFirst")}</p>
      ) : (
        <ConnectionTrust
          route={route}
          manager={manager}
          observation={observation}
          setObservation={setObservation}
        />
      )}
      {savedAndClean && route && (
        <>
          <PrerequisitePanel route={route} manager={manager} />
          <EnrollmentPanel route={route} manager={manager} />
        </>
      )}
      {route && (
        <div className="mt-6">
          <ManagerConfirmation
            label={t("settings:sshManager.deleteConnection")}
            title={t("settings:sshManager.deleteConnection")}
            description={t("settings:sshManager.deleteConnectionWarning")}
            target={route.destination.id}
            busy={manager.busy || dirty}
            destructive
            onConfirm={async () => {
              await manager.deleteConnection(route);
              onDeleted();
            }}
          />
        </div>
      )}
    </SettingsPageTemplate>
  );
}
function ConnectionTrust({
  route,
  manager,
  observation,
  setObservation,
}: {
  route: SSHRoute;
  manager: SSHManager;
  observation: SSHObservation | null;
  setObservation: (value: SSHObservation | null) => void;
}) {
  const { t } = useTranslation();
  const ready = route.destination.verified_route === route.stamp;
  return (
    <section className="mt-6 space-y-3 min-w-0">
      <p role="status" className="text-sm font-medium">
        {ready ? t("settings:sshManager.ready") : t("settings:sshManager.draft")}
      </p>
      {route.destination.fingerprint && (
        <p className="break-all font-mono text-xs">{route.destination.fingerprint}</p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          className={settingsActionClassName()}
          disabled={manager.busy}
          onClick={() => {
            void manager
              .observe(route)
              .then(setObservation)
              .catch(() => undefined);
          }}
        >
          {t("settings:sshManager.observe")}
        </Button>
        <Button
          type="button"
          className={settingsActionClassName()}
          disabled={manager.busy || !route.destination.fingerprint}
          onClick={() => {
            void manager.test(route).catch(() => undefined);
          }}
        >
          {t("settings:sshManager.test")}
        </Button>
      </div>
      {!route.destination.fingerprint && (
        <p className="text-sm text-muted-foreground">{t("settings:sshManager.trustNeeded")}</p>
      )}
      {observation && (
        <div className="space-y-3 rounded-md border p-3">
          <p className="text-sm">{t("settings:sshManager.trustDescription")}</p>
          <p className="break-all font-mono text-xs">{observation.fingerprint}</p>
          <ManagerConfirmation
            label={t("settings:sshManager.trust")}
            title={t("settings:sshManager.trustTitle")}
            description={
              <div className="space-y-3">
                <p>{t("settings:sshManager.trustDescription")}</p>
                {route.destination.fingerprint && (
                  <p className="break-all">
                    {t("settings:sshManager.oldFingerprint")}: {route.destination.fingerprint}
                  </p>
                )}
                <p className="break-all">
                  {t("settings:sshManager.newFingerprint")}: {observation.fingerprint}
                </p>
              </div>
            }
            target={observation.receipt}
            busy={manager.busy}
            onConfirm={async () => {
              await manager.trust(route, observation);
              setObservation(null);
            }}
          />
        </div>
      )}
      <p className="text-sm text-muted-foreground">{t("settings:sshManager.executorReadiness")}</p>
    </section>
  );
}

function ConnectionFields({
  form,
  manager,
  update,
  createIdentity,
}: {
  form: ManagedSSHConnection;
  manager: SSHManager;
  update: (key: keyof ManagedSSHConnection, value: string | number) => void;
  createIdentity?: () => void;
}) {
  const { t } = useTranslation();
  return (
    <fieldset disabled={manager.busy} className="space-y-4 min-w-0">
      <legend className="text-sm font-medium">{t("settings:sshManager.target")}</legend>
      <div className="space-y-1">
        <Label htmlFor="ssh-connection-name">{t("settings:sshManager.label")}</Label>
        <Input
          id="ssh-connection-name"
          className={settingsControlClassName()}
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          maxLength={200}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-[1fr_6rem]">
        <div className="space-y-1 min-w-0">
          <Label htmlFor="ssh-managed-host">{t("settings:sshManager.host")}</Label>
          <Input
            id="ssh-managed-host"
            className={settingsControlClassName()}
            value={form.host}
            onChange={(e) => update("host", e.target.value)}
            maxLength={253}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="ssh-managed-port">{t("settings:sshManager.port")}</Label>
          <Input
            id="ssh-managed-port"
            className={settingsControlClassName()}
            type="number"
            min={1}
            max={65535}
            value={form.port}
            onChange={(e) => update("port", Number(e.target.value))}
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="ssh-managed-user">{t("settings:sshManager.user")}</Label>
        <Input
          id="ssh-managed-user"
          className={settingsControlClassName()}
          value={form.user}
          onChange={(e) => update("user", e.target.value)}
          maxLength={256}
        />
      </div>
      <ConnectionPicker
        id="ssh-managed-identity"
        label={t("settings:sshManager.identity")}
        value={form.identity_id}
        onChange={(value) => update("identity_id", value)}
        disabled={manager.busy}
        options={[
          { value: "", label: t("settings:sshManager.selectIdentity") },
          ...manager.identities.map((identity) => ({ value: identity.id, label: identity.label })),
        ]}
      />
      {createIdentity && (
        <CreateIdentityAction
          disabled={manager.busy || !form.name.trim()}
          onClick={createIdentity}
        />
      )}
      <ConnectionPicker
        id="ssh-managed-bastion"
        label={t("settings:sshManager.bastion")}
        value={form.bastion_id ?? ""}
        onChange={(value) => update("bastion_id", value)}
        disabled={manager.busy}
        options={[
          { value: "", label: t("settings:sshManager.direct") },
          ...manager.routes
            .filter(
              (r) =>
                r.destination.id !== form.id &&
                !r.destination.bastion_id &&
                r.destination.verified_route === r.stamp,
            )
            .map((r) => ({ value: r.destination.id, label: r.destination.name })),
        ]}
      />
    </fieldset>
  );
}

function useConnectionDraft(route: SSHRoute | undefined, manager: SSHManager) {
  const [baseline, setBaseline] = useState(route?.destination ?? empty);
  const [form, setForm] = useState(baseline);
  const [requestId, setRequestId] = useState(generateUUID);
  const dirty = editable(form) !== editable(baseline);
  useEffect(() => {
    if (route && !dirty) {
      setBaseline(route.destination);
      setForm(route.destination);
    }
  }, [route, dirty]);
  const update = (key: keyof ManagedSSHConnection, value: string | number) => {
    setForm((previous) => ({ ...previous, [key]: value }));
    if (!baseline.id) setRequestId(generateUUID());
  };
  const saveDraft = async () => {
    const saved = await manager.saveConnection({
      request_id: requestId,
      connection: form,
      expected_version: baseline.version,
    });
    flushSync(() => {
      setBaseline(saved.destination);
      setForm(saved.destination);
    });
    return saved;
  };
  return { form, requestId, dirty, update, saveDraft, discard: () => setForm(baseline) };
}

function useCreateRelated(saveDraft: () => Promise<SSHRoute>) {
  const coordinator = useSettingsSaveCoordinator();
  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  return (navigate: (route: SSHRoute) => void) => {
    void coordinator
      .runExclusive(async () => {
        const saved = await saveDraft();
        if (active.current) navigate(saved);
      })
      .catch(() => undefined);
  };
}

function CreateIdentityAction({ disabled, onClick }: { disabled: boolean; onClick: () => void }) {
  const { t } = useTranslation();
  return (
    <Button
      type="button"
      variant="outline"
      className={settingsActionClassName()}
      disabled={disabled}
      onClick={onClick}
    >
      {t("settings:sshManager.createIdentityForConnection")}
    </Button>
  );
}
