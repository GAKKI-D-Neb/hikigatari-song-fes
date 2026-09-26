
"""全年度共通のGoogle認証情報・スプレッドシート設定。"""

import json
import os
from pathlib import Path


# hikigatari-song-fes/
REPOSITORY_ROOT = Path(__file__).resolve().parents[3]

CREDENTIALS_PATH = REPOSITORY_ROOT / "credentials.json"

YEAR_SHEETS_PATH = (
    REPOSITORY_ROOT / "config" / "year-sheets.json"
)


def get_credentials_path() -> str:
    """Google認証ファイルの絶対パスを返す。

    GitHub Actions:
        google-github-actions/authが設定する
        GOOGLE_APPLICATION_CREDENTIALSを使用する。

    ローカル:
        リポジトリ直下のcredentials.jsonを使用する。
    """
    environment_path = os.getenv(
        "GOOGLE_APPLICATION_CREDENTIALS"
    )

    if environment_path:
        path = Path(environment_path).expanduser().resolve()
    else:
        path = CREDENTIALS_PATH

    if not path.is_file():
        raise FileNotFoundError(
            f"Google認証ファイルが見つかりません: {path}"
        )

    return str(path)


def get_sheet_ids(year: str) -> dict[str, str]:
    """年度別の非公開スプレッドシートIDを取得する。"""
    if not YEAR_SHEETS_PATH.is_file():
        raise FileNotFoundError(
            f"設定ファイルがありません: {YEAR_SHEETS_PATH}"
        )

    with YEAR_SHEETS_PATH.open(encoding="utf-8") as file:
        settings = json.load(file)

    year_settings = settings.get(str(year))

    if not isinstance(year_settings, dict):
        raise ValueError(
            f"{year}年の設定がありません。"
        )

    result = {}

    for key in ("works", "work_details", "comments"):
        value = year_settings.get(key)

        if not isinstance(value, str) or not value.strip():
            raise ValueError(
                f"{year}年の{key}のIDが未設定です。"
            )

        result[key] = value.strip()

    return result


def get_year_settings(year: str) -> dict:
    """年度別の公開設定を取得する。"""
    path = (
        REPOSITORY_ROOT
        / year
        / "config"
        / "settings.json"
    )

    with path.open(encoding="utf-8") as file:
        return json.load(file)