# 弾き語り曲投稿祭 2027 - Frontend Mock

Next.js App Router + TypeScript + CSS で作成したモックアップです。

## ローカル起動

```bash
npm install
npm run dev
```

ブラウザで `http://localhost:3000` を開きます。

## ダミーデータ

- `public/data/works.json`
- `public/data/comments.json`

将来は GitHub Actions で同じパスに JSON を生成してから `npm run build` する想定です。

## ロゴ・キービジュアル

- `public/logo-placeholder.svg`
- `public/hero-placeholder.svg`

本番素材ができたら差し替え可能です。

## GitHub Pages 用 basePath

ローカルでは設定不要です。

将来 `https://<user>.github.io/hikigatari-song-fes/2027/` のような URL へ公開する場合は、
GitHub Actions の build 時に例えば次のような環境変数を設定します。

```bash
NEXT_PUBLIC_BASE_PATH=/hikigatari-song-fes/2027 npm run build
```

実際の公開方式に合わせて後で調整してください。


## 2027 tags

- ニコニコ参加タグ: `弾き語り曲投稿祭2027`
- X告知ハッシュタグ: `#弾き語り曲投稿祭2027`
