
import sys
import unittest
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parent.parent

sys.path.insert(
    0,
    str(BACKEND_DIR / "scripts"),
)

from generate_works import (  # noqa: E402
    extract_video_id,
    generate_works,
    read_csv,
)


class TestGenerateWorks(unittest.TestCase):

    def test_extract_video_id(self):
        cases = [
            "sm46282210",
            "https://www.nicovideo.jp/watch/sm46282210",
            "https://www.nicovideo.jp/watch/sm46282210?ref=test",
            "https://nico.ms/sm46282210",
            "www.nicovideo.jp/watch/sm46282210",
        ]

        for value in cases:
            with self.subTest(value=value):
                self.assertEqual(
                    extract_video_id(value),
                    "sm46282210",
                )

    def test_sample_output(self):
        works = read_csv(
            BACKEND_DIR / "samples/works_2027.csv"
        )

        details = read_csv(
            BACKEND_DIR / "samples/work_details_2027.csv"
        )

        result = generate_works(works, details)

        self.assertEqual(len(result), 2)

        first = result[0]
        second = result[1]

        self.assertEqual(
            first["videoId"],
            "sm46282210",
        )

        self.assertEqual(
            first["vocals"],
            ["初音ミク"],
        )

        self.assertEqual(
            first["instruments"],
            ["ピアノ"],
        )

        self.assertEqual(
            first["xAccount"],
            "GAKKI_D_Neb",
        )

        self.assertEqual(
            first["announcementPostUrl"],
            "https://x.com/GAKKI_D_Neb/status/"
            "2052690515100139668",
        )

        self.assertEqual(
            second["videoId"],
            "sm46284513",
        )

        self.assertIsNone(
            second["announcementPostUrl"]
        )

        self.assertEqual(
            second["instruments"],
            ["アコースティックギター"],
        )

        self.assertIn(
            "\n",
            first["description"],
        )

        self.assertEqual(
            second["description"].count("\n"),
            2,
        )


if __name__ == "__main__":
    unittest.main()
