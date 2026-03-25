# NG Report

## 対象
- プロジェクト: `webapp_PWA`
- 調査日: 2026-03-25
- 対象 URL: `https://garyohosu.github.io/webapp_PWA/`

## 事象
- Android スマホの Chrome でアプリは表示できるが、インストールできない。
- Chrome メニューに `アプリをインストール` / `ホーム画面に追加` が出ない。
- 当初は `新しいバージョンがあります` という表示が出ており、インストール導線と混同しやすかった。

## 結論
- 初期状態では、PWA の配信パス不整合があり、インストール判定を阻害する構成不備があった。
- その不整合は修正済み。
- 修正後は、Chrome DevTools Protocol の `Page.getInstallabilityErrors` で installability error は `[]` となり、アプリ側の必須要件は満たしていることを確認した。
- PC Chrome では `インストール済みとして判定` まで確認できた。
- それでも Android 実機では `beforeinstallprompt` が発火せず、メニュー上の install 導線も出ていない。
- 現時点の判断として、未解決なのはアプリの技術要件不足ではなく、端末側 Chrome の UI/実験・履歴・環境依存の挙動である可能性が高い。

## 調査結果

### 1. 初期不具合
- `manifest.webmanifest` の `id` / `start_url` / `scope` が `/webapp_PWA/` 固定だった。
- 一方で、通常の開発・確認経路は `/` 配信前提だった。
- このため、表示はできても PWA としての install 判定が不安定になる構成だった。

関連ファイル:
- `public/manifest.webmanifest`
- `vite.config.ts`
- `static-server.cjs`

### 2. 更新通知とインストール導線の混同
- `新しいバージョンがあります` はブラウザの install 通知ではなく、アプリ独自の Service Worker 更新通知だった。
- 文言が誤解を招くため、`アプリ更新があります。今すぐ反映しますか？` に変更した。

関連ファイル:
- `src/main.ts`

### 3. 実装済みの修正
- `manifest` の `id` / `start_url` / `scope` を相対化した。
- Service Worker のバージョンとキャッシュ名を更新した。
- 静的サーバーをサブパス配信対応に修正した。
- `/webapp_PWA/sw.js` に対しても `Cache-Control: no-store` が効くようにした。
- ホーム画面に installability 診断 UI を追加した。
- `beforeinstallprompt`、`appinstalled`、HTTPS、manifest、Service Worker 制御状態、操作有無、滞在時間を画面で確認できるようにした。

関連コミット:
- `c6012eb fix: align pwa install paths`
- `523c295 feat: add pwa install diagnostics`
- `93f4e41 feat: track pwa engagement diagnostics`

### 4. 確認できた事実
- `HTTPS`: OK
- `Manifest`: OK
- `Service Worker 対応`: OK
- `Service Worker 制御`: OK
- `Tap / click 済み`: OK
- `30秒閲覧`: OK
- `display-mode standalone`: NG
  - これは未インストール状態では正常
- `install prompt`: NG
  - `beforeinstallprompt` が未発火

追加確認:
- Android スマホでは、シークレットモードではない通常タブで確認した。
- Android 側で NG だったのは `install prompt` と `display-mode standalone` のみ。
- このうち `display-mode standalone: NG` は未インストール状態では正常なため、実質的な未達は `install prompt` のみ。

### 5. ブラウザ側の直接検査
- GitHub Pages 上の公開 URL に対して、Chrome DevTools Protocol の `Page.getInstallabilityErrors` を実行。
- 結果は `installabilityErrors: []`。
- Android 相当の UA / モバイル画面サイズでも同じ結果だった。

判断:
- Chrome から見た installability の必須条件は満たしている。
- `beforeinstallprompt` 未発火は、そのまま「インストール不可」を意味しない。

### 6. Chrome 公式情報と一致する点
- Chrome はメニューからの install 条件と、自動 prompt の表示アルゴリズムを分けている。
- 自動 prompt は追加シグナルで出し分けられる。
- そのため、アプリが installable でも `beforeinstallprompt` が常に来るとは限らない。

参考:
- `https://developer.chrome.com/blog/update-install-criteria`
- `https://developer.chrome.com/blog/how_chrome_helps_users_install_the_apps_they_value`
- `https://developer.chrome.com/docs/devtools/progressive-web-apps/`

### 7. PC Chrome での追加確認
- PC Chrome では `インストール済みとして判定` を確認した。
- 診断表示は `standalone 表示です。ブラウザ側の install メニューは表示されません。` となった。
- これは PWA として起動済みの正常動作であり、PC 側ではインストール問題は再現していない。

判断:
- 公開中アプリは少なくとも PC Chrome ではインストール成立まで確認済み。
- 問題の残存範囲は Android 実機環境に限定される。

## 問題点

### 問題点1: 配信パス設計と manifest 設定が一致していなかった
- GitHub Pages 配信を前提にしながら、通常確認経路と manifest の基準パスがずれていた。
- PWA は表示確認だけでは不十分で、配信パス整合まで見ないと installability 不具合を見逃す。

### 問題点2: 更新通知の文言が誤認を招いた
- Service Worker 更新通知が、ユーザー視点ではインストール案内に見えた。
- 問題の切り分けを遅らせた。

### 問題点3: installability を画面上で観測する手段がなかった
- `beforeinstallprompt` の未発火を、コード要件不足なのか Chrome 側要因なのか切り分けにくかった。

### 問題点4: Android 実機の Chrome UI 依存を事前に考慮していなかった
- 自動 prompt とメニュー導線はブラウザ側の裁量が大きく、必ず同じ動作になる前提で確認していた。

## 対策

### 実施済み対策
- manifest を配信パス非依存の相対指定へ修正。
- Service Worker のキャッシュ更新とサブパス配信対応を実施。
- 更新通知文言を修正。
- installability 診断 UI を追加し、以下を画面表示するようにした。
  - HTTPS
  - Manifest
  - Service Worker 対応
  - Service Worker 制御
  - Tap / click 済み
  - 30秒閲覧
  - install prompt
  - display-mode standalone

### 追加で推奨する運用対策
- Android 実機確認は必ず GitHub Pages の HTTPS URL で実施する。
- `beforeinstallprompt` の有無だけで「インストール可否」を判断しない。
- 端末確認では以下も必ず記録する。
  - Chrome バージョン
  - 通常タブ / シークレット
  - `PC版サイト` の ON/OFF
  - 対象 origin のサイトデータ削除有無
  - 別端末再現有無

## 再現防止

### 1. PWA 確認チェックリストを固定化する
- リリース前に以下を必須確認にする。
  - manifest の `id` / `start_url` / `scope`
  - Service Worker 登録 URL
  - HTTPS 配信
  - オフラインで Home が開く
  - `#/settings` へ遷移できる
  - GitHub Pages 配信 URL で installability を確認する

### 2. 「更新」と「インストール」の導線を分ける
- 文言、ボタン、ダイアログの意味を明確に分離する。
- ユーザー向け表示で install / update を混同させない。

### 3. installability の観測手段を残す
- 今回追加した診断 UI は、今後もデバッグ用途として維持する価値がある。
- 少なくとも開発用フラグや debug モードでは残す。

### 4. ブラウザ依存の不確定要素を前提にする
- `beforeinstallprompt` は補助的イベントとして扱う。
- installability の最終確認は、必要に応じて Chrome DevTools Protocol / DevTools Manifest の installability 情報でも確認する。

## 現在の残課題
- Android 実機の特定端末・特定 Chrome 環境で、install menu が出ない理由は未確定。
- ただし、現時点ではアプリ側の installability 要件不足は再現していない。
- PC Chrome ではインストール済み判定まで確認できており、PC 側では再現していない。
- Android 通常タブでも、技術条件は満たしており、実質的な未達は `beforeinstallprompt` 未発火のみ。
- 次の切り分け対象はアプリコードではなく、端末側 Chrome の状態である。
