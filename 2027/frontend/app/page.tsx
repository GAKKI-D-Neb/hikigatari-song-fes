import Link from "next/link";
import CopyTextButton from "@/components/CopyTextButton";

import {
  siteLinks,
  siteSettings,
  showWorks,
} from "@/lib/siteLinks";

const basePath =
  process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const organizer = {
  name: "D-Neb（GAKKI）",
  xUrl: siteLinks.organizerX,
  icon: "/organizer-icon.png",
};

// 担当者決定後に名前と画像を設定してください。
// 画像は frontend/public/ に配置します。
const illustrator = {
  name: "担当者未定",
  xUrl: siteLinks.illustratorX,
  icon: "",
};

export default function Home() {
  const credits = [
    {
      role: "ORGANIZER",
      label: "主催",
      ...organizer,
    },
    {
      role: "ILLUSTRATION",
      label: "キービジュアル",
      ...illustrator,
    },
  ];

  return (
    <>
      {/* HERO */}
      <section className="hero hero--compact">
        <div className="hero__content">
          <p className="eyebrow">
            HIKIGATARI SONG FESTIVAL 2027
          </p>

          <h1>弾き語り曲投稿祭 2027</h1>

          <p className="hero__lead">
            歌唱から演奏まで、一人で完結できる
            オリジナル曲を楽しむ投稿祭です。

            {siteSettings.phase === "prelaunch" && (
              <>
                <br />
                <br />
                ※このページは現在制作中のテストページです。
                「弾き語り曲投稿祭2027」の開催は未定です。
              </>
            )}
          </p>

          <div className="button-row">
            {siteSettings.phase !== "prelaunch" && (
              <Link
                className="button button--primary"
                href="/works"
              >
                参加作品を聴く
              </Link>
            )}

            <Link
              className={
                showWorks
                  ? "button button--ghost"
                  : "button button--primary"
              }
              href="/guide"
            >
              参加方法を見る
            </Link>
          </div>
        </div>

        <div className="hero__visual">
          <img
            src={`${basePath}/key_visual.png`}
            alt="弾き語り曲投稿祭2027 キービジュアル"
          />
        </div>
      </section>

      {/* CONCEPT */}
      <section className="section section--compact">
        <div className="section-heading">
          <p className="eyebrow">CONCEPT</p>
          <h2>コンセプト</h2>
        </div>

        <div className="concept-text">
          <p>
            「弾き語り曲投稿祭」は、歌唱から演奏まで、一人で完結できる構成のオリジナル曲を投稿する投稿祭です。
            <br />
            ピアノやギターによる一般的な弾き語りに限らず、楽器の種類や音楽ジャンルは問いません。
          </p>

          <p>
            実際に弾き語りで録音する必要はなく、一人で演奏できる構成であれば、打ち込みやソフト音源、歌声合成を使用した作品で参加できます。
            <br />
            また、ボカロ曲投稿祭として開催しますが、歌い手やシンガーソングライターなど、人間歌唱によるオリジナル曲も歓迎します。
          </p>

          <p>
            みんなでたくさんの音を重ねて作り上げる音楽も素晴らしいですが、ここでは、たった一人で奏でる音楽を楽しんでみませんか。
          </p>
        </div>
      </section>

      {/* EVENT */}
      <section className="section section--compact">
        <div className="section-heading">
          <p className="eyebrow">EVENT</p>
          <h2>開催概要</h2>
        </div>

        <div className="event-panel">
          <dl className="event-summary">
            <div>
              <dt>開催期間</dt>
              <dd>2027年 ─ 日程未定</dd>
            </div>

            <div>
              <dt>投稿先</dt>
              <dd>ニコニコ動画</dd>
            </div>

            <div>
              <dt>参加タグ</dt>

              <dd className="copyable-value">
                <code>弾き語り曲投稿祭2027</code>

                <CopyTextButton
                  value="弾き語り曲投稿祭2027"
                />
              </dd>
            </div>

            <div>
              <dt>Xでの告知タグ</dt>

              <dd className="copyable-value">
                <code>#弾き語り曲投稿祭2027</code>

                <CopyTextButton
                  value="#弾き語り曲投稿祭2027"
                />
              </dd>
            </div>

            <div className="event-summary__full">
              <dt>参加作品条件</dt>

              <dd>
                <ul className="event-conditions">
                  <li>オリジナル曲であること</li>

                  <li>
                    開催期間中にニコニコ動画へ新規投稿する動画であること
                  </li>

                  <li>
                    歌唱を含め、一人で演奏可能な構成の曲であること
                  </li>
                </ul>

                <Link
                  className="text-link"
                  href="/guide"
                >
                  詳しい参加ルールを見る →
                </Link>
              </dd>
            </div>
          </dl>

          <div className="form-info-panel">
            <div>
              <strong>作品情報登録フォーム</strong>

              <p>
                投稿後にこちらから、Webサイトに掲載する作品情報を登録できます。
                登録は任意です。
              </p>
            </div>

            {siteLinks.workRegistrationForm ? (
              <a
                className="button button--ghost"
                href={siteLinks.workRegistrationForm}
                target="_blank"
                rel="noopener noreferrer"
              >
                作品情報登録フォーム ↗
              </a>
            ) : (
              <span
                className={
                  "button button--ghost " +
                  "form-info-panel__pending"
                }
              >
                作品情報フォーム（準備中）
              </span>
            )}
          </div>
        </div>

        {siteSettings.phase === "prelaunch" && (
          <p className="notice">
            ※ このページは現在モックアップです。
            開催内容・日程・レギュレーションは変更される可能性があります。
          </p>
        )}
      </section>

      {/* LINKS */}
      <section className="section section--compact">
        <div className="section-heading">
          <p className="eyebrow">LINKS</p>
          <h2>関連リンク</h2>
        </div>

        <div className="related-links">
          {siteLinks.twipla ? (
            <a
              className="related-link-card"
              href={siteLinks.twipla}
              target="_blank"
              rel="noopener noreferrer"
            >
              <div>
                <span className="related-link-card__label">
                  TwiPla
                </span>

                <strong>
                  開催告知・参加表明ページ
                </strong>

                <p>
                  開催概要や最新のお知らせはこちらから
                  確認できます。
                </p>
              </div>

              <span className="related-link-card__arrow">
                ↗
              </span>
            </a>
          ) : (
            <div
              className={
                "related-link-card " +
                "related-link-card--disabled"
              }
            >
              <div>
                <span className="related-link-card__label">
                  TwiPla
                </span>

                <strong>
                  開催告知・参加表明ページ
                </strong>

                <p>
                  開催概要や最新のお知らせはこちらから確認できます。
                </p>

                <span className="credit-placeholder">
                  準備中
                </span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* CREDITS */}
      <section
        className={
          "section section--compact credits-section"
        }
      >
        <div className="section-heading">
          <p className="eyebrow">CREDITS</p>
          <h2>主催・制作</h2>
        </div>

        <div className="credits-grid">
          {credits.map((person) => (
            <div
              className="credit-card"
              key={person.role}
            >
              <div className="credit-card__profile">
                <div className="credit-card__avatar">
                  {person.icon ? (
                    <img
                      src={`${basePath}${person.icon}`}
                      alt={`${person.name}のアイコン`}
                    />
                  ) : (
                    <span aria-hidden="true">
                      ?
                    </span>
                  )}
                </div>

                <div className="credit-card__info">
                  <span className="credit-card__role">
                    {person.role}
                  </span>

                  <p className="credit-card__label">
                    {person.label}
                  </p>

                  <h3>{person.name}</h3>
                </div>
              </div>

              {person.xUrl ? (
                <a
                  className="credit-card__link"
                  href={person.xUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={
                    `${person.name}のXプロフィール`
                  }
                >
                  <span
                    className="credit-card__x-icon"
                    aria-hidden="true"
                  >
                    𝕏
                  </span>

                  <span>Xプロフィール</span>

                  <span aria-hidden="true">
                    ↗
                  </span>
                </a>
              ) : (
                <span className="credit-card__pending">
                  準備中
                </span>
              )}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}