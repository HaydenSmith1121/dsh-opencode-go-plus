/**
 * The card's state machine: one operation at a time, a bounded wait, and a
 * retry that keeps asking until the first status lands.
 *
 * Every failure reachable here is recoverable — a launcher whose client
 * connection is not up yet, a gateway call that stalled, a credential store
 * that was busy — and none of them is the user's to diagnose. What is NOT
 * recoverable is giving up: a card that never reads a status holds its message
 * on "reading" (and, before this, disabled its input), which reads as "broken
 * plugin" and leaves nothing to click. So a read that fails before any status
 * has arrived is retried with backoff, and the wait is bounded so a stalled
 * call surfaces as a failure instead of an eternal spinner.
 */

/** How long one Host round trip may take before the card calls it stalled. */
const READ_TIMEOUT_MS = 15e3;
/** First retry delay; doubles per consecutive failure. */
const RETRY_BASE_MS = 2e3;
/** Ceiling for the doubling retry delay. */
const RETRY_MAX_MS = 3e4;

/**
 * Schedule one retry. Node keeps a process alive for a pending timer and a
 * browser does not, and a retry is never worth pinning a Node host open — the
 * test suite imports this class — so let a Node timer drop out of the loop.
 * @param callback - work to run when the delay elapses.
 * @param delay - milliseconds to wait.
 * @returns the timer handle, for `clearTimeout`.
 */
function later(callback, delay) {
  const handle = setTimeout(callback, delay);
  if (handle !== null && typeof handle === 'object' && typeof handle.unref === 'function') handle.unref();
  return handle;
}

/**
 * Reject when `promise` has produced nothing after `ms`, leaving the original
 * promise running: a Host call cannot be aborted through this contract, and a
 * late answer is discarded by the caller's generation check anyway. This timer
 * is deliberately never unref'd — it is the only thing that turns a stalled
 * call into a visible failure, so it has to be able to fire on its own.
 * @param promise - the in-flight Host call.
 * @param ms - the wait budget.
 * @returns the call's value, or a rejection once the budget elapses.
 */
function within(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms);
    Promise.resolve(promise).then((value) => { clearTimeout(timer); resolve(value); }, (error) => { clearTimeout(timer); reject(error); });
  });
}

export class ConnectionController {
  constructor(actions, options = {}) {
    this.actions = actions;
    this.readTimeoutMs = options.readTimeoutMs ?? READ_TIMEOUT_MS;
    this.retryBaseMs = options.retryBaseMs ?? RETRY_BASE_MS;
    this.retryMaxMs = options.retryMaxMs ?? RETRY_MAX_MS;
    this.state = { status: null, busy: "", error: "", saved: false };
    this.listeners = new Set();
    this.generation = 0;
    this.disposed = false;
    this.attempts = 0;
    this.timer = void 0;
  }

  subscribe = (listener) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };

  getSnapshot = () => this.state;

  publish(patch) {
    if (this.disposed) return;
    this.state = { ...this.state, ...patch };
    for (const listener of this.listeners) listener();
  }

  /**
   * Book the next attempt, doubling the delay up to the ceiling. Only one timer
   * is ever pending: a failure while a retry is already booked is the same
   * failure, and the pending retry will carry the newer state anyway.
   */
  schedule() {
    if (this.disposed || this.timer !== void 0) return;
    const delay = Math.min(this.retryBaseMs * 2 ** this.attempts, this.retryMaxMs);
    this.attempts += 1;
    this.timer = later(() => {
      this.timer = void 0;
      if (this.disposed) return;
      // Something else is mid-flight; that operation reports its own outcome, so
      // the chain continues rather than being left without a next step.
      if (this.state.busy) { this.schedule(); return; }
      void this.run("read");
    }, delay);
  }

  cancel() {
    if (this.timer === void 0) return;
    clearTimeout(this.timer);
    this.timer = void 0;
  }

  /**
   * Run one read, refresh or save.
   *
   * The status already held is never dropped: a failed refresh must not take
   * away the last fact the card knew, and the input it gates stays usable.
   * @param kind - `read` (local metadata), `refresh` (verify upstream) or `save`.
   * @param key - the staged credential literal, for `save`.
   * @returns whether a credential was written.
   */
  async run(kind, key) {
    if (this.disposed || this.state.busy) return false;
    const generation = ++this.generation;
    this.publish({ busy: kind, error: "", saved: false });
    let saved = false;
    try {
      if (kind === "save") {
        const value = key.trim();
        if (!/^[\x21-\x7e]+$/.test(value)) throw new Error("invalid-key");
        // Re-read the effective reference before a write; never invent a key name.
        const current = await within(this.actions.status(), this.readTimeoutMs);
        if (generation === this.generation) this.publish({ status: current });
        if (!current.writable) throw new Error("read-only");
        await within(this.actions.set(current.ref, value), this.readTimeoutMs);
        saved = true;
        this.publish({ saved: true });
      }
      const status = await within(kind === "read" ? this.actions.status() : this.actions.refresh(), this.readTimeoutMs);
      if (generation !== this.generation) return saved;
      // The card is healthy again: stop retrying and drop the failure line.
      this.attempts = 0;
      this.cancel();
      this.publish({ status, error: "" });
      return saved;
    } catch (error) {
      if (generation === this.generation) {
        this.publish({ error: ["invalid-key", "read-only"].includes(error.message) ? error.message : saved ? "saved-refresh-failed" : kind === "save" ? "save-failed" : "refresh-failed" });
        // Only the no-status-yet case is retried: a card that already knows its
        // state has a visible failure and a manual control, and a host that is
        // down should not be polled forever on its behalf.
        if (this.state.status === null && !["invalid-key", "read-only"].includes(error.message)) this.schedule();
      }
      return saved;
    } finally {
      if (generation === this.generation) this.publish({ busy: "" });
    }
  }

  activate() { this.disposed = false; ++this.generation; this.attempts = 0; this.cancel(); this.publish({ busy: "" }); }
  read = () => this.run("read");
  refresh = () => this.run("refresh");
  save = (key) => this.run("save", key);
  dispose() { this.disposed = true; ++this.generation; this.cancel(); this.listeners.clear(); }
}
