import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: {
    default: "弾き語り曲投稿祭 2027",
    template: "%s | 弾き語り曲投稿祭 2027",
  },
  description:
    "歌唱から演奏まで、一人でステージに立って成立させられるオリジナル曲を楽しむ投稿祭。",
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
          <Header />
          <main>{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
