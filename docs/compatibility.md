# Harness compatibility

This package is a compiled artefact: it ships `lib/` and no source tree, so it
cannot be re-versioned per release of the harness it runs under. It therefore
states the versions it supports in `peerDependencies` and, where a release
changed an interface it uses, adapts at run time by probing for the interface
rather than by trusting a version string.

Everything below was measured, not inferred. `docs/verification.md` records the
boot evidence; this document records the rules and the reasoning.

## Supported releases

`@deepseek-ai/dsh` and its packages are published as a lockstep train, and every
`@deepseek-ai/dsh*` peer of this package is declared as:

```
>=0.1.6-alpha.1 <0.2.0-0 || >=0.1.7-alpha.0 <0.2.0-0
```

| Release | Status | What differs |
|---|---|---|
| `0.1.5-rc.3` and earlier | **not supported** | `@deepseek-ai/dsh-llm` predates the route-side image-offload API (`requiredImageOffload`, `projectOffloadedImages`, `IMAGE_OFFLOAD_REQUIRED_CODE`); the peer range refuses it |
| `0.1.6-alpha.1`, `0.1.6-alpha.2` | supported; `alpha.1` is the baseline this fork was built against | **old settings model** (`settings.yaml` sections via `SettingsProvider.installSection`) |
| `0.1.7-alpha.1` … `0.1.7-rc.2` | supported; `rc.2` is the current desktop release | **new settings model** (`SettingsForms`, profile-entry config, volatile fields) |
| `0.2.0` and later | not claimed | the upper bound is `<0.2.0-0`, which also excludes `0.2.0` prereleases |

### Why the range has two terms

DSP's own launcher evaluates this field with
`semver.satisfies(runtimeVersion, range, { includePrerelease: true })`
(`@deepseek-ai/dsh-app-boot`, `evaluatePluginCompatibility`). Prereleases take
part in ranges there, so a single term would be enough for the launcher — but
plain semver, which npm and pnpm use for their own peer reporting, applies the
prerelease rule: a version carrying a prerelease tag satisfies a comparator set
only when some comparator in that set carries a prerelease **at the same
major.minor.patch**. Neither `>=0.1.6-alpha.1 <0.2.0` nor `*` matches
`0.1.7-rc.2` under that rule, so one term per release train is what keeps both
readers honest. `<0.2.0-0` is deliberate: it excludes `0.2.0-rc.1`, which
`<0.2.0` would admit once prereleases are allowed.

`@deepseek-ai/cordis`, `@deepseek-ai/schemastery` and `@deepseek-ai/dsh-brand`
are not range-checked by the launcher (`@deepseek-ai/dsh` or
`@deepseek-ai/dsh-*` only), so they carry ordinary ranges.

## The two settings models

The only interface this plugin uses that changed incompatibly across the
supported train is the settings service.

| | `dsh <= 0.1.6` | `dsh >= 0.1.7` |
|---|---|---|
| Service class | `SettingsProvider` | `SettingsForms` |
| Where a plugin's config lives | a section of `settings.yaml` | the loader entry's own `config` |
| Config key | the plugin's namespace | the **loader entry id** |
| Binding call | `settings.installSection(ctx, ns, Config, value, hooks)` | none — `apply(ctx, config)` already received it |
| Live edit | service hands back a new source through `setSource` | the loader mutates the `Volatile` refs in the resolved config in place and emits `loader/volatile-update` |
| Invalid edit | rejected by the section's `validate` hook | rejected by an `internal/config` listener |
| Rendered form | the section's own page | `SettingsForms.describe()`, which lists only entries whose schema has a **volatile** field |

`apply()` therefore attempts `installSection` first and falls back to
`settings.configure({ auto: true }, ctx.fiber)` — the call the harness's own
providers make — and logs a warning if a future release offers neither. Because
the second model keys config by loader entry id, this package's bundle entry is
`id: llm-opencode-go`: the same string as its settings namespace. That single
value is then correct under both models, and it is what makes the row in
**Settings → Models** resolve to this plugin's form.

### Live fields

`Config`'s fields are marked volatile, but only under the settings model that
reads such marks:

```js
var NEW_SETTINGS_MODEL = typeof dshSettings.SettingsForms === "function";
var live = (schema) => NEW_SETTINGS_MODEL && typeof schema.volatile === "function" ? schema.volatile() : schema;
```

The discriminator is the **settings module**, and getting that wrong is not
hypothetical — the first cut of this code probed `schema.volatile` instead, on
the reasoning that `volatile()` landed after the `3.18.2` that `0.1.6` asks for.
That reasoning is false: `0.1.6-alpha.2` and `0.1.7-rc.2` both resolve
`schemastery@3.18.4`, so the probe answers "yes" on a release that has never
heard of a volatile field. Marking fields there makes
`SettingsProvider.register()` reject the base it is handed —

```none
0 {"options":{"path":["enabled"]},"name":"ValidationError"}
```

— `installSection` never completes, and the plugin silently loses its settings
section while its route keeps working. `@deepseek-ai/dsh-settings` exports
`SettingsProvider` through `0.1.6` and `SettingsForms` from `0.1.7` on, which is
a fact about the release train rather than about a transitive dependency's
version.

Read the `SettingsForms` check as a namespace import, not a named one, for the
same reason `@deepseek-ai/dsh-llm` is read that way: a named import that does
not exist fails the module at *link* time, before any probe could run. Reading
`SettingsForms` as a property of the namespace costs nothing and cannot fail.

Under `0.1.7` the fields become `Volatile` refs, which is what makes
`describe()` render a form at all and what lets an accepted edit update the
running plugin instead of remounting it. Reading is symmetric: `current()`
projects every field through `.get()` where a ref is present, so the adapter
sees plain values on both models.

For the same reason `apply()` does **not** re-resolve the config it is handed.
The loader resolves it already, and on `0.1.7` a second `Config(raw)` fails
validation — `$.enabled expected boolean but got [object Object]` — because
schemastery validates the refs as values. An unresolved config (a launcher that
hands raw config straight through) is still resolved, so the module's own
defaults stay authoritative. The `internal/config` listener takes the same
care: it validates `Config(project(raw))`, so a bad edit is still rejected while
a ref-bearing node is not rejected for being one.

### `schemastery` is a peer, not a dependency

It was a dependency at an exact `3.18.2` pin. A dependency installs a *second*
copy beside the harness's, and which copy the plugin links against is then a
property of the package manager rather than of the running harness — the
capability probe above would report the copy's features, not the host's. As a
peer it resolves to the harness's own copy, so `volatile` genuinely means "this
release has the new settings model".

`@deepseek-ai/dsh-brand` stays a dependency: `brandString` is the identity
function, its own README declares independently installed copies
interchangeable, and the harness's own adapters depend on it the same way.
`@earendil-works/pi-ai` stays a dependency too, at the `^0.85.1` the harness
also asks for.

## What the API surface actually differs by

Measured by diffing the published packages at `0.1.6-alpha.1` and `0.1.7-rc.2`:

| Package | Difference |
|---|---|
| `dsh-llm` | `LlmRuntime` and `LlmAdapter` are **unchanged**. Additions only: `ACCOUNT_QUOTA_EXCEEDED_CODE`, `createDeveloperMessage`, `projectToolUpdates`, and an optional `toolUpdate` on prepared calls |
| `dsh-attachment`, `dsh-credentials`, `dsh-launch-environment`, `dsh-timeout` | byte-identical `lib/` |
| `dsh-typert-protocol` | additions only (`typertOwnedValue` and friends) |
| `dsh-settings` | `SettingsProvider` → `SettingsForms`; see above |
| `dsh-client-locale`, `dsh-api-remotes`, `dsh-client-ui-model-selection` (declared client injects) | present in both trains (`0.1.6-alpha.2` / `0.1.7-rc.2`) — not new in `0.1.7` |
| `dsh-client-store`, `dsh-client-ui-primitives`, `dsh-client-ui-slots` | published as **packages** only from `0.1.7`; see below |

The `toolUpdate` addition is a new conversation-shape feature with a
backwards-compatible default: an adapter that declares no mode receives
`withoutDeveloperMessages(messages)`, so the plugin's conversion layer never sees
`tool-addition` / `tool-removal` blocks and needs no change for it.

### Three client modules that look missing on `0.1.6` and are not

`lib/client.js` requires `@deepseek-ai/dsh-client-store` and
`@deepseek-ai/dsh-client-ui-primitives`. Neither is installed as a package in a
`0.1.6` tree, which reads like a broken client half. It is not: 45 of `0.1.6`'s
**own** `@deepseek-ai/dsh-client-*` packages `require()` the same two
specifiers, and the string `dsh-client-ui-primitives` is present in
`dsh-web-frontend`'s built asset. The browser's module registry supplies them;
`node_modules` never did. `lib/build-info.json` records them as
`clientExternals`, which is the authoritative list of what the bundle expects
the loader to provide — the same place `react` and `react/jsx-runtime` come
from.

So a check that resolves the client half's specifiers against `node_modules`
must not call these missing. `scripts/compat-check.mjs` classifies them as
`loader-provided` instead; see below.

## Runtime probes, and what each one costs

Guards are per capability, so an unfamiliar release loses one feature rather
than the plugin — and, where the harness loads plugins from a shared tree, one
entry rather than every entry in the profile.

| Probe | If absent |
|---|---|
| `typeof ctx.llm.registerModelDiscovery === "function"` | the Models page cannot interrogate the endpoint; the adapter still serves the catalog it resolves itself |
| `typeof ctx.llm.registerConfigurableProviders === "function"` | no row in Settings → Models; route and models unaffected |
| `registerConfigurableProviders` throws `DUPLICATE_DIRECTORY` | the pre-existing row stands; route and models unaffected |
| `typeof settings.installSection === "function"` | tries `settings.configure` (the `>= 0.1.7` model) |
| `typeof settings.configure === "function"` | tries `installSection` (the `<= 0.1.6` model); if neither exists, configuration still resolves from the entry and only an in-app editor is lost |
| `typeof requiredImageOffload === "function"` | the base64 image bound is not enforced — a harness without it has no route-side offload marks to enforce |
| `typeof projectOffloadedImages === "function"` | messages are sent as derived — the same reason |

Two of those deserve a note. The duplicate-directory case used to escape
`apply()` and skip every statement after it, leaving the plugin completely inert
rather than merely row-less; it is now caught. And the
`dsh-llm` image-offload trio is read off the module namespace rather than as
named imports, because a single missing named export makes an ES module fail to
*link* — the whole plugin dies at import time, before any probe could run.

## Re-verifying

`scripts/compat-check.mjs` (repository only; not part of the tarball) checks this
package's import surface against an installed harness tree:

```sh
node scripts/compat-check.mjs --modules <dsh-install>/node_modules
```

It extracts every static import from `lib/index.js` and every `require()` from
`lib/client.js`, resolves each module under the given tree, and reports names
that do not exist — the failure mode a probe cannot catch, because a probe only
runs after linking succeeds. It sorts what it finds into three outcomes, and
only two of them are failures:

| Outcome | Meaning |
|---|---|
| `ABSENT MODULE (host)` | a Node-resolved import `lib/index.js` makes that the tree does not provide. Real breakage, and it fails the run |
| `MISSING <name>` | the module resolves but does not export a name the plugin imports. Also breakage |
| `loader-provided` | a client-side specifier the browser registry supplies, not `node_modules` — `react`, and the `clientExternals` the build declared |

The separation is not cosmetic. Reporting the second class as missing is a false
positive on every tree that predates `dsh-client-store`'s publication, which is
every `0.1.6` tree; tightening the first class to a failure is what makes the
script catch a host-side import that would have killed the plugin at link time.

It reads comments out of the sources before matching. That is load-bearing, not
tidiness: a doc comment containing the words `import` and `from` otherwise makes
the statement regex match prose, and the script reports a phantom module built
from the next real `from "…"` in the file.

```sh
node scripts/compat-check.mjs --modules <dsh-install>/node_modules   # text
node scripts/compat-check.mjs --modules <dsh-install>/node_modules --json
```

The behavioural check is a boot in a scratch home, which is how the numbers in
`docs/verification.md` were taken.

## Known limits

- Only the `web` profile was booted, on both trains. `headless`, `tui`, `acp`
  and `sdk` share the same bundles and the same `apply()`, but they were not
  exercised.
- The Settings → Models row and its editor were verified through
  `ctx.settings.describe()` — the descriptor count, `autoGenerate`, and the
  resolved values — not through the browser UI.
- No paid completion was requested on any release; catalog resolution, route
  registration, discovery, the directory row and the settings registration were.
- `0.1.7-alpha.1`, `alpha.2` and `rc.1` are covered by the declared range and by
  the same interface diffs, but only `rc.2` was booted. Likewise `0.1.6` was
  booted at `alpha.1` with its own `alpha.2` packages installed beneath it.
- Windows only.
- `dsh@0.1.6-alpha.1` cannot be booted against the `dsh-app-boot@0.1.6-alpha.2`
  that its own `^0.1.6-alpha.1` range resolves to: its bundle imports
  `watchUserPatches` from that package, which does not export it. Pinning
  `dsh-app-boot` back to `alpha.1` is what makes a `0.1.6` boot possible at all,
  and it is a defect in the harness's own lockstep publish — not something this
  plugin can cause or fix.
