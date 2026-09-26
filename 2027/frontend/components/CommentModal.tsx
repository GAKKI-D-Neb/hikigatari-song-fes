
"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import type { Work } from "@/types";

type Props = {
  work: Work | null;
  onClose: () => void;
};

const commentsApiUrl =
  process.env.NEXT_PUBLIC_COMMENTS_API_URL ?? "";

// XアカウントをID形式に正規化
function normalizeXAccount(
  input: string
): string | null {
  const value = input.trim();

  if (!value) {
    return "";
  }

  const urlMatch = value.match(
    /^(?:https?:\/\/)?(?:www\.)?(?:x\.com|twitter\.com)\/([A-Za-z0-9_]{1,15})\/?(?:[?#].*)?$/i
  );

  const account = urlMatch
    ? urlMatch[1]
    : value.replace(/^@/, "");

  return /^[A-Za-z0-9_]{1,15}$/.test(account)
    ? account
    : null;
}

export default function CommentModal({
  work,
  onClose,
}: Props) {
  const [name, setName] = useState("");
  const [xAccount, setXAccount] = useState("");
  const [comment, setComment] = useState("");
  const [website, setWebsite] = useState("");
  const [shareToX, setShareToX] = useState(true);

  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  // 別作品を選択した際にフォームを初期化
  useEffect(() => {
    setName("");
    setXAccount("");
    setComment("");
    setWebsite("");
    setShareToX(true);
    setSending(false);
    setSubmitted(false);
    setError("");
  }, [work]);

  // 既存のX共有用テキスト
  const xText = useMemo(() => {
    if (!work) {
      return "";
    }

    const commentText = comment.trim();
    const announcementUrl =
      work.announcementPostUrl?.trim();

    // 告知ポストがある場合
    if (announcementUrl) {
      return [
        commentText,
        announcementUrl,
      ]
        .filter(Boolean)
        .join("\n\n");
    }

    // 告知ポストがない場合
    const workInfo = [
      work.title,
      work.url,
      "",
      `#${work.videoId}`,
    ].join("\n");

    return [
      commentText,
      workInfo,
    ]
      .filter(Boolean)
      .join("\n\n");
  }, [comment, work]);

  if (!work) {
    return null;
  }

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (sending) {
      return;
    }

    setError("");

    const trimmedName = name.trim();
    const trimmedComment = comment.trim();
    const normalizedXAccount =
      normalizeXAccount(xAccount);

    if (!trimmedComment) {
      setError("感想を入力してください。");
      return;
    }

    if (trimmedName.length > 50) {
      setError(
        "お名前は50文字以内で入力してください。"
      );
      return;
    }

    if (trimmedComment.length > 1000) {
      setError(
        "感想は1000文字以内で入力してください。"
      );
      return;
    }

    if (normalizedXAccount === null) {
      setError(
        "Xアカウントは @ID、IDのみ、" +
        "またはプロフィールURLで入力してください。"
      );
      return;
    }

    if (!commentsApiUrl) {
      setError(
        "投稿先が設定されていません。" +
        "運営にお問い合わせください。"
      );
      return;
    }

    // ユーザー操作中にX用の画面を開き、
    // ポップアップブロックを避ける。
    const xWindow = shareToX
      ? window.open("about:blank", "_blank")
      : null;

    if (xWindow) {
      xWindow.opener = null;
    }

    setSending(true);

    try {
      await fetch(commentsApiUrl, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type":
            "text/plain;charset=utf-8",
        },
        body: JSON.stringify({
          videoId: work.videoId,
          authorName: trimmedName,
          xAccount: normalizedXAccount,
          comment: trimmedComment,
          website,
        }),
      });

      // no-corsではGASの応答内容は取得できない。
      // 送信要求が完了しても保存成功とは断定しない。
      setSubmitted(true);

      if (xWindow && !xWindow.closed) {
        xWindow.location.replace(
          "https://twitter.com/intent/tweet?text=" +
          encodeURIComponent(xText)
        );
      }
    } catch {
      if (xWindow && !xWindow.closed) {
        xWindow.close();
      }

      setError(
        "送信処理中にエラーが発生しました。" +
        "保存されている可能性もあるため、" +
        "再送信する前にご確認ください。"
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={
        sending ? undefined : onClose
      }
    >
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="comment-modal-title"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <button
          className="modal-close"
          type="button"
          onClick={onClose}
          disabled={sending}
          aria-label="閉じる"
        >
          ×
        </button>

        {!submitted ? (
          <>
            <p className="eyebrow">
              COMMENT
            </p>

            <h2 id="comment-modal-title">
              感想を書く
            </h2>

            <p className="modal-work-title">
              {work.title}
            </p>

            <form
              className="comment-form"
              onSubmit={handleSubmit}
            >
              <label>
                <span>
                  お名前（任意）
                </span>

                <input
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  maxLength={50}
                  placeholder="例：GAKKI"
                  disabled={sending}
                />
              </label>

              <label>
                <span>
                  Xアカウント（任意）
                </span>

                <input
                  value={xAccount}
                  onChange={(event) =>
                    setXAccount(event.target.value)
                  }
                  maxLength={200}
                  placeholder="例：@GAKKI_D_Neb"
                  autoComplete="off"
                  disabled={sending}
                />
              </label>

              <label>
                <span>感想</span>

                <textarea
                  required
                  rows={6}
                  value={comment}
                  onChange={(event) =>
                    setComment(event.target.value)
                  }
                  maxLength={1000}
                  placeholder="作品への感想を書いてください"
                  disabled={sending}
                />
              </label>

              {/* スパム対策用の隠し項目 */}
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  left: "-10000px",
                  width: 1,
                  height: 1,
                  overflow: "hidden",
                }}
              >
                <label>
                  Webサイト
                  <input
                    type="text"
                    value={website}
                    onChange={(event) =>
                      setWebsite(event.target.value)
                    }
                    tabIndex={-1}
                    autoComplete="off"
                  />
                </label>
              </div>

              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={shareToX}
                  onChange={(event) =>
                    setShareToX(
                      event.target.checked
                    )
                  }
                  disabled={sending}
                />

                <span>
                  同じ感想をXにも投稿する
                </span>
              </label>

              <p className="form-note">
                投稿された感想は、運営による確認・承認後にWebサイトで公開されます。
                お名前とXアカウントを入力した場合は、それらも感想と一緒に公開されます。
                個人情報や、公開したくない内容は入力しないでください。
                なお、Xアカウントの本人確認は行いません。
                <br />
                <br />
                ブラウザの制約により、この画面では保存結果を確認できません。
                Xへの共有を選択した場合は、別画面で投稿を確定してください。
              </p>

              {error && (
                <p
                  className="form-note"
                  role="alert"
                >
                  {error}
                </p>
              )}

              <button
                className="button button--primary"
                type="submit"
                disabled={sending}
              >
                {sending
                  ? "送信中…"
                  : "感想を投稿"}
              </button>
            </form>
          </>
        ) : (
          <div className="success-state">
            <span
              className="success-state__mark"
              aria-hidden="true"
            >
              ✓
            </span>

            <h2 id="comment-modal-title">
              感想を送信しました。
            </h2>

            <p>
              保存された感想は、運営による承認後に公開されます。
              {shareToX &&
                " Xへの共有を選択した場合は、" +
                "開いた画面から投稿してください。"}
            </p>

            <button
              className="button button--ghost"
              type="button"
              onClick={onClose}
            >
              閉じる
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
