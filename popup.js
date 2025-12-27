// ポップアップのスクリプト
// storageからデータを読み込んで表示する（ドメイン別）

// 現在の設定をキャッシュ（storage.onChanged で state だけ更新される場合に使用）
let currentSettings = null;

// 秒数を「○分○秒」形式に変換
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) {
    return `${secs}秒`;
  }
  return `${mins}分${secs}秒`;
}

// ドメイン名をエスケープ
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// 表示を更新（ドメイン別）
function updateDisplay(settings, state) {
  const limitEl = document.getElementById('limit');
  const domainListEl = document.getElementById('domainList');

  // 上限秒数を計算
  const limitSeconds = settings.dailyLimitMinutes * 60;

  // 上限時間
  limitEl.textContent = `${settings.dailyLimitMinutes}分`;

  // ドメイン別の表示を生成
  const domainItems = settings.domains
    .filter(domain => domain.enabled)
    .map(domain => {
      const domainState = state.domains?.[domain.domain] || { usageSecondsToday: 0, blocked: false };
      const remainingSeconds = Math.max(0, limitSeconds - domainState.usageSecondsToday);

      // 残り時間の色
      let remainingColor = '#1976d2';
      if (remainingSeconds === 0) {
        remainingColor = '#e53935';
      } else if (remainingSeconds <= 60) {
        remainingColor = '#ff9800';
      }

      // 状態
      let statusText = '利用可能';
      let statusColor = '#43a047';
      if (domainState.blocked) {
        statusText = 'ブロック中';
        statusColor = '#e53935';
      }

      return `
        <div class="domain-item">
          <div class="domain-name">${escapeHtml(domain.domain)}</div>
          <div class="domain-stats">
            <div class="stat">
              <span class="stat-label">残り</span>
              <span class="stat-value" style="color: ${remainingColor}">${formatTime(remainingSeconds)}</span>
            </div>
            <div class="stat">
              <span class="stat-label">使用</span>
              <span class="stat-value">${formatTime(domainState.usageSecondsToday)}</span>
            </div>
            <div class="stat">
              <span class="stat-label">状態</span>
              <span class="stat-value" style="color: ${statusColor}">${statusText}</span>
            </div>
          </div>
        </div>
      `;
    });

  if (domainItems.length === 0) {
    domainListEl.innerHTML = '<div class="no-domains">監視対象のドメインがありません</div>';
  } else {
    domainListEl.innerHTML = domainItems.join('');
  }
}

// 初期化
async function init() {
  const { settings, state } = await chrome.storage.local.get(['settings', 'state']);

  // データが存在しない場合のフォールバック
  if (!settings || !state) {
    document.getElementById('limit').textContent = 'データなし';
    document.getElementById('domainList').innerHTML = '<div class="no-domains">初期化待ち...</div>';
    return;
  }

  // 設定をキャッシュ
  currentSettings = settings;

  updateDisplay(settings, state);
}

// storage の変更を監視（リアルタイム更新）
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;

  // settings が変更された場合はキャッシュを更新
  if (changes.settings) {
    currentSettings = changes.settings.newValue;
  }

  // state が変更された場合は表示を更新
  if (changes.state && currentSettings) {
    updateDisplay(currentSettings, changes.state.newValue);
  }
});

// 「設定を開く」ボタンのイベント
document.getElementById('openSettings').addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

// ページ読み込み時に実行
init();
