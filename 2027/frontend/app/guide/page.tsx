import type { Metadata } from "next";
import Link from "next/link";

import {
  siteLinks,
  siteSettings,
  showWorks,
  showComments,
} from "@/lib/siteLinks";

export const metadata: Metadata = {
  title: "Guide",
};

export default function GuidePage() {
  return (
    <section className="page-section">
      <div className="page-heading">
        <p className="eyebrow">GUIDE</p>

        <h1>参加ガイド</h1>

        <p>
          弾き語り曲投稿祭2027 参加の流れと、作品に関するルールを掲載しています。
        </p>

        {siteSettings.phase === "prelaunch" && (
          <p className="notice">
            「弾き語り曲投稿祭2027」の開催は未定です。
          </p>
        )}
      </div>

      {/* 参加の流れ */}
      <section className="guide-section">
        <div className="section-heading">
          <p className="eyebrow">
            HOW TO PARTICIPATE
          </p>

          <h2>参加の流れ</h2>
        </div>

        {/* 投稿者向け */}
        <div className="participation-group">
          <div
            className={
              "section-heading section-heading--small"
            }
          >
            <p className="eyebrow">
              FOR CREATORS
            </p>

            <h3>投稿者の方へ</h3>
          </div>

          <div className="flow-list">
            <div className="flow-item">
              <span>01</span>

              <div>
                <h3>楽曲を制作する</h3>

                <p>
                  参加ルールを確認して、一人で演奏可能な構成のオリジナル曲を制作してください。
                </p>

                <a
                  className="text-link"
                  href="#rules"
                >
                  参加ルールを確認する →
                </a>
              </div>
            </div>

            <div className="flow-item">
              <span>02</span>

              <div>
                <h3>ニコニコ動画に投稿する</h3>

                <p>
                  開催期間中に、参加タグ「弾き語り曲投稿祭2027」を設定してニコニコ動画へ投稿してください。
                  参加タグはタグロックをお願いします。
                </p>

                <p>
                  Xで告知する場合は、タグ「#弾き語り曲投稿祭2027」をご利用ください。
                </p>
              </div>
            </div>

            <div className="flow-item">
              <span>03</span>

              <div>
                <h3>
                  作品情報を登録する（任意）
                </h3>

                <p>
                  作品情報登録フォームから、使用ボーカル、使用楽器、Xアカウント、告知ポストURL、作品の紹介文など、Webサイトに掲載する情報を登録できます。
                </p>

                <p>
                  フォームへの登録は任意です。
                </p>

                {siteLinks.workRegistrationForm ? (
                  <a
                    className="button button--ghost"
                    href={
                      siteLinks.workRegistrationForm
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    作品情報登録フォーム ↗
                  </a>
                ) : (
                  <span
                    className="button button--ghost"
                  >
                    作品情報フォーム（準備中）
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 視聴者向け */}
        <div className="participation-group">
          <div
            className={
              "section-heading section-heading--small"
            }
          >
            <p className="eyebrow">
              FOR LISTENERS
            </p>

            <h3>視聴者の方へ</h3>
          </div>

          <div className="flow-list">
            <div className="flow-item">
              <span>01</span>

              <div>
                <h3>参加作品を聴く</h3>

                <p>
                  Webサイトの参加作品ページから、気になる作品を探してみてください。
                  使用ボーカルや楽器などで絞り込むこともできます。
                </p>

                {showWorks && (
                  <Link
                    className="text-link"
                    href="/works"
                  >
                    参加作品一覧を見る →
                  </Link>
                )}
              </div>
            </div>

            <div className="flow-item">
              <span>02</span>

              <div>
                <h3>作品に感想を送る</h3>

                <p>
                  気に入った作品があれば、是非感想を送ってみてください。
                  作品一覧の「感想を書く」ボタンから感想を投稿できます。
                </p>

                <p>
                  投稿された感想は、運営による確認後、Webサイトの感想掲示板に掲載されます。
                  同じ感想をXに投稿することもできます。
                </p>

                {showComments && (
                  <Link
                    className="text-link"
                    href="/comments"
                  >
                    感想掲示板を見る →
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 参加ルール */}
      <section
        className={
          "guide-section guide-section--rules"
        }
        id="rules"
      >
        <div
          className={
            "section-heading section-heading--small"
          }
        >
          <p className="eyebrow">RULES</p>
          <h2>参加ルール</h2>
        </div>

        <div className="prose-layout">
          <section className="prose-card">
            <h3>対象作品</h3>

            <div className="required-rules">
              <p className="rules-caption">
                必須条件
              </p>

              <ul
                className={
                  "rule-list rule-list--required"
                }
              >
                <li>
                  オリジナル曲であること
                </li>

                <li>
                  開催期間中にニコニコ動画へ新規投稿する動画であること
                </li>

                <li>
                  歌唱を含め、一人で演奏可能な構成の曲であること
                </li>
              </ul>
            </div>

            <div className="supplement-rules">
              <p className="rules-caption">
                補足
              </p>

              <ul className="rule-list">
                <li>
                  ボカロ曲投稿祭として開催しますが、人間歌唱のオリジナル曲での参加も歓迎します
                </li>

                <li>
                  動画として新規投稿であれば、過去に発表した曲の弾き語りアレンジなどでも参加可能です
                </li>

                <li>
                  他投稿祭との同時参加も可能です（同時参加先のルールにも従ってください）
                </li>
              </ul>
            </div>
          </section>

          <section
            className={
              "prose-card prose-card--accent"
            }
          >
            <h3>
              「一人で演奏可能」の考え方
            </h3>

            <p>
              弾き語り曲投稿祭では、歌唱を含め、一人で演奏可能な構成の楽曲を募集しています。
              <br />
              「ステージに一人だけで立ち、その人の歌唱・演奏で楽曲を成立させられるか」を基準としてください。
              <br />
              楽器の種類や数、演奏の難易度は問いません。
            </p>

            <div className="rule-example-table-wrap">
              <table className="rule-example-table">
                <thead>
                  <tr>
                    <th>判定</th>
                    <th>例</th>
                  </tr>
                </thead>

                <tbody>
                  <tr>
                    <td>
                      <span
                        className={
                          "status-badge status-badge--ok"
                        }
                      >
                        OK
                      </span>
                    </td>

                    <td>
                      歌＋ピアノ、歌＋ギターなどの一般的な弾き語りの構成
                    </td>
                  </tr>

                  <tr>
                    <td>
                      <span
                        className={
                          "status-badge status-badge--ok"
                        }
                      >
                        OK
                      </span>
                    </td>

                    <td>
                      歌＋ギター＋ハーモニカ（間奏）など、複数の楽器でも一人で演奏できる構成
                    </td>
                  </tr>

                  <tr>
                    <td>
                      <span
                        className={
                          "status-badge status-badge--ok"
                        }
                      >
                        OK
                      </span>
                    </td>

                    <td>
                      曲中で楽器を持ち替えながら、複数の楽器を一人で演奏する構成
                    </td>
                  </tr>

                  <tr>
                    <td>
                      <span
                        className={
                          "status-badge status-badge--ng"
                        }
                      >
                        NG
                      </span>
                    </td>

                    <td>
                      歌＋ピアノ＋バイオリンなど、一人では同時に演奏できない構成
                    </td>
                  </tr>

                  <tr>
                    <td>
                      <span
                        className={
                          "status-badge status-badge--ng"
                        }
                      >
                        NG
                      </span>
                    </td>

                    <td>
                      歌と同時にハーモニカを演奏するなど、歌唱を含めて一人では演奏できない構成
                    </td>
                  </tr>

                  <tr>
                    <td>
                      <span
                        className={
                          "status-badge status-badge--ng"
                        }
                      >
                        NG
                      </span>
                    </td>

                    <td>
                      主旋律とは別のコーラス・ハモリを同時に重ねるなど、一人では歌唱できない構成
                    </td>
                  </tr>

                  {/* 
                  <tr>
                    <td>
                      <span
                        className={
                          "status-badge status-badge--ng"
                        }
                      >
                        NG
                      </span>
                    </td>

                    <td>
                      手が3本必要なピアノフレーズなど、一人では物理的に演奏できない構成
                    </td>
                  </tr>
                  */}
                </tbody>
              </table>
            </div>

            <p className="form-note">
              一人で演奏できる構成であれば、一人で実際に演奏した実演録音である必要はありません。
              打ち込み・ソフト音源・一般的なMIX処理は可能です。
            </p>

            <p className="form-note">
              ボーカルのダブリングについては、MIX処理の範囲内としてOKとします。
            </p>

            <p className="form-note">
              一般的に一人で演奏するのが困難な構成であっても、特殊な奏法や高度な演奏技術を用いることで理論上は一人でも演奏が可能となる場合は、
              投稿者自身の判断で参加していただいて構いません。
              <br />
              ただし、本投稿祭は 「一人で演奏可能な限界」を競うことが目的ではありませんので、
              投稿祭の趣旨をご理解いただいた上で、ご参加をお願いいたします。
            </p>
          </section>
        </div>
      </section>
    </section>
  );
}