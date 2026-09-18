# Derivation of this package

This package is a maintained fork of `dsh-opencode-go`, redistributed here so the
upstream's silent model-loss paths are fixed and so a collision with the
baseline can no longer take down the whole plugin tree. It is not a rewrite: the
wire protocol work, the settings UI, and the conversion modules are unchanged.

## Provenance

| Layer | Origin | License |
|---|---|---|
| Adapter, settings UI, `src/conversion/{context,stream,replay}.ts` | [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) | MIT |
| Package shell, build, tests, `docs/`, `examples/` | [`Duskriver/dsh-opencode-go`](https://github.com/Duskriver/dsh-opencode-go) | MIT |
| This fork's host-side fixes | This repository | MIT |

`dsh-opencode-go@0.1.2` is the baseline. That version is itself a fork of the
user's working copy of DeepSeek Harness on branch `oh-my-dsh`
(HEAD `2c8555b323f3b49eac743bafd527f9f3238bf548`); see the upstream's
`docs/independent-package.md` for how that extraction was done.

## What this fork changes

Exactly two artefacts carry code differences: `lib/index.js` (the five changes
below) and the three type declarations that describe the surface those changes
add — `lib/types/catalog.d.ts`, `lib/types/config.d.ts`, `lib/types/index.d.ts`.
Everything else is byte-identical to the baseline: `lib/client.js`, the other
`lib/types/**` modules, the bundle manifest (`cordis.patch.yml` apart from the
entry id), and the client manifest inside `package.json`.

### Guarding the second all-or-nothing registration

Upstream guarded `registerAdapter()` and missed the other registration that is
just as unconditional: `ctx.llm.registerModelDiscovery(settingsNs, discover)`,
keyed by the settings namespace, which throws `DUPLICATE_DISCOVERY`. This
package keeps the baseline's namespace on purpose, so installing both makes the
second one throw — from inside the loader's own effect, uncaught, which fails
the entire plugin tree rather than just that entry. Measured: with this package
first and the baseline second, `dsh web` exits 1 and every unrelated plugin in
the profile goes down with it.

The registration now happens before any route is claimed, inside a try/catch
that recognises only the duplicate, logs the remedy, and returns from `apply()`
— leaving the plugin inert (no route, no settings section) instead of taking the
tree down. Any other failure is rethrown. The discovery handler also compares
against `adapter.route` rather than `PROVIDER_ID`, so it stays correct when the
route fallback is in play.

### `FALLBACK_PROVIDER_ID`

`registerAdapter()` rejects any route another adapter already holds, with
`DUPLICATE_ADAPTER`, all-or-nothing. Upstream caught that and stopped, which
withdrew the entire dynamic catalog; the usual occupier is a model list that
dsh materialized into `settings.yaml` under `llm-pi-ai.providers.opencode-go`,
and such a list cannot grow, so newly published models never appear.

The fork retries under `opencode-go-plus` and warns with the exact remedy. The
route id is threaded through `curatedModels`, `adaptModelFromFamily`,
`buildProvider`, and `OpencodeGoCatalog` because the runtime rejects a catalog
whose entries name a provider other than the one registered
(`INVALID_CATALOG`); `OpencodeGoAdapter.route` is set before each registration
attempt for the same reason.

### Borrowed adaptation for unseen families

`adaptModelFromFamily()` required a same-family curated model to clone from and
returned `undefined` otherwise. A brand-new family therefore never reached the
picker. The fork falls back to the whole curated table, scoring by token
overlap, then majority protocol, then id-length proximity. `/models` returns
only `id`/`object`/`created`/`owned_by`, so the parameters remain estimates —
but an estimate the user can override beats an omission they cannot see.

### Self-check logging

`OpencodeGoCatalog` gained an `onResolved` observer reporting
`curated` / `listed` / `adapted` / `omitted` / `served` / `missing` per
resolution. `omitted` and `missing` are warnings, because both mean a model the
user might expect is absent.

### `catalogAdditions` setting

The hardcoded `CATALOG_ADDITIONS` constant became the default value of a
`schemastery` array field. schemastery passes object members through without
validating them, so `usableAdditions()` filters entries at use: a partially
spelled entry would otherwise seed a model with no wire protocol.

### 0.3.0 — the settings surface moved into Settings → Models

Through 0.2.1 this package registered a settings section of its own
(`settings.section`, id `opencode-go`), which put a second OpenCode Go entry in
the Settings sidebar next to the provider row the Models page already drew from
`llm-pi-ai`'s directory. 0.3.0 removes that section and gives the route a row
on the Models page that belongs to this package:

- **Host half (`lib/index.js`)** — `apply()` now calls
  `ctx.llm.registerConfigurableProviders([...])` for the route, with the
  `llm-opencode-go` namespace and an EMPTY `settingsPath` (the section root is
  the profile). This is what makes the Models page treat the row as configured
  and addressable.
- **Client half (`lib/client.js`)** — the `settings.section` registration, the
  settings scope that fed it, and the credential-invalidation effect that kept
  its badge fresh were deleted. The composer's usage pill is untouched and still
  registers into `conversation.input.right`.
- **Manifest (`package.json`)** — `dsh.client.inject` no longer lists
  `@deepseek-ai/dsh-client-ui-settings`, and that package is no longer a peer:
  nothing in this bundle reads the settings scope service any more.

#### Why the row's provider is `opencode-go-plus`, not `opencode-go`

`registerConfigurableProviders` rejects a second declaration of the same
provider, and `opencode-go` is **already declared** by
`@deepseek-ai/dsh-llm-pi-ai`, whose installed pi-ai catalog ships a route by
that name. Measured here: pi-ai's directory lists `opencode-go` with
`declared: false` before this package is loaded at all. Declaring it here does
not merely lose the row — the throw is `DUPLICATE_DIRECTORY`, it comes out of
`apply()`, and every statement after it never runs, so the route is never
claimed either and the plugin goes completely inert. The fallback id
`opencode-go-plus` is free in that directory, and it is also the route this
package actually serves whenever `opencode-go` was taken — the normal state on
any installation that also runs the pi-ai catalog.

#### What the row does and does not offer

The row shows the display name, the route, and the page's credential dot. Its
edit card offers the generic credential field: because the Models editor selects
its curated field set by settings namespace and knows only `llm-deepseek` and
`llm-pi-ai`, the card for `llm-opencode-go` states that the remaining fields live
in `settings.yaml`. That is deliberate — `refreshMinutes`, `autoDiscover`, the
image budgets, and `catalogAdditions` stay in `settings.yaml`, which the row
reports instead of half-editing. The row resolves its credential reference from
the section (`apiKeyEnv`), so its dot reports the key the plugin actually uses.

## What is intentionally unchanged

- Settings namespace stays `llm-opencode-go`, so existing configuration keeps working.
  The cost of that choice is that the baseline cannot share a profile with this
  package; see `examples/migrate-from-fork.patch.yml` for the measured outcomes.
- The only new setting key is `catalogAdditions`.
- Request headers, replay behaviour, image handling, and usage reporting are untouched.

## Verifying a rebuild

The tarball ships the compiled `lib/` only; no source tree is included, so there
is no build step. To check a package against the baseline:

```sh
mkdir -p /tmp/base && tar -xzf dsh-opencode-go-0.1.2.tgz -C /tmp/base
diff -rq /tmp/base/package/lib ./lib
```

Five paths should differ, and nothing should be reported as "Only in" — an extra
module means the build leaked a private file:

```none
lib/index.js                # the host-side changes above
lib/client.js               # 0.3.0: the settings section registration removed
lib/types/catalog.d.ts      # declarations for FALLBACK_PROVIDER_ID / onResolved
lib/types/config.d.ts       # declaration for the catalogAdditions setting
lib/types/index.d.ts        # re-exports of the above
```

From 0.2.1 to 0.3.0 the set is smaller and easier to audit: only three paths
change — `package.json` (version, description, client inject list, dropped peer),
`lib/index.js` (the configurable-provider declaration), and `lib/client.js` (the
section registration and its scope/section-controller wiring removed). Every
declaration under `lib/types/**` is unchanged, including the ones that still
describe the section: they are additive type surface, not shipped behaviour.
