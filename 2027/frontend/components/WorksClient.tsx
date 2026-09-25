"use client";

import { useEffect, useMemo, useState } from "react";
import type { Work } from "@/types";
import CommentModal from "@/components/CommentModal";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

function uniqueSorted(values: string[]) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b, "ja"));
}

export default function WorksClient() {
  const [works, setWorks] = useState<Work[]>([]);
  const [query, setQuery] = useState("");
  const [vocal, setVocal] = useState("すべて");
  const [instrument, setInstrument] = useState("すべて");
  const [randomOrder, setRandomOrder] = useState<string[] | null>(null);
  const [selectedWork, setSelectedWork] = useState<Work | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${basePath}/data/works.json`)
      .then((response) => {
        if (!response.ok) throw new Error("作品データを取得できませんでした。");
        return response.json();
      })
      .then((data: Work[]) => setWorks(data))
      .finally(() => setLoading(false));
  }, []);

  const vocalOptions = useMemo(
    () => uniqueSorted(works.flatMap((work) => work.vocals)),
    [works]
  );
  const instrumentOptions = useMemo(
    () => uniqueSorted(works.flatMap((work) => work.instruments)),
    [works]
  );

  const filteredWorks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    let result = works.filter((work) => {
      const matchesQuery =
        !normalizedQuery ||
        work.title.toLowerCase().includes(normalizedQuery) ||
        work.creator.toLowerCase().includes(normalizedQuery) ||
        work.description.toLowerCase().includes(normalizedQuery);
      const matchesVocal =
        vocal === "すべて" || work.vocals.includes(vocal);
      const matchesInstrument =
        instrument === "すべて" || work.instruments.includes(instrument);

      return matchesQuery && matchesVocal && matchesInstrument;
    });

    if (randomOrder) {
      const orderMap = new Map(
        randomOrder.map((videoId, index) => [videoId, index])
      );
      result = [...result].sort(
        (a, b) =>
          (orderMap.get(a.videoId) ?? 9999) -
          (orderMap.get(b.videoId) ?? 9999)
      );
    }
    return result;
  }, [works, query, vocal, instrument, randomOrder]);

  const shuffle = () => {
    const ids = [...works.map((work) => work.videoId)];
    for (let i = ids.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    setRandomOrder(ids);
  };

  const toggleDescription = (videoId: string) => {
    setExpanded((current) => {
      const next = new Set(current);
      next.has(videoId) ? next.delete(videoId) : next.add(videoId);
      return next;
    });
  };

  return (
    <>
      <div className="filters">
        <label className="filter-field filter-field--wide">
          <span>Search</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="タイトル・投稿者・紹介文から検索"
          />
        </label>

        <label className="filter-field">
          <span>Vocal</span>
          <select value={vocal} onChange={(event) => setVocal(event.target.value)}>
            <option>すべて</option>
            {vocalOptions.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>

        <label className="filter-field">
          <span>Instrument</span>
          <select
            value={instrument}
            onChange={(event) => setInstrument(event.target.value)}
          >
            <option>すべて</option>
            {instrumentOptions.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>

        <div className="filter-actions">
          <button className="button button--small button--ghost" onClick={shuffle}>
            Random
          </button>
          {randomOrder && (
            <button className="text-button" onClick={() => setRandomOrder(null)}>
              元の順に戻す
            </button>
          )}
        </div>
      </div>

      <div className="result-line">
        {loading ? "読み込み中..." : `${filteredWorks.length} works`}
      </div>

      <div className="work-grid work-grid--song-list">
        {filteredWorks.map((work) => {
          const isExpanded = expanded.has(work.videoId);

          return (
            <article className="work-card work-card--song-list" key={work.videoId}>
              <div className="work-card__media">
                <div className="work-card__player">
                  <iframe
                    src={`https://embed.nicovideo.jp/watch/${work.videoId}`}
                    title={`${work.title} - ニコニコ動画`}
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                  />
                </div>

                <div className="work-card__media-actions">
                  <a
                    className="button button--tiny button--ghost work-link work-link--primary"
                    href={work.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    作品を見る
                  </a>

                  {work.xAccount && (
                    <a
                      className="button button--tiny button--ghost work-link work-link--secondary"
                      href={`https://x.com/${work.xAccount.replace(/^@/, "")}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Xプロフィール
                    </a>
                  )}

                  {work.announcementPostUrl && (
                    <a
                      className="button button--tiny button--ghost work-link work-link--secondary"
                      href={work.announcementPostUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      告知ポスト
                    </a>
                  )}
                </div>
              </div>

              <div className="work-card__content">
                <p className="work-card__creator">{work.creator}</p>
                <h2>{work.title}</h2>

                <div className="song-list-meta">
                  <div>
                    <span>Vocal</span>
                    <p>
                      {work.vocals.map((item, index) => (
                        <button
                          className="meta-link"
                          key={item}
                          onClick={() => setVocal(item)}
                        >
                          {item}{index < work.vocals.length - 1 ? " / " : ""}
                        </button>
                      ))}
                    </p>
                  </div>
                  <div>
                    <span>Instrument</span>
                    <p>
                      {work.instruments.map((item, index) => (
                        <button
                          className="meta-link"
                          key={item}
                          onClick={() => setInstrument(item)}
                        >
                          {item}{index < work.instruments.length - 1 ? " / " : ""}
                        </button>
                      ))}
                    </p>
                  </div>
                </div>

                <div className="work-card__description-wrap">
                  <p
                    className={
                      isExpanded
                        ? "work-card__description is-expanded"
                        : "work-card__description"
                    }
                  >
                    {work.description}
                  </p>
                  <button
                    className="description-toggle"
                    onClick={() => toggleDescription(work.videoId)}
                  >
                    {isExpanded ? "閉じる" : "続きを読む"}
                  </button>
                </div>

                <button
                  className="button button--small button--primary work-card__comment"
                  onClick={() => setSelectedWork(work)}
                >
                  感想を書く
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {!loading && filteredWorks.length === 0 && (
        <div className="empty-state">条件に一致する作品がありません。</div>
      )}

      <CommentModal work={selectedWork} onClose={() => setSelectedWork(null)} />
    </>
  );
}
