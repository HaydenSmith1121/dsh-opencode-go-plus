/**
 * The Host half of the Models card: two reads over no secrets.
 *
 * The credential store is the one dependency this package does not own —
 * another provider answers `describe` — so a store that is slow, busy or
 * momentarily broken is reported as "nothing stored, still writable" rather
 * than as a failed RPC. That reading is the safe one: it hands the card a state
 * the user can act on, and the write path still refuses a read-only reference,
 * so a wrong guess costs one visible failure instead of an unusable card.
 * @param options - config/describe/route readers plus the refresh closure.
 * @returns the `status` and `refresh` operations the remote invokes.
 */
export function createConnectionStatus(options) {
  let pending;

  /**
   * Read one reference's availability, never throwing.
   * @param ref - the credential reference to describe.
   * @returns whether a key is stored, and whether this surface may replace it.
   */
  async function describe(ref) {
    try {
      const info = await options.describe(ref);
      return { configured: info?.configured === true, writable: info?.writable !== false };
    } catch {
      return { configured: false, writable: true };
    }
  }

  /** Local facts only: no upstream request, and never a credential value. */
  async function status() {
    const config = options.config();
    const info = await describe(config.apiKeyEnv);
    return {
      configured: info.configured, writable: info.writable, enabled: config.enabled,
      ref: config.apiKeyEnv, route: options.route() ?? '',
      connection: info.configured ? 'configured' : 'missing',
      modelCount: 0, checkedAt: 0, httpStatus: 0,
    };
  }

  async function check() {
    await options.syncRoute();
    const result = await status();
    if (!result.configured) return result;
    const config = options.config();
    if (config.apiKeyEnv !== result.ref) return status();
    try {
      const key = await options.resolveApiKey();
      const response = await (options.fetch ?? fetch)(`${config.baseURL.replace(/\/+$/, '')}/usage`, {
        headers: { ...options.headers(), Authorization: `Bearer ${key}`, Accept: 'application/json' },
        signal: AbortSignal.timeout(10000), redirect: 'error',
      });
      result.checkedAt = Date.now();
      result.httpStatus = response.status;
      if (!response.ok) {
        await response.body?.cancel();
        result.connection = response.status === 401 ? 'unauthorized' : response.status === 403 ? 'forbidden' : response.status === 429 ? 'limited' : 'unavailable';
      } else {
        options.parseUsage((await response.json())?.usage);
        const snapshot = await options.refreshModels();
        result.modelCount = snapshot.models.size;
        result.connection = snapshot.live ? 'ready' : 'models-unavailable';
      }
    } catch {
      result.checkedAt = Date.now();
      result.connection = 'unavailable';
    }
    // A response for an old key/config must never claim that the new key is valid.
    const latest = options.config();
    if (latest.apiKeyEnv !== config.apiKeyEnv || latest.baseURL !== config.baseURL || options.revision?.() !== revision) return status();
    result.route = options.route() ?? '';
    result.enabled = latest.enabled;
    return result;
  }

  let revision;
  return { status, refresh() {
    if (!pending) {
      revision = options.revision?.();
      pending = check().finally(() => { pending = undefined; });
    }
    return pending;
  } };
}
