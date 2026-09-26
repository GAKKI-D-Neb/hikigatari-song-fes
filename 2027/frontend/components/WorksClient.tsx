"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { Work } from "@/types";
import CommentModal from "@/components/CommentModal";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

function uniqueSorted(values: string[]) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b, "ja"));
}

/** 紹介文が実際に省略される場合だけ展開ボタンを表示する。 */
function WorkDescription({
  description,
  isExpanded,
  onToggle,
}: {
  description: string;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useLayoutEffect(() => {
    const element = descriptionRef.current;
    const wrapper = wrapperRef.current;
    if (!element || !wrapper) return;

    const checkOverflow = () => {
      // 展開中も一時的に折りたたみ状態で計測する。
      // 計測後すぐ元に戻すので、展開状態は維持される。
      const wasExpanded = element.classList.contains("is-expanded");
      if (wasExpanded) element.classList.remove("is-expanded");

      const overflowing = element.scrollHeight > element.clientHeight + 1;

      if (wasExpanded) element.classList.add("is-expanded");
      setIsOverflowing((previous) =>
        previous === overflowing ? previous : overflowing
      );
    };

    checkOverflow();

    // レスポンシブな列幅変更やフォント読み込み後の変化に対応。
    const observer = new ResizeObserver(checkOverflow);
    observer.observe(wrapper);
    document.fonts?.ready.then(checkOverflow);

    return () => observer.disconnect();
  }, [description, isExpanded]);

  return (
    <div className="work-card__description-wrap" ref={wrapperRef}>
      <p
        ref={descriptionRef}
        className={
          isExpanded
            ? "work-card__description is-expanded"
            : "work-card__description"
        }
      >
        {description}
      </p>
      {(isOverflowing || isExpanded) && (
        <button
          type="button"
          className="description-toggle"
          onClick={onToggle}
        >
          {isExpanded ? "閉じる" : "続きを読む"}
        </button>
      )}
    </div>
  );
}

type WorksClientProps = {
  acceptComments: boolean;
};

export default function WorksClient({ acceptComments }: WorksClientProps) {
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

                <WorkDescription
                  description={work.description}
                  isExpanded={isExpanded}
                  onToggle={() => toggleDescription(work.videoId)}
                />

                {acceptComments && (
                  <button
                    className="button button--small button--primary work-card__comment"
                    onClick={() => setSelectedWork(work)}
                  >
                    感想を書く
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {!loading && filteredWorks.length === 0 && (
        <div className="empty-state">条件に一致する作品がありません。</div>
      )}

      {acceptComments && (
        <CommentModal work={selectedWork} onClose={() => setSelectedWork(null)} />
      )}
    </>
  );
}
