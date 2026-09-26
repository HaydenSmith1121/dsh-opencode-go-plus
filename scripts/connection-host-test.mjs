import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { pathToFileURL } from 'node:url';
import { resolve, join } from 'node:path';
test('0.1.7 host: connection RPC mounts and manual refresh repairs route and model catalog', {skip:!process.env.HARNESS_TEST_MODULES}, async()=>{
  const hostUrl=pathToFileURL(join(resolve(process.env.HARNESS_TEST_MODULES),'../test-host.mjs')).href;
  const hook=registerHooks({resolve(specifier,context,next){return next(specifier,specifier.startsWith('@deepseek-ai/')?{...context,parentURL:hostUrl}:context);}});
  const {Context,Service}=await import('@deepseek-ai/cordis');
  const {TypertRegistry}=await import('@deepseek-ai/dsh-typert-registry');
  const {TypertGatewayService}=await import('@deepseek-ai/dsh-api-gateway');
  const plugin=await import(process.env.PLUGIN_TEST_ROOT ? pathToFileURL(join(resolve(process.env.PLUGIN_TEST_ROOT),'lib/index.js')).href : '../lib/index.js');
  const routes=new Map([['opencode-go',{}]]);
  let key='',modelRequests=0,directoryUpdates=0;
  class Llm extends Service {
    constructor(ctx){super(ctx,'llm');}
    registerAdapter(ids,adapter){for(const id of ids){if(routes.has(id))throw Object.assign(new Error('duplicate'),{code:'DUPLICATE_ADAPTER'});routes.set(id,adapter);}const handle=()=>ids.forEach(id=>routes.delete(id));handle.replace=next=>{assert.deepEqual(next,ids);++directoryUpdates;};return handle;}
    registerConfigurableProviders(){return ()=>{};}
    registerModelDiscovery(){return ()=>{};}
  }
  class Credentials extends Service {
    constructor(ctx){super(ctx,'credentials');}
    async describe(){return {configured:Boolean(key),writable:true};}
    async resolve(){return key?{value:key}:undefined;}
  }
  const ctx=new Context();
  const originalFetch=globalThis.fetch;
  globalThis.fetch=async(url,options)=>{
    if(String(url).endsWith('/usage')){
      assert.equal(options.headers.Authorization,`Bearer ${key}`);
      const window={status:'ok',percent:1,resetsAt:'2026-12-01T00:00:00Z'};
      return Response.json({usage:{rolling:window,weekly:window,monthly:window}});
    }
    if(String(url).endsWith('/models')){++modelRequests;return Response.json({data:[{id:'deepseek-v4.1-flash'},{id:'new-family-test'}]});}
    throw new Error('Unexpected URL');
  };
  try{
    await ctx.plugin(TypertRegistry);
    await ctx.plugin(TypertGatewayService, {});
    await ctx.plugin(Llm);
    await ctx.plugin(Credentials);
    await ctx.plugin(plugin,{});
    const connection={};
    for(const method of ['status','refresh']) connection[method]=async()=>{
      const reply=await ctx.typertGateway.invokeRpc('opencodeGoConnection/'+method,{args:{}},new AbortController().signal);
      assert.equal(reply.ok,true,JSON.stringify(reply));
      return reply.value;
    };
    assert.equal((await connection.status()).connection,'missing');
    assert.ok(ctx.typert.local.list().some(d=>d.method==='refresh'));
    assert.equal(routes.has('opencode-go-plus'),false);
    key='fake-test-key'; // deliberately no event: manual refresh must repair state
    const state=await connection.refresh();
    assert.equal(state.connection,'ready');assert.equal(state.modelCount,2);
    assert.equal(state.route,'opencode-go-plus');assert.equal(routes.has(state.route),true);
    await connection.refresh();assert.equal(modelRequests,2);assert.equal(directoryUpdates,2);
    key='';await connection.refresh();assert.equal(routes.has('opencode-go-plus'),false);
  }finally{globalThis.fetch=originalFetch;await ctx.fiber.dispose();hook.deregister();}
});
