import test from 'node:test';
import assert from 'node:assert/strict';
import { appendFileSync, cpSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { registerHooks } from 'node:module';

/**
 * Conversion regression: the two tool-result shapes a Harness can hand this
 * adapter, and the image rules that surround them.
 *
 * Session format v4 retired the `tool-result` content wrapper: a tool result is
 * now its own `role: "tool"` message carrying raw blocks, which is what
 * `createToolResultMessage` writes and what the harness's own pi-ai adapter
 * reads (`toolResultOf`). Session format v3 instead nested that wrapper inside
 * a user message. Both must convert into a pi-ai `toolResult`; an image inside
 * a tool result must ride that message rather than being rejected, because
 * `read_image` gates on the route's declared image input and this adapter
 * declares it from the live catalog.
 *
 * The package ships the compiled `lib/` only, so the conversion entry point is
 * not part of the exported surface. This test stages a copy of `lib/` in a
 * temporary directory and appends the one export it needs, which keeps the test
 * out of the shipped API. The staging directory is removed on the way out.
 */

const root = resolve(fileURLToPath(new URL('../', import.meta.url)));
const modules = process.env.HARNESS_TEST_MODULES ?? join(root, '.tmp/harness/dsh/node_modules');
const harness = existsSync(join(modules, '@deepseek-ai'));
const skip = harness ? false : `no Harness tree at ${modules}; set HARNESS_TEST_MODULES`;

const imageRef = {
  attachmentId: `sha256:${'a'.repeat(64)}`,
  mediaType: 'image/png',
  width: 4,
  height: 4,
  bytes: 4,
  name: 'shot.png',
};
const attachments = {
  readImageRequest: async () => ({
    data: new Uint8Array([0x89, 0x50, 0x4e, 0x47]),
    mediaType: 'image/png',
    width: 4,
    height: 4,
    bytes: 4,
  }),
};
const imageRequest = {
  attachments,
  resolveImageAccess: () => undefined,
  requestImagePolicy: { maxPixels: 4194304, maxBytes: 1048576 },
};

const assistantCall = {
  role: 'assistant',
  content: [{ type: 'tool-call', id: 'call-1', name: 'read_image', arguments: '{}' }],
  source: { kind: 'model' },
};
const base = { model: 'deepseek-v4.1-flash', provider: 'opencode-go', tools: [], system: 'sys' };

const v4Text = { role: 'tool', toolCallId: 'call-1', isError: false, content: [{ type: 'text', text: 'image read ok' }] };
const v4Image = {
  role: 'tool',
  toolCallId: 'call-1',
  isError: false,
  content: [{ type: 'text', text: 'Image "shot.png"; request preview 4x4px.' }, { type: 'image', attachment: imageRef }],
};
const v3Wrapper = {
  role: 'user',
  content: [{ type: 'tool-result', toolCallId: 'call-1', content: [{ type: 'text', text: 'image read ok' }] }],
};

/** Stage the shipped bundle with the conversion entry point appended. */
async function loadConversion() {
  const staging = mkdtempSync(join(tmpdir(), 'opencode-go-conversion-'));
  cpSync(join(root, 'lib'), join(staging, 'lib'), { recursive: true });
  appendFileSync(join(staging, 'lib/index.js'), '\nexport { toPiContext };\n');
  const hostUrl = pathToFileURL(join(resolve(modules), '../host-test.mjs')).href;
  const hooks = registerHooks({
    resolve(specifier, context, next) {
      if (specifier.startsWith('@deepseek-ai/')) return next(specifier, { ...context, parentURL: hostUrl });
      return next(specifier, context);
    },
  });
  try {
    const bundle = await import(pathToFileURL(join(staging, 'lib/index.js')).href);
    assert.equal(typeof bundle.toPiContext, 'function', 'lib/index.js no longer defines toPiContext');
    return { toPiContext: bundle.toPiContext, cleanup: () => { hooks.deregister(); rmSync(staging, { recursive: true, force: true }); } };
  } catch (error) {
    hooks.deregister();
    rmSync(staging, { recursive: true, force: true });
    throw error;
  }
}

test('the harness tree under test is present', { skip }, () => {
  assert.ok(harness);
});

test('v4 tool message becomes a pi-ai toolResult, not a user turn', { skip }, async () => {
  const { toPiContext, cleanup } = await loadConversion();
  try {
    const context = toPiContext({ ...base, messages: [assistantCall, v4Text] }, undefined, undefined);
    const tool = context.messages.at(-1);
    assert.equal(tool.role, 'toolResult', JSON.stringify(context.messages.map((m) => m.role)));
    assert.equal(tool.toolCallId, 'call-1');
    assert.equal(tool.toolName, 'read_image');
    assert.deepEqual(tool.content, [{ type: 'text', text: 'image read ok' }]);
  } finally { cleanup(); }
});

test('an image inside a v4 tool message survives into the toolResult', { skip }, async () => {
  const { toPiContext, cleanup } = await loadConversion();
  try {
    const context = await toPiContext({ ...base, messages: [assistantCall, v4Image] }, imageRequest, undefined);
    const tool = context.messages.at(-1);
    assert.equal(tool.role, 'toolResult', JSON.stringify(context.messages.map((m) => m.role)));
    const types = tool.content.map((block) => block.type);
    assert.ok(types.includes('image'), JSON.stringify(types));
    assert.ok(types.includes('text'), JSON.stringify(types));
    const image = tool.content.find((block) => block.type === 'image');
    assert.equal(image.mimeType, 'image/png');
    assert.equal(image.data, Buffer.from([0x89, 0x50, 0x4e, 0x47]).toString('base64'));
  } finally { cleanup(); }
});

test('a v3 nested tool-result wrapper still becomes a toolResult', { skip }, async () => {
  const { toPiContext, cleanup } = await loadConversion();
  try {
    const context = await toPiContext({ ...base, messages: [assistantCall, v3Wrapper] }, imageRequest, undefined);
    const tool = context.messages.at(-1);
    assert.equal(tool.role, 'toolResult', JSON.stringify(context.messages.map((m) => m.role)));
    assert.equal(tool.toolCallId, 'call-1');
    assert.equal(tool.toolName, 'read_image');
  } finally { cleanup(); }
});

test('an assistant image is still rejected', { skip }, async () => {
  const { toPiContext, cleanup } = await loadConversion();
  try {
    assert.throws(
      () => toPiContext({ ...base, messages: [{ role: 'assistant', content: [{ type: 'image', attachment: imageRef }], source: { kind: 'model' } }] }, undefined, undefined),
      (error) => error.code === 'UNSUPPORTED_CONTENT' && /in-history assistant message/.test(error.message),
    );
  } finally { cleanup(); }
});

test('a tool image without the attachment service still fails closed', { skip }, async () => {
  const { toPiContext, cleanup } = await loadConversion();
  try {
    assert.throws(
      () => toPiContext({ ...base, messages: [assistantCall, v4Image] }, undefined, undefined),
      (error) => error.code === 'UNSUPPORTED_CONTENT' && /durable attachment service/.test(error.message),
    );
  } finally { cleanup(); }
});
