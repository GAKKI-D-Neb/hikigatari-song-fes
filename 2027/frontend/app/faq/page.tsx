import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ",
};

const faqs = [
  {
    q: "実際に弾き語りで演奏する必要がありますか？",
    a: "いいえ。実際に演奏して録音する必要はありません。一人で演奏可能な構成になっていれば、打ち込みやソフト音源を使用した作品でも参加できます。",
  },
  {
    q: "人間歌唱の曲でも参加できますか？",
    a: "はい。ボカロ曲投稿祭として開催しますが、オリジナル曲であれば、歌い手やシンガーソングライターの方などの人間歌唱作品での参加も歓迎いたします。",
  },
  {
    q: "複数の楽器を使ってもいいですか？",
    a: "はい。一人で演奏可能であれば、楽器数そのものに制限はありません。",
  },
  {
    q: "曲中で楽器を持ち替えてもいいですか？",
    a: "はい。一人で行える範囲であれば、曲中での楽器の持ち替えも可能です。",
  },
  {
    q: "ボーカルをダブリングしてもいいですか？",
    a: "はい。ダブリングなどの一般的なMIX処理については制限しません。ただし、主旋律とは別のコーラスやハモリを重ねるなど、一人では同時に歌唱できない構成は、投稿祭の趣旨からご遠慮ください。",
  },
  {
    q: "過去曲でも参加できますか？",
    a: "動画として新規投稿であれば、過去に発表した曲のアレンジでも参加可能です。過去曲を弾き語り向けにリアレンジし、新規動画として投稿することは歓迎いたします。",
  },
  {
    q: "他の投稿祭と同時参加できますか？",
    a: "はい。ただし、同時参加する企画側のレギュレーションにも従ってください。",
  },
];

export default function FaqPage() {
  return (
    <section className="page-section">
      <div className="page-heading">
        <p className="eyebrow">FAQ</p>
        <h1>よくある質問</h1>
        <p>弾き語り投稿祭2027 参加条件について迷いやすい点をまとめています。</p>
      </div>

      <div className="faq-list">
        {faqs.map((faq) => (
          <details className="faq-item" key={faq.q}>
            <summary>{faq.q}</summary>
            <p>{faq.a}</p>
          </details>
        ))}
      </div>

      <section className="contact-panel">
        <p className="eyebrow">CONTACT</p>
        <h2>解決しない場合</h2>
        <p>
          参加条件や作品について判断に迷う場合は、主催 D-Neb（GAKKI）までお問い合わせください。
        </p>
        <a
          className="button button--ghost"
          href="https://x.com/GAKKI_D_Neb"
          target="_blank"
          rel="noreferrer"
        >
          Xで問い合わせる
        </a>
      </section>
    </section>
  );
}
