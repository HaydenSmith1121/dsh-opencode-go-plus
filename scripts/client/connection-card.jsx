import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { connectionRemote, parseConnectionStatus } from '../../lib/connection-contract.js';
import { ConnectionController } from './connection-controller.js';
const NS = 'opencode-go.connection';
const zh = {
  help: '登录 OpenCode 官网不会自动连接 Harness。请在 OpenCode 控制台获取 Go API Key，并保存到这里。',
  console: '打开 OpenCode 控制台', label: 'OpenCode Go API Key',
  placeholder: '粘贴 API Key', stored: '已保存；留空保留现有密钥',
  save: '保存并检查', refresh: '刷新状态', busy: '正在检查…', saving: '正在保存…', loading: '正在读取状态…',
  saved: '密钥已保存。', locked: '此密钥由环境或只读配置提供，不能在这里覆盖。',
  disabled: '插件已停用；请先启用插件配置中的 enabled，再使用模型。',
  missing: '未配置 API Key；官网登录状态不能代替密钥。',
  configured: '已配置密钥，尚未检查连接。点击“刷新状态”验证。',
  ready: '认证成功，模型目录已刷新。可用模型：',
  empty: '认证成功，但当前目录没有可用模型，请检查 Go 订阅或稍后刷新。',
  unauthorized: '认证失败（401）：请检查或更换 API Key。',
  forbidden: '访问被拒绝（403）：请检查 Go 订阅与该密钥的权限。',
  limited: '服务限流（429）：请稍后重试，并检查订阅用量。',
  unavailable: '暂时无法验证连接；请检查网络或服务状态后重试。这不代表密钥未保存。',
  'models-unavailable': '认证成功，但实时模型目录刷新失败；暂时使用内置目录，请稍后重试。',
  'invalid-key': '请输入有效的 API Key，不能包含空格或换行。',
  'read-only': '当前凭据不可写，未保存。',
  'save-failed': '保存失败，请检查桌面连接和凭据写入权限后重试。',
  'refresh-failed': '无法读取最新状态，请确认插件已启用并重新连接后再试。',
  'saved-refresh-failed': '密钥已保存，但状态检查失败，请点击“刷新状态”重试。',
  checked: '最近检查：', editHint: '请使用本卡片配置密钥；上方通用“编辑”暂不支持此插件。',
};
const en = {
  help: 'Signing in to the OpenCode website does not connect Harness. Copy your Go API key from the OpenCode console and save it here.',
  console: 'Open OpenCode console', label: 'OpenCode Go API Key', placeholder: 'Paste API key', stored: 'Stored; leave blank to keep the current key',
  save: 'Save and check', refresh: 'Refresh status', busy: 'Checking…', saving: 'Saving…', loading: 'Reading status…', saved: 'API key saved.',
  locked: 'This credential comes from an environment or read-only configuration and cannot be overwritten here.',
  disabled: 'This plugin is disabled. Enable its enabled setting before using models.',
  missing: 'No API key configured. Website sign-in does not supply an API key.', configured: 'API key configured; connection not checked. Refresh status to verify.',
  ready: 'Authenticated and model catalog refreshed. Available models: ', empty: 'Authenticated, but no models are available. Check your Go subscription or refresh later.',
  unauthorized: 'Authentication failed (401). Check or replace the API key.', forbidden: 'Access denied (403). Check your Go subscription and key permissions.',
  limited: 'Rate limited (429). Retry later and check subscription usage.', unavailable: 'Could not verify the connection. Check your network or service status and retry. Your stored key has not been removed.',
  'models-unavailable': 'Authenticated, but live model discovery failed. Using the bundled catalog; retry later.',
  'invalid-key': 'Enter an API key without whitespace or line breaks.', 'read-only': 'This credential is read-only. Nothing was saved.',
  'save-failed': 'Could not save. Check the desktop connection and credential write permissions.', 'refresh-failed': 'Could not read status. Ensure the plugin is enabled and reconnect, then retry.',
  'saved-refresh-failed': 'Key saved, but the check failed. Refresh status to retry.', checked: 'Last checked: ', editHint: 'Configure the key in this card; the generic Edit control above does not support this plugin yet.',
};
const css = `.ocg-connection{display:grid;gap:12px;padding-top:16px;font-size:13px;line-height:1.6;color:var(--dsw-alias-label-primary, #202326)}.ocg-connection p{margin:0}.ocg-connection a{color:var(--dsw-alias-brand-primary,#2458ce)}.ocg-connection label{display:grid;gap:6px;font-weight:500}.ocg-connection input{width:100%;box-sizing:border-box;min-height:40px;border:1px solid var(--dsw-alias-border-l4,#ccc);border-radius:8px;padding:8px 12px;color:inherit;background:var(--dsw-alias-bg-layer-3,#fff);font:inherit}.ocg-actions{display:flex;gap:10px;flex-wrap:wrap}.ocg-actions button{min-height:36px;border:1px solid var(--dsw-alias-border-l4,#ccc);border-radius:8px;padding:6px 14px;background:var(--dsw-alias-bg-layer-3,#fff);color:inherit;font:inherit;cursor:pointer}.ocg-actions button:first-child{background:var(--dsw-alias-brand-primary,#2458ce);color:#fff;border-color:transparent}.ocg-actions button:disabled{opacity:.5;cursor:default}.ocg-status{border-radius:8px;padding:10px 12px;background:var(--dsw-alias-bg-layer-2,#f5f6f7)}.ocg-status[data-tone=success]{border-left:3px solid #269267}.ocg-status[data-tone=warning]{border-left:3px solid #ca8a20}.ocg-note{color:var(--dsw-alias-label-secondary,#656b73);font-size:12px}.ocg-connection :focus-visible{outline:2px solid var(--dsw-alias-brand-primary,#2458ce);outline-offset:2px}`;

export function ConnectionCard({ actions, subscribeUpdates, t }) {
  const [controller] = useState(() => new ConnectionController(actions));
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot);
  const [key, setKey] = useState('');
  useEffect(() => {
    controller.activate();
    void controller.read();
    const unsubscribe = subscribeUpdates(() => { void controller.read(); });
    return () => { unsubscribe(); controller.dispose(); };
  }, [controller, subscribeUpdates]);
  const status = state.status;
  const locked = status?.writable === false;
  const good = status?.connection === 'ready' && status.modelCount > 0;
  const message = !status ? t('loading') : status.connection === 'ready' ? status.modelCount ? `${t('ready')}${status.modelCount}` : t('empty') : t(status.connection);
  const save = async event => { event.preventDefault(); if (await controller.save(key)) setKey(''); };
  return <form className="ocg-connection" onSubmit={save} aria-label="OpenCode Go">
    <p>{t('help')} <a href="https://opencode.ai/zen" target="_blank" rel="noopener noreferrer">{t('console')}</a></p>
    <div className="ocg-status" data-tone={good ? 'success' : 'warning'} role="status" aria-live="polite">{message}</div>
    {status && !status.enabled && <p>{t('disabled')}</p>}
    <label>{t('label')}<input type="password" aria-label={t('label')} autoComplete="new-password" spellCheck={false} value={key} placeholder={t(status?.configured ? 'stored' : 'placeholder')} disabled={Boolean(state.busy) || !status || locked} onChange={event => setKey(event.target.value)} /></label>
    {locked && <p className="ocg-note">{t('locked')}</p>}
    <div className="ocg-actions">
      <button type="submit" disabled={Boolean(state.busy) || !status || locked || !key.trim()}>{t(state.busy === 'save' ? 'saving' : 'save')}</button>
      <button type="button" disabled={Boolean(state.busy)} onClick={() => { void controller.refresh(); }}>{t(state.busy === 'refresh' ? 'busy' : 'refresh')}</button>
    </div>
    {state.saved && !state.error && <p role="status">{t('saved')}</p>}
    {state.error && <p role="alert">{t(state.error)}</p>}
    {Boolean(status?.checkedAt) && <p className="ocg-note">{t('checked')}{new Date(status.checkedAt).toLocaleString()}</p>}
    <p className="ocg-note">{t('editHint')}</p>
  </form>;
}

export function registerConnectionCard(ctx) {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }));
  ctx.effect(() => {
    const tag = document.createElement('style'); tag.textContent = css; document.head.appendChild(tag);
    return () => tag.remove();
  });
  ctx.inject(['remote.credentials'], scope => {
    scope.effect(async () => {
      const unmount = await scope.remote.$mount(connectionRemote);
      scope.inject(['remote.opencodeGoConnection'], ready => {
        const read = async method => {
          const response = await ready.remote.opencodeGoConnection[method]();
          if (!response.ok) throw new Error('status-unavailable');
          return parseConnectionStatus(response.value);
        };
        const actions = {
          status: () => read('status'), refresh: () => read('refresh'),
          set: async (ref, value) => { const result = await ready.remote.credentials.set(ref, value); if (!result.ok) throw new Error('save-failed'); },
        };
        const subscribeUpdates = listener => {
          const disposers = ['credentials/reference-updated','settings/document-updated'].map(event => ready.remote.$on(event, listener));
          disposers.push(ready.on('connection/reset', listener));
          return () => { for (const dispose of disposers) dispose(); };
        };
        const t = ready.locale.bind(NS);
        ready.slots.inject('settings.models.provider-card', () => ready.slots.register({
          name: 'settings.models.provider-card', key: 'llm-opencode-go',
          inject: () => ({ actions, subscribeUpdates, t }),
        }, ConnectionCard));
      });
      return unmount;
    });
  });
}
