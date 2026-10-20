import { fetchJson, type ApiRequestOptions } from "../client";
import type {
  CreateSSHIdentity,
  EnrollSSHKey,
  SSHEnrollment,
  SSHPreflight,
  SSHAdoptionPreview,
  SaveSSHConnection,
  SSHIdentity,
  SSHRoute,
  SSHObservation,
} from "@/lib/types/http-ssh-connections";
const root = "/api/v1/ssh/managed";
function mutate<T>(
  path: string,
  method: string,
  body: unknown,
  options?: ApiRequestOptions,
): Promise<T> {
  const headers = new Headers(options?.init?.headers);
  headers.set("Content-Type", "application/json");
  return fetchJson<T>(`${root}${path}`, {
    ...options,
    cache: "no-store",
    init: { ...options?.init, method, headers, body: JSON.stringify(body) },
  });
}
export function listSSHIdentities(options?: ApiRequestOptions): Promise<SSHIdentity[]> {
  return fetchJson(`${root}/identities`, { ...options, cache: "no-store" });
}
export function listManagedSSHConnections(options?: ApiRequestOptions): Promise<SSHRoute[]> {
  return fetchJson(`${root}/connections`, { ...options, cache: "no-store" });
}
export function createSSHIdentity(
  request: CreateSSHIdentity,
  options?: ApiRequestOptions,
): Promise<SSHIdentity> {
  return mutate("/identities", "POST", request, options);
}
export function renameSSHIdentity(identity: SSHIdentity, label: string): Promise<SSHIdentity> {
  return mutate(`/identities/${encodeURIComponent(identity.id)}`, "PATCH", {
    label,
    expected_version: identity.version,
  });
}
export function deleteSSHIdentity(identity: SSHIdentity): Promise<{ deleted: boolean }> {
  return mutate(`/identities/${encodeURIComponent(identity.id)}`, "DELETE", {
    expected_version: identity.version,
  });
}
export function saveManagedSSHConnection(request: SaveSSHConnection): Promise<SSHRoute> {
  const path = request.expected_version
    ? `/connections/${encodeURIComponent(request.connection.id)}`
    : "/connections";
  return mutate(path, request.expected_version ? "PATCH" : "POST", request);
}
export function deleteManagedSSHConnection(route: SSHRoute): Promise<{ deleted: boolean }> {
  return mutate(`/connections/${encodeURIComponent(route.destination.id)}`, "DELETE", {
    expected_version: route.destination.version,
  });
}
export function observeManagedSSH(route: SSHRoute): Promise<SSHObservation> {
  return mutate(`/connections/${encodeURIComponent(route.destination.id)}/observe`, "POST", {
    expected_stamp: route.stamp,
  });
}
export function trustManagedSSH(route: SSHRoute, observation: SSHObservation): Promise<SSHRoute> {
  return mutate(`/connections/${encodeURIComponent(route.destination.id)}/trust`, "POST", {
    expected_stamp: observation.stamp,
    receipt: observation.receipt,
    fingerprint: observation.fingerprint,
  });
}
export function testManagedSSH(route: SSHRoute): Promise<SSHRoute> {
  return mutate(`/connections/${encodeURIComponent(route.destination.id)}/test`, "POST", {
    expected_stamp: route.stamp,
  });
}

export function enrollManagedSSH(route: SSHRoute, request: EnrollSSHKey): Promise<SSHEnrollment> {
  return mutate(`/connections/${encodeURIComponent(route.destination.id)}/enroll`, "POST", request);
}
export function preflightManagedSSH(route: SSHRoute): Promise<SSHPreflight> {
  return mutate(`/connections/${encodeURIComponent(route.destination.id)}/preflight`, "POST", {
    expected_stamp: route.stamp,
  });
}

export function previewSSHAdoption(executorId: string): Promise<SSHAdoptionPreview> {
  return fetchJson(`${root}/executors/${encodeURIComponent(executorId)}/adoption-preview`, {
    cache: "no-store",
  });
}
export function createSSHAdoptionDrafts(
  executorId: string,
  digest: string,
  requestId: string,
): Promise<SSHRoute> {
  return mutate(`/executors/${encodeURIComponent(executorId)}/adoption-drafts`, "POST", {
    expected_config_digest: digest,
    request_id: requestId,
  });
}
export function adoptSSHConnection(
  executorId: string,
  digest: string,
  route: SSHRoute,
): Promise<{ adopted: boolean }> {
  return mutate(`/executors/${encodeURIComponent(executorId)}/adopt-connection`, "POST", {
    expected_config_digest: digest,
    connection_id: route.destination.id,
    expected_stamp: route.stamp,
  });
}
