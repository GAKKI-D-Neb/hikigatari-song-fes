import type { Metadata } from "next";
import WorksClient from "@/components/WorksClient";

export const metadata: Metadata = {
  title: "Works",
};

export default function WorksPage() {
  return (
    <section className="page-section">
      <div className="page-heading">
        <p className="eyebrow">WORKS</p>
        <h1>参加作品</h1>
        <p>
          弾き語り曲投稿祭2027 参加作品を掲載しています。<br />
          タイトル・投稿者名から検索したり、ボーカルや使用楽器から作品を探せます。<br />
          「感想を書く」から、感想を感想掲示板に投稿することができます。
          <br />
          <br />
          ※「弾き語り曲投稿祭2027」の開催は未定です。現在はWebサイトの動作確認のため、サンプルデータを表示しています。
        </p>
      </div>
      <WorksClient />
    </section>
  );
}
