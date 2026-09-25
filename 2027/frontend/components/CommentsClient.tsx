"use client";

import { useEffect, useMemo, useState } from "react";
import type { Comment, Work } from "@/types";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export default function CommentsClient() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [works, setWorks] = useState<Work[]>([]);
  const [query, setQuery] = useState("");
  const [workFilter, setWorkFilter] = useState("すべて");

  useEffect(() => {
    Promise.all([
      fetch(`${basePath}/data/comments.json`).then((response) => response.json()),
      fetch(`${basePath}/data/works.json`).then((response) => response.json()),
    ]).then(([commentData, workData]) => {
      setComments(commentData);
      setWorks(workData);
    });
  }, []);

  const workMap = useMemo(
    () => new Map(works.map((work) => [work.videoId, work])),
    [works]
  );

  const filteredComments = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return comments.filter((comment) => {
      const work = workMap.get(comment.videoId);
      const matchesWork =
        workFilter === "すべて" || comment.videoId === workFilter;
      const matchesQuery =
        !normalized ||
        comment.comment.toLowerCase().includes(normalized) ||
        comment.authorName.toLowerCase().includes(normalized) ||
        work?.title.toLowerCase().includes(normalized) ||
        work?.creator.toLowerCase().includes(normalized);

      return matchesWork && matchesQuery;
    });
  }, [comments, query, workFilter, workMap]);

  return (
    <>
      <div className="filters comments-filters">
        <label className="filter-field filter-field--wide">
          <span>Search</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="作品名・投稿者・感想から検索"
          />
        </label>

        <label className="filter-field">
          <span>Work</span>
          <select
            value={workFilter}
            onChange={(event) => setWorkFilter(event.target.value)}
          >
            <option value="すべて">すべての作品</option>
            {works.map((work) => (
              <option value={work.videoId} key={work.videoId}>
                {work.title}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="result-line">{filteredComments.length} comments</div>

      <div className="comment-list">
        {filteredComments.map((comment) => {
          const work = workMap.get(comment.videoId);
          if (!work) return null;

          return (
            <article className="comment-card" key={comment.commentId}>
              <div className="comment-card__work">
                <p>FOR</p>
                <h2>{work.title}</h2>
                <span>{work.creator}</span>
              </div>

              <div className="comment-card__body">
                <p className="comment-card__text">{comment.comment}</p>
                <div className="comment-card__meta">
                  <span>{comment.authorName || "匿名"}</span>
                  <time>{comment.submittedAt}</time>
                  <a href={work.url} target="_blank" rel="noreferrer">
                    作品を聴く ↗
                  </a>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
