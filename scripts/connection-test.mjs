import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createConnectionStatus } from '../lib/connection-status.js';
import { parseConnectionStatus, connectionRemote } from '../lib/connection-contract.js';
import { ConnectionController } from './client/connection-controller.js';
const base = { configured:true,writable:true,enabled:true,ref:'MY_GO_KEY',route:'opencode-go-plus',connection:'configured',modelCount:0,checkedAt:0,httpStatus:0 };
test('refresh survives status events and a newly mounted card without another request',async()=>{
  const {service,requests}=setup();
  const checked=await service.refresh();
  assert.equal(checked.connection,'ready');
  assert.deepEqual(await service.status(),checked);
  const card=new ConnectionController({status:()=>service.status()});
  await card.read();
  assert.deepEqual(card.state.status,checked);
  assert.equal(requests(),1);
  card.dispose();
});
test('cached verification is invalidated by credential and endpoint changes',async()=>{
  let revision=0,baseURL='https://example.invalid/v1';
  const {service}=setup({revision:()=>revision,config:()=>({apiKeyEnv:'MY_GO_KEY',baseURL,enabled:true})});
  await service.refresh(); revision++;
  assert.equal((await service.status()).connection,'configured');
  await service.refresh(); baseURL='https://other.invalid/v1';
  assert.equal((await service.status()).connection,'configured');
});
test('a failed recheck replaces earlier success, and removed credentials clear it',async()=>{
  let code=200,configured=true;
  const {service}=setup({describe:async()=>({configured,writable:true}),fetch:async()=>Response.json({usage:{ok:true}},{status:code})});
  await service.refresh(); code=401;
  await service.refresh();
  assert.equal((await service.status()).connection,'unauthorized');
  configured=false;
  assert.equal((await service.status()).connection,'missing');
  configured=true;
  assert.equal((await service.status()).connection,'configured');
});
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
test('a status field the card does not need can never blank the card',()=>{
  // `writable` gates the key input and `route`/counts only decorate; defaulting
  // them keeps a card that has a status to show renderable, where the strict
  // read this replaced returned nothing at all.
  assert.deepEqual(parseConnectionStatus({connection:'missing'}),{configured:false,writable:true,enabled:true,ref:'',route:'',connection:'missing',modelCount:0,checkedAt:0,httpStatus:0});
  assert.equal(parseConnectionStatus({...base,enabled:'yes',modelCount:-1,checkedAt:Number.NaN}).modelCount,0);
  assert.throws(()=>parseConnectionStatus(undefined));
});
test('an unreadable credential store reports an actionable state instead of failing the RPC',async()=>{
  const {service}=setup({describe:async()=>{throw new Error('store busy');}});
  assert.deepEqual(await service.status(),{...base,configured:false,writable:true,connection:'missing'});
  assert.equal((await service.refresh()).connection,'missing');
});
test('a first read that fails keeps retrying until a status lands',async()=>{
  let attempts=0;
  const c=new ConnectionController({status:async()=>{if(++attempts<3)throw new Error('gateway not up');return {...base,connection:'missing'};}},{retryBaseMs:1,retryMaxMs:1});
  await c.read();
  assert.equal(c.state.status,null);assert.equal(c.state.error,'refresh-failed');
  for(let wait=0;wait<50&&c.state.status===null;wait++)await new Promise(resolve=>setTimeout(resolve,5));
  assert.equal(attempts,3);assert.equal(c.state.status.connection,'missing');assert.equal(c.state.error,'');
  c.dispose();
});
test('a failed refresh of a known status does not erase it or retry forever',async()=>{
  let attempts=0;
  const c=new ConnectionController({status:async()=>{attempts++;return attempts===1?base:Promise.reject(new Error('gone'));}},{retryBaseMs:1,retryMaxMs:1});
  await c.read();assert.equal(c.state.status.connection,'configured');
  await c.read();assert.equal(c.state.error,'refresh-failed');assert.equal(c.state.status.connection,'configured');
  await new Promise(resolve=>setTimeout(resolve,20));
  assert.equal(attempts,2);c.dispose();
});
test('a stalled read is reported instead of leaving the card reading forever',async()=>{
  const c=new ConnectionController({status:()=>new Promise(()=>{})},{readTimeoutMs:5});
  await c.read();
  assert.equal(c.state.status,null);assert.equal(c.state.error,'refresh-failed');assert.equal(c.state.busy,'');
  c.dispose();
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
test('the collapsed card really hides its body in the shipped bundle',async()=>{
  // A details child that sets its own `display` outranks the UA's
  // `details:not([open])>:not(summary){display:none}`, so the chevron would rotate
  // while the form stayed on screen. Whatever the card builds must therefore also
  // carry an explicit closed-state rule; assert it against the built bundle, which
  // is what actually ships.
  const bundle=await readFile(new URL('../lib/client.js',import.meta.url),'utf8');
  const card=bundle.slice(bundle.indexOf('BEGIN GENERATED CONNECTION CARD'),bundle.indexOf('END GENERATED CONNECTION CARD'));
  assert.ok(card.length>0,'the built bundle embeds the card');
  const body=/\.ocg-body\{[^}]*display:/.exec(card);
  if(body)assert.match(card,/\.ocg-connection:not\(\[open\]\)>\.ocg-body\{display:none\}/);
  assert.match(card,/"details"/);
});
