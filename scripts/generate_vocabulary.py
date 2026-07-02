#!/usr/bin/env python3
"""Build the checked-in full Vietnamese HSK 2.0 dataset.

The script intentionally keeps source acquisition outside the repository:

- complete-hsk-vocabulary `complete.min.json` (MIT)
- Anki deck 698824905 `collection.anki2` (public community deck)

Usage:
    python3 scripts/generate_vocabulary.py \
      --hsk-json /path/to/complete.min.json \
      --anki-db /path/to/collection.anki2 \
      --output src/data/vocabulary.json
"""

from __future__ import annotations

import argparse
import html
import json
import re
import sqlite3
from pathlib import Path
from typing import Any

TARGET_SIZE = 4_991
EXPECTED_LEVEL_COUNTS = {1: 150, 2: 147, 3: 298, 4: 598, 5: 1_298, 6: 2_500}
FIELD_SEPARATOR = "\x1f"
HANZI_PATTERN = re.compile(r"[\u3400-\u9fff]")
TAG_PATTERN = re.compile(r"<[^>]+>")
CONTEXT_PATTERN = re.compile(
    r'<TR\s+id=mh_T_cv_id>.*?<FONT\s+color=#FF0000>(.*?)</FONT>.*?</TR>\s*'
    r'<TR\s+id=mh_n_T_cv_id>.*?<FONT\s+COLOR=#7F7F7F>(.*?)</FONT>',
    re.IGNORECASE | re.DOTALL,
)

MANUAL_VI = {
    "不屑一顾": "không thèm để ý; coi thường",
    "日": "ngày; mặt trời",
    "踢": "đá, sút",
    "电子": "điện tử",
    "刷": "chải; quét; cà",
    "刮": "cạo; thổi (gió)",
    "场": "sân; nơi chốn; trận, buổi (lượng từ)",
    "敞开": "mở rộng; mở toang",
    "储存": "lưu trữ; tích trữ",
    "弹": "gảy, đánh (nhạc cụ)",
    "分之": "phần; dùng trong phân số",
    "分辨": "phân biệt; nhận ra",
    "实现": "thực hiện; hiện thực hóa",
    "阻止": "ngăn cản; ngăn chặn",
    "一路": "suốt đường; dọc đường",
    "协议": "thỏa thuận; hiệp định",
    "夫妇": "vợ chồng",
    "清醒": "tỉnh táo",
    "栋": "tòa, căn (lượng từ cho nhà)",
    "高速": "tốc độ cao; cao tốc",
    "合算": "có lợi; đáng giá",
    "吉祥": "cát tường; may mắn",
    "拣": "nhặt; lựa chọn",
    "降临": "đến; giáng xuống",
    "名胜": "danh lam; thắng cảnh",
    "片断": "đoạn; mẩu",
    "曝光": "phơi sáng; vạch trần",
    "气色": "sắc mặt; thần sắc",
    "散布": "rải rác; lan truyền",
    "审理": "thụ lý và xét xử",
    "实事求是": "thực sự cầu thị; tôn trọng sự thật",
    "事迹": "sự tích; thành tích",
    "涮": "nhúng; nhúng lẩu",
    "素食": "đồ chay; thức ăn chay",
    "通货": "tiền tệ lưu thông",
    "团圆": "đoàn tụ; sum họp",
    "馅儿": "nhân bánh",
    "小气": "keo kiệt; hẹp hòi",
    "协商": "hiệp thương; bàn bạc",
    "休养": "nghỉ ngơi; tĩnh dưỡng",
    "烟花": "pháo hoa",
    "预期": "dự kiến; kỳ vọng",
    "暂且": "tạm thời; trước mắt",
}

ROOT_VI = {
    "子": "con; hậu tố danh từ",
    "时": "thời gian; lúc",
    "生": "sinh; sống",
    "成": "thành; trở thành",
    "心": "tim; lòng",
    "合": "hợp; kết hợp",
    "理": "lý; lẽ; quản lý",
    "动": "động; chuyển động",
    "力": "sức; lực",
    "公": "công; công cộng",
    "面": "mặt; phương diện",
    "情": "tình; tình huống",
    "表": "biểu; thể hiện",
    "作": "làm; tạo ra",
    "方": "phương; phía; vuông",
    "经": "qua; kinh",
    "地": "đất; nơi",
    "打": "đánh; thực hiện",
    "业": "nghề; nghiệp",
    "事": "việc; sự việc",
    "手": "tay; người thạo việc",
    "同": "cùng; giống",
    "道": "đường; đạo; cách",
    "自": "tự; bản thân",
    "法": "pháp; phương pháp",
    "感": "cảm; cảm thấy",
    "为": "làm; vì",
    "得": "được; đạt được",
    "中": "giữa; trung",
    "于": "ở; tại; đối với",
    "受": "nhận; chịu",
    "主": "chủ; chính",
    "度": "độ; mức độ",
    "记": "nhớ; ghi chép",
    "结": "kết; buộc; kết quả",
    "可": "có thể; khả",
    "起": "dậy; bắt đầu",
    "学": "học",
    "习": "học; luyện tập",
}

ROOT_PINYIN = {
    "合": "hé",
    "作": "zuò",
    "地": "dì",
    "打": "dǎ",
    "为": "wéi / wèi",
    "结": "jié",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--hsk-json", type=Path, required=True)
    parser.add_argument("--anki-db", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--roots-output", type=Path)
    return parser.parse_args()


def clean_html(value: str) -> str:
    value = TAG_PATTERN.sub("", value)
    value = html.unescape(value)
    return re.sub(r"\s+", " ", value).strip(" 。;；")


def extract_context(dictionary_html: str) -> dict[str, str] | None:
    match = CONTEXT_PATTERN.search(dictionary_html)
    if not match:
        return None

    chinese = clean_html(match.group(1))
    vietnamese = clean_html(match.group(2))
    if not chinese or not vietnamese:
        return None
    return {"zh": chinese, "vi": vietnamese}


def load_vietnamese_notes(database_path: Path) -> dict[str, dict[str, Any]]:
    connection = sqlite3.connect(database_path)
    notes: dict[str, dict[str, Any]] = {}
    try:
        for tags, fields in connection.execute("SELECT tags, flds FROM notes"):
            parts = fields.split(FIELD_SEPARATOR)
            if len(parts) < 6:
                continue
            word = clean_html(parts[0])
            notes[word] = {
                "meaning": clean_html(parts[1]),
                "pinyin": clean_html(parts[2]),
                "tag": tags.strip(),
                "context": extract_context(parts[5]),
            }
    finally:
        connection.close()
    return notes


def load_hsk_entries(path: Path) -> list[dict[str, Any]]:
    return json.loads(path.read_text(encoding="utf-8"))


def hsk_level(entry: dict[str, Any]) -> int | None:
    for level in range(1, 7):
        if f"o{level}" in entry.get("l", []):
            return level
    return None


def primary_form(entry: dict[str, Any]) -> dict[str, Any]:
    forms = entry.get("f") or []
    if not forms:
        return {"t": entry["s"], "i": {"y": ""}, "m": []}
    return forms[0]


def select_entries(entries: list[dict[str, Any]]) -> list[tuple[int, dict[str, Any]]]:
    grouped: dict[int, list[dict[str, Any]]] = {level: [] for level in range(1, 7)}
    for entry in entries:
        level = hsk_level(entry)
        word = entry.get("s", "")
        if level and word and HANZI_PATTERN.search(word):
            grouped[level].append(entry)

    selected: list[tuple[int, dict[str, Any]]] = []
    for level, expected_count in EXPECTED_LEVEL_COUNTS.items():
        candidates = sorted(
            grouped[level],
            key=lambda item: (
                item.get("q") is None,
                item.get("q") or 10**9,
                item["s"],
            ),
        )
        if len(candidates) != expected_count:
            raise ValueError(
                f"HSK {level} has {len(candidates)} candidates; expected {expected_count}"
            )
        selected.extend((level, entry) for entry in candidates)

    if len(selected) != TARGET_SIZE:
        raise ValueError(f"Expected {TARGET_SIZE} words, selected {len(selected)}")
    return selected


def build_records(
    selected: list[tuple[int, dict[str, Any]]],
    vietnamese_notes: dict[str, dict[str, Any]],
) -> list[dict[str, Any]]:
    counters = {level: 0 for level in range(1, 7)}
    records: list[dict[str, Any]] = []

    for level, entry in selected:
        counters[level] += 1
        word = entry["s"]
        form = primary_form(entry)
        note = vietnamese_notes.get(word, {})
        meaning = note.get("meaning") or MANUAL_VI.get(word)
        if not meaning:
            raise ValueError(f"Missing Vietnamese meaning for {word}")

        records.append(
            {
                "id": f"hsk{level}-{counters[level]:04d}",
                "simplified": word,
                "traditional": form.get("t") or word,
                "pinyin": (note.get("pinyin") or form.get("i", {}).get("y") or "").lower(),
                "meaningVi": meaning,
                "meaningEn": (form.get("m") or [""])[0],
                "level": level,
                "frequencyRank": entry.get("q"),
                "radical": entry.get("r") or "",
                "partOfSpeech": entry.get("p") or [],
                "context": note.get("context"),
            }
        )
    return records


def build_roots(
    entries: list[dict[str, Any]],
    vietnamese_notes: dict[str, dict[str, Any]],
) -> list[dict[str, Any]]:
    roots: list[dict[str, Any]] = []
    for entry in entries:
        character = entry.get("s", "")
        if len(character) != 1 or not HANZI_PATTERN.fullmatch(character):
            continue
        form = primary_form(entry)
        note = vietnamese_notes.get(character, {})
        roots.append(
            {
                "character": character,
                "traditional": form.get("t") or character,
                "pinyin": (
                    ROOT_PINYIN.get(character)
                    or note.get("pinyin")
                    or form.get("i", {}).get("y")
                    or ""
                ).lower(),
                "meaningVi": ROOT_VI.get(character) or note.get("meaning") or "hình vị chung",
                "meaningEn": (form.get("m") or [""])[0],
                "frequencyRank": entry.get("q"),
            }
        )
    return sorted(
        roots,
        key=lambda root: (
            root["frequencyRank"] is None,
            root["frequencyRank"] or 10**9,
            root["character"],
        ),
    )


def main() -> None:
    args = parse_args()
    entries = load_hsk_entries(args.hsk_json)
    vietnamese_notes = load_vietnamese_notes(args.anki_db)
    selected = select_entries(entries)
    records = build_records(selected, vietnamese_notes)
    roots = build_roots(entries, vietnamese_notes)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(records, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    roots_output = args.roots_output or args.output.with_name("roots.json")
    roots_output.parent.mkdir(parents=True, exist_ok=True)
    roots_output.write_text(
        json.dumps(roots, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )

    counts = {level: 0 for level in range(1, 7)}
    context_count = 0
    for record in records:
        counts[record["level"]] += 1
        context_count += int(bool(record["context"]))
    print(
        json.dumps(
            {
                "words": len(records),
                "roots": len(roots),
                "levels": counts,
                "contexts": context_count,
            }
        )
    )


if __name__ == "__main__":
    main()
