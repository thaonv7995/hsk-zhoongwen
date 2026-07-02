#!/usr/bin/env python3
"""Attach one complete Chinese–Vietnamese example sentence to every HSK word."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any, Iterable

HANZI = re.compile(r"[\u3400-\u9fff]")
INVALID_TEXT = re.compile(r"https?://|www\.|<[^>]+>|\{[^}]+\}", re.IGNORECASE)
CANTONESE_MARKERS = re.compile(r"[嘅係喺咗冇啲咁咩唔佢哋嚟俾畀噉]")
TERMINAL_ZH = re.compile(r"[。！？!?]$")
TERMINAL_VI = re.compile(r"[.!?…]$")

SOURCE_PENALTY = {
    "dictionary": 0,
    "tatoeba": 0,
    "alt": 5,
    "ted2020": 7,
    "wikimatrix": 20,
    "opensubtitles": 25,
    "manual": 0,
}

VI_STOPWORDS = {
    "cái",
    "các",
    "cho",
    "con",
    "của",
    "đã",
    "để",
    "đó",
    "là",
    "một",
    "này",
    "người",
    "những",
    "sự",
    "trong",
    "và",
    "về",
    "việc",
    "với",
}

MANUAL_EXAMPLES: dict[str, tuple[str, str]] = {
    "京剧": ("我爷爷很喜欢看京剧。", "Ông tôi rất thích xem kinh kịch."),
    "任重道远": ("这项工作任重道远，我们不能放松。", "Công việc này còn nặng nề và lâu dài, chúng ta không thể lơ là."),
    "勤俭": ("她一直保持勤俭的生活习惯。", "Cô ấy luôn duy trì thói quen sống cần kiệm."),
    "博大精深": ("中国文化博大精深。", "Văn hóa Trung Quốc rộng lớn và uyên thâm."),
    "压岁钱": ("春节时，孩子们会收到压岁钱。", "Vào dịp Tết, trẻ em sẽ nhận được tiền mừng tuổi."),
    "喜闻乐见": ("这种节目是大家喜闻乐见的。", "Loại chương trình này được mọi người yêu thích."),
    "墨水儿": ("钢笔里的墨水儿用完了。", "Mực trong bút máy đã hết."),
    "娇气": ("这个孩子有点儿娇气。", "Đứa trẻ này hơi yếu đuối và được nuông chiều."),
    "得不偿失": ("为了省一点钱而浪费时间，真是得不偿失。", "Lãng phí thời gian chỉ để tiết kiệm một ít tiền thật là lợi bất cập hại."),
    "急于求成": ("学语言不能急于求成。", "Học ngôn ngữ không thể nóng vội muốn thành công ngay."),
    "恳切": ("他用恳切的语气请求帮助。", "Anh ấy chân thành nhờ mọi người giúp đỡ."),
    "慌忙": ("听到消息后，他慌忙赶回家。", "Sau khi nghe tin, anh ấy vội vàng trở về nhà."),
    "招投标": ("这个工程正在进行招投标。", "Công trình này đang tiến hành mời thầu và đấu thầu."),
    "挺拔": ("校园里有一排挺拔的松树。", "Trong sân trường có một hàng thông cao thẳng."),
    "摊儿": ("夜市里有很多小吃摊儿。", "Trong chợ đêm có rất nhiều quầy đồ ăn vặt."),
    "斑纹": ("这只猫身上有漂亮的斑纹。", "Con mèo này có những vằn rất đẹp trên thân."),
    "斩钉截铁": ("他斩钉截铁地拒绝了这个要求。", "Anh ấy dứt khoát từ chối yêu cầu này."),
    "朝气蓬勃": ("这些年轻人朝气蓬勃。", "Những người trẻ này tràn đầy sức sống."),
    "沾光": ("多亏你的帮助，我也跟着沾光了。", "Nhờ sự giúp đỡ của bạn mà tôi cũng được hưởng lợi."),
    "深情厚谊": ("我们不会忘记两国人民的深情厚谊。", "Chúng tôi sẽ không quên tình hữu nghị sâu sắc giữa nhân dân hai nước."),
    "潜移默化": ("父母的言行会潜移默化地影响孩子。", "Lời nói và hành động của cha mẹ sẽ âm thầm ảnh hưởng đến con cái."),
    "理直气壮": ("有事实作证，他说得理直气壮。", "Có sự thật làm chứng nên anh ấy nói rất đanh thép và tự tin."),
    "画蛇添足": ("你再加这一句就有点儿画蛇添足了。", "Bạn thêm câu này nữa thì hơi thừa thãi, giống như vẽ rắn thêm chân."),
    "砖瓦": ("这座老房子是用砖瓦建成的。", "Ngôi nhà cổ này được xây bằng gạch và ngói."),
    "简体字": ("这本书使用简体字。", "Cuốn sách này sử dụng chữ giản thể."),
    "系领带": ("他每天上班都要系领带。", "Ngày nào đi làm anh ấy cũng phải thắt cà vạt."),
    "繁体字": ("她正在学习繁体字。", "Cô ấy đang học chữ phồn thể."),
    "纪要": ("请把会议纪要发给大家。", "Hãy gửi biên bản tóm tắt cuộc họp cho mọi người."),
    "纽扣儿": ("这件衣服掉了一颗纽扣儿。", "Chiếc áo này bị rơi mất một cái cúc."),
    "统筹兼顾": ("制定计划时要统筹兼顾各方面的需要。", "Khi lập kế hoạch cần cân nhắc và phối hợp nhu cầu của mọi phía."),
    "继往开来": ("年轻一代要继往开来，继续努力。", "Thế hệ trẻ phải kế thừa quá khứ, mở ra tương lai và tiếp tục nỗ lực."),
    "重阳节": ("重阳节这天，我们去看望爷爷奶奶。", "Vào Tết Trùng Dương, chúng tôi đến thăm ông bà."),
    "锲而不舍": ("只要锲而不舍，就一定能进步。", "Chỉ cần kiên trì không bỏ cuộc thì nhất định sẽ tiến bộ."),
    "闭塞": ("这个山村过去交通很闭塞。", "Trước đây giao thông ở ngôi làng miền núi này rất cách trở."),
    "风土人情": ("旅行让我了解当地的风土人情。", "Chuyến đi giúp tôi hiểu phong tục và đời sống của địa phương."),
    "飞禽走兽": ("这片森林里生活着各种飞禽走兽。", "Trong khu rừng này có đủ loài chim muông và thú vật sinh sống."),
    "糖葫芦": ("小孩子们很喜欢吃糖葫芦。", "Trẻ em rất thích ăn kẹo hồ lô."),
    "实现": ("只要坚持努力，我们就能实现目标。", "Chỉ cần kiên trì nỗ lực, chúng ta có thể thực hiện mục tiêu."),
    "对联": ("春节时，爷爷在门口贴了一副对联。", "Vào dịp Tết, ông đã dán một đôi câu đối trước cửa."),
    "做东": ("今天我做东，请大家一起吃饭。", "Hôm nay tôi làm chủ tiệc, mời mọi người cùng ăn cơm."),
    "苦尽甘来": ("经过多年的努力，他终于苦尽甘来。", "Sau nhiều năm nỗ lực, cuối cùng anh ấy đã khổ tận cam lai."),
    "端午节": ("端午节的时候，人们常常吃粽子。", "Vào Tết Đoan Ngọ, mọi người thường ăn bánh ú."),
    "拔苗助长": ("学习要循序渐进，不能拔苗助长。", "Học tập phải tiến từng bước, không thể nóng vội đốt cháy giai đoạn."),
    "各抒己见": ("讨论会上，大家各抒己见。", "Trong buổi thảo luận, mọi người đều nêu ý kiến của mình."),
    "武侠": ("他从小就喜欢看武侠小说。", "Từ nhỏ anh ấy đã thích đọc tiểu thuyết võ hiệp."),
    "举世瞩目": ("中国的发展成就举世瞩目。", "Thành tựu phát triển của Trung Quốc thu hút sự chú ý của toàn thế giới."),
    "须知": ("参加考试前，请仔细阅读考生须知。", "Trước khi dự thi, hãy đọc kỹ hướng dẫn dành cho thí sinh."),
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--vocabulary", type=Path, required=True)
    parser.add_argument(
        "--corpus",
        action="append",
        default=[],
        metavar="NAME:ZH_PATH:VI_PATH",
        help="Aligned UTF-8 files with one sentence per line.",
    )
    return parser.parse_args()


def normalize_space(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def normalize_chinese(text: str) -> str:
    text = normalize_space(text).strip("，,；;：:")
    return text if TERMINAL_ZH.search(text) else f"{text}。"


def normalize_vietnamese(text: str) -> str:
    text = normalize_space(text).strip(" ,;:")
    return text if TERMINAL_VI.search(text) else f"{text}."


def is_usable(zh: str, vi: str, word: str) -> bool:
    if (
        word not in zh
        or INVALID_TEXT.search(zh)
        or INVALID_TEXT.search(vi)
        or CANTONESE_MARKERS.search(zh)
    ):
        return False
    hanzi_count = len(HANZI.findall(zh))
    if not 5 <= hanzi_count <= 55:
        return False
    if not 5 <= len(vi) <= 220:
        return False
    return True


def has_clean_occurrence(zh: str, word: str, word_set: set[str], max_word_length: int) -> bool:
    """Reject matches formed by crossing two neighboring HSK words, e.g. 对联 in 应对联合国."""
    for match in re.finditer(re.escape(word), zh):
        start, end = match.span()
        crossing = False
        left_edge = max(0, start - max_word_length + 1)
        right_edge = min(len(zh), end + max_word_length - 1)
        for other_start in range(left_edge, end):
            for other_end in range(other_start + 2, min(right_edge, other_start + max_word_length) + 1):
                crosses_left = other_start < start < other_end < end
                crosses_right = start < other_start < end < other_end
                if (crosses_left or crosses_right) and zh[other_start:other_end] in word_set:
                    crossing = True
                    break
            if crossing:
                break
        if not crossing:
            return True
    return False


def meaning_bonus(vi: str, meaning: str) -> float:
    normalized_vi = vi.lower()
    senses = [sense.strip().lower() for sense in re.split(r"[;,]", meaning) if sense.strip()]
    bonus = 0.0
    if any(len(sense) >= 3 and sense in normalized_vi for sense in senses):
        bonus += 11
    tokens = {
        token
        for token in re.findall(r"[a-zà-ỹđ]+", meaning.lower())
        if len(token) >= 2 and token not in VI_STOPWORDS
    }
    bonus += min(8, sum(2.5 for token in tokens if token in normalized_vi))
    return bonus


def quality_score(zh: str, vi: str, source: str, meaning: str) -> float:
    hanzi_count = len(HANZI.findall(zh))
    score = SOURCE_PENALTY[source]
    score += abs(hanzi_count - 14) * 0.8
    score += max(0, hanzi_count - 28) * 1.5
    score += max(0, len(vi) - 100) * 0.08
    if TERMINAL_ZH.search(zh):
        score -= 1.5
    if "，" in zh or "," in zh:
        score -= 0.4
    if source not in {"dictionary", "manual"}:
        score -= meaning_bonus(vi, meaning)
    return score


def corpus_spec(value: str) -> tuple[str, Path, Path]:
    name, zh_path, vi_path = value.split(":", 2)
    normalized_name = name.lower()
    if normalized_name not in SOURCE_PENALTY:
        raise ValueError(f"Unknown source name: {name}")
    return normalized_name, Path(zh_path), Path(vi_path)


def aligned_lines(zh_path: Path, vi_path: Path) -> Iterable[tuple[str, str]]:
    with zh_path.open(encoding="utf-8", errors="ignore") as zh_file:
        with vi_path.open(encoding="utf-8", errors="ignore") as vi_file:
            for zh, vi in zip(zh_file, vi_file):
                yield normalize_space(zh), normalize_space(vi)


def main() -> None:
    args = parse_args()
    records: list[dict[str, Any]] = json.loads(args.vocabulary.read_text(encoding="utf-8"))
    words = [record["simplified"] for record in records]
    word_set = set(words)
    max_word_length = max(map(len, words))
    meaning_by_word = {record["simplified"]: record["meaningVi"] for record in records}
    pattern = re.compile("|".join(re.escape(word) for word in sorted(words, key=len, reverse=True)))
    best: dict[str, tuple[float, dict[str, str]]] = {}

    for record in records:
        context = record.get("context")
        if not context:
            continue
        zh = normalize_chinese(context["zh"])
        vi = normalize_vietnamese(context["vi"])
        word = record["simplified"]
        if is_usable(zh, vi, word):
            best[word] = (
                quality_score(zh, vi, "dictionary", record["meaningVi"]),
                {"zh": zh, "pinyin": "", "vi": vi, "source": "dictionary"},
            )

    for spec in args.corpus:
        source, zh_path, vi_path = corpus_spec(spec)
        for zh, vi in aligned_lines(zh_path, vi_path):
            if not is_usable(zh, vi, ""):
                continue
            matches = {match.group(0) for match in pattern.finditer(zh)}
            for word in matches & word_set:
                if not is_usable(zh, vi, word) or not has_clean_occurrence(
                    zh, word, word_set, max_word_length
                ):
                    continue
                candidate_zh = normalize_chinese(zh)
                candidate_vi = normalize_vietnamese(vi)
                score = quality_score(
                    candidate_zh,
                    candidate_vi,
                    source,
                    meaning_by_word[word],
                )
                if word not in best or score < best[word][0]:
                    best[word] = (
                        score,
                        {
                            "zh": candidate_zh,
                            "pinyin": "",
                            "vi": candidate_vi,
                            "source": source,
                        },
                    )

    for word, (zh, vi) in MANUAL_EXAMPLES.items():
        if word in word_set:
            best[word] = (
                quality_score(zh, vi, "manual", meaning_by_word[word]),
                {"zh": zh, "pinyin": "", "vi": vi, "source": "manual"},
            )

    missing = sorted(word_set - best.keys())
    if missing:
        raise ValueError(f"Missing examples for {len(missing)} words: {missing}")

    for record in records:
        record["context"] = best[record["simplified"]][1]

    args.vocabulary.write_text(
        json.dumps(records, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    by_source: dict[str, int] = {}
    for _, context in best.values():
        source = context["source"]
        by_source[source] = by_source.get(source, 0) + 1
    print(json.dumps({"records": len(records), "sources": by_source}, ensure_ascii=False))


if __name__ == "__main__":
    main()
