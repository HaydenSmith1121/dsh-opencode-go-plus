# Third-party notices

## DeepSeek Harness

The adapter, the settings UI, and `src/conversion/{context,stream,replay}.ts` derive from DeepSeek Harness, copyright (c) 2026 DeepSeek, under the MIT license included in LICENSE. The conversion modules are maintained in this package because the published DSH pi-ai package does not export its conversion helpers. Wire protocol implementations remain supplied by `@earendil-works/pi-ai`.

## dsh-opencode-go

This package is a fork of [`Duskriver/dsh-opencode-go`](https://github.com/Duskriver/dsh-opencode-go) at version `0.1.2`, whose package shell, build configuration, tests, and `docs/` provided the extraction of the adapter above out of a DeepSeek Harness checkout. That work is MIT-licensed and its copyright remains with its author.

Upstream `0.1.2` already carried local modifications relative to the published npm release; this fork starts from the compiled `lib/` of the build distributed by `HaydenSmith1121/dsh-plugins`, so it inherits those as well.

## This fork

Changes made here are confined to `lib/index.js` and the type declarations that describe it. See `docs/derivation.md` for the complete list. Nothing in this file claims authorship of the upstream work; the fork's own changes are MIT-licensed like the rest.
