import { GoConnectionService } from "./connection-service.js";
var __knownSymbol = (name2, symbol) => (symbol = Symbol[name2]) ? symbol : Symbol.for("Symbol." + name2);
var __typeError = (msg) => {
  throw TypeError(msg);
};
var __using = (stack, value, async) => {
  if (value != null) {
    if (typeof value !== "object" && typeof value !== "function") __typeError("Object expected");
    var dispose, inner;
    if (async) dispose = value[__knownSymbol("asyncDispose")];
    if (dispose === void 0) {
      dispose = value[__knownSymbol("dispose")];
      if (async) inner = dispose;
    }
    if (typeof dispose !== "function") __typeError("Object not disposable");
    if (inner) dispose = function() {
      try {
        inner.call(this);
      } catch (e) {
        return Promise.reject(e);
      }
    };
    stack.push([async, dispose, value]);
  } else if (async) {
    stack.push([async]);
  }
  return value;
};
var __callDispose = (stack, error, hasError) => {
  var E = typeof SuppressedError === "function" ? SuppressedError : function(e, s, m, _) {
    return _ = Error(m), _.name = "SuppressedError", _.error = e, _.suppressed = s, _;
  };
  var fail = (e) => error = hasError ? new E(e, error, "An error was suppressed during disposal") : (hasError = true, e);
  var next = (it) => {
    while (it = stack.pop()) {
      try {
        var result = it[1] && it[1].call(it[2]);
        if (it[0]) return Promise.resolve(result).then(next, (e) => (fail(e), next()));
      } catch (e) {
        fail(e);
      }
    }
    if (hasError) throw error;
  };
  return next();
};

// src/index.ts
import { launchEnvironmentOf } from "@deepseek-ai/dsh-launch-environment";
import { credentialRef } from "@deepseek-ai/dsh-credentials";
import { LlmError as LlmError6, assertUsableApiKey, resolveImageAttachmentAccess } from "@deepseek-ai/dsh-llm";

// src/adapter.ts
import { randomUUID } from "node:crypto";
import { getSupportedThinkingLevels } from "./vendor/pi-ai.js";
import {
  LlmAdapter,
  LlmError as LlmError5,
  ReasoningEffortId,
  attributionHeaders as attributionHeaders2,
  contentHasImage as contentHasImage2
} from "@deepseek-ai/dsh-llm";

// src/conversion/context.ts
import { brandString } from "@deepseek-ai/dsh-brand";
import * as dshLlm from "@deepseek-ai/dsh-llm";
// The image-offload trio below has moved once already (0.1.5-rc.3 exported
// `offloadRequestImagesWithPolicy` / `offloadedImagePrefixCount` where 0.1.6 and
// later export `requiredImageOffload` / `projectOffloadedImages`), and a single
// missing named export makes an ESM module fail to link rather than degrade.
// Read them off the module namespace so an unfamiliar release costs the feature
// instead of the whole plugin; `conversion/context.ts` guards their use.
const {
  contentHasImage,
  IMAGE_OFFLOAD_REQUIRED_CODE,
  LlmError: LlmError2,
  offloadedImageText,
  projectOffloadedImages,
  requestImageHandleText,
  requiredImageOffload
} = dshLlm;

// src/conversion/replay.ts
import { LlmError } from "@deepseek-ai/dsh-llm";
function parseArguments(raw) {
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
  }
  return {};
}
function emptyPiUsage() {
  return {
    input: 0,
    output: 0,
    cacheRead: 0,
    cacheWrite: 0,
    totalTokens: 0,
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 }
  };
}
function toPiReplayState(message, requestedModel = message.model) {
  const responseModel = message.api === "anthropic-messages" && message.model !== requestedModel ? message.model : message.responseModel;
  const response = {
    kind: "pi-ai",
    version: 2,
    api: message.api,
    provider: message.provider,
    model: requestedModel,
    ...responseModel === void 0 ? {} : { responseModel },
    ...message.responseId === void 0 ? {} : { responseId: message.responseId },
    ...message.providerThinkingLevel === void 0 ? {} : { providerThinkingLevel: message.providerThinkingLevel },
    stopReason: message.stopReason
  };
  return {
    response,
    blocks: message.content.map((block) => {
      switch (block.type) {
        case "text":
          return {
            type: "text",
            ...block.textSignature === void 0 ? {} : { textSignature: block.textSignature }
          };
        case "thinking":
          return {
            type: "reasoning",
            ...block.thinkingSignature === void 0 ? {} : { thinkingSignature: block.thinkingSignature },
            ...block.redacted === void 0 ? {} : { redacted: block.redacted }
          };
        case "toolCall":
          return {
            type: "tool-call",
            ...block.thoughtSignature === void 0 ? {} : { thoughtSignature: block.thoughtSignature }
          };
      }
    })
  };
}
function invalidReplay(message) {
  throw new LlmError(`invalid pi-ai replay state: ${message}`, "INVALID_REPLAY_STATE");
}
function readReplayState(value) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return invalidReplay("expected a replay envelope");
  const envelope = value;
  const rawResponse = envelope["response"];
  if (typeof rawResponse !== "object" || rawResponse === null || Array.isArray(rawResponse)) return invalidReplay("expected a response object");
  const response = rawResponse;
  if (response["kind"] !== "pi-ai") return invalidReplay("unknown state kind");
  if (response["version"] !== 2) return invalidReplay(`unsupported version ${String(response["version"])}`);
  for (const key of ["api", "provider", "model"]) {
    if (typeof response[key] !== "string" || response[key].length === 0) return invalidReplay(`${key} must be a non-empty string`);
  }
  if (!["stop", "length", "toolUse", "error", "aborted"].includes(String(response["stopReason"]))) {
    return invalidReplay("unknown stopReason");
  }
  if (response["responseModel"] !== void 0 && typeof response["responseModel"] !== "string") return invalidReplay("responseModel must be a string");
  if (response["responseId"] !== void 0 && typeof response["responseId"] !== "string") return invalidReplay("responseId must be a string");
  if (response["providerThinkingLevel"] !== void 0 && typeof response["providerThinkingLevel"] !== "string") return invalidReplay("providerThinkingLevel must be a string");
  const blocks = envelope["blocks"];
  if (!Array.isArray(blocks)) return invalidReplay("blocks must be an array");
  for (const [index, value2] of blocks.entries()) {
    if (typeof value2 !== "object" || value2 === null || Array.isArray(value2)) return invalidReplay(`block ${index} must be an object`);
    const block = value2;
    if (!["text", "reasoning", "tool-call"].includes(String(block["type"]))) return invalidReplay(`block ${index} has an unknown type`);
    for (const signature of ["textSignature", "thinkingSignature", "thoughtSignature"]) {
      if (block[signature] !== void 0 && typeof block[signature] !== "string") return invalidReplay(`block ${index} ${signature} must be a string`);
    }
    if (block["redacted"] !== void 0 && typeof block["redacted"] !== "boolean") return invalidReplay(`block ${index} redacted must be boolean`);
  }
  return {
    response,
    blocks
  };
}
function foreignAssistant(message) {
  const source = message.source.kind === "model" ? message.source : void 0;
  const content = [];
  for (const block of message.content) {
    switch (block.type) {
      case "text":
        content.push({ type: "text", text: block.text });
        break;
      case "reasoning":
        content.push({ type: "thinking", thinking: block.text });
        break;
      case "tool-call":
        content.push({
          type: "toolCall",
          id: block.id,
          name: block.name,
          arguments: parseArguments(block.arguments)
        });
        break;
      case "image":
        throw new LlmError("pi-ai chat history cannot represent structured assistant image output", "UNSUPPORTED_CONTENT");
      default:
        break;
    }
  }
  return {
    role: "assistant",
    content,
    // Deliberately never equals a catalog API: absent replay state is foreign
    // even if source names the same provider/model as this request.
    api: "dsh-foreign",
    provider: source?.provider ?? "dsh-foreign",
    model: source?.model ?? "dsh-foreign",
    usage: emptyPiUsage(),
    stopReason: content.some((piece) => piece.type === "toolCall") ? "toolUse" : "stop",
    timestamp: 0
  };
}
function replayedAssistant(message, source, rawState) {
  const state = readReplayState(rawState);
  if (state.response.provider !== source.provider) return invalidReplay("provider does not match assistant source");
  if (state.response.model !== source.model) return invalidReplay("model does not match assistant source");
  if (state.blocks.length !== message.content.length) return invalidReplay("block count does not match assistant content");
  const content = message.content.map((block, index) => {
    const replay = state.blocks[index];
    if (replay === void 0 || replay.type !== block.type) return invalidReplay(`block ${index} does not match assistant content`);
    switch (block.type) {
      case "text":
        return {
          type: "text",
          text: block.text,
          ...replay.type === "text" && replay.textSignature !== void 0 ? { textSignature: replay.textSignature } : {}
        };
      case "reasoning":
        return {
          type: "thinking",
          thinking: block.text,
          ...replay.type === "reasoning" && replay.thinkingSignature !== void 0 ? { thinkingSignature: replay.thinkingSignature } : {},
          ...replay.type === "reasoning" && replay.redacted !== void 0 ? { redacted: replay.redacted } : {}
        };
      case "tool-call":
        return {
          type: "toolCall",
          id: block.id,
          name: block.name,
          arguments: parseArguments(block.arguments),
          ...replay.type === "tool-call" && replay.thoughtSignature !== void 0 ? { thoughtSignature: replay.thoughtSignature } : {}
        };
      /* v8 ignore next -- readReplayState rejects unknown replay tags, so an equal plugin-added Harness tag cannot reach this switch */
      default:
        return invalidReplay(`block ${index} has an unsupported Harness type`);
    }
  });
  return {
    role: "assistant",
    content,
    api: state.response.api,
    provider: state.response.provider,
    // Anthropic reports aliases and fallbacks as model, unlike Completions' informational responseModel.
    model: state.response.api === "anthropic-messages" ? state.response.responseModel ?? state.response.model : state.response.model,
    ...state.response.responseModel === void 0 ? {} : { responseModel: state.response.responseModel },
    ...state.response.responseId === void 0 ? {} : { responseId: state.response.responseId },
    ...state.response.providerThinkingLevel === void 0 ? {} : { providerThinkingLevel: state.response.providerThinkingLevel },
    usage: emptyPiUsage(),
    stopReason: state.response.stopReason,
    timestamp: 0
  };
}
function toPiAssistant(message, onDegrade) {
  const source = message.source;
  if (source.kind !== "model" || source.replayState === void 0) return foreignAssistant(message);
  try {
    return replayedAssistant(message, source, source.replayState);
  } catch (error) {
    if (!(error instanceof LlmError) || error.code !== "INVALID_REPLAY_STATE") throw error;
    onDegrade?.(error.message);
    return foreignAssistant(message);
  }
}

// src/conversion/context.ts
import { requestImageDimensions } from "@deepseek-ai/dsh-attachment";

// src/conversion/config.ts
var DEFAULT_MAX_REQUEST_IMAGE_BYTES = 20 * 1024 * 1024;
var DEFAULT_REQUEST_IMAGE_PIXEL_BUDGET = 2048 * 2048;
var DEFAULT_REQUEST_IMAGE_MAX_BYTES = 1024 * 1024;

// src/conversion/context.ts
function flattenText(message) {
  return message.content.filter((block) => block.type === "text").map((block) => block.text).join("");
}
function toolResultText(blocks) {
  return blocks.map((block) => block.type === "text" ? block.text : block.type === "tool-result" ? toolResultText(block.content) : "").join("");
}
/**
 * Rebuild the pi-ai toolResult message for one Harness tool-role message.
 * Session format v4 writes the result as this message's own content, while v3
 * nested a `tool-result` wrapper inside a user message; both reach a pi-ai
 * `toolResult` carrying its toolCallId, and the image path also carries the
 * image itself rather than rejecting the role.
 */
function toolResultOf(message, toolNames, content) {
  return {
    role: "toolResult",
    toolCallId: message.toolCallId,
    toolName: toolNames.get(message.toolCallId) ?? "unknown",
    content: typeof content === "string" ? [{
      type: "text",
      text: content || "(no output)"
    }] : content,
    isError: message.isError ?? false,
    timestamp: 0
  };
}
function assertSupportedImageRoles(messages) {
  for (const message of messages) {
    if (message.role !== "user" && message.role !== "tool" && contentHasImage(message.content)) {
      throw new LlmError2(
        `pi-ai cannot represent an image in an in-history ${message.role} message`,
        "UNSUPPORTED_CONTENT"
      );
    }
  }
}
async function userContent(blocks, requestImages, resolveImageAccess) {
  const content = [];
  for (const block of blocks) {
    switch (block.type) {
      case "text":
        if (block.text.length > 0) content.push({ type: "text", text: block.text });
        break;
      case "image": {
        const version = requestImages.get(block.attachment.attachmentId);
        content.push({
          type: "text",
          text: requestImageHandleText(block.attachment, version, resolveImageAccess(block.attachment))
        });
        content.push({
          type: "image",
          data: Buffer.from(version.data).toString("base64"),
          mimeType: version.mediaType
        });
        break;
      }
      case "tool-result":
        {
          const nested = await userContent(block.content, requestImages, resolveImageAccess);
          if (typeof nested === "string") {
            if (nested.length > 0) content.push({ type: "text", text: nested });
          } else {
            content.push(...nested);
          }
        }
        break;
      default:
        break;
    }
  }
  if (content.every((block) => block.type === "text")) return content.map((block) => block.text).join("");
  return content;
}
function collectImageRefs(blocks, refs) {
  for (const block of blocks) {
    if (block.type === "image") {
      if (block.offloaded !== true) refs.set(block.attachment.attachmentId, block.attachment);
    } else if (block.type === "tool-result") {
      collectImageRefs(block.content, refs);
    }
  }
}
async function prepareRequestImages(messages, attachments, budget, signal) {
  const refs = /* @__PURE__ */ new Map();
  for (const message of messages) collectImageRefs(message.content, refs);
  const orderedRefs = [...refs.values()];
  const prepared = await Promise.all(orderedRefs.map(
    (ref) => attachments.readImageRequest(ref, requestImageTarget(ref, budget), signal)
  ));
  const versions = /* @__PURE__ */ new Map();
  for (const [index, ref] of orderedRefs.entries()) {
    versions.set(ref.attachmentId, prepared[index]);
  }
  return versions;
}
function toolsOf(options) {
  return options.tools?.map((tool) => ({
    name: tool.name,
    description: tool.description,
    // ToolSchema.parameters is a JSON Schema object; pi-ai's TSchema
    // (TypeBox) is structurally JSON Schema, so it assigns directly.
    parameters: tool.parameters
  }));
}
function splitSystemPrompt(options) {
  if (options.system !== void 0) return { systemPrompt: options.system, messages: options.messages };
  const [first, ...rest] = options.messages;
  if (first?.role !== "system") return { systemPrompt: void 0, messages: options.messages };
  const text = flattenText(first);
  return { systemPrompt: text.length > 0 ? text : void 0, messages: rest };
}
function piContext(systemPrompt, options, messages) {
  const tools = toolsOf(options);
  return {
    ...systemPrompt !== void 0 ? { systemPrompt } : {},
    messages,
    ...tools !== void 0 && tools.length > 0 ? { tools } : {}
  };
}
function appendAssistant(message, messages, toolNames, onReplayDegrade) {
  const assistant = toPiAssistant(message, onReplayDegrade);
  for (const block of assistant.content) {
    if (block.type === "toolCall") toolNames.set(brandString(block.id), block.name);
  }
  messages.push(assistant);
}
function textOnlyContext(options, onReplayDegrade) {
  assertSupportedImageRoles(options.messages);
  const split = splitSystemPrompt(options);
  const toolNames = /* @__PURE__ */ new Map();
  const messages = [];
  for (const message of split.messages) {
    if (contentHasImage(message.content)) {
      throw new LlmError2("pi-ai image conversion requires the durable attachment service", "UNSUPPORTED_CONTENT");
    }
    if (message.role === "system") {
      messages.push({ role: "user", content: flattenText(message), timestamp: 0 });
      continue;
    }
    if (message.role === "assistant") {
      appendAssistant(message, messages, toolNames, onReplayDegrade);
      continue;
    }
    if (message.role === "tool" && !message.content.some((block) => block.type === "tool-result")) {
      messages.push(toolResultOf(message, toolNames, flattenText(message)));
      continue;
    }
    const text = flattenText(message);
    const results = message.content.filter((block) => block.type === "tool-result");
    if (text.length > 0 || results.length === 0) messages.push({ role: "user", content: text, timestamp: 0 });
    for (const result of results) {
      messages.push({
        role: "toolResult",
        toolCallId: result.toolCallId,
        toolName: toolNames.get(result.toolCallId) ?? "unknown",
        content: [{
          type: "text",
          text: toolResultText(result.content) || "(no output)"
        }],
        isError: result.isError ?? false,
        timestamp: 0
      });
    }
  }
  return piContext(split.systemPrompt, options, messages);
}
function requestImageTarget(ref, budget) {
  return { ...requestImageDimensions(ref.width, ref.height, budget.maxPixels), maxBytes: budget.maxBytes };
}
function toPiContext(options, images, onReplayDegrade) {
  return images === void 0 ? textOnlyContext(options, onReplayDegrade) : toPiContextWithImages(options, images, onReplayDegrade);
}
async function toPiContextWithImages(options, images, onReplayDegrade) {
  const { attachments, resolveImageAccess, maxRequestImageBytes } = images;
  const requestImagePolicy = images.requestImagePolicy ?? {
    maxPixels: DEFAULT_REQUEST_IMAGE_PIXEL_BUDGET,
    maxBytes: DEFAULT_REQUEST_IMAGE_MAX_BYTES
  };
  assertSupportedImageRoles(options.messages);
  const split = splitSystemPrompt(options);
  const requestImages = await prepareRequestImages(split.messages, attachments, requestImagePolicy, options.signal);
  // Both functions were introduced with the route-side offload model; a harness
  // that does not carry them (0.1.5-rc.3 and earlier) has no offload marks to
  // enforce or project, so the request is sent as derived. Checked per call
  // because the module namespace, not this module, owns their availability.
  if (maxRequestImageBytes !== void 0 && typeof requiredImageOffload === "function") {
    const offloadImages = requiredImageOffload(
      split.messages,
      { representation: "base64", maxBytes: maxRequestImageBytes },
      (block) => requestImages.get(block.attachment.attachmentId).bytes
    );
    if (offloadImages > 0) {
      throw new LlmError2(
        `pi-ai request images exceed the ${maxRequestImageBytes}-byte base64 bound; ${offloadImages} more oldest occurrence(s) must be offloaded.`,
        IMAGE_OFFLOAD_REQUIRED_CODE,
        { offloadImages }
      );
    }
  }
  const exactMessages = typeof projectOffloadedImages === "function" ? projectOffloadedImages(
    split.messages,
    (ref) => offloadedImageText(ref, resolveImageAccess(ref))
  ) : split.messages;
  const toolNames = /* @__PURE__ */ new Map();
  const messages = [];
  for (const message of exactMessages) {
    if (message.role === "system") {
      messages.push({ role: "user", content: flattenText(message), timestamp: 0 });
      continue;
    }
    if (message.role === "assistant") {
      appendAssistant(message, messages, toolNames, onReplayDegrade);
      continue;
    }
    if (message.role === "tool" && !message.content.some((block) => block.type === "tool-result")) {
      const toolContent = await userContent(message.content, requestImages, resolveImageAccess);
      messages.push(toolResultOf(message, toolNames, toolContent));
      continue;
    }
    const regular = message.content.filter((block) => block.type !== "tool-result");
    const content = await userContent(regular, requestImages, resolveImageAccess);
    const results = message.content.filter((block) => block.type === "tool-result");
    if (content.length > 0 || results.length === 0) {
      messages.push({ role: "user", content, timestamp: 0 });
    }
    for (const result of results) {
      const resultContent = await userContent(result.content, requestImages, resolveImageAccess);
      messages.push({
        role: "toolResult",
        toolCallId: result.toolCallId,
        toolName: toolNames.get(result.toolCallId) ?? "unknown",
        content: typeof resultContent === "string" ? [{ type: "text", text: resultContent || "(no output)" }] : resultContent,
        isError: result.isError ?? false,
        timestamp: 0
      });
    }
  }
  return piContext(split.systemPrompt, options, messages);
}

// src/conversion/stream.ts
import { brandString as brandString2 } from "@deepseek-ai/dsh-brand";
import { CONTEXT_WINDOW_EXCEEDED_CODE, EMPTY_RESPONSE_CODE, isContextWindowExceededError, isQuotaExceededError, LlmError as LlmError3, QUOTA_EXCEEDED_CODE } from "@deepseek-ai/dsh-llm";
import { isContextOverflow } from "./vendor/pi-ai.js";
function mapUsage(usage) {
  return {
    inputTokens: usage.input,
    outputTokens: usage.output,
    totalTokens: usage.totalTokens,
    ...usage.cacheRead > 0 ? { cacheReadTokens: usage.cacheRead } : {},
    ...usage.cacheWrite > 0 ? { cacheWriteTokens: usage.cacheWrite } : {}
  };
}
function classifyPiAiError(message) {
  if (/\b(?:401|403)\b/.test(message)) return "AUTH";
  if (isQuotaExceededError(message)) return QUOTA_EXCEEDED_CODE;
  if (/\b429\b|rate.?limit/i.test(message)) return "RATE_LIMIT";
  if (/\b413\b|failed to buffer the request body:\s*length limit exceeded|payload too large|request body too large/i.test(message)) return "INVALID_REQUEST";
  if (/\b400\b|invalid.?request/i.test(message)) return "INVALID_REQUEST";
  if (/\b5\d\d\b/.test(message)) return "SERVER";
  if (/\btime(?:d)?\s*out\b|timeout/i.test(message)) return "TIMEOUT";
  if (/stream ended (?:before|without)\b/i.test(message)) return "TRANSPORT";
  if (/\b(?:network|connection|socket|fetch)\b|\bECONN[A-Z]+\b/i.test(message) || /\b(?:other side closed|HTTP2 request did not get a response|WebSocket closed unexpectedly)\b/i.test(message) || /\bterminated\b|premature close/i.test(message)) {
    return "TRANSPORT";
  }
  return "PI_AI_ERROR";
}
function mapStopReason(message, contextWindow) {
  const piAiOverflow = isContextOverflow(message, contextWindow);
  const harnessOverflow = message.stopReason === "error" && message.errorMessage !== void 0 && isContextWindowExceededError(message.errorMessage);
  if (piAiOverflow || harnessOverflow) {
    return {
      kind: "error",
      failure: {
        message: message.errorMessage ?? `pi-ai detected context overflow for model "${message.model}"`,
        code: CONTEXT_WINDOW_EXCEEDED_CODE
      }
    };
  }
  switch (message.stopReason) {
    case "stop":
      if (message.content.length === 0) {
        return {
          kind: "error",
          failure: {
            message: `model "${message.model}" returned a completed response with no content`,
            code: EMPTY_RESPONSE_CODE
          }
        };
      }
      return { kind: "stop" };
    case "length":
      return { kind: "max-tokens" };
    case "toolUse":
      return { kind: "tool-calls" };
    case "pending":
      return {
        kind: "error",
        failure: { message: `pi-ai stream for model "${message.model}" ended pending`, code: "PI_AI_ERROR" }
      };
    case "deferred":
      return {
        kind: "error",
        failure: { message: `pi-ai deferred response for model "${message.model}" is not supported`, code: "PI_AI_ERROR" }
      };
    case "aborted":
      return {
        kind: "aborted",
        failure: { message: message.errorMessage ?? "pi-ai stream aborted", code: "ABORTED" }
      };
    case "error": {
      const text = message.errorMessage ?? "pi-ai stream error";
      return { kind: "error", failure: { message: text, code: classifyPiAiError(text) } };
    }
  }
}
async function* toStreamChunks(events, contextWindow, callerSignal, requestedModel) {
  const toolIds = /* @__PURE__ */ new Map();
  for await (const event of events) {
    switch (event.type) {
      case "start":
        break;
      case "text_start":
        yield { type: "block-start", index: event.contentIndex, blockType: "text" };
        break;
      case "text_delta":
        yield { type: "text-delta", index: event.contentIndex, text: event.delta };
        break;
      case "text_end":
        yield { type: "block-end", index: event.contentIndex, block: { type: "text", text: event.content } };
        break;
      case "thinking_start":
        yield { type: "block-start", index: event.contentIndex, blockType: "reasoning" };
        break;
      case "thinking_delta":
        yield { type: "reasoning-delta", index: event.contentIndex, text: event.delta };
        break;
      case "thinking_end":
        yield { type: "block-end", index: event.contentIndex, block: { type: "reasoning", text: event.content } };
        break;
      case "toolcall_start": {
        const partial = event.partial.content[event.contentIndex];
        const id = partial?.type === "toolCall" ? partial.id : "";
        const name2 = partial?.type === "toolCall" ? partial.name : "";
        toolIds.set(event.contentIndex, { id, name: name2 });
        yield { type: "block-start", index: event.contentIndex, blockType: "tool-call" };
        break;
      }
      case "toolcall_delta": {
        const known = toolIds.get(event.contentIndex);
        yield {
          type: "tool-call-delta",
          index: event.contentIndex,
          id: brandString2(known?.id ?? ""),
          ...known?.name !== void 0 && known.name.length > 0 ? { name: known.name } : {},
          argumentsDelta: event.delta
        };
        break;
      }
      case "toolcall_end":
        yield {
          type: "block-end",
          index: event.contentIndex,
          block: {
            type: "tool-call",
            id: brandString2(event.toolCall.id),
            name: event.toolCall.name,
            // pi-ai hands back the PARSED arguments; the harness vocabulary
            // keeps the raw string.
            arguments: JSON.stringify(event.toolCall.arguments)
          }
        };
        break;
      case "done":
        yield { type: "usage", usage: mapUsage(event.message.usage) };
        yield {
          type: "finish",
          reason: mapStopReason(event.message, contextWindow),
          replayState: toPiReplayState(event.message, requestedModel)
        };
        return;
      case "error":
        yield { type: "usage", usage: mapUsage(event.error.usage) };
        yield {
          type: "finish",
          reason: mapStopReason(
            callerSignal?.aborted ? { ...event.error, stopReason: "aborted" } : event.error,
            contextWindow
          )
        };
        return;
    }
  }
  throw new LlmError3("pi-ai event stream ended without done/error", "STREAM_CLOSED");
}

// src/adapter.ts
import { idleWatchdog, timeoutOf } from "@deepseek-ai/dsh-timeout";

// src/catalog.ts
import { createProvider } from "./vendor/pi-ai.js";
import { getBuiltinModels } from "./vendor/pi-ai.js";
import { anthropicMessagesApi } from "./vendor/pi-ai.js";
import { openAICompletionsApi } from "./vendor/pi-ai.js";
import { openAIResponsesApi } from "./vendor/pi-ai.js";
import { attributionHeaders, LlmError as LlmError4 } from "@deepseek-ai/dsh-llm";
var PROVIDER_ID = "opencode-go";
/**
 * The route claimed when another adapter already owns {@link PROVIDER_ID}.
 *
 * `registerAdapter` is all-or-nothing and throws `DUPLICATE_ADAPTER` when any
 * requested route is taken. Giving up there would withdraw this plugin's whole
 * dynamic catalog without a visible error, leaving whatever registered first
 * (commonly a hand-materialized model list in `settings.yaml`, which cannot
 * grow on its own). Claiming a distinct id keeps the live catalog reachable.
 */
var FALLBACK_PROVIDER_ID = "opencode-go-plus";
var DISPLAY_NAME = "OpenCode Go";
var DEFAULT_BASE_URL = "https://opencode.ai/zen/go/v1";
/**
 * Models the installed pi-ai catalog does not describe, seeded by borrowing a
 * sibling's wire protocol. Override with the `catalogAdditions` setting; each
 * entry needs `id` plus the `siblingId` and `inputSiblingId` it derives from.
 */
var CATALOG_ADDITIONS = [
  {
    id: "deepseek-v4.1-flash",
    siblingId: "deepseek-v4-flash",
    inputSiblingId: "deepseek-v4-flash-vision-exp",
    name: "DeepSeek V4.1 Flash"
  }
];
/** Keep one addition only when it is fully spelled out; a partial entry would seed a broken model. */
function usableAdditions(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (entry) => entry !== null && typeof entry === "object" && typeof entry.id === "string" && entry.id.length > 0 && typeof entry.siblingId === "string" && entry.siblingId.length > 0 && typeof entry.inputSiblingId === "string" && entry.inputSiblingId.length > 0 && typeof entry.name === "string" && entry.name.length > 0
  );
}
var MODELS_FETCH_TIMEOUT_MS = 1e4;
var VISION_TOKENS = /* @__PURE__ */ new Set(["vision", "vl", "omni", "multimodal"]);
var BRAND_SPELLINGS = {
  deepseek: "DeepSeek",
  glm: "GLM",
  kimi: "Kimi",
  qwen: "Qwen",
  minimax: "MiniMax",
  grok: "Grok",
  gpt: "GPT",
  mimo: "MiMo",
  longcat: "LongCat",
  hy: "Hy",
  muse: "Muse",
  omen: "Omen"
};
function normalizeMatchToken(token) {
  return token.replace(/[0-9]+$/, "");
}
function matchTokens(id) {
  const tokens = /* @__PURE__ */ new Set();
  for (const token of id.toLowerCase().split(/[-._]/)) {
    const normalized = normalizeMatchToken(token);
    if (normalized.length > 0) tokens.add(normalized);
  }
  return tokens;
}
function familyOf(id) {
  const first = id.toLowerCase().split(/[-._]/)[0] ?? "";
  return normalizeMatchToken(first);
}
function hasVisionToken(id) {
  for (const token of matchTokens(id)) {
    if (VISION_TOKENS.has(token)) return true;
  }
  return false;
}
function prettifyModelName(id) {
  return id.split("-").filter((part) => part.length > 0).map((part) => BRAND_SPELLINGS[part.toLowerCase()] ?? `${part.charAt(0).toUpperCase()}${part.slice(1)}`).join(" ");
}
function isBetterScore(a, b) {
  for (let index = 0; index < a.length; index += 1) {
    if (a[index] > b[index]) return true;
    if (a[index] < b[index]) return false;
  }
  return false;
}
function adaptModelFromFamily(id, curated, baseURL, providerId = PROVIDER_ID) {
  const family = familyOf(id);
  if (family.length === 0) return void 0;
  const kin = [...curated.values()].filter((model) => familyOf(model.id) === family);
  // A family the endpoint just introduced has no kin to borrow a wire protocol
  // or capacity numbers from. Borrowing from the whole curated table is a
  // guess — but a guess the caller can correct through settings, whereas
  // dropping the id from the catalog gives them nothing to correct. The live
  // listing carries no metadata (`id`/`object`/`created`/`owned_by` only), so
  // there is nothing better to read.
  const borrowed = kin.length === 0;
  const candidates = borrowed ? [...curated.values()] : kin;
  if (candidates.length === 0) return void 0;
  const idTokens = matchTokens(id);
  const scoreOf = (model) => [
    [...matchTokens(model.id)].filter((token) => idTokens.has(token)).length,
    hasVisionToken(model.id) ? 0 : 1,
    -Math.abs(model.id.length - id.length)
  ];
  let best = candidates[0];
  for (const candidate of candidates) {
    if (isBetterScore(scoreOf(candidate), scoreOf(best))) best = candidate;
  }
  const protocolCounts = /* @__PURE__ */ new Map();
  for (const candidate of candidates) {
    protocolCounts.set(candidate.api, (protocolCounts.get(candidate.api) ?? 0) + 1);
  }
  let majorityApi;
  let majorityCount = 0;
  for (const [api, count] of protocolCounts) {
    if (count > majorityCount) {
      majorityApi = api;
      majorityCount = count;
    }
  }
  if (majorityApi !== void 0 && best.api !== majorityApi) {
    let majorityBest;
    for (const candidate of candidates) {
      if (candidate.api !== majorityApi) continue;
      if (majorityBest === void 0 || isBetterScore(scoreOf(candidate), scoreOf(majorityBest))) {
        majorityBest = candidate;
      }
    }
    if (majorityBest !== void 0) best = majorityBest;
  }
  let input = best.input;
  if (hasVisionToken(id)) {
    const visionSibling = candidates.find((candidate) => hasVisionToken(candidate.id) && candidate.input.includes("image")) ?? candidates.find((candidate) => candidate.input.includes("image"));
    if (visionSibling !== void 0) input = visionSibling.input;
  }
  return {
    ...best,
    id,
    name: prettifyModelName(id),
    input: [...input],
    provider: providerId,
    baseUrl: baseURL
  };
}
function curatedModels(baseURL, providerId = PROVIDER_ID, additions = CATALOG_ADDITIONS) {
  const models = /* @__PURE__ */ new Map();
  for (const model of getBuiltinModels("opencode-go")) {
    models.set(model.id, { ...model, provider: providerId, baseUrl: baseURL });
  }
  for (const addition of usableAdditions(additions)) {
    if (models.has(addition.id)) continue;
    const sibling = models.get(addition.siblingId);
    if (sibling === void 0) continue;
    const inputSibling = models.get(addition.inputSiblingId);
    if (inputSibling === void 0) continue;
    models.set(addition.id, {
      ...sibling,
      id: addition.id,
      name: addition.name,
      input: [...inputSibling.input],
      provider: providerId,
      baseUrl: baseURL
    });
  }
  if (models.size === 0) {
    throw new LlmError4(
      "llm-opencode-go: pi-ai's installed catalog describes no opencode-go models; cannot seed the curated table",
      "INVALID_CONFIG"
    );
  }
  return models;
}
function readLiveModelIds(body) {
  const data = body?.data;
  if (!Array.isArray(data)) throw new Error('the model listing has no "data" array');
  const ids = [];
  for (const entry of data) {
    const id = entry?.id;
    if (typeof id === "string" && id.length > 0) ids.push(id);
  }
  return ids;
}
async function fetchLiveModelIds(baseURL) {
  const url = `${baseURL.replace(/\/+$/, "")}/models`;
  let response;
  try {
    response = await fetch(url, {
      method: "GET",
      headers: { accept: "application/json", ...attributionHeaders() },
      signal: AbortSignal.timeout(MODELS_FETCH_TIMEOUT_MS)
    });
  } catch (error) {
    throw new LlmError4(`could not reach ${url}`, "DISCOVERY_FAILED", { cause: error });
  }
  if (!response.ok) {
    throw new LlmError4(`${url} answered ${response.status}`, "DISCOVERY_FAILED");
  }
  return readLiveModelIds(await response.json());
}
function harnessApiKeyAuth() {
  return {
    apiKey: {
      name: "OpenCode API key",
      /* v8 ignore next -- pi-ai calls resolve only for a request without an apiKey override, and this adapter always passes one */
      resolve: () => Promise.resolve({ auth: {}, source: "OpenCode API key" })
    }
  };
}
function buildProvider(baseURL, models, providerId = PROVIDER_ID) {
  return createProvider({
    id: providerId,
    name: DISPLAY_NAME,
    baseUrl: baseURL,
    auth: harnessApiKeyAuth(),
    models: [...models],
    api: {
      "anthropic-messages": anthropicMessagesApi(),
      "openai-completions": openAICompletionsApi(),
      "openai-responses": openAIResponsesApi()
    }
  });
}
var OpencodeGoCatalog = class {
  /**
   * @param baseURL - The endpoint the gateway serves; also the listing base.
   * @param refreshMs - How long one live resolution stays authoritative.
   * @param onFallback - Observes a failed live listing and how many curated
   *   models kept serving because of it.
   * @param onOmitted - Observes live ids the catalog cannot route, neither
   *   curated nor adapted.
   * @param autoDiscover - Whether unknown live ids from known families are
   *   adapted onto the route; off restores omit-only behavior.
   * @param onInferred - Observes live ids adapted onto the route.
   * @param providerId - The route these models are served under. It must be
   *   the id the adapter actually registered, because the LLM runtime rejects
   *   a catalog whose entries name a different provider.
   * @param additions - Extra models to seed beyond the installed pi-ai
   *   catalog, already filtered by the caller's configuration.
   * @param onResolved - Observes one resolution's arithmetic
   *   (`curated`/`live`/`adapted`/`omitted`/`served`), the four numbers that
   *   answer "why is this model missing" without reading the source.
   */
  constructor(baseURL, refreshMs, onFallback, onOmitted, autoDiscover = true, onInferred = () => {
  }, providerId = PROVIDER_ID, additions = CATALOG_ADDITIONS, onResolved = () => {
  }) {
    this.baseURL = baseURL;
    this.refreshMs = refreshMs;
    this.onFallback = onFallback;
    this.onOmitted = onOmitted;
    this.autoDiscover = autoDiscover;
    this.onInferred = onInferred;
    this.providerId = providerId;
    this.additions = additions;
    this.onResolved = onResolved;
  }
  served;
  pending;
  /**
   * The current catalog, fetching when expired or never fetched.
   * @returns the snapshot now serving, shared by concurrent callers.
   */
  snapshot() {
    if (this.served !== void 0 && Date.now() - this.served.fetchedAtMs < this.refreshMs) {
      return Promise.resolve(this.served);
    }
    this.pending ??= this.build().then((snapshot) => {
      this.served = snapshot;
      return snapshot;
    }).finally(() => {
      this.pending = void 0;
    });
    return this.pending;
  }
  /**
   * One resolution: intersect the curated table with the live listing, then
   * adapt the unknown live ids whose family carries evidence.
   */
  async build() {
    const curated = curatedModels(this.baseURL, this.providerId, this.additions);
    let liveIds;
    let failure;
    try {
      liveIds = await fetchLiveModelIds(this.baseURL);
    } catch (error) {
      failure = error;
    }
    if (liveIds === void 0) {
      this.onFallback({ url: `${this.baseURL.replace(/\/+$/, "")}/models`, error: failure, kept: curated.size });
      this.onResolved({
        live: false,
        curated: curated.size,
        listed: 0,
        adapted: 0,
        omitted: 0,
        served: curated.size,
        missing: []
      });
      return {
        models: curated,
        provider: buildProvider(this.baseURL, [...curated.values()], this.providerId),
        live: false,
        fetchedAtMs: Date.now()
      };
    }
    const live = new Set(liveIds);
    const omitted = [];
    const adapted = [];
    for (const id of liveIds) {
      if (curated.has(id)) continue;
      const adaptedModel = this.autoDiscover ? adaptModelFromFamily(id, curated, this.baseURL, this.providerId) : void 0;
      if (adaptedModel !== void 0) adapted.push(adaptedModel);
      else omitted.push(id);
    }
    if (adapted.length > 0) this.onInferred(adapted.map((model) => model.id));
    if (omitted.length > 0) this.onOmitted(omitted);
    const served = [...curated.values()].filter((model) => live.has(model.id));
    served.push(...adapted);
    // Curated entries the endpoint no longer lists: retired upstream, or a
    // locally seeded addition the endpoint never carried.
    const missing = [...curated.keys()].filter((id) => !live.has(id));
    this.onResolved({
      live: true,
      curated: curated.size,
      listed: liveIds.length,
      adapted: adapted.length,
      omitted: omitted.length,
      served: served.length,
      missing
    });
    return {
      models: new Map(served.map((model) => [model.id, model])),
      provider: buildProvider(this.baseURL, served, this.providerId),
      live: true,
      fetchedAtMs: Date.now()
    };
  }
};
async function discoverCatalogModels(catalog) {
  const snapshot = await catalog.snapshot();
  if (!snapshot.live) {
    throw new LlmError4("llm-opencode-go: the live model listing is unreachable; try again later", "DISCOVERY_FAILED");
  }
  return [...snapshot.models.values()].map((model) => ({
    id: model.id,
    name: model.name,
    contextWindow: model.contextWindow,
    maxTokens: model.maxTokens
  }));
}

// src/config.ts
import { MAX_TIMER_DELAY_MS } from "@deepseek-ai/dsh-timeout";
import z from "@deepseek-ai/schemastery";
import * as dshSettings from "@deepseek-ai/dsh-settings";
var DEFAULT_API_KEY_ENV = "OPENCODE_API_KEY";
var DEFAULT_REFRESH_MINUTES = 5;
var DEFAULT_STREAM_IDLE_TIMEOUT_MS = 3e5;
/**
 * Whether the installed harness carries the 0.1.7 settings model.
 *
 * This is asked of the settings module, not of the schema builder, and the
 * difference matters. `schemastery` 3.18.4 — which BOTH release trains resolve
 * — already carries `volatile()`, so probing it reports "yes" on a 0.1.6 that
 * has no idea what a volatile field is. Marking fields there makes
 * `SettingsProvider.register()` reject the base it is handed with
 * `ValidationError {"path":["enabled"]}`, and the section is lost with nothing
 * but an error line to show for it. The module is the honest test: it exports
 * `SettingsProvider` through 0.1.6 and `SettingsForms` from 0.1.7 on.
 *
 * A namespace import rather than a named one, for the same reason
 * `@deepseek-ai/dsh-llm` is read that way: a named import that does not exist
 * fails the module at link time, before any probe could run.
 */
var NEW_SETTINGS_MODEL = typeof dshSettings.SettingsForms === "function";
/**
 * Mark one config field live, under the settings model that reads such marks.
 * A volatile field is what makes a plugin's `Config` renderable as a 0.1.7
 * settings form AND what lets an accepted edit update the running fiber instead
 * of remounting it. Under 0.1.6 the field stays plain, which is exactly how its
 * settings section reads it.
 * @param schema - field schema to mark.
 * @returns the same schema, volatile under the 0.1.7 settings model.
 */
var live = (schema) => NEW_SETTINGS_MODEL && typeof schema.volatile === "function" ? schema.volatile() : schema;
var Config = z.object({
  enabled: live(z.boolean().default(true)),
  apiKeyEnv: live(z.string().role("credential-ref").default(DEFAULT_API_KEY_ENV)),
  baseURL: live(z.string().default(DEFAULT_BASE_URL)),
  autoDiscover: live(z.boolean().default(true)),
  refreshMinutes: live(z.number().step(1).min(1).max(7 * 24 * 60).default(DEFAULT_REFRESH_MINUTES)),
  streamIdleTimeoutMs: live(z.number().min(Number.MIN_VALUE).max(MAX_TIMER_DELAY_MS).default(DEFAULT_STREAM_IDLE_TIMEOUT_MS)),
  // The image defaults are the generic pi-ai adapter's: one normalized
  // request image fits the budget, and fifteen of them fit the payload cap.
  maxRequestImageBytes: live(z.number().step(1).min(1).default(DEFAULT_MAX_REQUEST_IMAGE_BYTES)),
  requestImagePixelBudget: live(z.number().step(1).min(1).default(DEFAULT_REQUEST_IMAGE_PIXEL_BUDGET)),
  requestImageMaxBytes: live(z.number().step(1).min(1).default(DEFAULT_REQUEST_IMAGE_MAX_BYTES)),
  // Models to seed beyond the installed pi-ai catalog. Entries are validated
  // where they are used, not here: schemastery passes object members through,
  // so a half-spelled entry would otherwise seed a model with no protocol.
  catalogAdditions: live(z.array(z.object({
    id: z.string(),
    siblingId: z.string(),
    inputSiblingId: z.string(),
    name: z.string()
  })).default(CATALOG_ADDITIONS))
});
function assertBaseURL(raw) {
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(`llm-opencode-go: baseURL "${raw}" is not a valid URL`);
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error(`llm-opencode-go: baseURL "${raw}" must be http or https`);
  }
  if (url.search.length > 0 || url.hash.length > 0) {
    throw new Error(`llm-opencode-go: baseURL "${raw}" must not carry a query or fragment`);
  }
  return url.toString().replace(/\/+$/, "");
}

// src/adapter.ts
function opencodeSessionValue(sessionId) {
  return sessionId !== void 0 && sessionId.length > 0 ? sessionId : randomUUID();
}
var OpencodeGoAdapter = class extends LlmAdapter {
  /**
   * The route this adapter actually registered. It starts at {@link PROVIDER_ID}
   * and moves to {@link FALLBACK_PROVIDER_ID} when that route was already taken.
   * The catalog and every model descriptor must name the registered id: the LLM
   * runtime rejects a catalog whose `provider` disagrees with the route.
   */
  route = PROVIDER_ID;
  constructor(options) {
    super();
    this.options = options;
  }
  /**
   * One catalog instance per endpoint/refresh pair. A settings write that
   * changes either gets a fresh resolver (and a fresh live-listing fetch) on
   * the next operation; an unchanged configuration keeps its cached snapshot
   * for the whole refresh interval.
   */
  catalogCache;
  /**
   * The catalog resolver for one configuration, rebuilding on the facts it
   * owns. Public for the plugin's discovery registration, which resolves the
   * current configuration the same way the adapter does.
   * @param config - the configuration whose endpoint, auto-discovery switch,
   *   and refresh interval the resolver serves; a change to any of them yields
   *   a fresh resolver.
   * @returns the resolver caching one snapshot per configuration key.
   */
  catalogOf(config) {
    const key = `${config.baseURL}|${String(config.refreshMinutes)}|${String(config.autoDiscover)}|${this.route}`;
    if (this.catalogCache?.key !== key) {
      this.catalogCache = {
        key,
        catalog: new OpencodeGoCatalog(
          assertBaseURL(config.baseURL),
          config.refreshMinutes * 6e4,
          /* v8 ignore next -- the plugin always passes both observers; the defaults exist for direct construction */
          this.options.onFallback ?? (() => {
          }),
          /* v8 ignore next -- the plugin always passes both observers; the defaults exist for direct construction */
          this.options.onOmitted ?? (() => {
          }),
          config.autoDiscover,
          /* v8 ignore next -- the plugin always passes the observer; the default exists for direct construction */
          this.options.onInferred ?? (() => {
          }),
          this.route,
          usableAdditions(config.catalogAdditions),
          /* v8 ignore next -- the plugin always passes the observer; the default exists for direct construction */
          this.options.onResolved ?? (() => {
          })
        )
      };
    }
    return this.catalogCache.catalog;
  }
  providerInfo(provider) {
    return { id: provider, name: DISPLAY_NAME };
  }
  async listModels(_provider) {
    const snapshot = await this.catalogOf(this.options.config()).snapshot();
    return [...snapshot.models.values()].map((model) => ({
      provider: this.route,
      id: model.id,
      name: model.name,
      inputModalities: [...model.input]
    }));
  }
  async resolveModel(_provider, model, _signal) {
    const snapshot = await this.catalogOf(this.options.config()).snapshot();
    const resolved = snapshot.models.get(model);
    if (resolved === void 0) {
      throw new LlmError5(`opencode-go has no model "${model}"`, "UNKNOWN_MODEL");
    }
    return this.modelInfo(resolved);
  }
  /** Describe one model: capacities plus the reasoning levels it actually offers. */
  modelInfo(model) {
    const reasoning = {};
    if (model.reasoning) {
      reasoning.reasoning = {
        efforts: getSupportedThinkingLevels(model).map((level) => ({
          id: ReasoningEffortId(level),
          name: `${level.charAt(0).toUpperCase()}${level.slice(1)}`
        }))
      };
    }
    return {
      provider: this.route,
      id: model.id,
      name: model.name,
      inputModalities: [...model.input],
      context: { contextWindow: model.contextWindow },
      ...reasoning
    };
  }
  /** Validate an explicit effort against the model's own levels, without clamping. */
  resolveReasoningLevel(model, effort) {
    if (effort === void 0) return void 0;
    const supported = getSupportedThinkingLevels(model);
    if (supported.some((level) => level === effort)) return effort;
    throw new LlmError5(
      `opencode-go model "${model.id}" does not support reasoning effort "${effort}"`,
      "UNSUPPORTED_REASONING_EFFORT"
    );
  }
  async *stream(options) {
    var _stack = [];
    try {
      if (options.stop !== void 0) {
        throw new LlmError5("llm-opencode-go does not support GenerateOptions.stop", "UNSUPPORTED_OPTION");
      }
      const config = this.options.config();
      const snapshot = await this.catalogOf(config).snapshot();
      const model = snapshot.models.get(options.model);
      if (model === void 0) {
        throw new LlmError5(`opencode-go has no model "${options.model}"`, "UNKNOWN_MODEL");
      }
      const apiKey = await this.options.resolveApiKey();
      if (apiKey === void 0 || apiKey.length === 0) {
        throw new LlmError5("llm-opencode-go: no credential resolved for the route", "MISSING_CREDENTIAL");
      }
      const reasoning = this.resolveReasoningLevel(model, options.reasoningEffort);
      const consumer = new AbortController();
      const upstream = options.signal === void 0 ? consumer.signal : AbortSignal.any([options.signal, consumer.signal]);
      const watchdog = __using(_stack, idleWatchdog(upstream, config.streamIdleTimeoutMs, "LLM_STREAM_IDLE_TIMEOUT"));
      try {
        const containsImage = options.messages.some((message) => contentHasImage2(message.content));
        if (containsImage && !model.input.includes("image")) {
          throw new LlmError5(`opencode-go model "${model.id}" does not support image input`, "UNSUPPORTED_CONTENT");
        }
        let imageRequest;
        if (containsImage) {
          const access = this.options.imageAccess;
          const store = access?.resolveAttachments();
          if (access === void 0 || store === void 0) {
            throw new LlmError5("llm-opencode-go image input requires the durable attachment service", "UNSUPPORTED_CONTENT");
          }
          imageRequest = {
            attachments: store,
            resolveImageAccess: (ref) => access.resolveImageAccess(store, ref),
            maxRequestImageBytes: config.maxRequestImageBytes,
            requestImagePolicy: {
              maxPixels: config.requestImagePixelBudget,
              maxBytes: config.requestImageMaxBytes
            }
          };
        }
        const context = imageRequest === void 0 ? toPiContext(options, void 0, this.options.onReplayDegrade) : await toPiContext({ ...options, signal: watchdog.signal }, imageRequest, this.options.onReplayDegrade);
        const events = snapshot.provider.streamSimple(model, context, {
          apiKey,
          ...reasoning === void 0 || reasoning === "off" ? {} : { reasoning },
          ...options.temperature === void 0 ? {} : { temperature: options.temperature },
          ...options.maxTokens === void 0 ? {} : { maxTokens: options.maxTokens },
          ...options.sessionId === void 0 ? {} : { sessionId: String(options.sessionId) },
          signal: watchdog.signal,
          // Harness-owned request identity: the gateway refuses requests without
          // `x-opencode-session` and profiles clients by User-Agent, and
          // attribution merges last in pi-ai's client.
          headers: {
            "x-opencode-session": opencodeSessionValue(options.sessionId === void 0 ? void 0 : String(options.sessionId)),
            ...attributionHeaders2()
          },
          // The agent recovery layer owns visible attempts; one adapter call is
          // one SDK attempt.
          maxRetries: 0
        });
        const iterator = toStreamChunks(events, model.contextWindow, options.signal, model.id)[Symbol.asyncIterator]();
        let exhausted = false;
        try {
          while (true) {
            const result = await watchdog.next(iterator);
            if (timeoutOf(watchdog.signal, "LLM_STREAM_IDLE_TIMEOUT") !== void 0) {
              throw new LlmError5("opencode-go stream idle timeout", "TIMEOUT");
            }
            if (result.done) {
              exhausted = true;
              return;
            }
            yield result.value;
          }
        } finally {
          if (!exhausted) {
            consumer.abort("opencode-go stream consumer stopped");
            try {
              await iterator.return(void 0);
            } catch (_abortedSdkTeardown) {
            }
          }
        }
      } catch (error) {
        if (timeoutOf(watchdog.signal, "LLM_STREAM_IDLE_TIMEOUT") !== void 0) {
          throw new LlmError5("opencode-go stream idle timeout", "TIMEOUT", { cause: error });
        }
        if (options.signal?.aborted) {
          throw new LlmError5("opencode-go request aborted by caller", "ABORTED", { cause: error });
        }
        throw error;
      }
    } catch (_) {
      var _error = _, _hasError = true;
    } finally {
      __callDispose(_stack, _error, _hasError);
    }
  }
};

// src/usage.ts
import { TypertRemoteService } from "@deepseek-ai/dsh-typert-protocol";
import { attributionHeaders as attributionHeaders3 } from "@deepseek-ai/dsh-llm";

// src/usage-contract.ts
function parseGoUsage(value) {
  if (!value || typeof value !== "object") throw new Error("Invalid OpenCode Go usage response");
  const source = value;
  const result = {};
  for (const key of ["rolling", "weekly", "monthly"]) {
    const row = source[key];
    if (!row || row.status !== "ok" && row.status !== "rate-limited" || typeof row.percent !== "number" || !Number.isFinite(row.percent) || row.percent < 0 || typeof row.resetsAt !== "string" || !Number.isFinite(Date.parse(row.resetsAt))) {
      throw new Error("Invalid OpenCode Go usage response");
    }
    result[key] = { status: row.status, percent: row.percent, resetsAt: row.resetsAt };
  }
  return result;
}
var usageCodec = {
  mode: "strict",
  typeSymbol: "dsh-opencode-go#GoUsage",
  schema: { parse: parseGoUsage },
  create: () => ({ parse: parseGoUsage })
};
var usageRemote = {
  package: "dsh-opencode-go",
  descriptors: [{
    id: "dsh-opencode-go#opencodeGoUsage/read",
    service: "opencodeGoUsage",
    namespace: "opencodeGoUsage",
    method: "read",
    invocation: { kind: "direct" },
    parameters: [],
    result: usageCodec
  }]
};

// src/usage.ts
var GoUsageService = class extends TypertRemoteService {
  constructor(ctx, options) {
    super(ctx, "opencodeGoUsage");
    this.options = options;
    ctx.inject(["typert"], (scope) => {
      scope.effect(() => scope.typert.register({
        package: usageRemote.package,
        face: "host",
        schemas: [],
        model: { services: [], events: [], objects: [] },
        invocations: usageRemote.descriptors
      }));
    });
  }
  async read() {
    const baseURL = assertBaseURL(this.options.baseURL()).replace(/\/$/, "");
    const key = await this.options.resolveApiKey();
    if (!key) throw new Error("OpenCode Go API key is not configured");
    const response = await fetch(`${baseURL}/usage`, {
      headers: { ...attributionHeaders3(), Authorization: `Bearer ${key}`, Accept: "application/json" },
      signal: AbortSignal.timeout(1e4),
      redirect: "error"
    });
    if (!response.ok) throw new Error(`OpenCode Go usage unavailable (HTTP ${response.status})`);
    const body = await response.json();
    return parseGoUsage(body && typeof body === "object" ? body.usage : void 0);
  }
};

// src/index.ts
var name = "llm-opencode-go";
var inject = ["llm"];
var NS = "llm-opencode-go";
function apply(ctx, raw) {
  // `apply` is handed the config its loader already resolved: defaults applied,
  // and — under the 0.1.7 settings model — live fields as `Volatile` refs that an
  // accepted edit updates in place rather than through a remount. Resolving that
  // object a second time is not merely redundant: schemastery validates the refs
  // as values and rejects the entry outright (`$.enabled expected boolean but got
  // [object Object]`). Only a config that arrives unresolved is resolved here,
  // which is also what keeps the module's own defaults authoritative for a
  // launcher that hands raw config straight in.
  const entry = raw !== null && typeof raw === "object" ? raw : Config(raw);
  // A live field is a `Volatile` ref, not a value: 0.1.7 hands `apply` the
  // config its loader resolved, and an accepted edit mutates those refs in place
  // instead of re-running the plugin. Read every field the same way on both
  // settings models — this projects the resolved node onto plain values, and is
  // a no-op where the fields are already plain (dsh <= 0.1.6).
  const unwrap = (value) => value !== null && typeof value === "object" && typeof value.get === "function" ? value.get() : value;
  const project = (node) => {
    const plain = {};
    for (const key of Object.keys(node)) plain[key] = unwrap(node[key]);
    return plain;
  };
  let current = () => project(entry);
  assertBaseURL(current().baseURL);
  const resolveApiKey = async () => {
    const ref = current().apiKeyEnv;
    const credentials = ctx.get("credentials");
    const hit = credentials !== void 0 ? (await credentials.resolve(credentialRef(ref)))?.value : launchEnvironmentOf(ctx).get(ref)?.value;
    if (hit !== void 0 && hit.length > 0) return assertUsableApiKey(hit, name, ref);
    throw new LlmError6(
      `llm-opencode-go: no credential; the profile resolves ${ref}, which is not set \u2014 store ${ref} through the credentials service or export it`,
      "MISSING_CREDENTIAL"
    );
  };
  ctx.plugin(GoUsageService, { baseURL: () => current().baseURL, resolveApiKey });
  const logger = {
    fallback: ({ error }) => {
      ctx.logger.warn(`llm-opencode-go: live model listing unreachable; serving the curated table until the next refresh (${String(error)})`);
    },
    omitted: (ids) => {
      ctx.logger.warn(`llm-opencode-go: live listing carries ids the catalog cannot describe, so they are NOT selectable: ${ids.join(", ")} — declare them under the "catalogAdditions" setting to seed them from a sibling model`);
    },
    inferred: (ids) => {
      ctx.logger.info(`llm-opencode-go: adapted live ids the curated table does not describe onto their family's protocol: ${ids.join(", ")}`);
    },
    resolved: (snapshot) => {
      const detail = `curated ${snapshot.curated}, live listing ${snapshot.listed}, adapted ${snapshot.adapted}, omitted ${snapshot.omitted}, served ${snapshot.served}`;
      if (snapshot.live) {
        ctx.logger.info(`llm-opencode-go: catalog resolved (${detail})`);
      } else {
        ctx.logger.warn(`llm-opencode-go: catalog resolved WITHOUT the live listing (${detail})`);
      }
      if (snapshot.missing.length > 0) {
        ctx.logger.warn(`llm-opencode-go: the endpoint no longer lists these curated ids, so they are withheld: ${snapshot.missing.join(", ")}`);
      }
    }
  };
  const adapter = new OpencodeGoAdapter({
    config: () => current(),
    resolveApiKey,
    imageAccess: {
      resolveAttachments: () => ctx.get("attachments"),
      resolveImageAccess: (attachments, ref) => resolveImageAttachmentAccess(
        attachments,
        (hostPath) => ctx.get("fs")?.processPathFromHostPath(hostPath),
        ref
      )
    },
    onFallback: logger.fallback,
    onOmitted: logger.omitted,
    onInferred: logger.inferred,
    onResolved: logger.resolved,
    onReplayDegrade: (reason) => {
      ctx.logger.warn(`llm-opencode-go: unusable replay state on assistant history; sending provider-neutral content (${reason})`);
    }
  });
  let registration;
  /**
   * Claim a route, preferring {@link PROVIDER_ID} and falling back to
   * {@link FALLBACK_PROVIDER_ID} when another adapter already owns the first.
   * `registerAdapter` is all-or-nothing, so a duplicate throws rather than
   * partially registering; retrying under another id is what keeps the live
   * catalog reachable instead of losing it to whoever registered first.
   * `adapter.route` is set before each attempt because the catalog it serves
   * must name the id that actually wins.
   * @returns the registration handle, or undefined when no route could be claimed.
   */
  const claimRoute = () => {
    for (const id of [PROVIDER_ID, FALLBACK_PROVIDER_ID]) {
      adapter.route = id;
      try {
        const handle = ctx.llm.registerAdapter([id], adapter);
        ctx.logger.info(`llm-opencode-go: route "${id}" registered as ${DISPLAY_NAME}`);
        if (id !== PROVIDER_ID) {
          ctx.logger.warn(
            `llm-opencode-go: provider "${PROVIDER_ID}" is already registered by another adapter, so this plugin serves "${id}" instead. `
            + `The usual cause is a model list materialized into settings.yaml under "llm-pi-ai.providers.${PROVIDER_ID}"; removing that entry lets this plugin own "${PROVIDER_ID}" and serve the live catalog there.`
          );
        }
        return handle;
      } catch (error) {
        const duplicate = error !== null && typeof error === "object" && error.code === "DUPLICATE_ADAPTER";
        if (!duplicate || id === FALLBACK_PROVIDER_ID) {
          ctx.logger.error(`llm-opencode-go: could not register the "${id}" route (${String(error)})`);
          return void 0;
        }
      }
    }
    return void 0;
  };  const applyRoute = (configured) => {
    if (configured && current().enabled && registration === void 0) {
      registration = claimRoute();
    } else if ((!configured || !current().enabled) && registration !== void 0) {
      registration();
      registration = void 0;
      if (!current().enabled) {
        ctx.logger.info("llm-opencode-go: disabled by configuration; the route and its models are withdrawn");
      }
    }
  };
  let credentialRevision = 0;
  let syncGeneration = 0;
  const describeCredential = async (ref) => {
    const credentials = ctx.get("credentials");
    if (credentials) return credentials.describe(credentialRef(ref));
    return { configured: Boolean(launchEnvironmentOf(ctx).get(ref)?.value), writable: false };
  };
  const syncRoute = async () => {
    const generation = ++syncGeneration;
    const ref = current().apiKeyEnv;
    try {
      const info = await describeCredential(ref);
      if (generation === syncGeneration && ref === current().apiKeyEnv) applyRoute(info.configured);
    } catch {
      ctx.logger.error("llm-opencode-go: credential status unavailable; keeping the previous route state");
    }
  };
  // Model discovery is keyed by the SETTINGS NAMESPACE, and this package keeps
  // that namespace identical to the baseline's on purpose so existing
  // configuration survives the migration. That sameness is exactly what makes
  // the two packages unable to share a profile: the registry rejects a second
  // offer for the same namespace, and it throws from inside the loader's own
  // effect — which fails the ENTIRE plugin tree, not just this entry, so an
  // unrelated plugin such as the receipt or market bundle stops loading too.
  // Detect the collision here, before a route is claimed or a settings section
  // is mounted, and let the loser go inert instead of taking everything down.
  // `registerModelDiscovery` is itself version-dependent: a harness that never
  // carried it would answer with a TypeError, which is not the collision this
  // guard is about, so it would be rethrown and fail the loader entry. Probe for
  // the method first and lose only the discovery offer.
  let undiscover;
  try {
    if (typeof ctx.llm.registerModelDiscovery !== "function") {
      ctx.logger.warn(
        "llm-opencode-go: this harness build has no ctx.llm.registerModelDiscovery, so the Models page cannot interrogate the endpoint; "
        + "the adapter still serves the live catalog it resolves itself."
      );
    } else {
      undiscover = ctx.llm.registerModelDiscovery(name, async (request) => {
        if (request.provider !== (adapter.route ?? PROVIDER_ID) && !(request.baseURL ?? "").includes("opencode.ai")) {
          throw new LlmError6(
            "llm-opencode-go discovers only OpenCode zen/go endpoints; enter this provider's models by hand",
            "DISCOVERY_UNSUPPORTED"
          );
        }
        return discoverCatalogModels(adapter.catalogOf(current()));
      });
    }
  } catch (error) {
    const collides = error !== null && typeof error === "object" && (error.code === "DUPLICATE_DISCOVERY" || /already registered/i.test(String(error.message)));
    if (!collides) throw error;
    ctx.logger.warn(
      `llm-opencode-go: model discovery for the settings namespace "${name}" is already registered by another plugin, so ${DISPLAY_NAME} stays disabled in this profile. `
      + `The baseline package "dsh-opencode-go" owns both that namespace and the "${PROVIDER_ID}" route and shares neither, so the two cannot coexist in one profile; `
      + `remove the other one ("dsh plugin --profile <profile> remove dsh-opencode-go") and restart to use this package instead.`
    );
    return;
  }
  // Declare the route in the configurable-provider directory so the web
  // Settings -> Models page carries an "OpenCode Go" row pointing at this
  // plugin's own settings namespace, instead of the plugin owning a settings
  // section of its own.
  //
  // WHY THE FALLBACK ID AND NOT `opencode-go`: the directory rejects a second
  // declaration of the same provider, and `opencode-go` is ALREADY declared
  // there by `@deepseek-ai/dsh-llm-pi-ai`, whose installed pi-ai catalog ships
  // a route by that name (`declared: false`). Declaring it here does not
  // merely lose the row — `registerConfigurableProviders` throws
  // DUPLICATE_DIRECTORY from inside `apply()` and aborts the rest of it, so the
  // route is never claimed either and the plugin goes completely inert.
  //
  // The fallback id is free in that directory, and it is the route this package
  // actually serves whenever `opencode-go` was taken. Registering it under the
  // fallback id also matters for a second reason: the Models row derives its
  // credential reference from whatever the plugin's default `apiKeyEnv` names,
  // so the row reads the SAME key the adapter already uses, rather than
  // inventing a second reference the plugin would ignore.
  //
  // `settingsPath` is EMPTY on purpose: the `llm-opencode-go` section root IS
  // this route's profile, exactly as the adapter's own schema validates the
  // whole section. The Models editor therefore edits section-root fields
  // (`apiKey` through the credentials domain, `baseURL`) and leaves
  // `refreshMinutes`, the image budgets, and `autoDiscover` in `settings.yaml`.
  //
  // This declaration is what replaces the plugin's former standalone
  // "Settings -> OpenCode Go" section: that page is withdrawn with it, because
  // the Models row is now the only configuration surface.
  // `settingsNs` is the plugin's own namespace, and `cordis.patch.yml` gives the
  // bundle entry the SAME id (`llm-opencode-go`). That is what makes this one
  // value correct on both settings models: up to 0.1.6 a settings namespace is a
  // `settings.yaml` section, and from 0.1.7 it is the loader entry id, which is
  // how the Models page finds the form backing this row. A harness without the
  // directory at all loses only the row, and a directory that already carries
  // this route loses only the row too — neither may take the plugin down, which
  // is why this no longer throws out of `apply()`.
  try {
    if (typeof ctx.llm.registerConfigurableProviders !== "function") {
      ctx.logger.warn(
        "llm-opencode-go: this harness build has no configurable-provider directory, so Settings -> Models carries no row for this plugin; "
        + "the route and its models are unaffected."
      );
    } else {
      ctx.llm.registerConfigurableProviders([{
        provider: FALLBACK_PROVIDER_ID,
        displayName: DISPLAY_NAME,
        settingsNs: NS,
        settingsPath: []
      }]);
    }
  } catch (error) {
    const duplicate = error !== null && typeof error === "object" && (error.code === "DUPLICATE_DIRECTORY" || /already declared/i.test(String(error.message)));
    if (!duplicate) throw error;
    ctx.logger.warn(
      `llm-opencode-go: the configurable-provider directory already declares "${FALLBACK_PROVIDER_ID}", so Settings -> Models shows the existing entry for it instead of one from this plugin. `
      + "The route and its models are unaffected; edit the section through whichever plugin declared it."
    );
  }
  ctx.plugin(GoConnectionService, {
    config: () => current(),
    describe: describeCredential,
    resolveApiKey,
    syncRoute,
    route: () => registration ? adapter.route : undefined,
    revision: () => credentialRevision,
    headers: attributionHeaders,
    parseUsage: parseGoUsage,
    refreshModels: async () => {
      const handle = registration;
      adapter.catalogCache = undefined;
      const snapshot = await adapter.catalogOf(current()).snapshot();
      // Publish the new directory without dropping an active route. Older
      // hosts may have only a disposer, so capability-check the update handle.
      if (handle && handle === registration && typeof handle.replace === "function") handle.replace([adapter.route]);
      return snapshot;
    }
  });
  syncRoute();
  ctx.effect(() => () => {
    ++syncGeneration;
    registration?.();
    undiscover?.();
  });
  // Validate an edit before the loader takes it. From 0.1.7 a settings form
  // writes the profile entry's config directly, so nothing consults the schema's
  // own `validate` hook (the pre-0.1.7 `installSection` option next door) on the
  // way in: an unusable `baseURL` would only surface inside the NEXT `apply()`,
  // failing the entry instead of being refused as typed. Throwing here rejects
  // the update and leaves the running config in place. Harnesses that never emit
  // this event simply never call it.
  ctx.on("internal/config", function (_raw, next) {
    const raw = next();
    if (this !== ctx.fiber) return raw;
    // Validate the values, not the node: under 0.1.7 this config holds `Volatile`
    // refs, and handing those to `Config` rejects a config that is perfectly
    // valid (`$.enabled expected boolean but got [object Object]`). Projecting
    // first keeps the validation — which is the whole point of this listener —
    // while letting it read the values the refs stand for.
    const node = raw !== null && typeof raw === "object" ? raw : {};
    assertBaseURL(Config(project(node)).baseURL);
    return raw;
  });
  ctx.inject(["settings"], (settingsCtx) => {
    const settings = settingsCtx.settings;
    // The settings service changed shape at 0.1.7 and this plugin has to work on
    // both. Through 0.1.6 it is `SettingsProvider`, which owns `installSection`:
    // the plugin registered a section, the service handed back a live source,
    // and `setSource`/`onChange` kept `current` and the route in step. From
    // 0.1.7 it is `SettingsForms`, which owns no section at all — the loader
    // entry carries the config, the form's schema is this module's exported
    // `Config`, and an accepted edit re-applies the entry, so the `entry` built
    // by the next `apply()` is already the source of truth and there is nothing
    // to install.
    if (typeof (settings && settings.installSection) === "function") {
      settings.installSection(ctx, NS, Config, entry, {
        validate: (value) => {
          assertBaseURL(value.baseURL);
        },
        setSource: (source) => {
          current = source;
        },
        onChange: () => {
          syncRoute();
        }
      });
      return;
    }
    if (typeof (settings && settings.configure) === "function") {
      // Declare this instance's page policy, exactly as the harness's own
      // providers do. `auto: true` is the default and asks for a generated form
      // over `Config`, which is what puts `refreshMinutes`, `autoDiscover`, the
      // image budgets and `catalogAdditions` in the UI on these releases.
      settingsCtx.effect(() => settings.configure({ auto: true }, ctx.fiber));
      return;
    }
    ctx.logger.warn(
      "llm-opencode-go: the settings service exposes neither installSection (dsh <= 0.1.6) nor configure (dsh >= 0.1.7), so this plugin cannot offer an editor; "
      + "its settings still resolve from the profile entry's own config."
    );
  });
  ctx.inject(["credentials"], (credentialsCtx) => {
    credentialsCtx.on("credentials/reference-updated", (ref) => {
      if (ref === current().apiKeyEnv) { ++credentialRevision; syncRoute(); }
    });
    syncRoute();
  });
}
export {
  CATALOG_ADDITIONS,
  Config,
  DEFAULT_BASE_URL,
  DISPLAY_NAME,
  FALLBACK_PROVIDER_ID,
  NS,
  OpencodeGoAdapter,
  OpencodeGoCatalog,
  PROVIDER_ID,
  apply,
  assertBaseURL,
  discoverCatalogModels,
  inject,
  name,
  readLiveModelIds,
  usableAdditions
};
