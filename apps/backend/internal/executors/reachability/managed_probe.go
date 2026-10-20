package reachability

import (
	"context"
	agentruntime "github.com/kandev/kandev/internal/agent/runtime"
	"github.com/kandev/kandev/internal/task/models"
)

type ManagedProbe func(context.Context, string) agentruntime.SSHProbeOutcome

// SetManagedProbe is configured before Start. Legacy executors keep the existing
// probe implementation; managed selectors cannot fall back to inline settings.
func (p *Poller) SetManagedProbe(probe ManagedProbe) {
	p.probe = func(ctx context.Context, executor *models.Executor) agentruntime.SSHProbeOutcome {
		if executor.Config["ssh_connection_id"] == "" {
			return defaultProbe(ctx, executor)
		}
		if probe == nil {
			return agentruntime.SSHProbeOutcome{Reason: agentruntime.SSHReachabilityReasonConfig, Message: "managed SSH connections unavailable"}
		}
		return probe(ctx, executor.ID)
	}
}
