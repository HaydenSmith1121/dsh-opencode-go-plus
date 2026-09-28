import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire, registerHooks } from 'node:module';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';

const modules = process.env.HARNESS_TEST_MODULES;
const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const skip = !modules && 'set HARNESS_TEST_MODULES to an installed Harness node_modules';

// Exercise the launcher itself: widening npm peers alone must never hide a
// plugin that the desktop inventory still refuses to activate.
test('launcher accepts supported trains without exemptions and refuses untested trains', { skip }, async () => {
  const host = pathToFileURL(join(resolve(modules), '../compat-test.mjs')).href;
  const hook = registerHooks({ resolve(specifier, context, next) {
    return next(specifier, specifier.startsWith('@deepseek-ai/') ? { ...context, parentURL: host } : context);
  }});
  try {
    const { evaluatePluginCompatibility } = await import('@deepseek-ai/dsh-app-boot');
    const require = createRequire(host);
    const semver = createRequire(require.resolve('@deepseek-ai/dsh-app-boot'))('semver');
    const ranges = Object.entries({ ...manifest.dependencies, ...manifest.peerDependencies })
      .filter(([name]) => name === '@deepseek-ai/dsh' || name.startsWith('@deepseek-ai/dsh-'));
    for (const version of ['0.1.6-alpha.1', '0.1.6-alpha.2', '0.1.7-alpha.1', '0.1.7-rc.2', '0.2.0-rc.1', '0.2.0', '0.2.1']) {
      assert.equal(evaluatePluginCompatibility(manifest, {}, version), undefined, version);
      for (const [name, range] of ranges) assert.ok(semver.satisfies(version, range), `${name} rejects ${version} under npm rules`);
    }
    for (const version of ['0.1.5-rc.3', '0.2.0-alpha.1', '0.3.0-alpha.1', '0.3.0', '1.0.0']) {
      assert.equal(evaluatePluginCompatibility(manifest, {}, version)?.exempted, false, version);
    }
    const installed = JSON.parse(readFileSync(join(modules, '@deepseek-ai/dsh-app-boot/package.json'), 'utf8')).version;
    assert.equal(evaluatePluginCompatibility(manifest, {}, installed), undefined, installed);
  } finally { hook.deregister(); }
});

test('real Harness LLM registers fallback route, discovers models and withdraws removed credentials', { skip }, async () => {
  const host = pathToFileURL(join(resolve(modules), '../compat-test.mjs')).href;
  const hook = registerHooks({ resolve(specifier, context, next) {
    return next(specifier, specifier.startsWith('@deepseek-ai/') ? { ...context, parentURL: host } : context);
  }});
  const { Context, Service } = await import('@deepseek-ai/cordis');
  const { LlmRuntime, LlmAdapter } = await import('@deepseek-ai/dsh-llm');
  const { TypertRegistry } = await import('@deepseek-ai/dsh-typert-registry');
  const { TypertGatewayService } = await import('@deepseek-ai/dsh-api-gateway');
  const plugin = await import('../lib/index.js');
  let key = 'local-test-key';
  class Credentials extends Service {
    constructor(ctx) { super(ctx, 'credentials'); }
    async describe() { return { configured: Boolean(key), writable: true }; }
    async resolve() { return key ? { value: key } : undefined; }
  }
  const ctx = new Context();
  const fetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    if (String(url).endsWith('/models')) return Response.json({ data: [{ id: 'deepseek-v4.1-flash' }, { id: 'new-family-test' }] });
    if (String(url).endsWith('/usage')) {
      const window = { status: 'ok', percent: 1, resetsAt: '2026-12-01T00:00:00Z' };
      return Response.json({ usage: { rolling: window, weekly: window, monthly: window } });
    }
    throw new Error(`Unexpected request: ${url}`);
  };
  try {
    await ctx.plugin(TypertRegistry);
    await ctx.plugin(TypertGatewayService, {});
    await ctx.plugin(LlmRuntime);
    await ctx.plugin(Credentials);
    ctx.llm.registerAdapter(['opencode-go'], new LlmAdapter());
    await ctx.plugin(plugin, {});
    const call = async method => {
      const reply = await ctx.typertGateway.invokeRpc(`opencodeGoConnection/${method}`, { args: {} }, new AbortController().signal);
      assert.equal(reply.ok, true, JSON.stringify(reply));
      return reply.value;
    };
    const state = await call('refresh');
    assert.equal(state.connection, 'ready');
    assert.equal(state.route, 'opencode-go-plus');
    const models = await ctx.llm.listModels(state.route);
    assert.ok(models.some(model => model.id === 'new-family-test'));
    const directory = ctx.llm.listConfigurableProviders();
    assert.ok(directory.some(row => row.provider === 'opencode-go-plus' && row.settingsNs === 'llm-opencode-go'));
    assert.deepEqual(await call('status'), state);
    key = '';
    await call('refresh');
    assert.ok(!ctx.llm.listProviders().some(provider => provider.id === 'opencode-go-plus'));
    assert.ok(ctx.llm.listProviders().some(provider => provider.id === 'opencode-go'));
  } finally {
    globalThis.fetch = fetch;
    await ctx.fiber.dispose();
    hook.deregister();
  }
});

test('modern Harness settings renders plugin volatile fields with the existing namespace', { skip }, async (t) => {
  const host = pathToFileURL(join(resolve(modules), '../compat-test.mjs')).href;
  const hook = registerHooks({ resolve(specifier, context, next) {
    return next(specifier, specifier.startsWith('@deepseek-ai/') ? { ...context, parentURL: host } : context);
  }});
  let ctx;
  try {
    const { SettingsForms } = await import('@deepseek-ai/dsh-settings');
    if (!SettingsForms) return t.skip('legacy SettingsProvider release');
    const { Context, Service } = await import('@deepseek-ai/cordis');
    const { LlmRuntime } = await import('@deepseek-ai/dsh-llm');
    const plugin = await import('../lib/index.js');
    ctx = new Context();
    let rows = [];
    // Only the profile storage/entry enumeration is a fixture. Schema
    // resolution, plugin activation and SettingsForms projection are real.
    for (const name of ['loader', 'profileContext', 'configEditor']) ctx.provide(name);
    ctx.set('loader', { await: async () => {} });
    ctx.set('profileContext', { home: resolve(modules, '../nonexistent-test-home') });
    ctx.set('configEditor', { configuration: () => rows });
    class Credentials extends Service {
      constructor(ctx) { super(ctx, 'credentials'); }
      async describe() { return { configured: false, writable: true }; }
    }
    await ctx.plugin(LlmRuntime);
    await ctx.plugin(Credentials);
    await ctx.plugin(SettingsForms);
    const fiber = ctx.plugin(plugin, {});
    await fiber;
    rows = [{ entry: { id: 'llm-opencode-go', options: { id: 'llm-opencode-go', config: {} }, fiber }, inherited: {}, override: {} }];
    const [form] = ctx.settings.describe();
    assert.ok(form, 'a missing volatile form would hide plugin settings');
    assert.equal(form.ns, 'llm-opencode-go');
    assert.equal(form.autoGenerate, true);
    assert.equal(form.applies, 'live');
    assert.equal(form.value.enabled, true);
    assert.equal(form.value.apiKeyEnv, 'OPENCODE_API_KEY');
    assert.equal(typeof form.value.baseURL, 'string');
  } finally { if (ctx) await ctx.fiber.dispose(); hook.deregister(); }
});
