// Shared, secret-free wire contract for the Models card.
const states = new Set(['missing', 'configured', 'ready', 'unauthorized', 'forbidden', 'limited', 'unavailable', 'models-unavailable']);
export function parseConnectionStatus(value) {
  if (!value || typeof value !== 'object' || !states.has(value.connection)) throw new Error('Invalid connection status');
  for (const name of ['configured', 'writable', 'enabled']) if (typeof value[name] !== 'boolean') throw new Error('Invalid connection status');
  for (const name of ['ref', 'route']) if (typeof value[name] !== 'string') throw new Error('Invalid connection status');
  for (const name of ['modelCount', 'checkedAt', 'httpStatus']) if (!Number.isFinite(value[name]) || value[name] < 0) throw new Error('Invalid connection status');
  return Object.fromEntries(['configured', 'writable', 'enabled', 'ref', 'route', 'connection', 'modelCount', 'checkedAt', 'httpStatus'].map(name => [name, value[name]]));
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
