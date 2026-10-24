"use client";
import { sshConnectionSettingsPath } from "@/lib/settings/ssh-connection-settings-routes";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@kandev/ui/button";
import { useRouter } from "@/lib/routing/client-router";
import {
  previewSSHAdoption,
  createSSHAdoptionDrafts,
  adoptSSHConnection,
} from "@/lib/api/domains/ssh-connections-api";
import type {
  SSHAdoptionPreview,
  SSHAdoptionTarget,
  SSHRoute,
} from "@/lib/types/http-ssh-connections";
import { generateUUID } from "@/lib/uuid";
import { settingsActionClassName } from "../settings-control";
import { ManagerConfirmation } from "./confirmation";
export function AdoptionLauncher({ executorId }: { executorId: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  const [preview, setPreview] = useState<SSHAdoptionPreview | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [requestId] = useState(generateUUID);
  const load = async () => {
    setBusy(true);
    setError(false);
    try {
      setPreview(await previewSSHAdoption(executorId));
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };
  const create = async () => {
    if (!preview) return;
    setBusy(true);
    setError(false);
    try {
      const route = await createSSHAdoptionDrafts(executorId, preview.config_digest, requestId);
      const query = new URLSearchParams({
        tab: "connections",
        id: route.destination.id,
        adopt_executor: executorId,
        adopt_digest: preview.config_digest,
        adopt_connection: route.destination.id,
      });
      router.push(sshConnectionSettingsPath(query));
    } catch (error) {
      setError(true);
      throw error;
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="space-y-3 rounded-md border p-4">
      <Button
        type="button"
        className={settingsActionClassName()}
        variant="outline"
        disabled={busy}
        onClick={() => {
          void load();
        }}
      >
        {t("settings:sshManager.adoption.move")}
      </Button>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {t("settings:sshManager.adoption.failed")}
        </p>
      )}
      {preview && (
        <>
          <p className="text-sm">{t("settings:sshManager.adoption.previewHelp")}</p>
          <AdoptionTargetPreview
            target={preview.destination}
            label={t("settings:sshManager.destination")}
          />
          {preview.bastion && (
            <AdoptionTargetPreview
              target={preview.bastion}
              label={t("settings:sshManager.bastion")}
            />
          )}
          <ManagerConfirmation
            label={t("settings:sshManager.adoption.create")}
            title={t("settings:sshManager.adoption.move")}
            description={t("settings:sshManager.adoption.createHelp")}
            target={`${executorId}:${preview.config_digest}`}
            busy={busy}
            onConfirm={create}
          />
        </>
      )}
    </section>
  );
}
function AdoptionTargetPreview({ target, label }: { target: SSHAdoptionTarget; label: string }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-1 break-all rounded-md bg-muted p-3 text-xs">
      <p className="font-medium">{label}</p>
      <p>
        {target.user}@{target.host}:{target.port}
      </p>
      <p>{target.identity_reference}</p>
      <p>{target.fingerprint || t("settings:sshManager.trustNeeded")}</p>
    </div>
  );
}
export function AdoptionFinish({
  executorId,
  digest,
  route,
}: {
  executorId: string;
  digest: string;
  route: SSHRoute;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const finish = async () => {
    setBusy(true);
    setError(false);
    try {
      await adoptSSHConnection(executorId, digest, route);
      router.push(`/settings/executors/ssh/${encodeURIComponent(executorId)}`);
    } catch (error) {
      setError(true);
      throw error;
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="space-y-2 rounded-md border p-3">
      <p className="text-sm">{t("settings:sshManager.adoption.finishHelp")}</p>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {t("settings:sshManager.adoption.failed")}
        </p>
      )}
      <ManagerConfirmation
        label={t("settings:sshManager.adoption.finish")}
        title={t("settings:sshManager.adoption.move")}
        description={t("settings:sshManager.adoption.finishHelp")}
        target={`${executorId}:${digest}:${route.stamp}`}
        busy={busy || route.destination.verified_route !== route.stamp}
        onConfirm={finish}
      />
    </div>
  );
}
