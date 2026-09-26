
"""ニコニコ動画の参加作品を取得してGoogle Sheetsに同期する。"""

import argparse
import time
import xml.etree.ElementTree as ET

import gspread
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from config import (
    get_credentials_path,
    get_sheet_ids,
    get_year_settings,
)


YEAR = "2027"

SEARCH_API_URL = (
    "https://snapshot.search.nicovideo.jp"
    "/api/v2/snapshot/video/contents/search"
)

THUMBINFO_API_URL = (
    "https://ext.nicovideo.jp/api/getthumbinfo/"
)

HEADERS = [
    "video_id",
    "title",
    "creator",
    "creator_id",
    "posted_at",
    "url",
    "included",
]


def create_session() -> requests.Session:
    """ニコニコ動画API用のHTTPセッションを作成する。"""
    session = requests.Session()

    session.headers.update({
        "User-Agent": "HikigatariSongFes2027/0.1",
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


def fetch_videos(
    session: requests.Session,
    tag: str,
    limit: int | None = None,
    delay: float = 1.0,
) -> list[dict]:
    """指定タグの動画情報を検索APIから取得する。

    limit=Noneなら全件取得する。
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
            f"取得済み: {len(videos)}件"
            f" / 検索結果: {total}件"
        )

        if (
            total is not None
            and offset >= total
        ):
            break

        if len(data) < count:
            break

        if limit is None or len(videos) < limit:
            time.sleep(delay)

    return videos


def fetch_creator(
    session: requests.Session,
    video_id: str,
) -> dict | None:
    """getthumbinfo APIから投稿者の表示名とIDを取得する。"""
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

    # 一般ユーザーによる投稿
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

    # チャンネルによる投稿
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


def convert_video(
    video: dict,
    creator: dict,
) -> dict:
    """ニコニコ動画の取得結果をworks用の形式に変換する。"""
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


def create_google_client() -> gspread.Client:
    """共通のGoogle認証情報で接続する。"""
    return gspread.service_account(
        filename=get_credentials_path()
    )


def get_worksheet(
    year: str,
    sheet_name: str,
) -> gspread.Worksheet:
    """年度に対応する作品管理シートを取得する。

    未作成の場合は作成し、既存の列構成も検証する。
    """
    client = create_google_client()

    sheet_ids = get_sheet_ids(year)

    spreadsheet = client.open_by_key(
        sheet_ids["works"]
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


def sync_works(
    worksheet: gspread.Worksheet,
    works: list[dict],
) -> None:
    """作品データをスプレッドシートへ同期する。

    新規作品のみ追加する。
    既存作品の投稿者名が空欄なら補完する。
    includedは変更しない。
    """
    # 実際の行番号を保持するため、
    # 行番号を含めて全行を読み込む。
    all_rows = worksheet.get_all_values()

    existing_map = {}

    for row_number, values in enumerate(
        all_rows[1:],
        start=2,
    ):
        if not values:
            continue

        video_id = str(
            values[0]
        ).strip()

        if video_id:
            existing_map[video_id] = {
                "row_number": row_number,
                "values": values,
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

            # 同一実行内での重複追加を防止
            existing_map[video_id] = {
                "row_number": None,
                "values": [],
            }

            continue

        existing = existing_map[video_id]

        row_number = existing[
            "row_number"
        ]

        if row_number is None:
            continue

        values = existing["values"]

        current_creator = (
            values[2].strip()
            if len(values) > 2
            else ""
        )

        # 投稿者名が空欄の場合だけ補完する
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
        updates = [
            {
                "range": (
                    f"C{item['row']}:D{item['row']}"
                ),
                "values": [[
                    item["creator"],
                    item["creator_id"],
                ]],
            }
            for item in creator_updates
        ]

        worksheet.batch_update(
            updates,
            value_input_option="RAW",
        )

    print(
        f"新規追加: {len(new_rows)}件"
    )

    print(
        f"投稿者名補完: {len(creator_updates)}件"
    )


def main():
    parser = argparse.ArgumentParser(
        description=(
            "ニコニコ動画から作品情報を取得し、"
            "Google Sheetsに同期する"
        )
    )

    parser.add_argument(
        "--year",
        default=YEAR,
        help="対象年度",
    )

    parser.add_argument(
        "--tag",
        default=None,
        help=(
            "検索タグ。省略時は"
            "settings.jsonの設定を使用"
        ),
    )

    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help=(
            "最大取得件数。省略時は"
            "settings.jsonの設定を使用"
        ),
    )

    parser.add_argument(
        "--all",
        action="store_true",
        help="取得件数の制限を解除する",
    )

    parser.add_argument(
        "--sheet",
        default=None,
        help=(
            "書き込み先タブ。省略時は"
            "settings.jsonの設定を使用"
        ),
    )

    parser.add_argument(
        "--write",
        action="store_true",
        help="Google Sheetsへ書き込む",
    )

    parser.add_argument(
        "--production",
        action="store_true",
        help="本番シートへの書き込みを許可",
    )

    args = parser.parse_args()

    year = args.year

    # 年度別の公開設定
    settings = get_year_settings(year)

    fetch_settings = settings["fetch"]
    deploy_settings = settings["deploy"]

    tag = args.tag or fetch_settings["tag"]

    sheet_name = (
        args.sheet or fetch_settings["sheet"]
    )

    production_sheet = deploy_settings[
        "works_sheet"
    ]

    configured_limit = fetch_settings.get(
        "limit"
    )

    if args.all:
        limit = None

    elif args.limit is not None:
        limit = args.limit

    else:
        limit = configured_limit

    if limit is not None and limit < 1:
        parser.error(
            "取得件数は1以上にしてください。"
        )

    production_tag = (
        f"弾き語り曲投稿祭{year}"
    )

    # 本番シートへの誤書き込み防止
    if sheet_name == production_sheet:
        if not args.production:
            parser.error(
                "本番シートへの同期には"
                "--productionが必要です。"
            )

        if tag != production_tag:
            parser.error(
                "本番シートには本番タグだけを"
                "使用できます。"
            )

        if limit is not None:
            parser.error(
                "本番シートへの同期では"
                "取得件数を制限できません。"
            )

    elif args.production:
        parser.error(
            "--productionは本番シートへの"
            "同期時のみ使用できます。"
        )

    session = create_session()

    videos = fetch_videos(
        session,
        tag,
        limit,
    )

    works = []
    skipped = []

    # 同一投稿者の情報取得結果を再利用
    creator_cache = {}

    for index, video in enumerate(
        videos,
        start=1,
    ):
        video_id = video["contentId"]

        owner_key = (
            str(video.get("userId") or ""),
            str(video.get("channelId") or ""),
        )

        print(
            f"[{index}/{len(videos)}] "
            f"{video_id}"
        )

        if (
            any(owner_key)
            and owner_key in creator_cache
        ):
            creator = creator_cache[owner_key]

        else:
            try:
                creator = fetch_creator(
                    session,
                    video_id,
                )

            except (
                requests.RequestException,
                ET.ParseError,
            ) as error:
                print(
                    f"  投稿者情報取得エラー: "
                    f"{type(error).__name__}"
                )

                creator = None

            if creator and any(owner_key):
                creator_cache[owner_key] = creator

            time.sleep(0.3)

        if not creator:
            print(
                "  投稿者名を取得できなかったため"
                "スキップします。"
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
            "\nプレビューのみです。"
            "スプレッドシートは変更していません。"
        )

        for work in works:
            print(
                work["video_id"],
                work["title"],
                work["creator"],
            )

        return

    # 本番では一部取得失敗時の更新を中止
    if sheet_name == production_sheet and skipped:
        raise RuntimeError(
            "投稿者情報を取得できなかった"
            "作品があるため、本番シートへの"
            "同期を中止しました。"
        )

    if not works:
        print(
            "同期対象が0件のため、"
            "書き込みません。"
        )
        return

    worksheet = get_worksheet(
        year,
        sheet_name,
    )

    sync_works(
        worksheet,
        works,
    )


if __name__ == "__main__":
    main()
