# 弾き語り曲投稿祭2027 — フロントエンド

このディレクトリは、弾き語り曲投稿祭2027のWebサイトを管理するNext.js（App Router）・React・TypeScriptのフロントエンドです。静的サイトとしてビルドし、GitHub Pagesで公開します。

- [2027年版全体の説明](../README.md)
- [バックエンド・Google Sheets・GASの運用](../backend/README.md)
- 公開先：<https://gakki-d-neb.github.io/hikigatari-song-fes/2027/>

> 開催状況・開催期間・参加ルールは正式な案内を優先してください。開催決定前のテスト公開では、画面上の注意書きやサンプルデータの扱いを確認してください。

## 1. ディレクトリ構成

```text
2027/frontend/
├── README.md
├── app/
│   ├── page.tsx                 # トップページ
│   ├── layout.tsx               # 共通レイアウト・メタデータ・OGP
│   ├── globals.css              # 共通スタイル
│   ├── icon.png                 # ファビコン
│   ├── works/page.tsx           # 参加作品一覧
│   ├── comments/page.tsx        # 感想掲示板
│   ├── guide/page.tsx           # 参加ガイド・ルール
│   └── faq/page.tsx             # よくある質問
├── components/
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── WorksClient.tsx
│   ├── CommentsClient.tsx
│   ├── CommentModal.tsx
│   └── CopyTextButton.tsx
├── lib/
│   └── siteLinks.ts             # 年度別設定の読み込み・表示条件
├── public/
│   ├── ogp.png                 # SNSリンク共有用の画像
│   ├── data/
│   │   ├── works.json          # Pythonが生成する公開用作品データ
│   │   └── comments.json       # Pythonが生成する承認済み感想データ
│   └── ...                     # キービジュアル・ヘッダーロゴ等
├── types.ts
├── package.json
├── package-lock.json
├── next.config.ts
└── .env.local                   # ローカル環境用（Git管理外）
```

年度共通の設定は `../config/settings.json`、デプロイ用のWorkflowはリポジトリ直下の `.github/workflows/deploy.yml` にあります。

## 2. ローカルで起動する

Node.jsを用意し、リポジトリ直下から次を実行します（GitHub ActionsではNode.js 22を使用）。

```bash
cd 2027/frontend
npm ci
npm run dev
```

起動後、通常は <http://localhost:3000/> を開きます。

**注意：** `lib/siteLinks.ts` は `process.cwd()` を基準に `../config/settings.json` を読み込みます。`npm run dev` や `npm run build` は **`2027/frontend` をカレントディレクトリとして**実行してください。

ローカルで感想投稿の動作を確認する場合は、`.env.local` にGASのWebアプリURLを設定します。

```dotenv
NEXT_PUBLIC_COMMENTS_API_URL=https://script.google.com/macros/s/実際のデプロイID/exec
```

ローカルでは `NEXT_PUBLIC_BASE_PATH` を通常は空欄（未設定）にします。GitHub Pages向けビルドではWorkflowが公開用ベースパスを渡します。`.env.local` に設定した値を変えた場合は開発サーバーを再起動してください。公開用設定に認証情報や秘密鍵を入れないでください（`NEXT_PUBLIC_` の値はブラウザから参照可能です）。

```bash
# 2027/frontend/ で実行
npm run build
```

静的ビルドの成果物は、現在の構成では `out/` に生成されます。

## 3. ページと主な機能

| 画面 | 主な内容 |
| --- | --- |
| Home (`/`) | 投稿祭の概要、開催案内、作品情報登録フォーム、TwiPla、主催・制作クレジット |
| Works (`/works`) | ニコニコ動画の埋め込み、検索、ボーカル・楽器での絞り込み、ランダム表示、作品への感想投稿 |
| Comments (`/comments`) | 運営が承認した感想の閲覧、作品への導線 |
| Guide (`/guide`) | 投稿方法、参加条件、OK・△・NGの例示 |
| FAQ (`/faq`) | 参加条件に関するよくある質問 |

`WorksClient.tsx` と `CommentsClient.tsx` はブラウザ側で `public/data/` のJSONを読み込みます。`CommentModal.tsx` はGASのWebアプリへ感想を送信します。

## 4. 年度別設定と開催フェーズ

`../config/settings.json` の `links` と `site` に、サイトのリンクと表示状態を設定します。以下は**設定項目の抜粋**です。既存の `fetch` と `deploy` は削除しないでください。

```json
{
  "links": {
    "work_registration_form": "",
    "twipla": "",
    "organizer_x": "https://x.com/GAKKI_D_Neb",
    "illustrator_x": ""
  },
  "site": {
    "_comment": "planning=開催決定前、prelaunch=開催決定後・開催前、live=開催中、ended=終了後",
    "phase": "planning",
    "show_sample_works": false,
    "show_sample_comments": false,
    "accept_comments": false,
    "public_url": "https://gakki-d-neb.github.io/hikigatari-song-fes/2027/"
  }
}
```

| `phase` | 意味 | 基本動作 |
| --- | --- | --- |
| `planning` | 開催決定前 | 「開催未定」の案内を表示。通常の作品一覧・感想掲示板は準備中 |
| `prelaunch` | 開催決定後・開催前 | 開催未定の案内は外す。通常の作品一覧・感想掲示板は準備中 |
| `live` | 開催中 | 参加作品・感想のページを通常表示 |
| `ended` | 開催終了後 | 参加作品・感想のページを引き続き表示 |

- `show_sample_works` / `show_sample_comments`：開催前でも対応するサンプルページの表示を許可します。実装上、**表示を隠してもJSONファイルへの直接アクセスは防げません**。
- `accept_comments`：Worksの「感想を書く」ボタンとモーダルの表示を制御します。**GAS側の受付可否は別設定**です。
- `links`：各URLが空文字列なら、対応するリンクは「準備中」と表示する設計です。
- `public_url`：OGPなどの絶対URL生成に使用します。

`lib/siteLinks.ts` が設定を読み込み、サーバー側のページへ表示用の値を提供します。`Header.tsx` などのClient Componentから、Node.jsのファイル読み込みを行う `siteLinks.ts` を直接インポートしないでください。必要な値は `layout.tsx` 等からpropsで渡します。

JSONに `//` や `/* */` コメントは使えません。必要なら `_comment` のような説明用プロパティを使用します。

```bash
# リポジトリ直下から実行
python3 -m json.tool 2027/config/settings.json >/dev/null
```

設定を変更したら再ビルド・再デプロイしてください。**各ページの「開催未定」表示条件は `planning` のみ**とし、`prelaunch` と混同しないようにします。

## 5. 画像・OGP・ファビコン

| 用途 | 配置先 | 推奨サイズ・比率 |
| --- | --- | --- |
| ファビコン | `app/icon.png` | 512×512px・1:1 |
| SNS共有用のOGP画像 | `public/ogp.png` | 1200×630px・約1.91:1 |
| トップのキービジュアル | `public/` 配下 | 1920×1080px・16:9など |
| ヘッダー左ロゴ | `public/` 配下 | 表示領域に合わせたコンパクトな画像 |

`app/icon.png` はNext.jsがファビコンとして認識します。OGP画像のURLや共有時のタイトル・説明文は `app/layout.tsx` の `metadata` で設定します。キービジュアルとヘッダーロゴは、それぞれ `app/page.tsx` と `components/Header.tsx` の画像参照先を変更します。角丸などの見た目は `app/globals.css` で調整します。

公開後のOGP画像の想定URL：<https://gakki-d-neb.github.io/hikigatari-song-fes/2027/ogp.png>

## 6. 作品・感想データの更新

`public/data/works.json` と `public/data/comments.json` は、通常はバックエンドのPythonスクリプトが生成します。データの生成・Google Sheetsの権限・GAS・承認作業の詳細は[バックエンドREADME](../backend/README.md)を参照してください。

感想公開までの流れ：投稿フォーム → GAS → Google Sheets（初期状態は未承認）→ 運営が承認 → Pythonで公開用JSONを再生成 → GitHub Pagesを再デプロイ。

感想投稿はブラウザの `no-cors` モードを利用しているため、画面側ではGASへの保存成功を直接確認できません。GAS側で受付を停止する場合は `ACCEPT_POSTS: false` にして、公開中のGAS Webアプリを新バージョンへ更新します。フロント側の `accept_comments: false` だけでは受付を止められません。

承認済み感想でも、公開作品一覧に対応する動画IDが存在しない場合は画面に表示されない場合があります。

## 7. GitHub Pagesへのデプロイ

リポジトリ直下の `.github/workflows/deploy.yml` を使用します。現在の構成では、`main` へのpush（PRマージを含む）またはGitHub Actionsからの手動実行で年度ごとのデータ生成・Next.jsビルド・Pagesへのデプロイを行います。実際の実行条件は最新のWorkflowを確認してください。

- 2027年分のビルドに用いる公開ベースパス：`/hikigatari-song-fes/2027`
- 公開先：<https://gakki-d-neb.github.io/hikigatari-song-fes/2027/>
- 秘密情報・年度別Sheets IDはGitHub SecretsからWorkflowが取得します。フロントエンド内には含めません。

ローカルでビルドが通っても、本番のJSON生成に必要なSheets権限がないとGitHub Actionsは失敗します。デプロイが成功しても感想が更新されない場合は、公開済みの `data/comments.json` とWorkflowの生成件数、スプレッドシートの承認状態を確認します。

## 8. 公開前チェック

- [ ] `phase` と開催未定・開催期間の表示が一致している
- [ ] 作品・感想のサンプル公開設定が意図どおりである
- [ ] フォーム、TwiPla、クレジットのURLを確認した
- [ ] `accept_comments` とGASの `ACCEPT_POSTS` の整合性を確認した
- [ ] 公開したくない個人情報・テストデータを `public/` に置いていない
- [ ] OGP画像・ファビコン・ヘッダーロゴの表示を確認した
- [ ] `layout.tsx` のOGP文面・`robots` が開催フェーズと一致している
- [ ] `npm run build` が成功し、公開URLでリンクとデータの読み込みを確認した
