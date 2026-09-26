import type { Metadata } from "next";
import "./globals.css";

import Header from "@/components/Header";
import Footer from "@/components/Footer";

import {
  siteSettings,
  showWorks,
  showComments,
} from "@/lib/siteLinks";

// 実際の公開URLをsettings.jsonから取得
const publicUrl = siteSettings.publicUrl.replace(
  /\/+$/,
  ""
);

const basePath =
  process.env.NEXT_PUBLIC_BASE_PATH ?? "";

// 公開URLが設定されている場合のみ
// OGP画像の絶対URLを生成
const ogpImageUrl = publicUrl
  ? `${publicUrl}/ogp.png`
  : undefined;

export const metadata: Metadata = {
  metadataBase: publicUrl
    ? new URL(`${publicUrl}/`)
    : undefined,

  title: {
    default: "弾き語り曲投稿祭 2027",
    template: "%s | 弾き語り曲投稿祭 2027",
  },

  description:
    siteSettings.phase === "prelaunch"
      ? "歌唱から演奏まで、一人で完結できるオリジナル曲を楽しむ投稿祭。現在は開催未定のテストサイトです。"
      : "歌唱から演奏まで、一人でステージに立って成立させられるオリジナル曲を楽しむ投稿祭。",

  openGraph: {
    type: "website",
    locale: "ja_JP",
    siteName: "弾き語り曲投稿祭 2027",

    ...(publicUrl && {
      url: `${publicUrl}/`,
    }),

    ...(ogpImageUrl && {
      images: [
        {
          url: ogpImageUrl,
          width: 1200,
          height: 630,
          alt: "弾き語り曲投稿祭 2027",
        },
      ],
    }),
  },

  twitter: {
    card: "summary_large_image",

    ...(ogpImageUrl && {
      images: [ogpImageUrl],
    }),
  },

  // 開催前のテスト公開中は
  // 検索エンジンへの登録を控える
  robots:
    siteSettings.phase === "prelaunch"
      ? {
          index: false,
          follow: false,
        }
      : {
          index: true,
          follow: true,
        },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>
        <div className="site-shell">
          <Header
            showWorks={showWorks}
            showComments={showComments}
          />

          <main>{children}</main>

          <Footer />
        </div>
      </body>
    </html>
  );
}