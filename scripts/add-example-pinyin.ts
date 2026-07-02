import { readFile, writeFile } from "node:fs/promises";
import { pinyin } from "pinyin-pro";
import type { VocabularyWord } from "../src/types/vocabulary";

const vocabularyPath = new URL("../src/data/vocabulary.json", import.meta.url);
const records = JSON.parse(await readFile(vocabularyPath, "utf8")) as VocabularyWord[];

for (const record of records) {
  if (!record.context) throw new Error(`Missing context for ${record.simplified}`);
  record.context.pinyin = pinyin(record.context.zh, {
    toneType: "symbol",
    nonZh: "consecutive",
  })
    .replace(/\s+([，。！？；：,.!?;:])/g, "$1")
    .replace(/([（(“‘《【「『])\s+/g, "$1")
    .replace(/\s+([）)”’》】」』])/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();
}

await writeFile(vocabularyPath, JSON.stringify(records), "utf8");
console.log(JSON.stringify({ records: records.length, status: "pinyin-added" }));
