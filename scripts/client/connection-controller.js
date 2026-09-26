export class ConnectionController {
  constructor(actions) {
    this.actions = actions;
    this.state = { status: null, busy: '', error: '', saved: false };
    this.listeners = new Set();
    this.generation = 0;
    this.disposed = false;
  }
  subscribe = (listener) => { this.listeners.add(listener); return () => this.listeners.delete(listener); };
  getSnapshot = () => this.state;
  publish(patch) {
    if (this.disposed) return;
    this.state = { ...this.state, ...patch };
    for (const listener of this.listeners) listener();
  }
  async run(kind, key) {
    if (this.disposed || this.state.busy) return false;
    const generation = ++this.generation;
    this.publish({ busy: kind, error: '', saved: false });
    let saved = false;
    try {
      if (kind === 'save') {
        const value = key.trim();
        if (!/^[\x21-\x7e]+$/.test(value)) throw new Error('invalid-key');
        // Re-read the effective reference before a write; never invent a key name.
        const current = await this.actions.status();
        if (!current.writable) throw new Error('read-only');
        await this.actions.set(current.ref, value);
        saved = true;
        this.publish({ saved: true });
      }
      const status = await (kind === 'read' ? this.actions.status() : this.actions.refresh());
      if (generation === this.generation) this.publish({ status });
      return saved;
    } catch (error) {
      if (generation === this.generation) this.publish({ error: ['invalid-key','read-only'].includes(error.message) ? error.message : saved ? 'saved-refresh-failed' : kind === 'save' ? 'save-failed' : 'refresh-failed' });
      return saved;
    } finally {
      if (generation === this.generation) this.publish({ busy: '' });
    }
  }
  activate() { this.disposed = false; ++this.generation; this.publish({ busy: "" }); }
  read = () => this.run('read');
  refresh = () => this.run('refresh');
  save = (key) => this.run('save', key);
  dispose() { this.disposed = true; ++this.generation; this.listeners.clear(); }
}
