import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { readFile } from 'node:fs/promises';
import { registerHooks } from 'node:module';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.env.PLUGIN_TEST_ROOT ? pathToFileURL(resolve(process.env.PLUGIN_TEST_ROOT) + '/') : new URL('../', import.meta.url);
const { createProvider, getBuiltinModels, anthropicMessagesApi, openAICompletionsApi, openAIResponsesApi } = await import(new URL('lib/vendor/pi-ai.js', root));
const apis = {
  'openai-completions': openAICompletionsApi,
  'anthropic-messages': anthropicMessagesApi,
  'openai-responses': openAIResponsesApi,
};
const requests = [];
const server = createServer(async (req, res) => {
  let raw = '';
  for await (const chunk of req) raw += chunk;
  if (req.url === '/models') {
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({data:[{id:getBuiltinModels('opencode-go')[0].id},{id:'new-family-test'}]}));
    return;
  }
  const body = JSON.parse(raw);
  requests.push({ url:req.url, body, headers:req.headers });
  res.writeHead(200, { 'content-type': 'text/event-stream' });
  const send = (event, data) => res.write(`${event ? `event: ${event}\n` : ''}data: ${JSON.stringify(data)}\n\n`);
  if (req.url === '/chat/completions') {
    send('', {id:'test',object:'chat.completion.chunk',model:body.model,choices:[{index:0,delta:{role:'assistant',content:'hello'},finish_reason:null}]});
    send('', {id:'test',object:'chat.completion.chunk',model:body.model,choices:[{index:0,delta:{},finish_reason:'stop'}],usage:{prompt_tokens:3,completion_tokens:1,total_tokens:4}});
    res.write('data: [DONE]\n\n');
  } else if (new URL(req.url, 'http://localhost').pathname === '/v1/messages') {
    send('message_start',{type:'message_start',message:{id:'test',type:'message',role:'assistant',model:body.model,content:[],stop_reason:null,stop_sequence:null,usage:{input_tokens:3,output_tokens:0}}});
    send('content_block_start',{type:'content_block_start',index:0,content_block:{type:'text',text:''}});
    send('content_block_delta',{type:'content_block_delta',index:0,delta:{type:'text_delta',text:'hello'}});
    send('content_block_stop',{type:'content_block_stop',index:0});
    send('message_delta',{type:'message_delta',delta:{stop_reason:'end_turn',stop_sequence:null},usage:{output_tokens:1}});
    send('message_stop',{type:'message_stop'});
  } else if (req.url === '/responses') {
    const item={id:'msg_test',type:'message',role:'assistant',status:'in_progress',content:[]};
    send('response.created',{type:'response.created',response:{id:'resp_test',model:body.model,status:'in_progress',output:[]}});
    send('response.output_item.added',{type:'response.output_item.added',output_index:0,item});
    send('response.content_part.added',{type:'response.content_part.added',item_id:item.id,output_index:0,content_index:0,part:{type:'output_text',text:'',annotations:[]}});
    send('response.output_text.delta',{type:'response.output_text.delta',item_id:item.id,output_index:0,content_index:0,delta:'hello'});
    const finished={...item,status:'completed',content:[{type:'output_text',text:'hello',annotations:[]}]};
    send('response.output_item.done',{type:'response.output_item.done',output_index:0,item:finished});
    send('response.completed',{type:'response.completed',response:{id:'resp_test',status:'completed',model:body.model,output:[finished],usage:{input_tokens:3,output_tokens:1,total_tokens:4,input_tokens_details:{cached_tokens:0},output_tokens_details:{reasoning_tokens:0}}}});
  } else { res.statusCode=404; res.end(); return; }
  res.end();
});
server.listen(0, '127.0.0.1');
await once(server, 'listening');
const baseUrl = `http://127.0.0.1:${server.address().port}`;
test.after(() => { server.closeAllConnections(); server.close(); });

test('production manifest has no pi-ai install dependency or lifecycle scripts', async () => {
  const pkg=JSON.parse(await readFile(new URL('package.json',root),'utf8'));
  for (const name of ['@earendil-works/pi-ai','@google/genai','protobufjs']) {
    assert.equal(pkg.dependencies?.[name],undefined);
    assert.equal(pkg.optionalDependencies?.[name],undefined);
  }
  assert.equal(pkg.peerDependenciesMeta['@earendil-works/pi-ai'].optional,true);
  for (const script of ['preinstall','install','postinstall','prepare']) assert.equal(pkg.scripts?.[script],undefined);
  const build=JSON.parse(await readFile(new URL('lib/vendor/pi-ai.build.json',root),'utf8'));
  assert.ok(!build.inputs.some(p=>/node_modules\/(?:@google\/|protobufjs\/|@aws-sdk\/)/.test(p)));
});

test('catalog remains available without pi-ai installed', () => {
  const models=getBuiltinModels('opencode-go');
  assert.ok(models.length>0);
  assert.ok(models.every(m=>m.provider==='opencode-go' && apis[m.api]));
  assert.deepEqual(getBuiltinModels('google'),[]);
});

for (const [api,factory] of Object.entries(apis)) {
  test(`${api}: lazy module loads and streams a response`, async () => {
    const seed=getBuiltinModels('opencode-go').find(m=>m.api===api) ?? getBuiltinModels('opencode-go')[0];
    const model={...seed,api,id:'test-model',baseUrl,reasoning:false,compat:undefined};
    const provider=createProvider({id:'opencode-go',name:'test',models:[model],auth:{apiKey:{name:'test',resolve:async()=>({auth:{},source:'test'})}},api:{[api]:factory()}});
    const events=[];
    for await (const event of provider.stream(model,{messages:[{role:'user',content:'hi',timestamp:Date.now()}]}, {apiKey:'test-key',maxTokens:32,signal:AbortSignal.timeout(10000)})) events.push(event);
    assert.equal(events.at(-1).type,'done',JSON.stringify(events.at(-1)));
    assert.equal(events.at(-1).message.content.filter(c=>c.type==='text').map(c=>c.text).join(''),'hello');
    assert.ok(requests.at(-1).headers.authorization || requests.at(-1).headers['x-api-key']);
  });
}

test('Harness host: plugin imports and discovers existing and new model families', {skip: !process.env.HARNESS_TEST_MODULES}, async () => {
  const hostUrl=pathToFileURL(join(resolve(process.env.HARNESS_TEST_MODULES),'../host-test.mjs')).href;
  const hooks=registerHooks({ resolve(specifier,context,next) {
    if(specifier.startsWith('@deepseek-ai/')) return next(specifier,{...context,parentURL:hostUrl});
    return next(specifier,context);
  }});
  try {
    const plugin=await import(new URL('lib/index.js', root));
    const catalog=new plugin.OpencodeGoCatalog(baseUrl,300000,()=>assert.fail('Unexpected fallback'),()=>assert.fail('Model omitted'));
    const snapshot=await catalog.snapshot();
    assert.equal(snapshot.live,true);
    assert.equal(snapshot.models.size,2);
    assert.ok(snapshot.models.has('new-family-test'));
    assert.equal(snapshot.provider.id,'opencode-go');
    assert.ok(plugin.Config);
  } finally {hooks.deregister();}
});
