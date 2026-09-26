
"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  Comment,
  Work,
} from "@/types";

const basePath =
  process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export default function CommentsClient() {
  const [comments, setComments] =
    useState<Comment[]>([]);

  const [works, setWorks] =
    useState<Work[]>([]);

  const [query, setQuery] =
    useState("");

  const [workFilter, setWorkFilter] =
    useState("すべて");

  const [loadError, setLoadError] =
    useState(false);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      fetch(`${basePath}/data/comments.json`).then(
        (response) => {
          if (!response.ok) {
            throw new Error(
              "Failed to load comments"
            );
          }
          return response.json();
        }
      ),
      fetch(`${basePath}/data/works.json`).then(
        (response) => {
          if (!response.ok) {
            throw new Error(
              "Failed to load works"
            );
          }
          return response.json();
        }
      ),
    ])
      .then(([commentData, workData]) => {
        if (cancelled) return;

        setComments(commentData);
        setWorks(workData);
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const workMap = useMemo(
    () =>
      new Map(
        works.map((work) => [
          work.videoId,
          work,
        ])
      ),
    [works]
  );

  const filteredComments = useMemo(() => {
    const normalized =
      query.trim().toLowerCase();

    return comments.filter((comment) => {
      const work = workMap.get(
        comment.videoId
      );

      // 公開対象にない作品の感想は表示しない。
      if (!work) {
        return false;
      }

      const matchesWork =
        workFilter === "すべて" ||
        comment.videoId === workFilter;

      const matchesQuery =
        !normalized ||
        comment.comment
          .toLowerCase()
          .includes(normalized) ||
        comment.authorName
          .toLowerCase()
          .includes(normalized) ||
        (comment.xAccount ?? "")
          .toLowerCase()
          .includes(normalized) ||
        work.title
          .toLowerCase()
          .includes(normalized) ||
        work.creator
          .toLowerCase()
          .includes(normalized);

      return (
        matchesWork &&
        matchesQuery
      );
    });
  }, [
    comments,
    query,
    workFilter,
    workMap,
  ]);

  return (
    <>
      <div className="filters comments-filters">
        <label className="filter-field filter-field--wide">
          <span>Search</span>

          <input
            value={query}
            onChange={(event) =>
              setQuery(event.target.value)
            }
            placeholder="作品名・投稿者・感想から検索"
          />
        </label>

        <label className="filter-field">
          <span>Work</span>

          <select
            value={workFilter}
            onChange={(event) =>
              setWorkFilter(
                event.target.value
              )
            }
          >
            <option value="すべて">
              すべての作品
            </option>

            {works.map((work) => (
              <option
                key={work.videoId}
                value={work.videoId}
              >
                {work.title}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loadError ? (
        <p role="alert">
          感想を読み込めませんでした。
          時間をおいて再度お試しください。
        </p>
      ) : (
        <>
          <div className="result-line">
            {filteredComments.length} comments
          </div>

          <div className="comment-list">
            {filteredComments.map(
              (comment) => {
                const work = workMap.get(
                  comment.videoId
                );

                if (!work) {
                  return null;
                }

                // 手動編集されたJSONも考慮し、
                // 正しいXのIDのみリンクに使用する。
                const xAccount =
                  comment.xAccount &&
                  /^[A-Za-z0-9_]{1,15}$/.test(
                    comment.xAccount
                  )
                    ? comment.xAccount
                    : null;

                return (
                  <article
                    className="comment-card"
                    key={comment.commentId}
                  >
                    <div className="comment-card__work">
                      <p>FOR</p>

                      <h2>
                        {work.title}
                      </h2>

                      <span>
                        {work.creator}
                      </span>
                    </div>

                    <div className="comment-card__body">
                      <p className="comment-card__text">
                        {comment.comment}
                      </p>

                      <div className="comment-card__meta">
                        <span>
                          {comment.authorName || "匿名"}
                        </span>

                        {xAccount && (
                          <a
                            href={`https://x.com/${xAccount}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Xアカウント @${xAccount}`}
                          >
                            @{xAccount} ↗
                          </a>
                        )}

                        <time>
                          {comment.submittedAt}
                        </time>

                        <a
                          href={work.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          作品を聴く ↗
                        </a>
                      </div>
                    </div>
                  </article>
                );
              }
            )}
          </div>
        </>
      )}
    </>
  );
}
