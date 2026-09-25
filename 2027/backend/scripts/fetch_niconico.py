
import argparse
import os
import time
import xml.etree.ElementTree as ET
from pathlib import Path

import gspread
import requests
from dotenv import load_dotenv
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry


BACKEND_DIR = Path(__file__).resolve().parent.parent

load_dotenv(BACKEND_DIR / ".env")

SEARCH_API_URL = (
    "https://snapshot.search.nicovideo.jp"
    "/api/v2/snapshot/video/contents/search"
)

THUMBINFO_API_URL = (
    "https://ext.nicovideo.jp/api/getthumbinfo/"
)

PRODUCTION_TAG = "弾き語り曲投稿祭2027"

HEADERS = [
    "video_id",
    "title",
    "creator",
    "creator_id",
    "posted_at",
    "url",
    "included",
]


def create_session():
    """APIアクセス用のセッションを作成する。"""
    session = requests.Session()

    session.headers.update({
        "User-Agent": "HikigatariSongFes2027/0.1"
    })

    retry = Retry(
        total=3,
        backoff_factor=1,
        status_forcelist=[
            429,
            500,
            502,
            503,
            504,
        ],
    )

    adapter = HTTPAdapter(
        max_retries=retry
    )

    session.mount(
        "https://",
        adapter,
    )

    return session


def fetch_videos(session, tag, limit=None):
    """
    指定タグの動画を検索する。

    limit=None の場合は全件取得する。
    """

    videos = []
    offset = 0
    page_size = 100

    while True:
        count = page_size

        if limit is not None:
            remaining = limit - len(videos)

            if remaining <= 0:
                break

            count = min(
                count,
                remaining,
            )

        params = {
            "q": tag,
            "targets": "tagsExact",
            "fields": (
                "contentId,"
                "title,"
                "userId,"
                "channelId,"
                "startTime"
            ),
            "_sort": "+startTime",
            "_offset": offset,
            "_limit": count,
            "_context": "HikigatariSongFes2027",
        }

        response = session.get(
            SEARCH_API_URL,
            params=params,
            timeout=30,
        )

        response.raise_for_status()

        result = response.json()

        meta = result.get("meta", {})

        if meta.get("status") != 200:
            raise RuntimeError(
                f"検索APIエラー: {meta}"
            )

        data = result.get("data", [])

        if not data:
            break

        videos.extend(data)

        offset += len(data)

        total = meta.get("totalCount")

        print(
            f"検索取得: {len(videos)}件"
            f" / 全{total}件"
        )

        if (
            total is not None
            and offset >= total
        ):
            break

        if len(data) < count:
            break

        time.sleep(1)

    return videos


def fetch_creator(session, video_id):
    """
    getthumbinfo APIから投稿者情報を取得する。

    ユーザー投稿:
        user_nickname
        user_id

    チャンネル投稿:
        ch_name
        ch_id
    """

    response = session.get(
        THUMBINFO_API_URL + video_id,
        timeout=30,
    )

    response.raise_for_status()

    root = ET.fromstring(
        response.content
    )

    if root.attrib.get("status") != "ok":
        return None

    thumb = root.find("thumb")

    if thumb is None:
        return None

    user_name = thumb.findtext(
        "user_nickname"
    )

    user_id = thumb.findtext(
        "user_id"
    )

    if user_name:
        return {
            "name": user_name,
            "id": user_id or "",
        }

    channel_name = thumb.findtext(
        "ch_name"
    )

    channel_id = thumb.findtext(
        "ch_id"
    )

    if channel_name:
        return {
            "name": channel_name,
            "id": channel_id or "",
        }

    return None


def convert_video(video, creator):
    """API取得結果を管理シートの形式に変換する。"""

    video_id = video["contentId"]

    return {
        "video_id": video_id,
        "title": video.get("title", ""),
        "creator": creator["name"],
        "creator_id": creator["id"],
        "posted_at": video.get(
            "startTime", ""
        ),
        "url": (
            "https://www.nicovideo.jp/watch/"
            + video_id
        ),
        "included": True,
    }


def create_google_client():
    """Google Sheetsの認証を行う。"""

    credentials = Path(
        os.environ[
            "GOOGLE_APPLICATION_CREDENTIALS"
        ]
    ).expanduser()

    if not credentials.is_absolute():
        credentials = (
            BACKEND_DIR / credentials
        )

    return gspread.service_account(
        filename=str(credentials)
    )


def get_worksheet(sheet_name):
    """
    指定したワークシートを取得する。

    未作成の場合は作成する。
    既存の列構成が違う場合は停止する。
    """

    client = create_google_client()

    spreadsheet = client.open_by_key(
        os.environ["WORKS_SPREADSHEET_ID"]
    )

    try:
        worksheet = spreadsheet.worksheet(
            sheet_name
        )

    except gspread.WorksheetNotFound:
        worksheet = spreadsheet.add_worksheet(
            title=sheet_name,
            rows=1000,
            cols=len(HEADERS),
        )

    first_row = worksheet.row_values(1)

    if not first_row:
        worksheet.update(
            range_name="A1:G1",
            values=[HEADERS],
        )

        worksheet.freeze(
            rows=1
        )

    elif first_row != HEADERS:
        raise ValueError(
            "シートのヘッダーが想定と異なります。\n"
            f"現在: {first_row}\n"
            f"期待: {HEADERS}"
        )

    return worksheet


def sync_works(worksheet, works):
    """
    取得した作品をGoogle Sheetsに反映する。

    - 新規作品のみ追加
    - 既存作品のcreatorが空欄なら補完
    - includedは変更しない
    """

    existing_rows = (
        worksheet.get_all_records(
            expected_headers=HEADERS
        )
    )

    existing_map = {}

    for index, row in enumerate(
        existing_rows,
        start=2,
    ):
        video_id = str(
            row.get("video_id", "")
        ).strip()

        if video_id:
            existing_map[video_id] = {
                "row_number": index,
                "data": row,
            }

    new_rows = []

    creator_updates = []

    for work in works:
        video_id = work["video_id"]

        if video_id not in existing_map:
            new_rows.append([
                work["video_id"],
                work["title"],
                work["creator"],
                work["creator_id"],
                work["posted_at"],
                work["url"],
                True,
            ])

            # 同一実行内で重複登録しない
            existing_map[video_id] = {
                "row_number": None,
                "data": work,
            }

            continue

        existing = existing_map[
            video_id
        ]

        row_number = existing[
            "row_number"
        ]

        # 今回追加予定の作品ならスキップ
        if row_number is None:
            continue

        current_creator = str(
            existing["data"].get(
                "creator", ""
            )
        ).strip()

        if not current_creator:
            creator_updates.append({
                "row": row_number,
                "creator": work["creator"],
                "creator_id": work["creator_id"],
            })

    if new_rows:
        worksheet.append_rows(
            new_rows,
            value_input_option="RAW",
        )

    if creator_updates:
        updates = []

        for item in creator_updates:
            updates.append({
                "range": (
                    f"C{item['row']}:"
                    f"D{item['row']}"
                ),
                "values": [[
                    item["creator"],
                    item["creator_id"],
                ]],
            })

        worksheet.batch_update(
            updates,
            value_input_option="RAW",
        )

    print(
        f"新規追加: {len(new_rows)}件"
    )

    print(
        f"投稿者名補完: "
        f"{len(creator_updates)}件"
    )


def main():
    parser = argparse.ArgumentParser(
        description=(
            "ニコニコ動画から作品を取得し、"
            "Google Sheetsに同期する"
        )
    )

    parser.add_argument(
        "--tag",
        required=True,
        help="検索対象タグ",
    )

    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="最大取得件数。省略時は全件",
    )

    parser.add_argument(
        "--write",
        action="store_true",
        help="Google Sheetsへ書き込む",
    )

    parser.add_argument(
        "--sheet",
        default="works_test",
        help="書き込み先シート名",
    )

    parser.add_argument(
        "--production",
        action="store_true",
        help="本番シートへの書き込みを許可",
    )

    args = parser.parse_args()

    if (
        args.limit is not None
        and args.limit < 1
    ):
        parser.error(
            "--limitには1以上を指定してください"
        )

    # 本番への誤書き込み防止
    if args.sheet == "works":
        if not args.production:
            parser.error(
                "worksへの書き込みには"
                "--productionが必要です"
            )

        if args.tag != PRODUCTION_TAG:
            parser.error(
                "本番シートでは本番タグのみ"
                "指定できます"
            )

        if args.limit is not None:
            parser.error(
                "本番シートでは--limitを"
                "指定できません"
            )

    if (
        args.production
        and args.sheet != "works"
    ):
        parser.error(
            "--productionは"
            "--sheet worksと併用してください"
        )

    session = create_session()

    videos = fetch_videos(
        session,
        args.tag,
        args.limit,
    )

    works = []
    skipped = []

    # 同じ投稿者IDを持つ場合は
    # 投稿者名の取得結果を再利用する。
    creator_cache = {}

    for index, video in enumerate(
        videos,
        start=1,
    ):
        video_id = video["contentId"]

        owner_key = (
            str(
                video.get("userId")
                or ""
            ),
            str(
                video.get("channelId")
                or ""
            ),
        )

        print(
            f"[{index}/{len(videos)}] "
            f"{video_id}"
        )

        if (
            any(owner_key)
            and owner_key in creator_cache
        ):
            creator = creator_cache[
                owner_key
            ]

        else:
            creator = fetch_creator(
                session,
                video_id,
            )

            if any(owner_key) and creator:
                creator_cache[
                    owner_key
                ] = creator

            time.sleep(0.3)

        if not creator:
            print(
                "  投稿者名を取得できないため"
                "スキップします"
            )

            skipped.append(video_id)
            continue

        work = convert_video(
            video,
            creator,
        )

        works.append(work)

        print(
            f"  投稿者: {work['creator']}"
        )

    print(
        f"\n取得成功: {len(works)}件"
    )

    print(
        f"取得失敗: {len(skipped)}件"
    )

    if skipped:
        print(
            "投稿者情報を取得できなかった動画:",
            ", ".join(skipped),
        )

    if not args.write:
        print(
            "\nプレビューのみ。"
            "スプレッドシートは"
            "変更していません。"
        )

        for work in works:
            print(
                work["video_id"],
                work["title"],
                work["creator"],
            )

        return

    if not works:
        print(
            "同期対象が0件のため、"
            "書き込みません。"
        )

        return

    if args.sheet == "works" and skipped:
        raise RuntimeError(
            "投稿者情報を取得できなかった"
            "作品があります。"
            "本番シートへの同期を中止します。"
        )

    worksheet = get_worksheet(
        args.sheet
    )

    sync_works(
        worksheet,
        works,
    )


if __name__ == "__main__":
    main()
