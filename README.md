# 弾き語り曲投稿祭 Webサイト

「弾き語り曲投稿祭」のWebサイトを管理するリポジトリです。開催年ごとにサイトを分け、Next.jsで生成した静的サイトをGitHub Pagesに公開する構成です。

> **現在の状況**：2027年の開催は未確定です。現在のサイトは企画内容の案内・動作確認用であり、日程や参加ルールなどは変更される可能性があります。

## 公開先

- [2027年版サイト](https://gakki-d-neb.github.io/hikigatari-song-fes/2027/)

## ディレクトリ構成

```text
hikigatari-song-fes/
├── .github/workflows/
│   ├── deploy.yml                 # 各年のサイトをビルドしGitHub Pagesへ公開
│   └── fetch-works-2027.yml       # 2027年の作品データ取得用
├── config/
│   ├── deploy-years.json          # デプロイ対象年
│   └── year-sheets.example.json   # Google Sheets IDの設定例
├── 2027/
│   ├── README.md                  # 2027年版サイトの機能・設定・開発方法
│   ├── config/settings.json       # 2027年版の設定
│   ├── frontend/                  # Next.jsサイト
│   └── backend/
│       ├── README.md              # データ生成・Google Sheets・GASの運用手順
│       ├── scripts/               # Pythonスクリプト
│       └── gas/                   # Apps Scriptのソースコード
└── README.md
```

新しい開催年を追加する場合は年度別ディレクトリを作り、`config/deploy-years.json` と対応するWorkflow・設定を更新します。

## 開発・運用ドキュメント

- [2027年版サイトのREADME](2027/README.md)
- [2027年版バックエンドのREADME](2027/backend/README.md)

`credentials.json`、`config/year-sheets.json`、`.clasp.json`、各種ローカル環境設定などはGitHubにコミットしません。
