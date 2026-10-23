package lifecycle

import (
	"context"
	"encoding/json"

	"github.com/kandev/kandev/internal/task/models"
)

type canonicalAgentDeliveryReceiptProjector interface {
	ProjectCanonicalAgentDeliveryEventsWithReceipt(context.Context, []*models.AgentDeliveryEvent, []*models.AgentDeliveryEffect) ([]bool, *models.ConversationMutationReceipt, error)
}

func projectCanonicalSingleWithReceipt(ctx context.Context, projector canonicalAgentDeliveryProjector, event *models.AgentDeliveryEvent, effect *models.AgentDeliveryEffect) (bool, json.RawMessage, error) {
	if withReceipt, ok := projector.(canonicalAgentDeliveryReceiptProjector); ok {
		appended, receipt, err := withReceipt.ProjectCanonicalAgentDeliveryEventsWithReceipt(ctx, []*models.AgentDeliveryEvent{event}, []*models.AgentDeliveryEffect{effect})
		if err != nil {
			return false, nil, err
		}
		return len(appended) == 1 && appended[0], encodeCanonicalConversationReceipt(receipt), nil
	}
	appended, err := projector.ProjectCanonicalAgentDeliveryEvent(ctx, event, effect)
	return appended, nil, err
}

func projectCanonicalBatchWithReceipt(ctx context.Context, projector canonicalAgentDeliveryBatchProjector, events []*models.AgentDeliveryEvent, effects []*models.AgentDeliveryEffect) ([]bool, json.RawMessage, error) {
	if withReceipt, ok := projector.(canonicalAgentDeliveryReceiptProjector); ok {
		appended, receipt, err := withReceipt.ProjectCanonicalAgentDeliveryEventsWithReceipt(ctx, events, effects)
		if err != nil {
			return nil, nil, err
		}
		return appended, encodeCanonicalConversationReceipt(receipt), nil
	}
	appended, err := projector.ProjectCanonicalAgentDeliveryEvents(ctx, events, effects)
	return appended, nil, err
}

func encodeCanonicalConversationReceipt(receipt *models.ConversationMutationReceipt) json.RawMessage {
	if receipt == nil {
		return nil
	}
	encoded, err := json.Marshal(receipt)
	if err != nil {
		return nil
	}
	return encoded
}

func decodeCanonicalConversationReceipt(encoded json.RawMessage) *models.ConversationMutationReceipt {
	if len(encoded) == 0 {
		return nil
	}
	var receipt models.ConversationMutationReceipt
	if err := json.Unmarshal(encoded, &receipt); err != nil {
		return nil
	}
	return &receipt
}

// Coalescing can replace repeated snapshots only inside a fully covered
// contiguous interval. Missing coverage must retain the reset fallback.
func mergeCanonicalConversationReceipts(previous, next *models.ConversationMutationReceipt) *models.ConversationMutationReceipt {
	if previous == nil || next == nil || !previous.Complete || !next.Complete ||
		previous.SessionID != next.SessionID || previous.Revision != next.BaseRevision {
		return nil
	}
	merged := *next
	merged.BaseRevision = previous.BaseRevision
	merged.Operations = make([]models.ConversationMutationOperation, 0, len(previous.Operations)+len(next.Operations))
	type key struct {
		entity models.ConversationEntityKind
		id     string
	}
	replaced := make(map[key]bool, len(next.Operations))
	for _, operation := range next.Operations {
		replaced[key{operation.Entity, operation.ID}] = true
	}
	for _, operation := range previous.Operations {
		if !replaced[key{operation.Entity, operation.ID}] {
			merged.Operations = append(merged.Operations, operation)
		}
	}
	merged.Operations = append(merged.Operations, next.Operations...)
	return &merged
}
