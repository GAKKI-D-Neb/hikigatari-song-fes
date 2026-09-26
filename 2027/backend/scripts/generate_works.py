
"""Google Sheetsの作品情報を統合し、works.jsonを生成する。"""

import argparse
import json
import re
from datetime import datetime
from pathlib import Path

import gspread

from config import (
    get_credentials_path,
    get_sheet_ids,
    get_year_settings,
)


YEAR = "2027"

BACKEND_DIR = Path(__file__).resolve().parent.parent

DEFAULT_OUTPUT = (
    BACKEND_DIR.parent
    / "frontend"
    / "public"
    / "data"
    / "works.json"
)


def read_google_sheet(
    client: gspread.Client,
    spreadsheet_id: str,
    sheet_name: str,
) -> list[dict]:
    """指定したGoogleスプレッドシートを読み込む。"""
    spreadsheet = client.open_by_key(spreadsheet_id)
    worksheet = spreadsheet.worksheet(sheet_name)

    return worksheet.get_all_records()


def is_enabled(value) -> bool:
    """Google SheetsのTRUE/FALSEを判定する。"""
    if isinstance(value, bool):
        return value

    return str(value).strip().lower() in {
        "true",
        "1",
        "yes",
    }


def extract_video_id(value) -> str:
    """動画IDまたはニコニコ動画URLから動画IDを抽出する。"""
    text = str(value or "").strip()

    if not text:
        return ""

    # 動画IDのみ
    if re.fullmatch(
        r"sm\d+",
        text,
        flags=re.IGNORECASE,
    ):
        return text.lower()

    # 通常URLおよび短縮URL
    patterns = [
        (
            r"(?:https?://)?"
            r"(?:[a-z0-9-]+\.)*nicovideo\.jp/"
            r"watch/(sm\d+)(?=[/?#\s]|$)"
        ),
        (
            r"(?:https?://)?"
            r"(?:www\.)?nico\.ms/"
            r"(sm\d+)(?=[/?#\s]|$)"
        ),
    ]

    for pattern in patterns:
        match = re.search(
            pattern,
            text,
            flags=re.IGNORECASE,
        )

        if match:
            return match.group(1).lower()

    return ""


def normalize_x_account(value) -> str:
    """XのURLまたは@IDをユーザーIDに変換する。"""
    text = str(value or "").strip()

    if not text:
        return ""

    match = re.fullmatch(
        r"(?:https?://)?(?:www\.)?"
        r"(?:x\.com|twitter\.com)/"
        r"([A-Za-z0-9_]{1,15})/?"
        r"(?:\?.*)?",
        text,
        flags=re.IGNORECASE,
    )

    if match:
        return match.group(1)

    text = text.lstrip("@")

    # 不正なIDをそのまま公開しない
    if re.fullmatch(r"[A-Za-z0-9_]{1,15}", text):
        return text

    return ""


def split_values(value) -> list[str]:
    """複数のボーカル名・楽器名を配列に変換する。"""
    text = str(value or "").strip()

    if not text:
        return []

    return [
        item.strip()
        for item in re.split(
            r"[,，、・\n]+",
            text,
        )
        if item.strip()
    ]


def parse_timestamp(value) -> datetime:
    """フォーム回答のタイムスタンプを解析する。"""
    if isinstance(value, datetime):
        return value.replace(tzinfo=None)

    text = str(value or "").strip()

    formats = [
        "%Y/%m/%d %H:%M:%S",
        "%Y/%m/%d %H:%M",
        "%Y/%m/%d",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d %H:%M",
        "%Y-%m-%d",
    ]

    for date_format in formats:
        try:
            return datetime.strptime(
                text,
                date_format,
            )
        except ValueError:
            continue

    return datetime.min


def prepare_details(
    details: list[dict],
) -> dict[str, dict]:
    """掲載対象の作品詳細を動画IDごとに整理する。"""
    result = {}

    for row in details:
        if not is_enabled(
            row.get("掲載対象", False)
        ):
            continue

        video_id = extract_video_id(
            row.get("動画ID")
            or row.get("作品のニコニコ動画URL")
        )

        if not video_id:
            continue

        previous = result.get(video_id)

        if previous is None:
            result[video_id] = row
            continue

        current_time = parse_timestamp(
            row.get("タイムスタンプ")
        )

        previous_time = parse_timestamp(
            previous.get("タイムスタンプ")
        )

        # 同じ日時の場合は、後の行を採用する
        if current_time >= previous_time:
            result[video_id] = row

    return result


def get_vocals(detail: dict) -> list[str]:
    """歌唱区分・キャラクター名から配列を生成する。"""
    vocal_type = str(
        detail.get("使用ボーカル") or ""
    ).strip()

    if vocal_type == "人間歌唱":
        return ["人間歌唱"]

    if vocal_type == "ボカロ・合成音声":
        value = (
            detail.get("使用キャラクター名（修正後）")
            or detail.get("使用キャラクター名")
        )

        return split_values(value)

    return []


def get_instruments(detail: dict) -> list[str]:
    """運営が修正した楽器名を優先する。"""
    value = (
        detail.get("使用楽器（修正後）")
        or detail.get("使用楽器")
    )

    return split_values(value)


def generate_works(
    works: list[dict],
    details: list[dict],
) -> list[dict]:
    """動画IDで作品情報を統合する。"""
    detail_map = prepare_details(details)

    result = []
    seen_video_ids = set()

    for work in works:
        # 作品自体が掲載対象外なら除外
        if not is_enabled(
            work.get("included", False)
        ):
            continue

        video_id = extract_video_id(
            work.get("video_id")
            or work.get("url")
        )

        if not video_id:
            print(
                "WARNING: 動画IDを取得できない作品を"
                "スキップしました。"
            )
            continue

        # 重複作品を除外
        if video_id in seen_video_ids:
            continue

        seen_video_ids.add(video_id)

        # フォーム回答がなければ空の辞書
        detail = detail_map.get(video_id, {})

        url = str(
            work.get("url") or ""
        ).strip()

        if not url:
            url = (
                "https://www.nicovideo.jp/watch/"
                + video_id
            )

        x_account = normalize_x_account(
            detail.get("投稿者のXアカウント")
        )

        announcement_url = str(
            detail.get("作品の告知ポストURL")
            or ""
        ).strip()

        result.append({
            "videoId": video_id,
            "title": str(
                work.get("title") or ""
            ).strip(),
            "creator": str(
                work.get("creator") or ""
            ).strip(),
            "url": url,
            "xAccount": (
                x_account or None
            ),
            "announcementPostUrl": (
                announcement_url or None
            ),
            "vocals": get_vocals(detail),
            "instruments": get_instruments(detail),
            "description": str(
                detail.get("作品の紹介文") or ""
            ),
        })

    return result


def main():
    parser = argparse.ArgumentParser(
        description=(
            "Google Sheetsから作品情報を取得し、"
            "works.jsonを生成する"
        )
    )

    parser.add_argument(
        "--year",
        default=YEAR,
        help="対象年度",
    )

    # 既存の実行コマンドとの互換性
    parser.add_argument(
        "--mode",
        choices=["live"],
        default="live",
        help="データ取得モード",
    )

    parser.add_argument(
        "--output",
        type=Path,
        default=None,
        help="JSONの出力先",
    )

    args = parser.parse_args()

    year = args.year

    # 共通の非公開設定
    sheet_ids = get_sheet_ids(year)

    # 年度別の公開設定
    settings = get_year_settings(year)

    deploy_settings = settings["deploy"]

    works_sheet_name = deploy_settings[
        "works_sheet"
    ]

    details_sheet_name = deploy_settings[
        "work_details_sheet"
    ]

    # Google Sheetsへ接続
    client = gspread.service_account(
        filename=get_credentials_path()
    )

    print(
        f"{year}年の作品情報を取得しています..."
    )

    works = read_google_sheet(
        client,
        sheet_ids["works"],
        works_sheet_name,
    )

    details = read_google_sheet(
        client,
        sheet_ids["work_details"],
        details_sheet_name,
    )

    print(
        f"作品管理シート: {len(works)}件"
    )

    print(
        f"作品詳細シート: {len(details)}件"
    )

    # データを統合
    result = generate_works(
        works,
        details,
    )

    # JSONの出力先
    if args.output is not None:
        output_path = args.output
    else:
        output_path = (
            BACKEND_DIR.parent.parent
            / year
            / "frontend"
            / "public"
            / "data"
            / "works.json"
        )

    output_path.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    with output_path.open(
        "w",
        encoding="utf-8",
    ) as file:
        json.dump(
            result,
            file,
            ensure_ascii=False,
            indent=2,
        )

        file.write("\n")

    print(
        f"{len(result)}作品を出力しました。"
    )

    print(
        f"出力先: {output_path}"
    )


if __name__ == "__main__":
    main()
