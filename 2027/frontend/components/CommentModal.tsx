"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { Work } from "@/types";

type Props = {
  work: Work | null;
  onClose: () => void;
};

export default function CommentModal({ work, onClose }: Props) {
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [shareToX, setShareToX] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  // 別作品を選択した際や、閉じて再度開いた際に入力状態を初期化します。
  useEffect(() => {
    setName("");
    setComment("");
    setShareToX(true);
    setSubmitted(false);
  }, [work]);

  const xText = useMemo(() => {
    if (!work) return "";

    const commentText = comment.trim();
    const announcementUrl = work.announcementPostUrl?.trim();

    // 投稿祭ハッシュタグは自動付与しません。
    if (announcementUrl) {
      return [commentText, announcementUrl].filter(Boolean).join("\n\n");
    }

    // ニコニコ動画の共有投稿に近い改行構成：
    // タイトル\nURL\n\n#sm番号
    const workInfo = [
      work.title,
      work.url,
      "",
      `#${work.videoId}`,
    ].join("\n");

    return [commentText, workInfo].filter(Boolean).join("\n\n");
  }, [comment, work]);

  if (!work) return null;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!comment.trim()) return;

    // 現在はモックアップのため、サーバーには保存されません。
    setSubmitted(true);

    if (shareToX) {
      const intentUrl =
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(xText)}`;
      window.open(intentUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="comment-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          className="modal-close"
          type="button"
          onClick={onClose}
          aria-label="閉じる"
        >
          ×
        </button>

        {!submitted ? (
          <>
            <p className="eyebrow">COMMENT</p>
            <h2 id="comment-modal-title">感想を書く</h2>
            <p className="modal-work-title">{work.title}</p>

            <form className="comment-form" onSubmit={handleSubmit}>
              <label>
                <span>お名前（任意）</span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="例：GAKKI"
                />
              </label>

              <label>
                <span>感想</span>
                <textarea
                  required
                  rows={6}
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="作品への感想を書いてください"
                />
              </label>

              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={shareToX}
                  onChange={(event) => setShareToX(event.target.checked)}
                />
                <span>同じ感想をXにも投稿する</span>
              </label>

              <p className="form-note">
                現在はモックアップのため、掲示板への保存は行われません。
                Xへの共有だけ実際に試すことができます。
              </p>
              <button className="button button--primary" type="submit">
                感想を投稿
              </button>
            </form>
          </>
        ) : (
          <div className="success-state">
            <span className="success-state__mark" aria-hidden="true">✓</span>
            <h2 id="comment-modal-title">投稿操作が完了しました</h2>
            <p>
              これはモックアップです。感想は保存されていません。
              Xへの共有を選択した場合は、開いた画面から投稿してください。
            </p>
            <button className="button button--ghost" type="button" onClick={onClose}>
              閉じる
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
