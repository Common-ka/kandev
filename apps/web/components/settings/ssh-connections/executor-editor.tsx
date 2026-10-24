"use client";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@kandev/ui/button";
import { useFeature } from "@/hooks/domains/features/use-feature";
import { useIsAdmin } from "@/hooks/domains/auth/use-is-admin";
import { SSHConnectionCard, type SSHConnectionCardProps } from "../ssh-connection-card";
import { settingsActionClassName } from "../settings-control";
import { AdoptionLauncher } from "./adoption";
import { ManagedBinding } from "./managed-binding";
export function SSHConnectionEditor(
  props: SSHConnectionCardProps & { executorId?: string; ownerUserId?: string },
) {
  const enabled = useFeature("sshConnectionManager");
  const admin = useIsAdmin();
  const { t } = useTranslation();
  const [managed, setManaged] = useState(Boolean(props.initial?.connection_id) || !props.initial);
  if (props.initial?.connection_id && (!enabled || !admin))
    return <p>{t("settings:sshManager.unavailable")}</p>;
  if (!enabled || !admin) return <SSHConnectionCard {...props} />;
  return (
    <div className="space-y-4">
      {!props.initial && (
        <div className="flex flex-wrap gap-2">
          <Button
            className={settingsActionClassName()}
            variant={managed ? "secondary" : "outline"}
            onClick={() => setManaged(true)}
          >
            {t("settings:sshManager.binding.shared")}
          </Button>
          <Button
            className={settingsActionClassName()}
            variant={!managed ? "secondary" : "outline"}
            onClick={() => setManaged(false)}
          >
            {t("settings:sshManager.binding.inline")}
          </Button>
        </div>
      )}
      {managed ? (
        <ManagedBinding {...props} />
      ) : (
        <>
          <SSHConnectionCard {...props} />
          {props.executorId && <AdoptionLauncher executorId={props.executorId} />}
        </>
      )}
    </div>
  );
}
