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

export function wordMatchesQuery(word: VocabularyWord, rawQuery: string): boolean {
  const query = normalizeSearch(rawQuery);
  if (!query) return true;

  const searchable = normalizeSearch(
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
  return searchable.includes(query);
}
