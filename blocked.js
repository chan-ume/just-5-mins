// ブロック画面のスクリプト（ドメイン別対応）

// 秒数を「○分○秒」形式に変換
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) {
    return `${secs}秒`;
  }
  return `${mins}分${secs}秒`;
}

// URLパラメータからドメインを取得
function getBlockedDomain() {
  const params = new URLSearchParams(window.location.search);
  return params.get('domain') || null;
}

// 使用時間を表示
async function init() {
  const blockedDomain = getBlockedDomain();
  const domainEl = document.getElementById('domain');
  const usageEl = document.getElementById('usage');

  // ドメイン名を表示
  if (blockedDomain) {
    domainEl.textContent = blockedDomain;
  } else {
    domainEl.textContent = '不明';
  }

  const { state, settings } = await chrome.storage.local.get(['state', 'settings']);

  if (state && settings && blockedDomain) {
    // ドメイン別の使用時間を取得
    const domainState = state.domains?.[blockedDomain] || { usageSecondsToday: 0 };
    usageEl.textContent = `${formatTime(domainState.usageSecondsToday)} / ${settings.dailyLimitMinutes}分`;
  } else if (state && settings) {
    // フォールバック：ドメインが不明な場合は上限時間だけ表示
    usageEl.textContent = `上限: ${settings.dailyLimitMinutes}分`;
  }
}

init();
