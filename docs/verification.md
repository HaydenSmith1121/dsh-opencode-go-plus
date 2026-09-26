# Verification

This package redistributes the compiled `lib/` only. There is no source tree, no
`scripts/`, and no `devDependencies` in the tarball, so the baseline's
verification workflow — `npm run typecheck`, `npm test`,
`npm run verify:installed` — cannot run against what you receive. This document
records what was measured on the shipped artefact instead, and how to reproduce it.

Baseline of record: `dsh-opencode-go@0.1.2`. Its own `docs/verification.md`
described its source repository and is not reproduced here.

**The section below records 0.3.0** — one train, one settings model. The 0.4.0
section at the end of this document records the same claims re-taken on both
trains, and supersedes the 0.3.0 "Remaining limits" where they disagree.

## Environment

| | |
|---|---|
| Date | 2026-09-17 |
| OS | Windows |
| Node | 24.14.0 |
| dsh | 0.1.6-alpha.1 (alpha channel) |
| pnpm | 12.4.2 |
| Profile | `web`, in a dedicated scratch `DSH_HOME` (see "Isolation") |

### Isolation

Every 0.3.0 measurement below was taken in a throwaway harness home
(`DSH_HOME=<scratch>/home`, port 3091) rather than the machine's daily `~/.dsh`,
because the checks install and uninstall this package and rewrite the profile
patch layer. The scratch home was created with the distribution repository's own
`scripts/dev-env.mjs init --home …` and removed once the checks were green.

## What was measured

### 1. Tarball contents

`npm pack --ignore-scripts` yields 31 files and no directory entries:

```sh
tar -tzf dsh-opencode-go-plus-0.3.0.tgz | grep -c 'package/lib/'         # 21
tar -tzf dsh-opencode-go-plus-0.3.0.tgz | grep -c 'cordis.patch.yml'     # 1
tar -tzf dsh-opencode-go-plus-0.3.0.tgz | grep -ciE 'package/LICENSE'    # 1
tar -tzf dsh-opencode-go-plus-0.3.0.tgz | grep -cE 'node_modules|\.env'  # 0
```

### 2. Difference from the released 0.2.1

```sh
mkdir -p /tmp/prev && tar -xzf dsh-opencode-go-plus-0.2.1.tgz -C /tmp/prev
diff -rq /tmp/prev/package .
```

Exactly three paths differ, and nothing is added or removed:

```none
package.json        # version, description, client inject list, dropped peer
lib/index.js        # the configurable-provider declaration
lib/client.js       # the settings section registration removed
```

Difference against the `dsh-opencode-go@0.1.2` baseline is the wider set the
package has always carried; see `docs/derivation.md`.

### 3. 0.3.0: the Models row, and why it must not be `opencode-go`

Read-only probes mounted through the profile patch layer
(`ctx.llm.listConfigurableProviders()`, `listProviders()`, the settings
document), plus the Web UI driven in a browser. Measured outcomes:

- `opencode-go` is already in the configurable-provider directory **before this
  package loads**, declared by `@deepseek-ai/dsh-llm-pi-ai`
  (`opencode-go <- llm-pi-ai["providers","opencode-go"] declared=false`). It
  comes from the installed pi-ai catalog, not from any user configuration.
- Declaring `provider: "opencode-go"` therefore fails:

  ```none
  LlmError: configurable provider "opencode-go" is already declared
    code: DUPLICATE_DIRECTORY
  ```

  and because it is thrown from inside `apply()`, every statement after it is
  skipped: `listProviders()` came back with only what had registered before, and
  the plugin's own `route "opencode-go" registered` line never appeared. The
  plugin is inert — not merely row-less.
- With the declaration on the fallback id the boot is clean, the directory gains
  exactly one entry (`opencode-go-plus <- llm-opencode-go[]`), and the plugin's
  route registration follows:

  ```none
  llm-opencode-go: route "opencode-go" registered as OpenCode Go
  ```

- The settings document exposes the `llm-opencode-go` namespace, which is what
  makes the Models row count as configured even though its `settingsPath` is
  empty.

In the Web UI on that instance:

| Check | Result |
|---|---|
| Settings sidebar sections | 通用设置 / 模型 / 插件 / Agent 预设 / 已归档会话 — **no OpenCode Go section** |
| 模型 page rows | DeepSeek, **OpenCode Go**, 火山方舟 Agent Plan |
| OpenCode Go row | display name present, route `opencode-go-plus`, green credential dot (`API 密钥已配置`) |
| Row's 编辑 card | generic credential field; states the remaining fields are in `settings.yaml` for `llm-opencode-go` |

The green dot is the load-bearing part: the row resolves its credential from the
section (`apiKeyEnv`, default `OPENCODE_API_KEY`), the same reference the adapter
resolves its key through, so the dot reports the key actually in use rather than
a second, unused one.

### 4. Served catalog

Read through the same value path the settings UI uses —
`ctx.llm.listProviders()` then `ctx.llm.listModels(id)`. One such run against the
live endpoint:

```none
id    = opencode-go
name  = OpenCode Go
count = 38
union-alpha        present
deepseek-v4.1-flash present
```

The plugin's own log lines for that resolution:

```none
llm-opencode-go: route "opencode-go" registered as OpenCode Go
llm-opencode-go: adapted live ids the curated table does not describe onto their
  family's protocol: minimax-m2.5, kimi-k2.5, glm-5, deepseek-flash,
  qwen3.5-plus, mimo-v2-pro, mimo-v2-omni, union-alpha, hy3-preview, grok-4.5
llm-opencode-go: catalog resolved (curated 28, live listing 38, adapted 10, omitted 0, served 38)
```

`union-alpha` appearing in the `adapted` list is the borrowed-adaptation fix
working: the baseline drops that id, because it belongs to a family the curated
table has never seen.

### 5. Coexistence with the baseline

Every configuration below was booted, not reasoned about. "Both installed" means
one profile's `dsh.profile.bundles` lists both `dsh-opencode-go` and
`dsh-opencode-go-plus`.

| Bundles | Profile patch | `dsh web` | Served |
|---|---|---|---|
| baseline only | — | starts | `opencode-go`, 37 models, no `union-alpha` |
| this package only | — | starts | `opencode-go`, **38** models, `union-alpha` present |
| both, baseline first | — | starts | the baseline serves 37; this package logs the collision and goes inert |
| both, this package first | — | **fails, exit 1** | — |
| both | baseline `disabled: true` | starts | `opencode-go`, **38** models |

The fourth row is the baseline's defect, not this package's: it does not catch the
`DUPLICATE_DISCOVERY` thrown by `ctx.llm.registerModelDiscovery()`, and the throw
escapes from the loader's own effect, so the whole tree fails and every unrelated
plugin in the profile goes down with it. Nothing this package does can prevent
that; the remedy is simply not to install both. This package's own contribution is
the third row — it no longer brings the tree down when it loses the race.

### 6. Where the plugin's logs go

Worth knowing before you go looking for that collision warning. cordis'
`LoggerService` registers exactly one exporter by default and it appends to an
in-memory ring buffer of 1000 messages. Nothing forwards to `stdout`. Measured: a
boot whose entire console output was the single line `dsh web: http://127.0.0.1:…`
had four entries sitting in `ctx.logger.buffer`, including the three quoted above.
The 0.3.0 `DUPLICATE_DIRECTORY` failure was found in exactly that buffer.

## Reproducing

```sh
# 1. the tarball
tar -tzf dsh-opencode-go-plus-0.3.0.tgz

# 2. an isolated harness home, so the checks cannot touch your daily profile
node scripts/dev-env.mjs init    --home /tmp/otg-home
node scripts/dev-env.mjs install /absolute/path/to/dsh-opencode-go-plus-0.3.0.tgz --home /tmp/otg-home
DSH_HOME=/tmp/otg-home dsh web --port 3091 --no-open

# 3. the four-step check from the distribution repository this ships in
node scripts/verify.mjs

# 4. what verify.mjs does not inspect: the directory, the row, and the catalog
#    mount a read-only probe through the profile patch layer and read
#    ctx.llm.listConfigurableProviders() + ctx.llm.listProviders() + listModels()
```

Step 4 is the one that answers "is the model list right"; `verify.mjs` only proves
the tree loads. Confirm by **count**: 38 including `union-alpha` is this package,
37 without it is the baseline.

## Remaining limits

- No real paid completion was requested. Catalog resolution, route registration,
  the Models-row declaration, and the collision behaviours were exercised;
  generation and streaming were not.
- The Models row's edit card offers the generic credential field only. This
  plugin's own knobs (`refreshMinutes`, `autoDiscover`, the image budgets,
  `catalogAdditions`) have no editor in this release and stay in `settings.yaml`;
  the card states that rather than half-editing them.
- Windows only. macOS and Linux are unverified here, though the baseline recorded
  macOS runs of its own source tree.
- Only dsh `0.1.6-alpha.1`. The `@deepseek-ai/*` peer range is an exact pin, so
  other releases are unsupported by construction.
- The desktop shell and the `headless` profile were not exercised.
- The live listing is a moving target: 38 is what the endpoint advertised on
  2026-09-17, and the counts drift as the gateway adds and retires models.

## 0.4.0 — the same claims, on both release trains

`0.3.0` supported one train and said so with an exact peer pin. `0.4.0` claims
two, so the claims have to be taken twice, on two real harnesses rather than on
two readings of a changelog. Both were taken on 2026-09-26.

| | |
|---|---|
| `0.1.6` boot | `dsh 0.1.6-alpha.1`, profile `otg`, throwaway `DSH_HOME`, port 3097 |
| `0.1.7` boot | `dsh 0.1.7-rc.2`, profile `web`, throwaway `DSH_HOME`, port 3098 |
| Probe | a repository-external plugin mounting through the profile patch layer, reading `ctx.get("settings")`, `ctx.llm.listProviders()`, `listConfigurableProviders()`, `listModels()`, and the logger's ring buffer |
| Credential | `OPENCODE_API_KEY` set to a placeholder. The model-list endpoint answers without a paid credential, which is why the live listing resolved; no completion was requested |

### Measured, side by side

| Observation | `0.1.6-alpha.1` | `0.1.7-rc.2` |
|---|---|---|
| `typeof ctx.get("settings").configure` | `undefined` | `function` |
| `llm-opencode-go` in `ctx.settings.describe()` | **present** | **present** |
| descriptor `autoGenerate` | absent (no such field) | `true` |
| descriptor `value` | all nine fields, plain values | all nine fields, plain values |
| `listProviders()` | `deepseek-official`, **`opencode-go`** | `deepseek-official`, `deepseek-account`, **`opencode-go`** |
| our row in `listConfigurableProviders()` | `opencode-go-plus<-llm-opencode-go[]` | `opencode-go-plus<-llm-opencode-go[]` |
| `ctx.llm.listModels("opencode-go")` | **43** | **43** |
| first three ids | `minimax-m3, qwen3.8-flash, deepseek-v4-flash` | identical |
| plugin log lines | route registered / adapted 15 / catalog resolved | identical |

Both boots logged:

```none
llm-opencode-go: route "opencode-go" registered as OpenCode Go
llm-opencode-go: adapted live ids the curated table does not describe onto their
  family's protocol: minimax-m2.5, kimi-k2.5, glm-5, deepseek-flash,
  qwen3.5-plus, mimo-v2-pro, mimo-v2-omni, mimo-v2.6-pro, mimo-v2.6-flash,
  space-bunny-free, longcat-2.5-preview-free, hy3-preview, grok-4.5, grok-4.7,
  gpt-6-luna
llm-opencode-go: catalog resolved (curated 28, live listing 43, adapted 15, omitted 0, served 43)
```

The route lands on `opencode-go` — the preferred id, not the `opencode-go-plus`
fallback — on both trains, even though `listConfigurableProviders()` shows a row
for `opencode-go` owned by `dsh-llm-pi-ai`. A *row* is not a registration; that
distinction is what lets this plugin claim the id. The curated/live split has
moved since `0.3.0` (28/38/10 served → 28/43/15 served): the gateway added five
models in the intervening nine days, which is the `autoDiscover` path doing the
work it exists for.

### The regression this round found, and the fix

The first `0.4.0` cut marked its config fields volatile by probing the schema
builder:

```js
var live = (schema) => typeof schema.volatile === "function" ? schema.volatile() : schema;
```

On `0.1.6` that is not a no-op. `schemastery@3.18.4` — the version *both* trains
resolve — carries `volatile()`, so every field was wrapped, and
`SettingsProvider.register()` rejected the base it was handed:

```none
0 {"options":{"path":["enabled"]},"name":"ValidationError"}
```

The plugin kept working and kept its route, which is what made the failure easy
to miss: only the settings registration died. The observable difference is the
namespace listing. Before the fix, on `0.1.6-alpha.1`:

```none
forms: [... 15 namespaces ...]          ← llm-opencode-go absent
entryConfig: "absent"
```

and after it:

```none
forms: [... 15 namespaces ..., llm-opencode-go]   ← present
entryConfig: {"value":{"enabled":true,"apiKeyEnv":"OPENCODE_API_KEY", ...}}
```

The fix moves the test from the schema builder to the settings module —
`typeof dshSettings.SettingsForms === "function"` — because that is a fact about
the release train rather than about a transitive dependency's version. See
`docs/compatibility.md` § "Live fields".

### Reproducing

```sh
# 0.1.7, the desktop release: a profile whose bundles end in this package
DSH_HOME=<scratch> dsh web --port 3098 --no-open

# 0.1.6: dsh-app-boot must be pinned back to alpha.1 or nothing boots — see the
# note in docs/compatibility.md § "Known limits"
cd <dsh-0.1.6-install> && npm install --no-save @deepseek-ai/dsh-app-boot@0.1.6-alpha.1
DSH_HOME=<scratch> node node_modules/@deepseek-ai/dsh/lib/bin.js \
  --profile otg --port 3097 --no-open

# both: read the namespace listing, the directory, and the catalog
node scripts/compat-check.mjs --modules <dsh-install>/node_modules
```

### Limits of this section

- Two releases, both on Windows, both the `web` profile.
- The settings form was confirmed through its descriptor, not by clicking in the
  browser.
- Nothing in either table was taken from a paid completion.
- The `0.1.6` environment is `0.1.6-alpha.1` for `dsh` with `alpha.2` packages
  beneath it (and `dsh-app-boot` pinned to `alpha.1`). That is as close to a
  coherent `0.1.6` install as the published packages allow.
