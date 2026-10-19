package handlers

import (
	"context"
	"encoding/json"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/kandev/kandev/internal/task/models"
	ws "github.com/kandev/kandev/pkg/websocket"
)

func (f *fakeOrchestrator) SessionHasLiveClarification(_ context.Context, sessionID string) bool {
	f.mu.Lock()
	defer f.mu.Unlock()
	return f.liveClarifications[sessionID]
}

func TestHandleMessageTask_LiveClarification_QueuesInsteadOfPrompting(t *testing.T) {
	ctx := context.Background()
	svc, repo := newTestTaskService(t)
	sender, target, sess := seedTaskWithSession(t, svc, repo, models.TaskSessionStateWaitingForInput)
	h, orch := newMessageTaskHandler(t, svc, repo)
	orch.liveClarifications = map[string]bool{sess.ID: true}

	msg := makeWSMessage(t, ws.ActionMCPMessageTask, senderPayload(target.ID, "review report", sender.ID))
	resp, err := h.handleMessageTask(ctx, msg)
	require.NoError(t, err)
	require.Equal(t, ws.MessageTypeResponse, resp.Type, string(resp.Payload))

	var payload map[string]interface{}
	require.NoError(t, json.Unmarshal(resp.Payload, &payload))
	assert.Equal(t, "queued", payload["status"])
	assert.Empty(t, orch.promptCalls, "a session waiting on a live question must not be prompted")
	assert.Zero(t, orch.resumeCalls)

	status := orch.queue.GetStatus(ctx, sess.ID)
	require.Equal(t, 1, status.Count)
	require.Len(t, orch.readinessCalls, 1, "queue admission readiness must be rechecked")
	assert.Equal(t, sess.ID, orch.readinessCalls[0].SessionID)
}

func TestHandleMessageTask_NoLiveClarification_PromptsWaitingSession(t *testing.T) {
	ctx := context.Background()
	svc, repo := newTestTaskService(t)
	sender, target, sess := seedTaskWithSession(t, svc, repo, models.TaskSessionStateWaitingForInput)
	h, orch := newMessageTaskHandler(t, svc, repo)
	orch.liveClarifications = map[string]bool{"other-session": true}

	msg := makeWSMessage(t, ws.ActionMCPMessageTask, senderPayload(target.ID, "next instruction", sender.ID))
	resp, err := h.handleMessageTask(ctx, msg)
	require.NoError(t, err)

	var payload map[string]interface{}
	require.NoError(t, json.Unmarshal(resp.Payload, &payload))
	assert.Equal(t, "sent", payload["status"])
	require.Len(t, orch.promptCalls, 1)
	assert.Equal(t, sess.ID, orch.promptCalls[0].sessionID)
	assert.Zero(t, orch.queue.GetStatus(ctx, sess.ID).Count)
}
