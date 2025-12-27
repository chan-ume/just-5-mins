# Privacy Policy / プライバシーポリシー

Last updated: 2025-12-29

## English

### Overview
Just 5 Minutes is a Chrome extension that limits daily browsing time on specific websites. We are committed to protecting your privacy.

### Data Collection
**We do not collect any personal data.**

This extension:
- Does NOT collect personal information
- Does NOT track your browsing history
- Does NOT send any data to external servers
- Does NOT use analytics or tracking tools
- Does NOT require account registration

### Data Storage
All data is stored locally on your device using Chrome's storage API (`chrome.storage.local`). This includes:
- Your configured domains and rules
- Daily time limit settings
- Usage time for the current day

This data never leaves your device and is not accessible to us or any third party.

### Permissions
This extension requires the following permissions:
- **storage**: To save your settings and usage data locally
- **tabs**: To check the current tab's URL and redirect to the block page when time limit is exceeded
- **scripting**: To inject content scripts for time tracking on configured domains
- **host_permissions**: To track time on websites you configure (default: x.com, youtube.com)

### Data Deletion
All data is automatically deleted when you uninstall the extension. You can also clear your settings at any time through Chrome's extension settings.

### Changes to This Policy
We may update this Privacy Policy from time to time. Any changes will be posted on this page.

### Contact
If you have any questions about this Privacy Policy, please open an issue on our GitHub repository.

---

## 日本語

### 概要
Just 5 Minutesは、特定のウェブサイトの1日あたりの閲覧時間を制限するChrome拡張機能です。ユーザーのプライバシー保護に努めています。

### データ収集について
**本拡張機能は個人データを一切収集しません。**

本拡張機能は：
- 個人情報を収集しません
- 閲覧履歴を追跡しません
- 外部サーバーへデータを送信しません
- アナリティクスやトラッキングツールを使用しません
- アカウント登録を必要としません

### データの保存
すべてのデータは、Chromeのストレージ API（`chrome.storage.local`）を使用して、お使いのデバイス内にローカル保存されます。保存されるデータ：
- 設定したドメインとルール
- 1日の上限時間設定
- 当日の使用時間

これらのデータはデバイス外に送信されることはなく、開発者や第三者がアクセスすることはできません。

### 権限について
本拡張機能は以下の権限を使用します：
- **storage**: 設定と使用状況をローカルに保存するため
- **tabs**: 現在のタブのURLを確認し、上限超過時にブロック画面へ遷移させるため
- **scripting**: 設定されたドメインで時間計測用のContent Scriptを実行するため
- **host_permissions**: 設定したウェブサイト（デフォルト：x.com、youtube.com）で時間を計測するため

### データの削除
拡張機能をアンインストールすると、すべてのデータが自動的に削除されます。Chromeの拡張機能設定からいつでも設定をクリアすることもできます。

### ポリシーの変更
本プライバシーポリシーは随時更新される場合があります。変更があった場合は、このページに掲載します。

### お問い合わせ
本プライバシーポリシーに関するご質問は、GitHubリポジトリのIssueにてお問い合わせください。
