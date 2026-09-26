# 2027年版バックエンド — データ生成・Google Sheets・GAS運用

`2027/backend/` では、作品データの取得、作品情報・感想の公開用JSON生成、感想受付用GASのソース管理を行います。サイトの画面・開催フェーズについては[2027年版README](../README.md)を参照してください。

## ディレクトリ構成

```text
2027/backend/
├── README.md
├── requirements.txt
├── scripts/
│   ├── config.py
│   ├── fetch_niconico.py
│   ├── generate_works.py
│   └── generate_comments.py
├── gas/
│   ├── work_details/            # 作品情報関係のGAS（管理する場合）
│   └── comments/
│       ├── Code.js または Code.gs # clone結果のファイル名をそのまま使用
│       ├── appsscript.json      # 既存GASからcloneしたマニフェスト
│       └── .clasp.json          # ローカルのスクリプトID設定・Git管理外
├── .venv/                       # Git管理外
└── tmp-data/                    # Git管理外
```

## 1. Pythonのローカル環境

リポジトリのルートから実行します。Python 3.12の例です。

```bash
cd 2027/backend
python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
```

リポジトリ直下に `credentials.json`（Googleサービスアカウントの認証情報）、`config/year-sheets.json`（年度別シートID）を用意します。これらはGitにコミットしません。`config/year-sheets.example.json` を設定例として参照してください。

サービスアカウントには、実際に使うシートに必要な権限を付与します。通常は作品一覧の更新先が編集可、作品情報・感想の読み取り先が閲覧可です。

```bash
# 以下は2027/backend/で実行
# 作品データの生成
python scripts/generate_works.py --year 2027 --mode live

# 承認済み感想の公開用JSONを生成
python scripts/generate_comments.py --year 2027

# 本番用JSONを上書きせず感想データを確認
mkdir -p tmp-data
python scripts/generate_comments.py --year 2027 --output ./tmp-data/comments.json
```

公開用JSONの通常の出力先は `2027/frontend/public/data/works.json` および `comments.json` です。`fetch_niconico.py` のタグ・件数等は `2027/config/settings.json` の `fetch` 設定も参照します。

## 2. 感想掲示板のデータの流れ

1. `CommentModal.tsx` から感想を感想受付用GAS Webアプリへ送信する。
2. GASが検証して `comments_2027` の `comments` シートへ追加する。追加時は `approved = FALSE`。
3. 運営が内容を確認し、公開する行の `approved` を `TRUE` にする。
4. `generate_comments.py` が承認済みの感想を取得し、公開用 `comments.json` を生成する。
5. GitHub Pagesの再デプロイでサイトに反映する。

`comments` シートの列順は次のとおりです。

| 列 | 見出し | 内容 |
| --- | --- | --- |
| A | `comment_id` | UUID |
| B | `created_at` | 投稿日時 |
| C | `video_id` | 作品のニコニコ動画ID |
| D | `comment` | 感想本文 |
| E | `author_name` | 名前（任意） |
| F | `x_account` | XアカウントID（任意） |
| G | `approved` | 公開承認。初期値はFALSE |

本文1,000文字・名前50文字を上限とする現在の仕様を前提としています。名前とXアカウントは感想とともに公開されるため、承認時には両方を確認してください。

## 3. 既存GASをcloneしてGitHubに登録する（初回のみ）

**既存のGASが原本です。** 初回は既存のスプレッドシートに紐づくGASをそのまま取得してGitへ登録します。別途作った `Code.gs` との比較・統合作業は行いません。**claspの設定により、取得するファイル名は `Code.js` になる場合もあります。** 以降は実際に取得したファイル名で管理します。

### 3-1. claspのインストール・ログイン

```bash
npm install -g @google/clasp
clasp --version
clasp login
```

GASを管理するGoogleアカウントでログインし、必要なら <https://script.google.com/home/usersettings> で **Google Apps Script API** を有効化します。

### 3-2. スクリプトIDを取得する

1. `comments_2027` のスプレッドシートを開く。
2. **拡張機能 → Apps Script** を開く。
3. Apps Scriptの **プロジェクトの設定 → スクリプトID** をコピーする。

ここで使うのは**スクリプトID**です。スプレッドシートIDや公開用WebアプリのデプロイIDとは異なります。

### 3-3. GASをcloneする

リポジトリにすでに `gas/comments/Code.gs` がある場合でも、未コミットの作業を保護するため、いったん空の作業用ディレクトリへcloneします。ここでは内容を比較せず、**既存GASから取得したものをそのまま採用**します。

```bash
# リポジトリ直下から実行
mkdir -p /tmp/hikigatari-comments-gas
cd /tmp/hikigatari-comments-gas

# <SCRIPT_ID> は実際の既存GASのスクリプトIDに置き換える
clasp clone-script "<SCRIPT_ID>"
ls -la
```

`Code.gs` のほか、複数の `.gs` / `.html` ファイルや `appsscript.json` がある場合は、**すべて**管理対象とします。既存GASに秘密情報をコード直書きしている場合は、公開リポジトリに登録する前に除去・移行してください。

### 3-4. 取得したコードをリポジトリに配置する

clone結果に含まれるすべてのソースファイルと `appsscript.json` を登録します。`Code.js` / `Code.gs` のどちらになるかは取得結果に合わせてください。リポジトリに以前の仮のコード（例：`Code.gs`）があり、clone結果が `Code.js` になった場合は、**同じスクリプトを二重にpushしないよう、古い仮ファイルを削除**してください。`git status` で未コミット変更がないことを確認してから作業します。

```bash
cd /path/to/hikigatari-song-fes
mkdir -p 2027/backend/gas/comments

cp -R /tmp/hikigatari-comments-gas/. 2027/backend/gas/comments/

# clone結果を確認し、Code.jsとCode.gsなど旧ファイルが重複していれば不要な方を整理
ls -la 2027/backend/gas/comments/
```

`/path/to/hikigatari-song-fes` は実際のリポジトリのパスに置き換えます。**`appsscript.json` は既存GASから取得したものをそのまま使い、独自の例示用マニフェストで置き換えないでください。**

リポジトリ直下の `.gitignore` に以下があることを確認します（既存のルールは削除しません）。

```gitignore
# ローカルのGAS接続設定・認証情報
**/.clasp.json
**/.clasprc.json
credentials.json
config/year-sheets.json
**/.venv/
**/tmp-data/
```

`~/.clasprc.json` には認証情報が含まれます。`.clasp.json` はスクリプトID等の接続設定であり、今回の運用ではGit管理外にします。

```bash
# リポジトリ直下で、追加されるファイルを確認
# 既存ファイルの置き換えがある場合もここで確認
git status --short

git add 2027/backend/gas/comments/ .gitignore

git commit -m "Track existing comments GAS with clasp"

# mainへの直接pushが認められる運用の場合
git push origin main
```

Pull Request運用の場合は作業用ブランチへpushしてPRを作成してください。**初回のclone・Git登録では `clasp push` は不要**です。既存GASの稼働中コードと公開Webアプリは変更されません。

## 4. ローカルで編集し、GASへ反映する（日常運用）

**Gitで管理しているGASソース（`Code.js` または `Code.gs` など）と `appsscript.json` を原本にします。** オンラインのApps Scriptエディタとローカルを同時に編集しないでください。GitHub PagesのデプロイだけではGASは更新されません。

### 4-1. 最新コードを取得する

```bash
cd /path/to/hikigatari-song-fes
git switch main
git pull --ff-only origin main
```

PR運用の場合は、ここで作業ブランチを作成して編集します。

### 4-2. ローカルのGASコードを編集する

```bash
cd 2027/backend/gas/comments
```

clone時に取得した `Code.js` または `Code.gs` など、必要なファイルをエディタで編集してください。変更内容を確認します。

```bash
git diff -- .
```

### 4-3. GASの編集用コードに反映する

```bash
# 必ず 2027/backend/gas/comments/ 内で実行
clasp show-file-status
clasp push
clasp open-script
```

`clasp show-file-status` で対象ファイルを確認してから `clasp push` を実行します。`clasp push` はGASプロジェクトの**ソース全体**を更新するため、ローカルにファイルの不足がないこと、接続先 `.clasp.json` が正しいことを確認してください。通常、`--force` は不要です。

この段階では公開中のWebアプリのコードはまだ切り替わりません。

### 4-4. テストして、既存のWebアプリを更新する

`clasp open-script` で開いたGASエディタで動作確認します。既存の `testDoPost` / `testDuplicatePost` などが実装されている場合は必要に応じて実行してください。テスト投稿は実際のシートに行を作る可能性があります。

テスト後、既存の `/exec` URLを維持するために、GAS画面で以下を操作します。

1. **デプロイ → デプロイを管理** を開く。
2. 稼働中のWebアプリを選択して**編集（鉛筆アイコン）**を押す。
3. **バージョン：新バージョン**を選択する。
4. **デプロイ**を押す。

新しいデプロイを作るのではなく、**既存のデプロイを更新**してください。公開後はサイトから投稿テストして動作を確認します。

### 4-5. GitHubへ保存する

```bash
# リポジトリ直下へ戻る
cd /path/to/hikigatari-song-fes

git add 2027/backend/gas/comments/
git commit -m "Update comments GAS"
git push origin main
```

PR運用の場合は対象ブランチにpushしてレビュー・マージします。チーム開発で公開手順を管理するなら、原則として**Gitにコミットした内容をレビュー・マージしたあと**に `clasp push` とGASの本番デプロイを実行してください。

### GAS側を直接修正してしまった場合

ローカルに未保存の作業がないことを確認したうえで、GAS側の変更を取得します。

```bash
cd /path/to/hikigatari-song-fes/2027/backend/gas/comments
git status
clasp pull
git diff
```

取得したコードをGitにコミットして運用を再開します。`clasp pull` はローカルのファイルを上書きし得るため、未コミットの編集内容がある場合は先に退避してください。

## 5. 感想受付の開始・停止

受付の可否は、サイトとGASの**2か所**で切り替えます。

| 設定 | 場所 | 役割 |
| --- | --- | --- |
| `site.accept_comments` | `2027/config/settings.json` | 「感想を書く」ボタンとフォームの表示 |
| `CONFIG.ACCEPT_POSTS` | `2027/backend/gas/comments/Code.gs` | GASでの実際の新規投稿受付 |

停止時はまずGASを `ACCEPT_POSTS: false` にして `clasp push` → **既存Webアプリを新バージョンで再デプロイ**し、次に `accept_comments: false` を設定してサイトを再ビルド・デプロイします。

再開時はGASを `ACCEPT_POSTS: true` にして更新し、続いてサイトを `accept_comments: true` にして公開します。両方の反映後に、投稿可能な状態か確認してください。

`show_sample_comments` は開催前のサンプル感想ページの表示設定であり、実際の投稿受付とは無関係です。

**注意**：フロントエンドからGASへのPOSTは `no-cors` を使用しており、ブラウザはGAS側の保存成功・失敗を読み取れません。投稿画面の表示だけで実際の受付状態を保証しないでください。

## 6. 感想の承認・公開・取り下げ

1. `comments_2027` の `comments` タブで未承認行を確認し、公開する行のG列 `approved` を `TRUE` にする。
2. `generate_comments.py` により承認済みデータの公開用JSONを再生成する。
3. GitHub Pagesへ再デプロイし、公開ページを確認する。

公開済み感想の取り下げも、`approved` を `FALSE` に戻したあと、JSONの再生成・サイトの再デプロイが必要です。スプレッドシートの値を変更するだけでは、すでに公開済みの静的JSONは変更されません。

## 関連リンク

- [Google公式：claspの使い方](https://developers.google.com/apps-script/guides/clasp)
- [clasp CLIのコマンド一覧（GitHub）](https://github.com/google/clasp)
- [Apps Script APIユーザー設定](https://script.google.com/home/usersettings)
