/**
 * 弾き語り曲投稿祭2027
 * 感想投稿受付用Google Apps Script
 */

const CONFIG = {
  SHEET_NAME: "comments",
  MAX_COMMENT_LENGTH: 1000,
  MAX_NAME_LENGTH: 50,

  // 投稿受付を停止する場合はfalseに変更する
  ACCEPT_POSTS: true,

  // 同一内容の連続投稿を防止する時間（秒）
  DUPLICATE_INTERVAL: 60,
};

const HEADERS = [
  "comment_id",
  "created_at",
  "video_id",
  "comment",
  "author_name",
  "x_account",
  "approved",
];


/**
 * XアカウントをID形式に正規化する。
 *
 * 対応形式:
 * - GAKKI_D_Neb
 * - @GAKKI_D_Neb
 * - https://x.com/GAKKI_D_Neb
 * - https://twitter.com/GAKKI_D_Neb
 *
 * 未入力の場合は空文字列、
 * 不正な形式の場合はnullを返す。
 */
function normalizeXAccount(value) {
  const text = String(value || "").trim();

  if (!text) {
    return "";
  }

  const match = text.match(
    /^(?:https?:\/\/)?(?:www\.)?(?:x\.com|twitter\.com)\/([A-Za-z0-9_]{1,15})\/?(?:[?#].*)?$/i
  );

  const account = match
    ? match[1]
    : text.replace(/^@/, "");

  if (!/^[A-Za-z0-9_]{1,15}$/.test(account)) {
    return null;
  }

  return account;
}


/**
 * ユーザー入力がGoogle Sheetsの数式として
 * 解釈されないようにする。
 */
function safeText(value) {
  const text = String(value || "");

  if (/^[=+\-@]/.test(text)) {
    return "'" + text;
  }

  return text;
}


/**
 * 同一投稿を識別するためのキーを生成する。
 *
 * 動画ID・投稿者名・Xアカウント・感想本文が
 * すべて同じ場合に、同一投稿として扱う。
 *
 * 感想本文を直接キャッシュに保存せず、
 * SHA-256のハッシュ値を使用する。
 */
function createDuplicateKey(
  videoId,
  authorName,
  xAccount,
  comment
) {
  const content = JSON.stringify([
    videoId,
    authorName,
    xAccount,
    comment,
  ]);

  const digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    content,
    Utilities.Charset.UTF_8
  );

  const hash = digest
    .map((byte) => {
      const value = (byte + 256) % 256;

      return value
        .toString(16)
        .padStart(2, "0");
    })
    .join("");

  return "comment:" + hash;
}


/**
 * JSON形式のレスポンスを返す。
 */
function jsonResponse(data) {
  return ContentService
    .createTextOutput(
      JSON.stringify(data)
    )
    .setMimeType(
      ContentService.MimeType.JSON
    );
}


/**
 * POSTリクエストを受信する。
 *
 * 想定するリクエスト:
 * {
 *   "videoId": "sm12345678",
 *   "authorName": "投稿者名",
 *   "xAccount": "@example",
 *   "comment": "感想本文",
 *   "website": ""
 * }
 *
 * authorNameとxAccountは任意。
 * websiteはスパム対策用の隠し項目。
 */
function doPost(e) {
  try {
    // ----------------------------------
    // リクエストの検証
    // ----------------------------------

    if (
      !e ||
      !e.postData ||
      !e.postData.contents
    ) {
      return jsonResponse({
        ok: false,
        error: "EMPTY_REQUEST",
      });
    }

    const request = JSON.parse(
      e.postData.contents
    );

    if (
      !request ||
      typeof request !== "object" ||
      Array.isArray(request)
    ) {
      return jsonResponse({
        ok: false,
        error: "INVALID_REQUEST",
      });
    }

    // 簡易的なボット対策
    // 隠し項目に値が入っている場合は保存しない
    if (request.website) {
      return jsonResponse({
        ok: true,
      });
    }

    // ----------------------------------
    // 投稿受付状況の確認
    // ----------------------------------

    if (!CONFIG.ACCEPT_POSTS) {
      return jsonResponse({
        ok: false,
        error: "POSTING_DISABLED",
      });
    }

    // ----------------------------------
    // 投稿内容の取得
    // ----------------------------------

    const videoId = String(
      request.videoId || ""
    ).trim();

    const authorName = String(
      request.authorName || ""
    ).trim();

    const xAccount = normalizeXAccount(
      request.xAccount
    );

    const comment = String(
      request.comment || ""
    ).trim();

    // ----------------------------------
    // 入力値の検証
    // ----------------------------------

    if (!/^sm[0-9]+$/.test(videoId)) {
      return jsonResponse({
        ok: false,
        error: "INVALID_VIDEO_ID",
      });
    }

    if (
      comment.length === 0 ||
      comment.length > CONFIG.MAX_COMMENT_LENGTH
    ) {
      return jsonResponse({
        ok: false,
        error: "INVALID_COMMENT",
      });
    }

    if (
      authorName.length >
      CONFIG.MAX_NAME_LENGTH
    ) {
      return jsonResponse({
        ok: false,
        error: "INVALID_AUTHOR_NAME",
      });
    }

    if (xAccount === null) {
      return jsonResponse({
        ok: false,
        error: "INVALID_X_ACCOUNT",
      });
    }

    // ----------------------------------
    // スプレッドシートの取得
    // ----------------------------------

    const spreadsheet =
      SpreadsheetApp.getActiveSpreadsheet();

    if (!spreadsheet) {
      throw new Error(
        "スプレッドシートを取得できませんでした。"
      );
    }

    const sheet = spreadsheet.getSheetByName(
      CONFIG.SHEET_NAME
    );

    if (!sheet) {
      throw new Error(
        "commentsシートが見つかりません。"
      );
    }

    // ----------------------------------
    // 排他制御・重複確認・データ保存
    // ----------------------------------

    const lock = LockService.getScriptLock();

    lock.waitLock(10000);

    try {
      // ヘッダーの整合性を確認
      const headers = sheet
        .getRange(1, 1, 1, HEADERS.length)
        .getValues()[0];

      if (
        JSON.stringify(headers) !==
        JSON.stringify(HEADERS)
      ) {
        throw new Error(
          "シートのヘッダーが正しくありません。"
        );
      }

      // --------------------------------
      // 同一内容の連続投稿を防止
      // --------------------------------

      const cache = CacheService.getScriptCache();

      const duplicateKey = createDuplicateKey(
        videoId,
        authorName,
        xAccount,
        comment
      );

      if (cache.get(duplicateKey) !== null) {
        return jsonResponse({
          ok: true,
          duplicate: true,
        });
      }

      // --------------------------------
      // 新規投稿の保存
      // --------------------------------

      const commentId = Utilities.getUuid();
      const createdAt = new Date();

      // 新規投稿は必ず未承認にする。
      // approvedは最後のG列。
      sheet.appendRow([
        commentId,
        createdAt,
        videoId,
        safeText(comment),
        safeText(authorName),
        xAccount,
        false,
      ]);

      SpreadsheetApp.flush();

      // 保存成功後に重複判定用キャッシュを登録
      cache.put(
        duplicateKey,
        "1",
        CONFIG.DUPLICATE_INTERVAL
      );

      return jsonResponse({
        ok: true,
        commentId: commentId,
      });

    } finally {
      lock.releaseLock();
    }

  } catch (error) {
    console.error(error);

    return jsonResponse({
      ok: false,
      error: "INTERNAL_ERROR",
    });
  }
}


/**
 * GASエディタから実行するテスト。
 *
 * 同じ投稿内容で2回実行すると、
 * 2回目は重複投稿として処理される。
 */
function testDoPost() {
  const request = {
    postData: {
      contents: JSON.stringify({
        videoId: "sm46282210",
        authorName: "テスト投稿者",
        xAccount: "@GAKKI_D_Neb",
        comment: "テスト投稿です。公開前に確認します。",
        website: "",
      }),
    },
  };

  const response = doPost(request);

  console.log(response.getContent());
}


/**
 * 重複投稿防止機能のテスト。
 *
 * 同じ内容を連続送信して、
 * 2回目が重複と判定されることを確認する。
 */
function testDuplicatePost() {
  // 過去のテストによるキャッシュとの
  // 重複を避けるため、毎回異なる感想を生成する。
  const comment = (
    "重複投稿テスト: " +
    Utilities.getUuid()
  );

  const request = {
    postData: {
      contents: JSON.stringify({
        videoId: "sm46282210",
        authorName: "重複テスト",
        xAccount: "",
        comment: comment,
        website: "",
      }),
    },
  };

  const firstResponse = doPost(request);
  const secondResponse = doPost(request);

  console.log(
    "1回目: " +
    firstResponse.getContent()
  );

  console.log(
    "2回目: " +
    secondResponse.getContent()
  );
}