// Content Script
// 対象ドメインのページに注入されるスクリプト

// 1秒ごとにtickを送信
setInterval(() => {
  // ページがアクティブ（見えている）場合のみ送信
  if (document.visibilityState === 'visible') {
    chrome.runtime.sendMessage({ type: 'tick' }).catch(() => {
      // Service Workerが停止している場合は無視
      // （次のtickで再接続される）
    });
  }
}, 1000);
