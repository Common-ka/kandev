import { randomUUID } from "node:crypto";
import path from "node:path";
import { test, expect } from "../../fixtures/ssh-test-base";
import { startBastionAndTarget, stopBastionAndTarget } from "../../helpers/ssh-bastion";
import type { SSHBastionHandles } from "../../helpers/ssh-bastion";
import type {
  SSHAdoptionPreview,
  SSHObservation,
  SSHRoute,
} from "../../../lib/types/http-ssh-connections";

// @covers AC-EXECUTORS-SSH-CONNECTIONS-002.7, AC-EXECUTORS-SSH-CONNECTIONS-005.2
for (const topology of ["direct", "bastion"] as const) {
  test(`${topology} adoption preserves the route and rejects unverified or stale changes`, async ({
    backend,
    apiClient,
    seedData,
  }, testInfo) => {
    test.setTimeout(240_000);
    const release = await backend.useEnv({ KANDEV_FEATURES_SSH_CONNECTION_MANAGER: "true" });
    let handles: SSHBastionHandles | undefined;
    const send = (suffix: string, body?: unknown) =>
      fetch(`${backend.baseUrl}/api/v1/ssh/managed${suffix}`, {
        method: body === undefined ? "GET" : "POST",
        headers: { "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    const request = async <T>(suffix: string, body?: unknown): Promise<T> => {
      const response = await send(suffix, body);
      expect(response.ok, await response.clone().text()).toBe(true);
      return response.json() as Promise<T>;
    };
    try {
      if (topology === "bastion") {
        handles = startBastionAndTarget(
          testInfo.workerIndex,
          path.join(backend.tmpDir, "managed-adoption"),
        );
      }
      const target = handles?.target ?? seedData.sshTarget;
      const config: Record<string, string> = {
        ssh_host: target.host,
        ssh_port: String(target.port),
        ssh_user: target.user,
        ssh_identity_source: "file",
        ssh_identity_file: target.identityFile,
        ssh_shell: "bash",
      };
      if (handles) {
        config.ssh_proxy_jump = `${handles.bastion.user}@${handles.bastion.host}:${handles.bastion.port}`;
      }
      const probe = await apiClient.testSSHConnection({
        name: `Adoption ${topology} source`,
        host: target.host,
        port: target.port,
        user: target.user,
        identity_source: "file",
        identity_file: target.identityFile,
        proxy_jump: config.ssh_proxy_jump,
      });
      expect(probe.success).toBe(true);
      config.ssh_host_fingerprint = probe.fingerprint!;
      const executor = await apiClient.createSSHExecutor(`Adopt ${topology}`, config);
      const root = `/executors/${executor.id}`;
      const preview = await request<SSHAdoptionPreview>(`${root}/adoption-preview`);
      expect(preview.destination).toMatchObject({
        host: target.host,
        port: target.port,
        user: target.user,
        fingerprint: probe.fingerprint,
        identity_reference: target.identityFile,
      });
      let route = await request<SSHRoute>(`${root}/adoption-drafts`, {
        request_id: randomUUID(),
        expected_config_digest: preview.config_digest,
      });
      expect((await apiClient.getExecutor(executor.id)).config).toEqual(config);
      const adopt = () =>
        send(`${root}/adopt-connection`, {
          expected_config_digest: preview.config_digest,
          connection_id: route.destination.id,
          expected_stamp: route.stamp,
        });
      expect((await adopt()).ok).toBe(false);
      expect((await apiClient.getExecutor(executor.id)).config).toEqual(config);
      if (handles) {
        expect(route.bastion?.fingerprint).toBe("");
        const bastionRoute = await request<SSHRoute>(`/connections/${route.bastion!.id}`);
        const observation = await request<SSHObservation>(
          `/connections/${route.bastion!.id}/observe`,
          { expected_stamp: bastionRoute.stamp },
        );
        const trustedBastion = await request<SSHRoute>(`/connections/${route.bastion!.id}/trust`, {
          expected_stamp: observation.stamp,
          receipt: observation.receipt,
          fingerprint: observation.fingerprint,
        });
        route = await request<SSHRoute>(`/connections/${route.destination.id}`);
        const unready = await send(`/connections/${route.destination.id}/test`, {
          expected_stamp: route.stamp,
        });
        expect(unready.status).toBe(422);
        expect(await unready.json()).toMatchObject({
          error: "ssh_bastion_not_ready",
          hop: "bastion",
        });
        await request(`/connections/${trustedBastion.destination.id}/test`, {
          expected_stamp: trustedBastion.stamp,
        });
        route = await request<SSHRoute>(`/connections/${route.destination.id}`);
      }
      route = await request<SSHRoute>(`/connections/${route.destination.id}/test`, {
        expected_stamp: route.stamp,
      });
      expect(route.destination.verified_route).toBe(route.stamp);
      const concurrentConfig = { ...config, ssh_shell: "sh" };
      await apiClient.updateExecutor(executor.id, { config: concurrentConfig });
      expect((await adopt()).status).toBe(409);
      expect((await apiClient.getExecutor(executor.id)).config).toEqual(concurrentConfig);
      await apiClient.updateExecutor(executor.id, { config });
      expect((await adopt()).ok).toBe(true);
      expect((await apiClient.getExecutor(executor.id)).config).toEqual({
        ssh_shell: "bash",
        ssh_connection_id: route.destination.id,
        ssh_connection_stamp: route.stamp,
      });
      await backend.restart();
      const saved = await request<SSHRoute>(`/connections/${route.destination.id}`);
      expect(saved.stamp).toBe(route.stamp);
      expect(saved.destination.fingerprint).toBe(probe.fingerprint);
      await request(`/connections/${saved.destination.id}/test`, {
        expected_stamp: saved.stamp,
      });
    } finally {
      if (handles) stopBastionAndTarget(handles);
      await release();
    }
  });
}
