"use client";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@kandev/ui/button";
import { Input } from "@kandev/ui/input";
import { Label } from "@kandev/ui/label";
import type { SSHIdentity } from "@/lib/types/http-ssh-connections";
import type { SSHManager } from "@/hooks/domains/settings/use-ssh-connections";
import { copyToClipboard } from "@/lib/utils/copy-to-clipboard";
import { SettingsPageTemplate } from "../settings-page-template";
import { settingsActionClassName, settingsControlClassName } from "../settings-control";
import { ManagerConfirmation } from "./confirmation";
export function IdentityDetails({
  identity,
  manager,
  onDeleted,
}: {
  identity: SSHIdentity;
  manager: SSHManager;
  onDeleted: () => void;
}) {
  const { t } = useTranslation();
  const [label, setLabel] = useState(identity.label);
  const [copied, setCopied] = useState<boolean | null>(null);
  const usage = manager.routes.filter((r) => r.destination.identity_id === identity.id).length;
  return (
    <SettingsPageTemplate
      title={t("settings:sshManager.identities")}
      showPageChrome={false}
      isDirty={label !== identity.label}
      saveId={`ssh-identity:${identity.id}`}
      saveRevision={`${identity.version}:${label}`}
      saveStatus={manager.busy ? "loading" : "idle"}
      canSave={Boolean(label.trim()) && !manager.busy}
      onSave={() => manager.renameIdentity(identity, label)}
      onDiscard={() => setLabel(identity.label)}
    >
      <div className="space-y-4 min-w-0">
        <div className="space-y-1">
          <Label htmlFor="ssh-identity-name">{t("settings:sshManager.label")}</Label>
          <Input
            id="ssh-identity-name"
            className={settingsControlClassName()}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            maxLength={200}
            disabled={manager.busy}
          />
        </div>
        <p className="text-sm text-muted-foreground">
          {identity.kind === "managed"
            ? t("settings:sshManager.custody")
            : t("settings:sshManager.externalIdentity")}
        </p>
        {identity.reference && <p className="break-all font-mono text-xs">{identity.reference}</p>}
        {identity.public_key && (
          <>
            <Label>{t("settings:sshManager.publicKey")}</Label>
            <pre className="whitespace-pre-wrap break-all rounded-md bg-muted p-3 text-xs">
              {identity.public_key}
            </pre>
            <p className="break-all font-mono text-xs">{identity.fingerprint}</p>
            <Button
              type="button"
              className={settingsActionClassName()}
              variant="outline"
              onClick={() => {
                void copyToClipboard(identity.public_key).then(setCopied);
              }}
            >
              {t("settings:sshManager.copyPublicKey")}
            </Button>
            {copied !== null && (
              <p role="status">
                {copied ? t("settings:sshManager.copied") : t("settings:sshManager.copyFailed")}
              </p>
            )}
          </>
        )}
        <p className="text-sm text-muted-foreground">
          {t("settings:sshManager.usedBy", { count: usage })}
        </p>
        <ManagerConfirmation
          label={t("settings:sshManager.deleteIdentity")}
          title={t("settings:sshManager.deleteIdentity")}
          description={t("settings:sshManager.deleteIdentityWarning")}
          target={identity.id}
          busy={manager.busy || usage > 0}
          destructive
          onConfirm={async () => {
            await manager.deleteIdentity(identity);
            onDeleted();
          }}
        />
      </div>
    </SettingsPageTemplate>
  );
}
