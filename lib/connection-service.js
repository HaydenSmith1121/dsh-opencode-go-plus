import { TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
import { connectionRemote } from './connection-contract.js';
import { createConnectionStatus } from './connection-status.js';
export class GoConnectionService extends TypertRemoteService {
  constructor(ctx, options) {
    super(ctx, 'opencodeGoConnection');
    this.connection = createConnectionStatus(options);
    ctx.inject(['typert'], scope => scope.effect(() => scope.typert.register({
      package: connectionRemote.package, face: 'host', schemas: [],
      model: { services: [], events: [], objects: [] }, invocations: connectionRemote.descriptors,
    })));
  }
  status() { return this.connection.status(); }
  refresh() { return this.connection.refresh(); }
}
