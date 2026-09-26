import test from 'node:test';
import assert from 'node:assert/strict';
import { createConnectionStatus } from '../lib/connection-status.js';
import { parseConnectionStatus, connectionRemote } from '../lib/connection-contract.js';
import { ConnectionController } from './client/connection-controller.js';
const base = { configured:true,writable:true,enabled:true,ref:'MY_GO_KEY',route:'opencode-go-plus',connection:'configured',modelCount:0,checkedAt:0,httpStatus:0 };
function setup(overrides={}) {
  let count=0;
  const options={config:()=>({apiKeyEnv:'MY_GO_KEY',baseURL:'https://example.invalid/v1',enabled:true}),describe:async()=>({configured:true,writable:true}),resolveApiKey:async()=>'secret-test-key',syncRoute:async()=>{},route:()=>base.route,headers:()=>({}),parseUsage:value=>assert.ok(value),refreshModels:async()=>({live:true,models:new Map([['test',{}]])}),fetch:async()=>{++count;return new Response(JSON.stringify({usage:{ok:true}}),{status:200});},...overrides};
  return {service:createConnectionStatus(options),requests:()=>count};
}
test('opening the card reads local metadata only and returns no key',async()=>{
  const {service,requests}=setup();
  assert.deepEqual(await service.status(),base);
  assert.equal(requests(),0);
});
test('missing key does not issue an authenticated request',async()=>{
  const {service,requests}=setup({describe:async()=>({configured:false,writable:true})});
  assert.equal((await service.refresh()).connection,'missing');assert.equal(requests(),0);
});
for (const [status,connection] of [[401,'unauthorized'],[403,'forbidden'],[429,'limited'],[500,'unavailable']]) test(`HTTP ${status} is reported without upstream content`,async()=>{
  const {service}=setup({fetch:async()=>new Response('secret-test-key',{status})});
  const result=await service.refresh();assert.equal(result.connection,connection);assert.equal(result.httpStatus,status);
  assert.ok(!JSON.stringify(result).includes('secret-test-key'));
});
test('successful refresh rechecks auth and forces fresh model discovery',async()=>{
  let models=0;
  const {service,requests}=setup({refreshModels:async()=>{++models;return {live:true,models:new Map([['a',{}],['b',{}]])};}});
  const first=service.refresh();assert.equal(first,service.refresh());
  assert.equal((await first).connection,'ready');assert.equal(models,1);
  assert.equal((await service.refresh()).modelCount,2);assert.equal(requests(),2);assert.equal(models,2);
});
test('network errors and invalid usage payloads never masquerade as authentication success',async()=>{
  const network=setup({fetch:async()=>{throw new Error('secret-test-key');}});
  assert.equal((await network.service.refresh()).connection,'unavailable');
  const invalid=setup({parseUsage:()=>{throw new Error('bad JSON');}});
  assert.equal((await invalid.service.refresh()).connection,'unavailable');
});
test('auth success with model fallback is distinguished from a fresh live catalog',async()=>{
  const {service}=setup({refreshModels:async()=>({live:false,models:new Map([['a',{}]])})});
  assert.equal((await service.refresh()).connection,'models-unavailable');
});
test('changing a credential while checking discards the old authentication result',async()=>{
  let revision=0;
  const {service}=setup({revision:()=>revision,fetch:async()=>{revision++;return new Response(JSON.stringify({usage:{ok:true}}),{status:200});}});
  assert.equal((await service.refresh()).connection,'configured');
});
test('wire codec strips unexpected secret fields and rejects unknown states',()=>{
  assert.deepEqual(parseConnectionStatus({...base,apiKey:'do-not-return'}),base);
  assert.throws(()=>parseConnectionStatus({...base,connection:'logged-in'}));
  assert.deepEqual(connectionRemote.descriptors.map(d=>d.method),['status','refresh']);
});
test('save uses the effective credential ref, trims key and checks afterward',async()=>{
  const calls=[];
  const controller=new ConnectionController({status:async()=>base,set:async(...args)=>{calls.push(args);},refresh:async()=>({...base,connection:'ready',modelCount:2})});
  assert.equal(await controller.save('  test-key  '),true);
  assert.deepEqual(calls,[['MY_GO_KEY','test-key']]);assert.equal(controller.state.status.connection,'ready');
  assert.ok(!JSON.stringify(controller.state).includes('test-key'));
});
test('invalid key/read-only/save failures retain key drafts and never claim saved',async()=>{
  for(const [input,writable,error] of [['bad\nkey',true,'invalid-key'],['key',false,'read-only'],['key',true,'save-failed']]){
    const c=new ConnectionController({status:async()=>({...base,writable}),set:async()=>{throw new Error('private details');}});
    assert.equal(await c.save(input),false);assert.equal(c.state.saved,false);assert.equal(c.state.error,error);
  }
});
test('saved key is cleared by the UI even when follow-up refresh fails',async()=>{
  const c=new ConnectionController({status:async()=>base,set:async()=>{},refresh:async()=>{throw new Error('private details');}});
  assert.equal(await c.save('test-key'),true);assert.equal(c.state.error,'saved-refresh-failed');
});
test('duplicate actions are blocked and late responses cannot update an unmounted card',async()=>{
  let done;
  const c=new ConnectionController({status:()=>new Promise(resolve=>{done=resolve;})});
  const pending=c.read();assert.equal(await c.refresh(),false);c.dispose();done(base);await pending;assert.equal(c.state.status,null);
  c.activate();assert.equal(c.state.busy,'');
});
