
/**
 * 弾き語り曲投稿祭2027
 * Googleフォーム回答 → 運営管理シート
 */

// 転記先 work_details_2027 のスプレッドシートID
const DESTINATION_SPREADSHEET_ID = "1M6XP_eb7VsS7i-BzmeCb2l-Wf8JyWPWbLBYdq34-Zm0";

// フォーム回答シートのタブ名
const SOURCE_SHEET_NAME = "フォームの回答 1";

// 転記先のシート名
const DESTINATION_SHEET_NAME = "work_details";

// フォーム回答の列数
const SOURCE_COLUMN_COUNT = 8;

// 転記先のヘッダー
const DESTINATION_HEADERS = [
  "タイムスタンプ",
  "作品のニコニコ動画URL",
  "投稿者のXアカウント",
  "作品の告知ポストURL",
  "使用ボーカル",
  "使用キャラクター名",
  "使用楽器",
  "作品の紹介文",
  "回答ID",
  "動画ID",
  "使用キャラクター名（修正後）",
  "使用楽器（修正後）",
  "確認状況",
  "掲載対象",
];


/**
 * 転記先のシートを取得する。
 * 存在しなければ新規作成する。
 */
function getDestinationSheet() {
  const spreadsheet = SpreadsheetApp.openById(
    DESTINATION_SPREADSHEET_ID
  );

  let sheet = spreadsheet.getSheetByName(
    DESTINATION_SHEET_NAME
  );

  if (!sheet) {
    sheet = spreadsheet.insertSheet(
      DESTINATION_SHEET_NAME
    );
  }

  // 新規シートの場合のみヘッダーを設定
  if (sheet.getLastRow() === 0) {
    sheet
      .getRange(1, 1, 1, DESTINATION_HEADERS.length)
      .setValues([DESTINATION_HEADERS]);

    sheet.setFrozenRows(1);
  } else {
    // 既存シートの列構成が違う場合は処理を停止
    const currentHeaders = sheet
      .getRange(1, 1, 1, DESTINATION_HEADERS.length)
      .getValues()[0];

    if (
      currentHeaders.some(
        (value, index) =>
          value !== DESTINATION_HEADERS[index]
      )
    ) {
      throw new Error(
        "転記先シートのヘッダーが想定と異なります。"
      );
    }
  }

  return sheet;
}


/**
 * ニコニコ動画IDを抽出する。
 *
 * 対応例：
 * sm12345678
 * https://www.nicovideo.jp/watch/sm12345678
 * https://www.nicovideo.jp/watch/sm12345678?ref=...
 * https://nico.ms/sm12345678
 *
 * 抽出できない場合は空文字を返す。
 */
function extractVideoId(input) {
  const text = String(input || "").trim();

  if (!text) {
    return "";
  }

  // 動画IDのみが入力されている場合
  const idOnly = text.match(/^sm\d+$/i);

  if (idOnly) {
    return idOnly[0].toLowerCase();
  }

  // URLの前にhttps://がなくても対応
  // URLの前後に多少の文章があっても抽出する
  const patterns = [
    // 通常のニコニコ動画URL
    /(?:https?:\/\/)?(?:www\.)?nicovideo\.jp\/watch\/(sm\d+)(?=[/?#\s]|$)/i,

    // 短縮URL
    /(?:https?:\/\/)?(?:www\.)?nico\.ms\/(sm\d+)(?=[/?#\s]|$)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);

    if (match) {
      return match[1].toLowerCase();
    }
  }

  return "";
}


/**
 * スプレッドシートに入力する文字列を安全に扱う。
 * 先頭の数式記号を式として評価させない。
 */
function safeCellValue(value) {
  if (typeof value !== "string") {
    return value;
  }

  if (/^[\s]*[=+\-@]/.test(value)) {
    return "'" + value;
  }

  return value;
}


/**
 * 回答IDが転記済みか確認する。
 */
function getTransferredIds(sheet) {
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return new Set();
  }

  const values = sheet
    .getRange(2, 9, lastRow - 1, 1)
    .getValues();

  return new Set(
    values.flat().map(String).filter(Boolean)
  );
}


/**
 * 1件の回答を転記する。
 *
 * 元のシートIDと行番号を組み合わせて
 * 回答IDを生成する。
 */
function transferResponse(
  sourceSheet,
  sourceRow,
  destinationSheet,
  transferredIds
) {
  const sourceSpreadsheetId =
    sourceSheet.getParent().getId();

  const responseId = [
    sourceSpreadsheetId,
    sourceSheet.getSheetId(),
    sourceRow,
  ].join(":");

  // 転記済みの場合は何もしない
  if (transferredIds.has(responseId)) {
    return false;
  }

  const values = sourceSheet
    .getRange(
      sourceRow,
      1,
      1,
      SOURCE_COLUMN_COUNT
    )
    .getValues()[0];

  // URLから動画IDを抽出
  const videoId = extractVideoId(values[1]);

  // 初期状態では確認待ち
  const reviewStatus = videoId
    ? "未確認"
    : "要確認";

  const row = [
    ...values.map(safeCellValue),
    responseId,
    videoId,
    safeCellValue(values[5]),
    safeCellValue(values[6]),
    reviewStatus,
    true,
  ];

  destinationSheet
    .getRange(
      destinationSheet.getLastRow() + 1,
      1,
      1,
      row.length
    )
    .setValues([row]);

  transferredIds.add(responseId);

  return true;
}


/**
 * フォーム送信時に実行する関数。
 *
 * インストール型トリガーから呼び出す。
 */
function onFormSubmit(e) {
  if (!e || !e.range) {
    throw new Error(
      "フォーム送信トリガーから実行してください。"
    );
  }

  const lock = LockService.getScriptLock();

  lock.waitLock(30000);

  try {
    const sourceSheet = e.range.getSheet();

    if (
      sourceSheet.getName() !== SOURCE_SHEET_NAME
    ) {
      return;
    }

    const destinationSheet =
      getDestinationSheet();

    const transferredIds =
      getTransferredIds(destinationSheet);

    transferResponse(
      sourceSheet,
      e.range.getRow(),
      destinationSheet,
      transferredIds
    );

    SpreadsheetApp.flush();
  } finally {
    lock.releaseLock();
  }
}


/**
 * 既存の回答をまとめて転記する。
 *
 * 初回設定時や、転記漏れを補う場合に
 * 手動で実行する。
 */
function syncExistingResponses() {
  const lock = LockService.getScriptLock();

  lock.waitLock(30000);

  try {
    const sourceSpreadsheet =
      SpreadsheetApp.getActiveSpreadsheet();

    const sourceSheet =
      sourceSpreadsheet.getSheetByName(
        SOURCE_SHEET_NAME
      );

    if (!sourceSheet) {
      throw new Error(
        "フォーム回答シートが見つかりません。"
      );
    }

    const destinationSheet =
      getDestinationSheet();

    const transferredIds =
      getTransferredIds(destinationSheet);

    const lastRow = sourceSheet.getLastRow();

    let count = 0;

    for (let row = 2; row <= lastRow; row++) {
      if (
        transferResponse(
          sourceSheet,
          row,
          destinationSheet,
          transferredIds
        )
      ) {
        count++;
      }
    }

    SpreadsheetApp.flush();

    console.log(
      `${count}件の回答を新規転記しました。`
    );
  } finally {
    lock.releaseLock();
  }
}

