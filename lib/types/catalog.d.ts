/**
 * The OpenCode Go model catalog: a curated table intersected with the gateway's
 * live model list.
 *
 * The curated table is seeded from pi-ai's installed `opencode-go` catalog —
 * its entries carry the wire protocol, compat quirks, thinking-level spellings,
 * and capacities that the gateway's own listing endpoint does not disclose —
 * plus this package's additions for models the installed catalog has not
 * caught up with. The gateway rotates its list faster than either pi-ai or
 * this package releases, so the served catalog is the curated table **minus**
 * models the live listing no longer advertises: a model the gateway retired
 * must disappear rather than error mid-session.
 *
 * Live ids the curated table does not describe are auto-adapted when
 * auto-discovery is on: an id from a family the table knows (matched on the
 * normalized first token, so `qwen4-max` belongs to the `qwen3.x` family)
 * clones its best-scoring sibling — wire protocol, compat, thinking levels,
 * and capacities — so a brand-new variant is selectable the moment the
 * gateway serves it, without waiting for a catalog release. Cloned capacities
 * are the sibling's best estimate; a wrong protocol guess fails that one
 * model's requests, never the rest of the route. An id from a family the table
 * has never described has no sibling to clone, so it borrows from the whole
 * table instead — scored by token overlap, then majority protocol, then
 * id-length proximity. That is still an estimate, but one the user can see and
 * override, which an omission is not.
 *
 * The live listing at `{baseURL}/models` is public and answers ids only. A
 * fetch failure never takes the route down: the curated table is served as-is
 * and the failure is reported, on the grounds that a network blip should not
 * deny service, while model discovery — whose whole purpose is the live
 * answer — fails loud instead.
 *
 * @module dsh-llm-opencode-go/catalog
 */
import type { Api, Model, Provider } from '@earendil-works/pi-ai';
import type { LlmDiscoveredModel } from '@deepseek-ai/dsh-llm';
/** Provider route key this plugin registers and every materialized model carries. */
export declare const PROVIDER_ID = "opencode-go";
/**
 * The route claimed when another adapter already owns {@link PROVIDER_ID}.
 * `registerAdapter` is all-or-nothing, so without a fallback a duplicate would
 * withdraw this plugin's whole live catalog without a visible error.
 */
export declare const FALLBACK_PROVIDER_ID = "opencode-go-plus";
/** One model the installed pi-ai catalog has not caught up with, seeded from a sibling. */
export interface CatalogAddition {
    /** Model id as the gateway lists it. */
    readonly id: string;
    /** Curated model whose wire protocol and capacities this one clones. */
    readonly siblingId: string;
    /** Curated model whose input modalities this one inherits. */
    readonly inputSiblingId: string;
    /** Display name for selectors. */
    readonly name: string;
}
/** Additions this package seeds by default; the `catalogAdditions` setting overrides it. */
export declare const CATALOG_ADDITIONS: readonly CatalogAddition[];
/**
 * Keep only the additions that are fully spelled out. schemastery passes object
 * members through without validating them, so a partial entry would otherwise
 * seed a model with no wire protocol.
 * @param raw - the configured additions, of unproven shape.
 * @returns the usable additions, in configured order.
 */
export declare function usableAdditions(raw: unknown): readonly CatalogAddition[];
/** Display name for selectors and status labels. */
export declare const DISPLAY_NAME = "OpenCode Go";
/** Endpoint serving both model requests and the model listing. */
export declare const DEFAULT_BASE_URL = "https://opencode.ai/zen/go/v1";
/** One immutable resolution of the served catalog. */
export interface CatalogSnapshot {
    /** Served models by id: the curated table minus retired ids, plus adapted unknown ids. */
    readonly models: ReadonlyMap<string, Model<Api>>;
    /** The provider serving exactly these models. */
    readonly provider: Provider;
    /** Whether the live listing answered this resolution; `false` on the fallback path. */
    readonly live: boolean;
    /** When this resolution completed, for the refresh interval. */
    readonly fetchedAtMs: number;
}
/**
 * Read one live listing reply. The endpoint answers the standard OpenAI
 * `data` array with entries carrying ids only; anything else is a fault the
 * caller treats as "live unavailable" and falls back. An honest empty array
 * is a valid answer: the gateway says it serves nothing.
 * @param body - the decoded JSON reply.
 * @returns the non-empty ids it advertises, in reply order.
 * @throws {Error} when the reply carries no `data` array.
 */
export declare function readLiveModelIds(body: unknown): readonly string[];
/**
 * One resolution's arithmetic, the four numbers that answer "why is this model
 * missing" without reading the source.
 */
export interface CatalogResolution {
    /** Whether the live listing answered this resolution. */
    readonly live: boolean;
    /** Size of the curated table (installed pi-ai catalog plus usable additions). */
    readonly curated: number;
    /** How many ids the live listing carried; 0 on the fallback path. */
    readonly listed: number;
    /** Unknown live ids adapted onto the route. */
    readonly adapted: number;
    /** Live ids no candidate could describe; these are not selectable. */
    readonly omitted: number;
    /** Models actually served. */
    readonly served: number;
    /** Curated ids the endpoint no longer lists; these are withheld. */
    readonly missing: readonly string[];
}
/**
 * TTL-cached resolution of the served catalog. Concurrent callers share one
 * in-flight fetch; a completed snapshot serves unchanged until the refresh
 * interval elapses, so one stream call never observes two catalog generations.
 */
export declare class OpencodeGoCatalog {
    private readonly baseURL;
    private readonly refreshMs;
    private readonly onFallback;
    private readonly onOmitted;
    private readonly autoDiscover;
    private readonly onInferred;
    private readonly providerId;
    private readonly additions;
    private readonly onResolved;
    private served;
    private pending;
    /**
     * @param baseURL - The endpoint the gateway serves; also the listing base.
     * @param refreshMs - How long one live resolution stays authoritative.
     * @param onFallback - Observes a failed live listing and how many curated
     *   models kept serving because of it.
     * @param onOmitted - Observes live ids the catalog cannot route, neither
     *   curated nor adapted.
     * @param autoDiscover - Whether unknown live ids from known families are
     *   adapted onto the route; off restores omit-only behavior.
     * @param onInferred - Observes live ids adapted onto the route.
     * @param providerId - The route these models are served under; it must be
     *   the id the adapter registered, or the runtime rejects the catalog.
     * @param additions - Extra models to seed beyond the installed catalog.
     * @param onResolved - Observes one resolution's arithmetic.
     */
    constructor(baseURL: string, refreshMs: number, onFallback: (detail: {
        url: string;
        error: unknown;
        kept: number;
    }) => void, onOmitted: (ids: readonly string[]) => void, autoDiscover?: boolean, onInferred?: (ids: readonly string[]) => void, providerId?: string, additions?: readonly CatalogAddition[], onResolved?: (resolution: CatalogResolution) => void);
    /**
     * The current catalog, fetching when expired or never fetched.
     * @returns the snapshot now serving, shared by concurrent callers.
     */
    snapshot(): Promise<CatalogSnapshot>;
    /**
     * One resolution: intersect the curated table with the live listing, then
     * adapt the unknown live ids whose family carries evidence.
     */
    private build;
}
/**
 * Candidate models for the configuration surface's "fetch available models"
 * action: the same live intersection the route would serve, with the curated
 * capacities the listing endpoint does not disclose. Unlike route resolution,
 * discovery fails when the live listing is unreachable: its whole purpose is
 * the live answer, and a stale answer would offer models the gateway retired.
 * @param catalog - The route's catalog resolver.
 * @returns the served models in curated order.
 * @throws LlmError `DISCOVERY_FAILED` when the live listing is unreachable.
 */
export declare function discoverCatalogModels(catalog: OpencodeGoCatalog): Promise<readonly LlmDiscoveredModel[]>;
