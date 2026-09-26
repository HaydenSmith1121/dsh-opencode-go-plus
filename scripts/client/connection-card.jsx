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
  'refresh-failed': '暂时读不到状态；卡片会自动重试，也可以点“刷新状态”立即重试。',
  'saved-refresh-failed': '密钥已保存，但状态检查失败；点“刷新状态”可立即重试。',
  checked: '最近检查：', summary: '连接与密钥',
  editHint: '请使用本卡片配置密钥；上方通用“编辑”暂不支持此插件。',
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
  'save-failed': 'Could not save. Check the desktop connection and credential write permissions.', 'refresh-failed': 'Status is unavailable for now; the card keeps retrying, or refresh status to retry now.',
  'saved-refresh-failed': 'Key saved, but the check failed. Refresh status to retry.', checked: 'Last checked: ', summary: 'Connection and key',
  editHint: 'Configure the key in this card; the generic Edit control above does not support this plugin yet.',
};
// Styled with the harness's own tokens so the card sits in the Models list
// rather than on top of it, and shaped like the harness's own disclosure
// (`customizedSummary`): a chevron drawn from a rotated border, an ellipsised
// status line, and the form underneath. The body is what collapses — the row's
// own header, identity dot and Edit button belong to the host.
const css = `.ocg-connection{display:flex;flex-direction:column;font-size:13px;line-height:1.6;color:var(--dsw-alias-label-primary,#202326)}
.ocg-summary{display:flex;align-items:center;gap:6px;max-width:100%;width:fit-content;margin-left:-4px;padding:2px 4px;border-radius:var(--dsw-radius-sm,6px);color:var(--dsw-alias-label-secondary,#656b73);cursor:pointer;font-size:12px;font-weight:500;line-height:18px;list-style:none}
.ocg-summary::-webkit-details-marker{display:none}
.ocg-summary:before{content:"";flex:none;width:5px;height:5px;border-bottom:1.5px solid;border-right:1.5px solid;transform:rotate(-45deg) translate(-1px,-1px);transition:transform .12s}
.ocg-connection[open]>.ocg-summary:before{transform:rotate(45deg) translate(-1px,-1px)}
.ocg-summary:hover{color:var(--dsw-alias-label-primary,#202326)}
.ocg-summary:focus-visible{outline:none;box-shadow:0 0 0 2px var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary))}
.ocg-summary-label{flex:none}
.ocg-summary-status{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ocg-summary-status:before{content:"·";margin-right:6px}
.ocg-summary-status[data-tone=success]{color:var(--dsw-alias-state-success-primary,#269267)}
.ocg-summary-status[data-tone=warning]{color:var(--dsw-alias-state-warn-label,#a05a00)}
.ocg-summary-status[data-tone=error]{color:var(--dsw-alias-state-error-primary,#d33)}
.ocg-body{display:flex;flex-direction:column;gap:12px;padding-top:12px}
/* An author rule setting display on a details child outranks the UA's
   \`details:not([open])>\`:not(summary){display:none}\`, so the body would stay
   on screen with the chevron rotated. Hide it back, explicitly. */
.ocg-connection:not([open])>.ocg-body{display:none}
.ocg-connection p{margin:0}
.ocg-connection a{color:var(--dsw-alias-state-business-primary,#2458ce)}
.ocg-connection label{display:flex;flex-direction:column;gap:6px;color:var(--dsw-alias-label-secondary,#656b73);font-size:12px;font-weight:500;line-height:18px}
.ocg-connection input{box-sizing:border-box;width:100%;height:32px;padding:0 10px;border:.5px solid var(--dsw-alias-border-l4,#ccc);border-radius:var(--dsw-radius-md,8px);background:var(--dsw-alias-bg-layer-1,#fff);color:var(--dsw-alias-label-primary,#202326);font:inherit;font-size:14px}
.ocg-connection input::placeholder{color:var(--dsw-alias-label-dimmed,#9aa0a6)}
.ocg-connection input:focus{border-color:var(--dsw-alias-state-business-primary,#2458ce);outline:none}
.ocg-connection input:disabled{opacity:.6;cursor:default}
.ocg-actions{display:flex;flex-wrap:wrap;gap:8px}
.ocg-actions button{box-sizing:border-box;height:32px;padding:0 14px;border:.5px solid var(--dsw-alias-border-l3,#ccc);border-radius:var(--dsw-radius-md,8px);background:0 0;color:var(--dsw-alias-label-primary,#202326);font:inherit;font-size:13px;cursor:pointer}
.ocg-actions button:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover-solid,rgba(0,0,0,.04))}
.ocg-actions button[type=submit]{border:none;background:var(--dsw-alias-button-primary-fill,#2458ce);color:var(--dsw-alias-label-primary-foreground,#fff)}
.ocg-actions button[type=submit]:hover:not(:disabled){background:var(--dsw-alias-button-primary-hover,#1e46a8)}
.ocg-actions button:disabled{opacity:.4;cursor:default}
.ocg-actions button:focus-visible{outline:none;box-shadow:0 0 0 2px var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary))}
.ocg-note{color:var(--dsw-alias-label-tertiary,#9aa0a6);font-size:12px;line-height:18px}
.ocg-error{color:var(--dsw-alias-state-error-primary,#d33);font-size:12px;line-height:18px}
@media (prefers-reduced-motion:reduce){.ocg-summary:before{transition:none}}`;

/** Success, failure, or merely unfinished — the collapsed row's colour. */
function toneOf(status) {
  if (status === null) return 'idle';
  if (status.connection === 'ready' && status.modelCount > 0) return 'success';
  if (['unauthorized', 'forbidden', 'limited'].includes(status.connection)) return 'error';
  // 'missing' is the one state the user has to act on, and 'configured' has not
  // been checked yet — both want attention rather than the neutral idle grey,
  // which is otherwise indistinguishable from "still reading".
  if (['missing', 'configured', 'empty', 'models-unavailable', 'unavailable'].includes(status.connection)) return 'warning';
  return 'idle';
}

export function ConnectionCard({ actions, subscribeUpdates, t }) {
  const [controller] = useState(() => new ConnectionController(actions));
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot);
  const [key, setKey] = useState('');
  // `null` while the user has not expressed a preference: the card then shows
  // itself only until it knows a credential is stored, so a fresh install opens
  // on the field it needs and a configured install collapses to one line.
  const [folded, setFolded] = useState(null);
  useEffect(() => {
    controller.activate();
    void controller.read();
    const unsubscribe = subscribeUpdates(() => { void controller.read(); });
    // A tab left open across a Host restart has no other way back: the retry
    // timer stops once a status exists, and no event fires for "the window came
    // back". Coming into view with nothing readable is exactly that case.
    const onVisible = () => {
      const snapshot = controller.getSnapshot();
      if (!document.hidden && (snapshot.status === null || snapshot.error)) void controller.read();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      unsubscribe();
      controller.dispose();
    };
  }, [controller, subscribeUpdates]);
  const status = state.status;
  const locked = status?.writable === false;
  const message = !status ? t('loading') : status.connection === 'ready' ? status.modelCount ? `${t('ready')}${status.modelCount}` : t('empty') : t(status.connection);
  const open = folded ?? !(status?.configured === true);
  const save = async event => { event.preventDefault(); if (await controller.save(key)) setKey(''); };
  return <details className="ocg-connection" open={open} onToggle={event => setFolded(event.currentTarget.open)}>
    <summary className="ocg-summary" title={`${t('summary')} — ${message}`}>
      <span className="ocg-summary-label">{t('summary')}</span>
      <span className="ocg-summary-status" data-tone={toneOf(status)} role="status" aria-live="polite">{message}</span>
    </summary>
    <form className="ocg-body" onSubmit={save} aria-label="OpenCode Go">
      <p>{t('help')} <a href="https://opencode.ai/zen" target="_blank" rel="noopener noreferrer">{t('console')}</a></p>
      {/* No status block here on purpose: the summary above already carries the
          status, tone-coloured and visible whether the card is open or closed.
          Repeating it verbatim just made the card taller and noisier. */}
      {status && !status.enabled && <p>{t('disabled')}</p>}
      <label>{t('label')}<input type="password" aria-label={t('label')} autoComplete="new-password" spellCheck={false} value={key} placeholder={t(status?.configured ? 'stored' : 'placeholder')} disabled={locked || state.busy === 'save'} onChange={event => setKey(event.target.value)} /></label>
      {locked && <p className="ocg-note">{t('locked')}</p>}
      <div className="ocg-actions">
        <button type="submit" disabled={Boolean(state.busy) || locked || !key.trim()}>{t(state.busy === 'save' ? 'saving' : 'save')}</button>
        <button type="button" disabled={Boolean(state.busy)} onClick={() => { void controller.refresh(); }}>{t(state.busy === 'refresh' ? 'busy' : 'refresh')}</button>
      </div>
      {state.saved && !state.error && <p role="status">{t('saved')}</p>}
      {state.error && <p className="ocg-error" role="alert">{t(state.error)}</p>}
      {Boolean(status?.checkedAt) && <p className="ocg-note">{t('checked')}{new Date(status.checkedAt).toLocaleString()}</p>}
      <p className="ocg-note">{t('editHint')}</p>
    </form>
  </details>;
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
