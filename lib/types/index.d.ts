/**
 * Dedicated OpenCode Go adapter plugin. Registers one `opencode-go` route
 * whose catalog is the curated table intersected with the gateway's live model
 * listing — plus, when auto-discovery is on, unknown live ids adapted from
 * their family's closest sibling, so a new variant is selectable the moment
 * the gateway serves it — and installs the `llm-opencode-go` settings section:
 * the Web UI renders it as its own settings page where the API key and every
 * knob are edited, and a change reaches the next request without a restart.
 * The plugin exists because the gateway has wire requirements a generic pi-ai
 * route cannot express: a mandatory per-conversation `x-opencode-session`
 * routing header and a model list that rotates faster than any shipped
 * catalog.
 *
 * Configuration layers like every settings-backed plugin: a `cordis.yml`
 * entry supplies the composition base and the settings document overrides it
 * field by field.
 *
 * ```yaml
 * - id: llm-opencode-go
 *   name: 'dsh-opencode-go-plus'
 *   config:
 *     enabled: true                     # false withdraws the route; the plugin stays mounted
 *     apiKeyEnv: OPENCODE_API_KEY       # default
 *     baseURL: https://opencode.ai/zen/go/v1   # default
 *     autoDiscover: true                # adapt unknown live ids from their family's sibling
 *     refreshMinutes: 5                 # live catalog re-resolution interval
 *     catalogAdditions: [...]           # extra models to seed beyond the installed catalog
 * ```
 *
 * The credential resolves per request through the credentials seam, falling
 * back to the process environment — the same reference semantics the generic
 * pi-ai adapter uses. The route registers atomically: if another adapter
 * family already owns `opencode-go` (a profile in `llm-pi-ai`, for example),
 * this plugin claims `opencode-go-plus` instead and warns with the remedy, so
 * its live catalog stays reachable instead of being withdrawn.
 *
 * @module dsh-opencode-go-plus
 */
import type { Context } from '@deepseek-ai/cordis';
import type { OpencodeGoConfig } from './config.ts';
export { OpencodeGoAdapter } from './adapter.ts';
export type { OpencodeGoAdapterOptions, OpencodeGoImageAccess } from './adapter.ts';
export { CATALOG_ADDITIONS, DEFAULT_BASE_URL, DISPLAY_NAME, FALLBACK_PROVIDER_ID, PROVIDER_ID, OpencodeGoCatalog, discoverCatalogModels, readLiveModelIds, usableAdditions, } from './catalog.ts';
export type { CatalogAddition, CatalogResolution } from './catalog.ts';
export { Config, assertBaseURL } from './config.ts';
export type { OpencodeGoConfig } from './config.ts';
export declare const name = "llm-opencode-go";
export declare const inject: string[];
/** Settings namespace this plugin installs and the Web page edits. */
export declare const NS = "llm-opencode-go";
/**
 * Register the route, its discovery, the settings section, and their
 * teardown for one mount. Configuration starts as the cordis.yml entry and is
 * replaced by the settings section's resolved value once the settings
 * provider attaches; the adapter re-reads it at every operation.
 */
export declare function apply(ctx: Context, raw?: OpencodeGoConfig): void;
