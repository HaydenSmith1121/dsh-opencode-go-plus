export { createProvider, getSupportedThinkingLevels, isContextOverflow } from '@earendil-works/pi-ai';
export { anthropicMessagesApi } from '@earendil-works/pi-ai/api/anthropic-messages.lazy';
export { openAICompletionsApi } from '@earendil-works/pi-ai/api/openai-completions.lazy';
export { openAIResponsesApi } from '@earendil-works/pi-ai/api/openai-responses.lazy';
import { OPENCODE_GO_MODELS } from '@earendil-works/pi-ai/providers/opencode-go.models';
export function getBuiltinModels(provider) {
  return provider === 'opencode-go' ? Object.values(OPENCODE_GO_MODELS) : [];
}
