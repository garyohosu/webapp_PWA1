# AGENTS.md

## プロジェクト概要
- モバイル向けPWAの最小実装。ページは「Home」と「Settings」の2画面。
- フレームワークは不要（Vite + TypeScriptのバニラ構成）。
- ハッシュルーターで404回避。/dist を静的配信。

## セットアップ
- Install: `npm ci`（初回は `npm i` でも可）
- Dev: `npm run dev`
- Build: `npm run build`  → 出力先は `dist/`
- Preview: `npm run preview`（本番確認）

## PWA必須要件
- `public/manifest.webmanifest` を配備し `<link rel="manifest" ...>` を `index.html` に追加。
- `public/sw.js` を登録し、最低限のオフライン対応。更新時は SW のバージョンを上げる。
- HTTPS 前提。アイコンは 192/512px を用意。

## 守るべき方針（重要）
- 追加ライブラリは原則禁止。どうしても必要な場合は理由を提案 → 承認後に導入。
- いきなり大改造しない。小さな差分で繰り返す。
- **GitHubへのpushは私の許可が出るまで禁止。**
- 機能実装の前に「変更計画→合意→実装→デモURL提示→承認→commit」の順で進める。
- 秘密情報（APIキー等）は `.env` 参照にし、リポジトリへは書かない。

## 品質チェック
- ビルド後、デモで以下を確認してレポート:
  - インストール可能（manifest/HTTPS/SW 判定OK）
  - オフラインで Home が開ける
  - `#/settings` へ遷移可、404にならない
- コミット時は Conventional Commits で短いサマリ＋変更点リストを付与。

## 変更禁止事項
- PM2 等の常駐プロセス導入
- ルーティングを history モードへ変更
- サービスワーカーの過剰なキャッシュ戦略（最初は最小構成）

