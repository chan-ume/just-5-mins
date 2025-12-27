// Service Worker (Background Script)
// 拡張機能のバックグラウンドで動作するスクリプト

// ローカル時間で今日の日付キーを取得（UTC問題を回避）
function getTodayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 初期設定データ
const DEFAULT_SETTINGS = {
  dailyLimitMinutes: 5,
  domains: [
    {
      id: 'domain-youtube',
      domain: 'youtube.com',
      enabled: true,
      rules: [
        {
          id: 'rule-shorts',
          name: 'Shorts',
          type: 'prefix',
          pattern: '/shorts/',
          enabled: true
        }
      ]
    },
    {
      id: 'domain-x',
      domain: 'x.com',
      enabled: true,
      rules: [
        {
          id: 'rule-all',
          name: '全体',
          type: 'prefix',
          pattern: '/',
          enabled: true
        }
      ]
    }
  ]
};

// 初期状態データを生成（ドメイン別カウント対応）
function createInitialState() {
  return {
    todayKey: getTodayKey(),
    domains: {}  // { "youtube.com": { usageSecondsToday: 0, blocked: false }, ... }
  };
}

// ========================================
// 日次リセット
// ========================================

// 日付が変わったらリセットする（ドメイン別カウント対応）
async function ensureDailyReset() {
  const { state } = await chrome.storage.local.get('state');
  if (!state) return;

  const today = getTodayKey();

  if (state.todayKey !== today) {
    state.todayKey = today;
    state.domains = {};  // 全ドメインの状態をリセット
    await chrome.storage.local.set({ state });

    // ブロック解除完了。次回 tick 受信時からアクセス可能
  }
}

// Content Script を動的に登録する
async function registerInitialContentScripts() {
  // 既存の登録を確認
  const existing = await chrome.scripting.getRegisteredContentScripts();
  const existingIds = existing.map(s => s.id);

  const scriptsToRegister = [];

  // 初期プリセットを登録（未登録の場合のみ）
  if (!existingIds.includes('content-youtube')) {
    scriptsToRegister.push({
      id: 'content-youtube',
      matches: ['*://youtube.com/*', '*://*.youtube.com/*'],
      js: ['content.js'],
      runAt: 'document_start'
    });
  }

  if (!existingIds.includes('content-x')) {
    scriptsToRegister.push({
      id: 'content-x',
      matches: ['*://x.com/*', '*://*.x.com/*'],
      js: ['content.js'],
      runAt: 'document_start'
    });
  }

  if (scriptsToRegister.length > 0) {
    await chrome.scripting.registerContentScripts(scriptsToRegister);
  }
}

// 拡張機能がインストール・更新された時に実行
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    // 初回インストール時のみ初期値を設定
    await chrome.storage.local.set({
      settings: DEFAULT_SETTINGS,
      state: createInitialState()
    });
  } else if (details.reason === 'update') {
    // 更新時は既存データを保持（存在しない場合のみ初期化）
    const { settings, state } = await chrome.storage.local.get(['settings', 'state']);

    if (!settings) {
      await chrome.storage.local.set({ settings: DEFAULT_SETTINGS });
    }

    if (!state) {
      await chrome.storage.local.set({ state: createInitialState() });
    }
  }

  // Content Script を登録（インストール時・更新時共通）
  await registerInitialContentScripts();
});

// Service Worker が起動した時（ブラウザ起動時など）
chrome.runtime.onStartup.addListener(async () => {
  // 日次リセットを確認
  await ensureDailyReset();
});

// ========================================
// URLマッチング
// ========================================

// ドメインがマッチするかチェック（サブドメイン対応）
function matchesDomain(hostname, targetDomain) {
  // 完全一致
  if (hostname === targetDomain) return true;
  // サブドメイン（www.youtube.com → youtube.com）
  if (hostname.endsWith('.' + targetDomain)) return true;
  return false;
}

// URLが対象かどうかをチェックし、マッチしたドメイン名を返す
// マッチしない場合は null を返す
function getMatchedDomain(url, settings) {
  // 設定がない場合は対象外
  if (!settings || !settings.domains) return null;

  try {
    // ブラウザ内部URLは対象外
    if (url.startsWith('chrome://') || url.startsWith('about:') || url.startsWith('edge://')) {
      return null;
    }

    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    const pathname = urlObj.pathname;

    for (const domain of settings.domains) {
      if (!domain.enabled) continue;

      // ドメインマッチ（サブドメイン対応）
      if (!matchesDomain(hostname, domain.domain)) continue;

      // パスルールマッチ
      for (const rule of domain.rules) {
        if (!rule.enabled) continue;

        if (rule.type === 'prefix') {
          // 前方一致
          if (pathname.startsWith(rule.pattern)) return domain.domain;
        } else if (rule.type === 'regex') {
          // 正規表現
          try {
            if (new RegExp(rule.pattern).test(pathname)) return domain.domain;
          } catch {
            // 不正な正規表現はスキップ
            console.warn('Just 5 Minutes: 不正な正規表現:', rule.pattern);
          }
        }
      }
    }

    return null;
  } catch {
    // URLのパースに失敗した場合は対象外
    return null;
  }
}

// URLが対象かどうかをチェック（後方互換用）
function isTargetUrl(url, settings) {
  return getMatchedDomain(url, settings) !== null;
}

// ========================================
// タブ監視
// ========================================

// タブがアクティブになった時
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  // 日次リセットを確認
  await ensureDailyReset();

  try {
    await chrome.tabs.get(activeInfo.tabId);
  } catch {
    // タブが既に閉じられている場合などはエラーになる
  }
});

// タブのURLが変更された時（SPA対応）
chrome.tabs.onUpdated.addListener(async () => {
  // URL変更時の処理（将来の拡張用）
});

// ========================================
// メッセージ受信（Content Script からの tick）
// ========================================

// tick を処理する（ドメイン別カウント対応）
async function handleTick(url, tabId) {
  // 日次リセットを確認
  await ensureDailyReset();

  const { settings, state } = await chrome.storage.local.get(['settings', 'state']);

  // 設定または状態がない場合は無視
  if (!settings || !state) return;

  // 対象URLかチェックし、マッチしたドメインを取得
  const matchedDomain = getMatchedDomain(url, settings);
  if (!matchedDomain) return;

  // ドメインの状態を初期化（未登録の場合）
  if (!state.domains) {
    state.domains = {};
  }
  if (!state.domains[matchedDomain]) {
    state.domains[matchedDomain] = { usageSecondsToday: 0, blocked: false };
  }

  const domainState = state.domains[matchedDomain];

  // 既にこのドメインがブロック中なら即座にリダイレクト
  if (domainState.blocked) {
    const blockedUrl = chrome.runtime.getURL('blocked.html') + '?domain=' + encodeURIComponent(matchedDomain);
    try {
      await chrome.tabs.update(tabId, { url: blockedUrl });
    } catch {
      // タブが既に閉じられている場合などはエラーになる
    }
    return;
  }

  // 時間を加算（1秒固定）
  domainState.usageSecondsToday += 1;

  // 上限チェック
  const dailyLimitSeconds = settings.dailyLimitMinutes * 60;
  if (domainState.usageSecondsToday >= dailyLimitSeconds) {
    // 上限到達
    domainState.blocked = true;
    await chrome.storage.local.set({ state });

    // 現在のタブを blocked.html に遷移（どのドメインかをクエリパラメータで渡す）
    const blockedUrl = chrome.runtime.getURL('blocked.html') + '?domain=' + encodeURIComponent(matchedDomain);
    try {
      await chrome.tabs.update(tabId, { url: blockedUrl });
    } catch {
      // タブが既に閉じられている場合などはエラーになる
    }
  } else {
    await chrome.storage.local.set({ state });
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'tick') {
    const url = sender.tab?.url;
    const tabId = sender.tab?.id;
    if (url && tabId) {
      // 非同期処理を実行（sendResponse は使わない）
      handleTick(url, tabId);
    }
  }
});
