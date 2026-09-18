/**
 * Configuration schema for the OpenCode Go adapter plugin. The section is
 * installed under the `llm-opencode-go` settings namespace: a cordis.yml
 * entry supplies the composition base and the settings document overrides it
 * field by field, hot-reloaded without a restart. Self-contained constraints
 * (URL shape, numeric bounds) fail at load for the composition layer and
 * refuse the write for the settings layer.
 *
 * @module dsh-llm-opencode-go/config
 */
import z from '@deepseek-ai/schemastery';
import type { CatalogAddition } from './catalog.ts';
/** Environment variable resolving the OpenCode API key. */
export declare const DEFAULT_API_KEY_ENV = "OPENCODE_API_KEY";
/** Default interval between live catalog re-resolutions. */
export declare const DEFAULT_REFRESH_MINUTES = 5;
/** Default maximum idle interval while a stream read is outstanding. */
export declare const DEFAULT_STREAM_IDLE_TIMEOUT_MS = 300000;
/** Runtime configuration for one plugin mount. */
export interface OpencodeGoConfig {
    /**
     * Whether this adapter serves its route at all. False withdraws the
     * `opencode-go` route and its models from every picker without unloading the
     * plugin, so the settings page that owns this switch stays reachable to turn
     * it back on. Independent of the credential: a key present while this is
     * false registers nothing.
     */
    enabled: boolean;
    /** Credential reference: the environment variable the key resolves from. */
    apiKeyEnv: string;
    /** The gateway endpoint; also the base of the live model listing. */
    baseURL: string;
    /**
     * Whether live ids the curated table does not describe are adapted onto the
     * route by cloning their family's best sibling. False restores omit-only
     * behavior: unknown ids wait for a curated-table release.
     */
    autoDiscover: boolean;
    /** How long one live catalog resolution stays authoritative, in minutes. */
    refreshMinutes: number;
    /** Largest idle gap between stream events before the request fails. */
    streamIdleTimeoutMs: number;
    /** Request-level bound on base64-encoded image payload, in bytes. */
    maxRequestImageBytes: number;
    /** Total-pixel budget for one request image. */
    requestImagePixelBudget: number;
    /** Raw encoded-byte target for one request image before base64 expansion. */
    requestImageMaxBytes: number;
    /**
     * Models to seed beyond the installed pi-ai catalog, for ids that catalog
     * has not caught up with. Entries are validated where they are used rather
     * than by the schema — schemastery passes object members through — so a
     * partially spelled entry is ignored instead of seeding a model that names
     * no wire protocol. Defaults to this package's built-in additions.
     */
    catalogAdditions: readonly CatalogAddition[];
}
/** Runtime schema for {@link OpencodeGoConfig}. */
export declare const Config: z<OpencodeGoConfig>;
/**
 * Accept only an http(s) base without a query or fragment. Runs at load for
 * the composition layer and as the settings section's write validator, so a
 * bad URL fails where it is written, never at first request.
 * @param raw - the configured base URL.
 * @returns the normalized base URL without trailing slashes.
 */
export declare function assertBaseURL(raw: string): string;
