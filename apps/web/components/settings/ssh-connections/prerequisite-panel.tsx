"use client";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@kandev/ui/button";
import type { SSHRoute, SSHPreflight } from "@/lib/types/http-ssh-connections";
import type { SSHManager } from "@/hooks/domains/settings/use-ssh-connections";
import { settingsActionClassName } from "../settings-control";
export function PrerequisitePanel({ route, manager }: { route: SSHRoute; manager: SSHManager }) {
  const { t } = useTranslation();
  const [result, setResult] = useState<SSHPreflight | null>(null);
  return (
    <section className="mt-4 space-y-2">
      <Button
        type="button"
        variant="outline"
        className={settingsActionClassName()}
        disabled={manager.busy}
        onClick={() => {
          void manager
            .preflight(route)
            .then(setResult)
            .catch(() => undefined);
        }}
      >
        {t("settings:sshManager.preflight")}
      </Button>
      {result?.stamp === route.stamp && (
        <div role="status" className="text-sm">
          {result.checks.length === 0 ? (
            <p>{t("settings:sshManager.prerequisitesReady")}</p>
          ) : (
            <ul className="list-disc space-y-1 pl-5">
              {result.checks.map((check) => (
                <li key={`${check.hop}:${check.code}`}>
                  {t(
                    check.hop === "bastion"
                      ? "settings:sshManager.bastion"
                      : "settings:sshManager.destination",
                  )}
                  :{" "}
                  {t(`settings:sshManager.errors.${check.code}`, {
                    defaultValue: t("settings:sshManager.errors.ssh_operation_failed"),
                  })}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
