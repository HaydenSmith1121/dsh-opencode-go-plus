# Third-party notices

## DeepSeek Harness

The adapter, the settings UI, and `src/conversion/{context,stream,replay}.ts` derive from DeepSeek Harness, copyright (c) 2026 DeepSeek, under the MIT license included in LICENSE. The conversion modules are maintained in this package because the published DSH pi-ai package does not export its conversion helpers. Wire protocol implementations are bundled from `@earendil-works/pi-ai@0.85.1`; see the vendored runtime notice below.

## dsh-opencode-go

This package is a fork of [`Duskriver/dsh-opencode-go`](https://github.com/Duskriver/dsh-opencode-go) at version `0.1.2`, whose package shell, build configuration, tests, and `docs/` provided the extraction of the adapter above out of a DeepSeek Harness checkout. That work is MIT-licensed and its copyright remains with its author.

Upstream `0.1.2` already carried local modifications relative to the published npm release; this fork starts from the compiled `lib/` of the build distributed by `HaydenSmith1121/dsh-plugins`, so it inherits those as well.

## This fork

Changes made here include `lib/index.js`, its type declarations, and the vendored runtime added in 0.4.1. See `docs/derivation.md` for the complete list. Nothing in this file claims authorship of the upstream work; the fork's own changes are MIT-licensed like the rest.

## Vendored runtime (0.4.1)

`lib/vendor/pi-ai.js` contains the OpenCode Go catalog and the three protocol implementations
used by this plugin, together with their runtime dependencies. It does not include the
Google, Protobuf, or Bedrock runtimes. Exact versions and build inputs are recorded in
`lib/vendor/pi-ai.build.json`; complete license texts are in `lib/vendor/pi-ai.LICENSES.txt`.
The pi-ai license is from the upstream v0.85.1 tag; the Standard Webhooks repository license
is from https://github.com/standard-webhooks/standard-webhooks/blob/b4d2c14fc5b4ccff3ff271e3b087dff812254c59/LICENSE
(the gitHead reported for 1.1.1). Its npm manifest declares MIT, while that repository
provides Apache-2.0; the upstream text is reproduced unchanged and this discrepancy
is recorded in the generated notices.
Reproduction instructions: `docs/vendored-runtime.md`.
