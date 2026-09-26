# Vendored OpenCode Go runtime

From 0.4.1, installation uses checked-in JavaScript in `lib/vendor/pi-ai.js`.
The plugin does not need a prepare/postinstall script or a pnpm allowBuilds entry.
`@earendil-works/pi-ai` is an optional peer only for the existing public TypeScript
declarations; developers consuming those types must provide it themselves. Harness
uses `autoInstallPeers: false`, and optional peers are not automatically installed
by npm/pnpm. All runtime imports use the local bundle.

## Rebuild (maintainers only)

```sh
npm ci --prefix scripts/vendor --ignore-scripts
node scripts/vendor/build.mjs
node --test scripts/runtime-test.mjs
```

The independent `scripts/vendor/package-lock.json` pins build inputs. The tools and
full upstream SDK dependencies stay in that maintenance directory and are excluded
from the published plugin by the root `files` allowlist. Nothing runs on installation.
Review and commit the generated files after rebuilding; do not edit them by hand.
To update pi-ai, change its exact version in the maintenance manifest and regenerate
the lock, runtime, build inventory, and license notices. Update its optional type
peer range and upstream license snapshot at the same time.

The entry selects only the OpenCode Go catalog and the OpenAI Completions, OpenAI
Responses, and Anthropic Messages implementations. The SDKs are bundled too, so
installing this plugin cannot transitively install Google/Protobuf. The generator
rejects builds containing Google, Protobuf, or AWS runtime inputs, and fails if a
bundled package lacks a license. Two upstream npm packages omit their license;
reviewed upstream snapshots are stored next to the builder. A Node createRequire
shim supports CommonJS code in the ESM bundle. Lazy protocol initialization remains
inside the bundle, with no loose runtime chunks.

## Validation

The offline test serves local SSE fixtures for all three protocols and verifies the
catalog and production manifest. To also test plugin loading and model discovery,
set `HARNESS_TEST_MODULES` to a Harness installation's `node_modules`. Optionally set
`PLUGIN_TEST_ROOT` to an unpacked/installed plugin to test the packaged artifact.

```sh
node scripts/compat-check.mjs --modules /path/to/harness/node_modules
node --test scripts/runtime-test.mjs
```

For install checks, use a fresh directory with the desktop profile's settings:

```yaml
packages:
  - .
nodeLinker: hoisted
autoInstallPeers: false
strictDepBuilds: true
```

Pack the repository and install that tarball with the desktop's pnpm. No ignore-scripts
or allowBuilds override should be necessary. Check the resulting dependency tree for
absence of pi-ai, @google/genai and protobufjs. Peer warnings outside a Harness
installation are expected; the host supplies the @deepseek-ai peers.

Verified against the local desktop 0.1.7-rc.2 runtime with pnpm 11.7.0: import audit,
all six regression checks, and fresh strict installation. This does not exercise a
paid live gateway call or the desktop UI install workflow itself.
