import type { RootCharacter, VocabularyWord, WordFamily } from "../types/vocabulary";

export function buildFamilies(scopedWords: VocabularyWord[], roots: RootCharacter[]): WordFamily[] {
  return roots
    .map((rootWord) => ({
      root: rootWord.character,
      rootWord,
      members: scopedWords
        .filter(
          (word) =>
            word.simplified !== rootWord.character && word.simplified.includes(rootWord.character),
        )
        .sort(compareWords),
    }))
    .filter((family) => family.members.length >= 2)
    .sort(
      (left, right) =>
        right.members.length - left.members.length ||
        (left.rootWord.frequencyRank ?? Number.MAX_SAFE_INTEGER) -
          (right.rootWord.frequencyRank ?? Number.MAX_SAFE_INTEGER),
    );
}

export function compareWords(left: VocabularyWord, right: VocabularyWord): number {
  return (
    left.level - right.level ||
    (left.frequencyRank ?? Number.MAX_SAFE_INTEGER) -
      (right.frequencyRank ?? Number.MAX_SAFE_INTEGER) ||
    left.simplified.localeCompare(right.simplified, "zh-CN")
  );
}

export function findBestFamilyForWord(
  word: VocabularyWord,
  families: WordFamily[],
): WordFamily | undefined {
  return families
    .filter((family) => word.simplified.includes(family.root))
    .sort((left, right) => right.members.length - left.members.length)[0];
}
