// Shared, secret-free wire contract for the Models card.
const states = new Set(['missing', 'configured', 'ready', 'unauthorized', 'forbidden', 'limited', 'unavailable', 'models-unavailable']);
/** A non-negative finite count, or zero when the field is absent or unusable. */
const count = (value) => Number.isFinite(value) && value >= 0 ? value : 0;
/**
 * Project a wire status onto exactly the fields the card reads.
 *
 * `connection` is this package's own enum and stays strict: a state nobody
 * publishes means the two halves disagree about the contract, and that is worth
 * failing on. Every other field is defaulted instead, because a strict read
 * here has only one possible outcome — a card that renders nothing — and no
 * field it drops is worth that: an unreadable `writable` disables the very
 * input the card exists for, and an unreadable `route` hides nothing the user
 * acts on. Unknown fields are dropped, so a Host that grows a secret-bearing
 * field cannot leak it through this projection.
 * @param value - the decoded Host status value.
 * @returns the card's status.
 * @throws when the value is not an object or names an unknown connection state.
 */
export function parseConnectionStatus(value) {
  if (!value || typeof value !== 'object' || !states.has(value.connection)) throw new Error('Invalid connection status');
  return {
    configured: value.configured === true,
    writable: value.writable !== false,
    enabled: value.enabled !== false,
    ref: typeof value.ref === 'string' ? value.ref : '',
    route: typeof value.route === 'string' ? value.route : '',
    connection: value.connection,
    modelCount: count(value.modelCount),
    checkedAt: count(value.checkedAt),
    httpStatus: count(value.httpStatus),
  };
}
const codec = { mode: 'strict', typeSymbol: 'dsh-opencode-go-plus-connection#ConnectionStatus', schema: { parse: parseConnectionStatus }, create: () => ({ parse: parseConnectionStatus }) };
export const connectionRemote = {
  package: 'dsh-opencode-go-plus-connection',
  descriptors: ['status', 'refresh'].map(method => ({
    id: `dsh-opencode-go-plus-connection#opencodeGoConnection/${method}`,
    service: 'opencodeGoConnection', namespace: 'opencodeGoConnection', method,
    invocation: { kind: 'direct' }, parameters: [], result: codec,
  })),
};
