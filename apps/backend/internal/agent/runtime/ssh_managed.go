package runtime

import "github.com/kandev/kandev/internal/agent/runtime/lifecycle"

// ManagedSSHConnections is the runtime contract for retained managed SSH routes.
type ManagedSSHConnections = lifecycle.ManagedSSHConnections

// ClassifySSHDialError exposes the closed runtime SSH failure classification.
func ClassifySSHDialError(err error) SSHReachabilityReason {
	return SSHReachabilityReason(lifecycle.ClassifyDialError(err))
}
