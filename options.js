// 設定画面のスクリプト
// storageからデータを読み込んで表示し、保存する

// DOM要素
const dailyLimitInput = document.getElementById('dailyLimit');
const domainListEl = document.getElementById('domainList');
const saveBtn = document.getElementById('saveBtn');
const saveStatusEl = document.getElementById('saveStatus');
const newDomainInput = document.getElementById('newDomainInput');
const addDomainBtn = document.getElementById('addDomainBtn');
const addDomainStatusEl = document.getElementById('addDomainStatus');

// 現在の設定をキャッシュ
let currentSettings = null;

// ドメイン一覧を表示
function renderDomainList(domains) {
  if (!domains || domains.length === 0) {
    domainListEl.innerHTML = '<div class="empty-message">対象ドメインがありません</div>';
    return;
  }

  domainListEl.innerHTML = domains.map(domain => {
    // 有効なルール数をカウント
    const enabledRules = domain.rules.filter(r => r.enabled).length;
    const totalRules = domain.rules.length;
    const rulesText = `${enabledRules}/${totalRules} ルール有効`;

    // パスルール一覧を生成
    const rulesHtml = domain.rules.length > 0
      ? domain.rules.map(rule => renderRule(domain.id, rule)).join('')
      : '<div class="no-rules">ルールがありません</div>';

    return `
      <div class="domain-item" data-domain-id="${escapeHtml(domain.id)}">
        <div class="domain-header">
          <div class="domain-info">
            <div class="domain-name">${escapeHtml(domain.domain)}</div>
            <div class="domain-rules">${rulesText}</div>
          </div>
          <div class="domain-actions">
            <label class="toggle-switch">
              <input type="checkbox" class="domain-toggle" data-domain-id="${escapeHtml(domain.id)}" ${domain.enabled ? 'checked' : ''}>
              <span class="toggle-slider"></span>
            </label>
            <button class="btn-delete" data-domain-id="${escapeHtml(domain.id)}">削除</button>
          </div>
        </div>

        <!-- パスルール一覧 -->
        <div class="rules-section">
          <div class="rules-list">
            ${rulesHtml}
          </div>

          <!-- パスルール追加フォーム -->
          <div class="add-rule-form" data-domain-id="${escapeHtml(domain.id)}">
            <select class="rule-type-select">
              <option value="prefix">前方一致</option>
              <option value="regex">正規表現</option>
            </select>
            <input type="text" class="rule-pattern-input" placeholder="例: /shorts/">
            <input type="text" class="rule-name-input" placeholder="ルール名">
            <button class="btn-add-rule">追加</button>
          </div>
          <div class="add-rule-status"></div>
        </div>
      </div>
    `;
  }).join('');

  // ドメイン削除ボタンのイベントリスナーを設定
  domainListEl.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const domainId = e.target.dataset.domainId;
      deleteDomain(domainId);
    });
  });

  // パスルール追加ボタンのイベントリスナーを設定
  domainListEl.querySelectorAll('.btn-add-rule').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const form = e.target.closest('.add-rule-form');
      const domainId = form.dataset.domainId;
      const type = form.querySelector('.rule-type-select').value;
      const pattern = form.querySelector('.rule-pattern-input').value.trim();
      const name = form.querySelector('.rule-name-input').value.trim();

      const statusEl = form.nextElementSibling;
      const error = await addRule(domainId, type, pattern, name);

      if (error) {
        statusEl.textContent = error;
        statusEl.className = 'add-rule-status error';
      } else {
        statusEl.textContent = 'ルールを追加しました';
        statusEl.className = 'add-rule-status success';
        // 入力欄をクリア
        form.querySelector('.rule-pattern-input').value = '';
        form.querySelector('.rule-name-input').value = '';
      }

      // 3秒後にメッセージを消す
      setTimeout(() => {
        statusEl.textContent = '';
        statusEl.className = 'add-rule-status';
      }, 3000);
    });
  });

  // パスルール削除ボタンのイベントリスナーを設定
  domainListEl.querySelectorAll('.btn-delete-rule').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const domainId = e.target.dataset.domainId;
      const ruleId = e.target.dataset.ruleId;
      deleteRule(domainId, ruleId);
    });
  });

  // ドメイントグルのイベントリスナーを設定
  domainListEl.querySelectorAll('.domain-toggle').forEach(toggle => {
    toggle.addEventListener('change', (e) => {
      const domainId = e.target.dataset.domainId;
      toggleDomain(domainId, e.target.checked);
    });
  });

  // パスルールトグルのイベントリスナーを設定
  domainListEl.querySelectorAll('.rule-toggle').forEach(toggle => {
    toggle.addEventListener('change', (e) => {
      const domainId = e.target.dataset.domainId;
      const ruleId = e.target.dataset.ruleId;
      toggleRule(domainId, ruleId, e.target.checked);
    });
  });
}

// HTMLエスケープ
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// パスルールを表示
function renderRule(domainId, rule) {
  const typeText = rule.type === 'prefix' ? '前方一致' : '正規表現';
  const disabledClass = rule.enabled ? '' : 'disabled';
  return `
    <div class="rule-item ${disabledClass}" data-rule-id="${escapeHtml(rule.id)}">
      <label class="toggle-switch small">
        <input type="checkbox" class="rule-toggle" data-domain-id="${escapeHtml(domainId)}" data-rule-id="${escapeHtml(rule.id)}" ${rule.enabled ? 'checked' : ''}>
        <span class="toggle-slider"></span>
      </label>
      <span class="rule-type">${typeText}</span>
      <span class="rule-pattern">${escapeHtml(rule.pattern)}</span>
      <span class="rule-name">${escapeHtml(rule.name)}</span>
      <button class="btn-delete-rule" data-domain-id="${escapeHtml(domainId)}" data-rule-id="${escapeHtml(rule.id)}">×</button>
    </div>
  `;
}

// 表示を更新
function updateDisplay(settings) {
  dailyLimitInput.value = settings.dailyLimitMinutes;
  renderDomainList(settings.domains);
}

// 設定を保存
async function saveSettings() {
  // 入力値を取得
  const dailyLimitMinutes = parseInt(dailyLimitInput.value, 10);

  // バリデーション
  if (isNaN(dailyLimitMinutes) || dailyLimitMinutes < 1 || dailyLimitMinutes > 1440) {
    saveStatusEl.textContent = 'エラー: 1〜1440の範囲で入力してください';
    saveStatusEl.style.color = '#e53935';
    return;
  }

  // 設定を更新
  currentSettings.dailyLimitMinutes = dailyLimitMinutes;

  // storageに保存
  await chrome.storage.local.set({ settings: currentSettings });

  // 保存完了メッセージ
  saveStatusEl.textContent = '保存しました';
  saveStatusEl.style.color = '#43a047';

  // 3秒後にメッセージを消す
  setTimeout(() => {
    saveStatusEl.textContent = '';
  }, 3000);

}

// 初期化
async function init() {
  const { settings } = await chrome.storage.local.get('settings');

  if (!settings) {
    domainListEl.innerHTML = '<div class="empty-message">設定が見つかりません</div>';
    return;
  }

  currentSettings = settings;
  updateDisplay(settings);
}

// ドメインを追加
async function addDomain() {
  const domain = newDomainInput.value.trim().toLowerCase();

  // バリデーション
  if (!domain) {
    showAddDomainStatus('ドメインを入力してください', 'error');
    return;
  }

  // 簡易的なドメイン形式チェック
  if (!/^[a-z0-9]+([\-.][a-z0-9]+)*\.[a-z]{2,}$/.test(domain)) {
    showAddDomainStatus('有効なドメイン形式で入力してください（例: example.com）', 'error');
    return;
  }

  // 既に追加済みかチェック
  if (currentSettings.domains.some(d => d.domain === domain)) {
    showAddDomainStatus('このドメインは既に追加されています', 'error');
    return;
  }

  // 権限をリクエスト（https と http を個別に指定）
  const origins = [
    `https://${domain}/*`,
    `https://*.${domain}/*`,
    `http://${domain}/*`,
    `http://*.${domain}/*`
  ];

  try {
    const granted = await chrome.permissions.request({ origins });

    if (!granted) {
      showAddDomainStatus('権限が許可されませんでした', 'error');
      return;
    }

    // ドメインIDを生成
    const domainId = `domain-${Date.now()}`;

    // 設定に追加
    currentSettings.domains.push({
      id: domainId,
      domain: domain,
      enabled: true,
      rules: []
    });

    // storageに保存
    await chrome.storage.local.set({ settings: currentSettings });

    // Content Scriptを登録（matches は *:// パターンが使える）
    const contentScriptMatches = [`*://${domain}/*`, `*://*.${domain}/*`];
    await chrome.scripting.registerContentScripts([{
      id: `content-${domainId}`,
      matches: contentScriptMatches,
      js: ['content.js'],
      runAt: 'document_start'
    }]);

    // 表示を更新
    renderDomainList(currentSettings.domains);
    newDomainInput.value = '';
    showAddDomainStatus(`${domain} を追加しました`, 'success');

  } catch (error) {
    console.error('Just 5 Minutes: ドメイン追加エラー:', error);
    showAddDomainStatus('エラーが発生しました: ' + error.message, 'error');
  }
}

// ドメインの有効/無効を切り替え
async function toggleDomain(domainId, enabled) {
  const domain = currentSettings.domains.find(d => d.id === domainId);
  if (!domain) return;

  domain.enabled = enabled;
  await chrome.storage.local.set({ settings: currentSettings });

  // 表示を更新（ルール数表示の更新のため）
  renderDomainList(currentSettings.domains);

}

// パスルールの有効/無効を切り替え
async function toggleRule(domainId, ruleId, enabled) {
  const domain = currentSettings.domains.find(d => d.id === domainId);
  if (!domain) return;

  const rule = domain.rules.find(r => r.id === ruleId);
  if (!rule) return;

  rule.enabled = enabled;
  await chrome.storage.local.set({ settings: currentSettings });

  // 表示を更新（ルール数表示の更新のため）
  renderDomainList(currentSettings.domains);

}

// パスルールを追加
async function addRule(domainId, type, pattern, name) {
  // バリデーション
  if (!pattern) {
    return 'パターンを入力してください';
  }

  if (type === 'regex') {
    try {
      new RegExp(pattern);
    } catch (e) {
      return '正規表現が無効です: ' + e.message;
    }
  }

  // ドメインを検索
  const domain = currentSettings.domains.find(d => d.id === domainId);
  if (!domain) {
    return 'ドメインが見つかりません';
  }

  // ルールを追加
  const ruleId = `rule-${Date.now()}`;
  domain.rules.push({
    id: ruleId,
    name: name || pattern,
    type: type,
    pattern: pattern,
    enabled: true
  });

  // storageに保存
  await chrome.storage.local.set({ settings: currentSettings });

  // 表示を更新
  renderDomainList(currentSettings.domains);

  return null; // 成功
}

// パスルールを削除
async function deleteRule(domainId, ruleId) {
  const domain = currentSettings.domains.find(d => d.id === domainId);
  if (!domain) return;

  const ruleIndex = domain.rules.findIndex(r => r.id === ruleId);
  if (ruleIndex === -1) return;

  // 設定から削除
  domain.rules.splice(ruleIndex, 1);
  await chrome.storage.local.set({ settings: currentSettings });

  // 表示を更新
  renderDomainList(currentSettings.domains);

}

// ドメインを削除
async function deleteDomain(domainId) {
  const domainIndex = currentSettings.domains.findIndex(d => d.id === domainId);
  if (domainIndex === -1) {
    console.error('Just 5 Minutes: ドメインが見つかりません:', domainId);
    return;
  }

  const domain = currentSettings.domains[domainIndex];

  // 確認ダイアログ
  if (!confirm(`「${domain.domain}」を削除しますか？`)) {
    return;
  }

  try {
    // Content Script登録を解除
    try {
      await chrome.scripting.unregisterContentScripts({
        ids: [`content-${domainId}`]
      });
    } catch {
      // 登録されていない場合はエラーになるが無視
    }

    // 権限を解放（https と http 両方）
    const origins = [
      `https://${domain.domain}/*`,
      `https://*.${domain.domain}/*`,
      `http://${domain.domain}/*`,
      `http://*.${domain.domain}/*`
    ];

    try {
      await chrome.permissions.remove({ origins });
    } catch {
      // 権限がない場合はエラーになるが無視
    }

    // 設定から削除
    currentSettings.domains.splice(domainIndex, 1);
    await chrome.storage.local.set({ settings: currentSettings });

    // 表示を更新
    renderDomainList(currentSettings.domains);

  } catch (error) {
    console.error('Just 5 Minutes: ドメイン削除エラー:', error);
    alert('削除中にエラーが発生しました: ' + error.message);
  }
}

// ステータスメッセージを表示
function showAddDomainStatus(message, type) {
  addDomainStatusEl.textContent = message;
  addDomainStatusEl.className = 'add-domain-status ' + type;

  // 5秒後にメッセージを消す
  setTimeout(() => {
    addDomainStatusEl.textContent = '';
    addDomainStatusEl.className = 'add-domain-status';
  }, 5000);
}

// イベントリスナー
saveBtn.addEventListener('click', saveSettings);
addDomainBtn.addEventListener('click', addDomain);

// Enterキーでもドメイン追加
newDomainInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    addDomain();
  }
});

// ページ読み込み時に実行
init();
