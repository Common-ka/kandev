"use client";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@kandev/ui/button";
import { Input } from "@kandev/ui/input";
import { Label } from "@kandev/ui/label";
import type { SSHRoute } from "@/lib/types/http-ssh-connections";
import type { SSHManager } from "@/hooks/domains/settings/use-ssh-connections";
import { generateUUID } from "@/lib/uuid";
import { copyToClipboard } from "@/lib/utils/copy-to-clipboard";
import { settingsActionClassName, settingsControlClassName } from "../settings-control";
import { ManagerConfirmation } from "./confirmation";
import { ConnectionPicker } from "./picker";
export function EnrollmentPanel({ route, manager }: { route: SSHRoute; manager: SSHManager }) {
  return <EnrollmentForm key={route.stamp} route={route} manager={manager} />;
}
function EnrollmentForm({ route, manager }: { route: SSHRoute; manager: SSHManager }) {
  const { t } = useTranslation();
  const [password, setPassword] = useState("");
  const [bootstrap, setBootstrap] = useState("");
  const [mode, setMode] = useState("password");
  const [copied, setCopied] = useState<boolean | null>(null);
  const identity = manager.identities.find((item) => item.id === route.destination.identity_id);
  if (!identity?.public_key) return null;
  const install = async () => {
    try {
      await manager.enroll(route, {
        request_id: generateUUID(),
        expected_stamp: route.stamp,
        key_fingerprint: identity.fingerprint,
        mode: mode === "password" ? "password" : "identity",
        ...(mode === "password" ? { password } : { bootstrap_identity_id: bootstrap }),
      });
    } finally {
      setPassword("");
    }
  };
  const latest =
    route.latest_enrollment?.stamp === route.stamp ? route.latest_enrollment : undefined;
  return (
    <section
      className="mt-6 min-w-0 space-y-3"
      aria-label={t("settings:sshManager.enrollment.title")}
    >
      <h3 className="text-sm font-medium">{t("settings:sshManager.enrollment.title")}</h3>
      <p className="text-sm text-muted-foreground">{t("settings:sshManager.enrollment.manual")}</p>
      <pre className="whitespace-pre-wrap break-all rounded-md bg-muted p-3 text-xs">
        {identity.public_key}
      </pre>
      <Button
        type="button"
        variant="outline"
        className={settingsActionClassName()}
        onClick={() => {
          void copyToClipboard(identity.public_key).then(setCopied);
        }}
      >
        {t("settings:sshManager.copyPublicKey")}
      </Button>
      {copied !== null && (
        <p role="status" className="text-sm">
          {t(copied ? "settings:sshManager.copied" : "settings:sshManager.copyFailed")}
        </p>
      )}
      <EnrollmentStatus latest={latest} />
      {!route.destination.fingerprint ? (
        <p className="text-sm text-muted-foreground">
          {t("settings:sshManager.enrollment.trustFirst")}
        </p>
      ) : (
        <fieldset disabled={manager.busy} className="space-y-3">
          <legend className="text-sm font-medium">
            {t("settings:sshManager.enrollment.assisted")}
          </legend>
          <EnrollmentBootstrapFields
            mode={mode}
            setMode={setMode}
            password={password}
            setPassword={setPassword}
            bootstrap={bootstrap}
            setBootstrap={setBootstrap}
            manager={manager}
          />
          <ManagerConfirmation
            label={t("settings:sshManager.enrollment.install")}
            title={t("settings:sshManager.enrollment.confirmTitle")}
            description={
              <span className="block space-y-2 break-all">
                <span className="block">{t("settings:sshManager.enrollment.confirmHelp")}</span>
                <span className="block">
                  {route.destination.user}@{route.destination.host}:{route.destination.port}
                </span>
                <span className="block">{route.destination.fingerprint}</span>
                <span className="block">{identity.fingerprint}</span>
              </span>
            }
            target={`${route.destination.id}:${route.stamp}:${identity.fingerprint}`}
            busy={
              manager.busy ||
              latest?.state === "started" ||
              (mode === "password" ? !password : !bootstrap)
            }
            onConfirm={install}
            onDismiss={() => setPassword("")}
          />
        </fieldset>
      )}
    </section>
  );
}

function EnrollmentStatus({ latest }: { latest: SSHRoute["latest_enrollment"] }) {
  const { t } = useTranslation();
  if (!latest) return null;
  return (
    <>
      <p role="status" className="rounded-md border p-3 text-sm">
        {t(`settings:sshManager.enrollment.states.${latest.state}`)}
      </p>
      {latest.error_code && (
        <p className="text-sm text-muted-foreground">
          {latest.hop && (
            <>
              {t(
                latest.hop === "bastion"
                  ? "settings:sshManager.bastion"
                  : "settings:sshManager.destination",
              )}
              :{" "}
            </>
          )}
          {t(`settings:sshManager.errors.${latest.error_code}`, {
            defaultValue: t("settings:sshManager.errors.ssh_operation_failed"),
          })}
        </p>
      )}
    </>
  );
}

function EnrollmentBootstrapFields({
  mode,
  setMode,
  password,
  setPassword,
  bootstrap,
  setBootstrap,
  manager,
}: {
  mode: string;
  setMode: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  bootstrap: string;
  setBootstrap: (value: string) => void;
  manager: SSHManager;
}) {
  const { t } = useTranslation();
  return (
    <>
      {" "}
      <ConnectionPicker
        id="ssh-enrollment-mode"
        label={t("settings:sshManager.method")}
        value={mode}
        onChange={(value) => {
          setMode(value);
          setPassword("");
        }}
        disabled={manager.busy}
        options={[
          { value: "password", label: t("settings:sshManager.enrollment.password") },
          { value: "identity", label: t("settings:sshManager.enrollment.existingIdentity") },
        ]}
      />
      {mode === "password" ? (
        <div className="space-y-1">
          <Label htmlFor="ssh-enrollment-password">
            {t("settings:sshManager.enrollment.password")}
          </Label>
          <Input
            id="ssh-enrollment-password"
            className={settingsControlClassName()}
            type="password"
            autoComplete="off"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            {t("settings:sshManager.enrollment.passwordHelp")}
          </p>
        </div>
      ) : (
        <ConnectionPicker
          id="ssh-enrollment-identity"
          label={t("settings:sshManager.enrollment.existingIdentity")}
          value={bootstrap}
          onChange={setBootstrap}
          disabled={manager.busy}
          options={[
            { value: "", label: t("settings:sshManager.selectIdentity") },
            ...manager.identities.map((item) => ({ value: item.id, label: item.label })),
          ]}
        />
      )}
    </>
  );
}
