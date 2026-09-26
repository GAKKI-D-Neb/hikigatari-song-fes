# 弾き語り曲投稿祭 2027 — Webサイト

2027年版サイトの実装・設定・公開方法を説明します。バックエンドの詳細とGAS操作は[backend/README.md](backend/README.md)を参照してください。

> **注意**：現時点では開催未定のテストサイトです。参加ルール、開催時期、掲載データの扱いは正式公開前に確認してください。

## 公開URLと技術構成

- 公開URL：<https://gakki-d-neb.github.io/hikigatari-song-fes/2027/>
- フロントエンド：Next.js（App Router）、React、TypeScript、静的書き出し
- データ生成：Python、ニコニコ動画、Google Sheets
- 感想受付：Google Apps Script（GAS）、Google Sheets
- 公開：GitHub Actions → GitHub Pages

## ディレクトリ

```text
2027/
├── README.md
├── config/
│   └── settings.json                 # この年の取得・公開・表示設定
├── backend/
│   ├── README.md                     # Python・Sheets・GASの運用
│   ├── requirements.txt
│   ├── scripts/
│   │   ├── config.py
│   │   ├── fetch_niconico.py
│   │   ├── generate_works.py
│   │   └── generate_comments.py
│   └── gas/
│       ├── work_details/
│       └── comments/
└── frontend/
    ├── app/                         # Home / Works / Comments / Guide / FAQ
    ├── components/                  # WorksClient、CommentModalなど
    ├── lib/siteLinks.ts             # settings.jsonをサーバー側で読み込み
    ├── public/
    │   ├── ogp.png
    │   └── data/
    │       ├── works.json
    │       └── comments.json
    └── .env.local                   # ローカル専用・Git管理外
```

## 主な機能

- **Home**：コンセプト、開催概要、作品情報フォーム、関連リンク、主催・制作クレジット。
- **Guide / FAQ**：参加方法、レギュレーション、よくある質問。開催前も公開可能。
- **Works**：ニコニコ動画の埋め込み、作品情報、キーワード検索、使用ボーカル・楽器による絞り込み、ランダム表示。作品紹介文が省略された場合のみ「続きを読む」を表示。
- **Comments**：作品に寄せられた承認済み感想を表示。作品ページの「感想を書く」から投稿でき、Xへの共有も選択可能。

作品情報登録フォームは任意です。感想はGASがGoogle Sheetsへ `approved = FALSE` で記録し、運営の承認後に公開用JSONへ取り込みます。

## フロントエンドのローカル起動

以下はリポジトリ直下から実行する例です。

```bash
cd 2027/frontend
npm ci
npm run dev
```

ローカルで感想投稿を試す場合のみ、`2027/frontend/.env.local` に以下を設定してください。

```dotenv
NEXT_PUBLIC_COMMENTS_API_URL=https://script.google.com/macros/s/実際のデプロイID/exec
```

ローカルでは通常 `NEXT_PUBLIC_BASE_PATH` を未設定（空文字列）で使用します。GitHub Pages向けビルドではWorkflowが公開用の値を指定します。

```bash
# 2027/frontend/ で実行
npm run build
```

## `config/settings.json` の管理

既存の `fetch` と `deploy` を維持しながら、以下の項目を管理します。ここでは関連部分だけを示します。**ファイル全体をこの抜粋で置き換えないでください。**

```json
{
  "links": {
    "work_registration_form": "",
    "twipla": "",
    "organizer_x": "https://x.com/GAKKI_D_Neb",
    "illustrator_x": ""
  },
  "site": {
    "phase": "prelaunch",
    "show_sample_works": false,
    "show_sample_comments": false,
    "accept_comments": false,
    "public_url": "https://gakki-d-neb.github.io/hikigatari-song-fes/2027/"
  }
}
```

### 開催フェーズ

| `site.phase` | 意味 | 想定表示 |
| --- | --- | --- |
| `prelaunch` | 開催前 | トップの「参加作品を聴く」を隠し、Guide / FAQ中心に公開 |
| `live` | 開催中 | 通常の作品・感想ページを公開 |
| `ended` | 開催終了後 | 作品・感想ページを引き続き公開 |

- `show_sample_works` / `show_sample_comments`：`prelaunch` 中に各ページのサンプルを公開するかどうか。トップページの「参加作品を聴く」はフェーズ判定のため、サンプル公開時でも表示しない設計です。
- `accept_comments`：Works上の投稿ボタン・モーダルの表示を制御。**GAS自体の受付停止ではありません。** 詳細はバックエンドREADMEを参照してください。
- `links`：URLが空ならフォーム・関連リンク・Xプロフィールを「準備中」と表示。
- `public_url`：公開サイトのURL。SNS用OGP画像のURL生成などに利用。
- `fetch`：ニコニコ動画からの作品取得条件。テスト用タグやシートのまま正式公開しないこと。
- `deploy`：公開ベースパス、参照シート名、感想投稿用GASの `/exec` URLなど。

`settings.json` は通常のJSONです。`//` コメントは使えません。補足が必要な場合は `_comment` という文字列プロパティを利用するかREADMEに記載してください。

```bash
# リポジトリ直下でJSON構文を検証
python3 -m json.tool 2027/config/settings.json >/dev/null
```

**重要**：`settings.json` を変更した場合、サイトを再ビルド・再デプロイする必要があります。

## 公開用画像

| 用途 | ファイル | 推奨比率・サイズ |
| --- | --- | --- |
| ファビコン | `frontend/app/icon.png` | 1:1、512×512pxを制作元の目安にする |
| OGP（SNSでURL共有時） | `frontend/public/ogp.png` | 約1.91:1、1200×630px |
| トップのキービジュアル | `frontend/public/` 配下の画像 | 16:9、1920×1080pxなど |
| ヘッダー左ロゴ | `frontend/public/` 配下の画像 | ほぼ正方形 |

キービジュアル・ヘッダーロゴを差し替える場合は、`app/page.tsx`、`components/Header.tsx` の画像参照先も更新します。画像の角丸はCSS側で調整します。

## データの更新とデプロイ

作品・感想の公開用JSONは、Pythonスクリプトが `frontend/public/data/` に生成します。生成方法、Google Sheetsの権限、GASの管理・承認フローは[backend/README.md](backend/README.md)を参照してください。

GitHub Actionsの `.github/workflows/deploy.yml` は、`config/deploy-years.json` に記載した年度をビルドしてGitHub Pagesへ配置します。現在の運用方針では `main` へのpush（PRのマージ後を含む）および手動実行を使用し、定期実行は必要になった段階で有効化します。**実際のトリガーはリポジトリ内の最新Workflowを正としてください。**

GASのWebアプリ更新はこのGitHub Pagesデプロイとは独立しています。

## テスト公開から正式公開へのチェック

1. トップとガイドに、開催未定・テスト公開であることが適切に表示されているか確認する。
2. `show_sample_works` / `show_sample_comments` とナビゲーションの表示を確認する。非表示でも公開済みJSONへの直接アクセスは可能なので、公開したくない情報を配布ファイルに含めない。
3. `fetch` のタグ・シートと、作品情報フォームなどのリンクを本番用に更新する。
4. OGP画像とファビコン、`public_url`、開催期間などを確認する。
5. 感想受付を始める場合はサイトの `accept_comments` **と** GASの `ACCEPT_POSTS` の両方を有効にし、投稿→承認→公開までテストする。
6. 仮のテスト公開中に `robots: noindex` にしている場合は、正式公開時に意図した設定へ切り替える。
