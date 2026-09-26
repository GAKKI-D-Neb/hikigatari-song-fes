
import type { Metadata } from "next";
import Link from "next/link";
import CommentsClient from "@/components/CommentsClient";
import { showComments, showWorks, siteSettings } from "@/lib/siteLinks";

export const metadata: Metadata = {
  title: "Comments",
};

export default function CommentsPage() {
  if (!showComments) {
    return (
      <section className="page-section">
        <div className="page-heading">
          <p className="eyebrow">COMMENTS</p>
          <h1>感想掲示板</h1>
          <p>「弾き語り曲投稿祭2027」の開催は未定です。感想掲示板は現在準備中です。</p>
        </div>
      </section>
    );
  }

  return (
    <section className="page-section">
      <div className="page-heading">
        <p className="eyebrow">COMMENTS</p>
        <h1>感想掲示板</h1>
        <p>
          弾き語り曲投稿祭2027 参加作品に対して寄せられた感想を掲載しています。
          {siteSettings.phase === "prelaunch" && (
            <>
              <br />
              <br />
              ※「弾き語り曲投稿祭2027」の開催は未定です。現在はWebサイトの動作確認のため、サンプルデータを表示しています。
            </>
          )}
        </p>
      </div>

      {showWorks && (
        <div className="comments-guide">
          <div>
            <h2>感想を書きたい方へ</h2>
            <p>
              感想は参加作品一覧の各作品カードにある「感想を書く」ボタンから投稿できます。<br />
              同じ感想をXに投稿することもできます。
            </p>
          </div>
          <Link className="button button--primary" href="/works">
            参加作品一覧へ
          </Link>
        </div>
      )}

      <CommentsClient />
    </section>
  );
}
