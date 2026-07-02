import vocabulary from "../src/data/vocabulary.json";
import roots from "../src/data/roots.json";

type VocabularyRecord = {
  id: string;
  simplified: string;
  pinyin: string;
  meaningVi: string;
  level: number;
  context: {
    zh: string;
    pinyin: string;
    vi: string;
    source: string;
  } | null;
};

const records = vocabulary as VocabularyRecord[];
const ids = new Set<string>();
const words = new Set<string>();
const levelCounts = new Map<number, number>();

for (const record of records) {
  if (!record.id || !record.simplified || !record.pinyin || !record.meaningVi) {
    throw new Error(`Invalid vocabulary record: ${JSON.stringify(record)}`);
  }
  if (
    !record.context?.zh ||
    !record.context.pinyin ||
    !record.context.vi ||
    !record.context.source ||
    !record.context.zh.includes(record.simplified)
  ) {
    throw new Error(`Invalid example sentence for ${record.simplified}`);
  }
  if (record.level < 1 || record.level > 6) {
    throw new Error(`Invalid HSK level for ${record.simplified}: ${record.level}`);
  }
  if (ids.has(record.id)) throw new Error(`Duplicate id: ${record.id}`);
  if (words.has(record.simplified)) throw new Error(`Duplicate word: ${record.simplified}`);
  ids.add(record.id);
  words.add(record.simplified);
  levelCounts.set(record.level, (levelCounts.get(record.level) ?? 0) + 1);
}

if (records.length !== 4_991) {
  throw new Error(`Expected 4,991 normalized records, received ${records.length}`);
}

if (roots.length < 1_000) {
  throw new Error(`Expected at least 1,000 root characters, received ${roots.length}`);
}

console.log(
  JSON.stringify({
    status: "ok",
    records: records.length,
    roots: roots.length,
    levels: Object.fromEntries(levelCounts),
  }),
);
