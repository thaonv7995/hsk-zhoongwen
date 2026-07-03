import type { VocabularyWord } from "../types/vocabulary";

export function normalizeSearch(value: string): string {
  return value
    .toLocaleLowerCase("vi")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/\s+/g, " ")
    .trim();
}

const searchCache = new WeakMap<VocabularyWord, string>();

export function wordMatchesQuery(word: VocabularyWord, rawQuery: string): boolean {
  const query = normalizeSearch(rawQuery);
  if (!query) return true;

  let searchable = searchCache.get(word);
  if (searchable === undefined) {
    searchable = normalizeSearch(
      [
        word.simplified,
        word.traditional,
        word.pinyin,
        word.meaningVi,
        word.meaningEn,
        word.context?.zh ?? "",
        word.context?.vi ?? "",
      ].join(" "),
    );
    searchCache.set(word, searchable);
  }
  return searchable.includes(query);
}
