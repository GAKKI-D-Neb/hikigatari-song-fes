
import argparse
import csv
import json
import os
import re
from datetime import datetime
from pathlib import Path

import gspread
from dotenv import load_dotenv


BACKEND_DIR = Path(__file__).resolve().parent.parent

load_dotenv(BACKEND_DIR / ".env")


def read_csv(path):
    """CSVファイルを読み込む。"""
    with open(path, encoding="utf-8-sig", newline="") as file:
        return list(csv.DictReader(file))


def read_google_sheet(spreadsheet_id, sheet_name):
    """Googleスプレッドシートを読み込む。"""
    client = gspread.service_account(
        filename=os.environ["GOOGLE_APPLICATION_CREDENTIALS"]
    )

    spreadsheet = client.open_by_key(spreadsheet_id)
    worksheet = spreadsheet.worksheet(sheet_name)

    return worksheet.get_all_records()


def is_enabled(value):
    """スプレッドシートのTRUE/FALSEを判定する。"""
    if isinstance(value, bool):
        return value

    return str(value).strip().lower() in {
        "true",
        "1",
        "yes",
    }


def extract_video_id(value):
    """動画IDまたは一般的なニコニコ動画URLからIDを抽出する。"""
    text = str(value or "").strip()

    if re.fullmatch(r"sm\d+", text, flags=re.IGNORECASE):
        return text.lower()

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


def normalize_x_account(value):
    """XアカウントのURLや@IDをユーザーIDに統一する。"""
    text = str(value or "").strip()

    if not text:
        return ""

    match = re.fullmatch(
        r"(?:https?://)?(?:www\.)?"
        r"(?:x\.com|twitter\.com)/"
        r"([A-Za-z0-9_]{1,15})/?",
        text,
        flags=re.IGNORECASE,
    )

    if match:
        return match.group(1)

    return text.lstrip("@")


def split_values(value):
    """カンマや読点などで区切られた値を配列に変換する。"""
    text = str(value or "").strip()

    if not text:
        return []

    return [
        item.strip()
        for item in re.split(r"[,，、・\n]+", text)
        if item.strip()
    ]


def parse_timestamp(value):
    """重複回答の日時比較に使用する。"""
    text = str(value or "").strip()

    if not text:
        return datetime.min

    formats = [
        "%Y/%m/%d %H:%M:%S",
        "%Y/%m/%d %H:%M",
        "%Y/%m/%d",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d",
    ]

    for date_format in formats:
        try:
            return datetime.strptime(text, date_format)
        except ValueError:
            continue

    return datetime.min


def prepare_details(details):
    """掲載対象のフォーム情報を動画IDごとに整理する。"""
    result = {}

    for row in details:
        if not is_enabled(row.get("掲載対象", False)):
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

        # 重複回答は新しいものを採用する。
        # 同じ日時なら後に読み込んだ回答を採用する。
        current_time = parse_timestamp(
            row.get("タイムスタンプ")
        )
        previous_time = parse_timestamp(
            previous.get("タイムスタンプ")
        )

        if current_time >= previous_time:
            result[video_id] = row

    return result


def get_vocals(detail):
    """歌唱区分とキャラクター名をJSON用の配列に変換する。"""
    vocal_type = str(
        detail.get("使用ボーカル", "")
    ).strip()

    if vocal_type == "人間歌唱":
        return ["人間歌唱"]

    if vocal_type == "ボカロ・合成音声":
        value = detail.get(
            "使用キャラクター名（修正後）"
        ) or detail.get("使用キャラクター名")

        return split_values(value)

    return []


def get_instruments(detail):
    """運営による修正後の使用楽器を優先する。"""
    value = detail.get(
        "使用楽器（修正後）"
    ) or detail.get("使用楽器")

    return split_values(value)


def generate_works(works, details):
    """2つのデータを統合し、フロントエンド用の形式にする。"""
    detail_map = prepare_details(details)

    result = []
    seen_video_ids = set()

    for work in works:
        if not is_enabled(work.get("included", False)):
            continue

        video_id = extract_video_id(
            work.get("video_id") or work.get("url")
        )

        if not video_id:
            continue

        # 重複した作品は最初の1件を採用
        if video_id in seen_video_ids:
            continue

        seen_video_ids.add(video_id)

        detail = detail_map.get(video_id, {})

        url = str(work.get("url") or "").strip()

        if not url:
            url = (
                "https://www.nicovideo.jp/watch/"
                + video_id
            )

        x_account = normalize_x_account(
            detail.get("投稿者のXアカウント")
        )

        announcement_url = str(
            detail.get("作品の告知ポストURL") or ""
        ).strip()

        result.append(
            {
                "videoId": video_id,
                "title": str(
                    work.get("title") or ""
                ).strip(),
                "creator": str(
                    work.get("creator") or ""
                ).strip(),
                "url": url,
                "xAccount": x_account or None,
                "announcementPostUrl": (
                    announcement_url or None
                ),
                "vocals": get_vocals(detail),
                "instruments": get_instruments(detail),
                "description": str(
                    detail.get("作品の紹介文") or ""
                ),
            }
        )

    return result


def main():
    parser = argparse.ArgumentParser(
        description="弾き語り曲投稿祭2027の作品JSONを生成する"
    )

    parser.add_argument(
        "--mode",
        choices=["sample", "live"],
        default="sample",
    )

    parser.add_argument(
        "--output",
        type=Path,
        default=BACKEND_DIR.parent
        / "frontend/public/data/works.json",
    )

    args = parser.parse_args()

    if args.mode == "sample":
        works = read_csv(
            BACKEND_DIR / "samples/works_2027.csv"
        )

        details = read_csv(
            BACKEND_DIR / "samples/work_details_2027.csv"
        )

    else:
        works = read_google_sheet(
            os.environ["WORKS_SPREADSHEET_ID"],
            os.getenv("WORKS_SHEET_NAME", "works"),
        )

        details = read_google_sheet(
            os.environ["WORK_DETAILS_SPREADSHEET_ID"],
            os.getenv(
                "WORK_DETAILS_SHEET_NAME",
                "work_details",
            ),
        )

    result = generate_works(works, details)

    args.output.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    with open(
        args.output,
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
        f"{len(result)}作品を出力しました: "
        f"{args.output}"
    )


if __name__ == "__main__":
    main()
