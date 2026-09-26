
"""承認済みの感想をcomments.jsonに変換する。"""

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


REPOSITORY_ROOT = (
    Path(__file__).resolve().parents[3]
)


def generate_comments(
    year: str,
) -> list[dict]:
    """指定年度の承認済み感想を取得する。"""
    sheet_ids = get_sheet_ids(year)
    settings = get_year_settings(year)

    sheet_name = settings["deploy"][
        "comments_sheet"
    ]

    client = gspread.service_account(
        filename=get_credentials_path()
    )

    worksheet = (
        client.open_by_key(
            sheet_ids["comments"]
        )
        .worksheet(sheet_name)
    )

    rows = worksheet.get_all_records(
        value_render_option="FORMATTED_VALUE"
    )

    result = []
    seen = set()

    for row in rows:
        # 承認済みの感想だけを出力
        if (
            str(row.get("approved", ""))
            .strip()
            .lower()
            != "true"
        ):
            continue

        comment_id = str(
            row.get("comment_id") or ""
        ).strip()

        video_id = str(
            row.get("video_id") or ""
        ).strip()

        comment = str(
            row.get("comment") or ""
        ).strip()

        # 無効なデータや重複を除外
        if (
            not comment_id
            or comment_id in seen
            or not re.fullmatch(
                r"sm\d+",
                video_id,
            )
            or not comment
        ):
            continue

        seen.add(comment_id)

        # 投稿日時
        created_at = row.get(
            "created_at"
        ) or ""

        if isinstance(
            created_at,
            datetime,
        ):
            submitted_at = (
                created_at.isoformat(
                    timespec="seconds"
                )
            )
        else:
            submitted_at = str(
                created_at
            ).strip()

        # Xアカウント
        # GASで正規化されているが、
        # 手動編集に備えて再検証する。
        x_account = (
            str(
                row.get("x_account")
                or ""
            )
            .strip()
            .lstrip("@")
        )

        if not re.fullmatch(
            r"[A-Za-z0-9_]{1,15}",
            x_account,
        ):
            x_account = ""

        result.append({
            "commentId": comment_id,
            "videoId": video_id,
            "authorName": (
                str(
                    row.get("author_name")
                    or ""
                ).strip()
                or "匿名"
            ),
            "xAccount": (
                x_account or None
            ),
            "comment": comment,
            "submittedAt": submitted_at,
        })

    return result


def main():
    parser = argparse.ArgumentParser(
        description=(
            "承認済みの感想から"
            "comments.jsonを生成する"
        )
    )

    parser.add_argument(
        "--year",
        default="2027",
    )

    parser.add_argument(
        "--output",
        type=Path,
        default=None,
    )

    args = parser.parse_args()

    output = (
        args.output
        or (
            REPOSITORY_ROOT
            / args.year
            / "frontend"
            / "public"
            / "data"
            / "comments.json"
        )
    )

    result = generate_comments(
        args.year
    )

    output.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    output.write_text(
        json.dumps(
            result,
            ensure_ascii=False,
            indent=2,
        ) + "\n",
        encoding="utf-8",
    )

    print(
        f"承認済み {len(result)} 件 -> {output}"
    )


if __name__ == "__main__":
    main()
