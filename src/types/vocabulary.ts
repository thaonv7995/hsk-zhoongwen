export type HskLevel = 1 | 2 | 3 | 4 | 5 | 6;

export type WordContext = {
  zh: string;
  pinyin: string;
  vi: string;
  source: string;
};

export type VocabularyWord = {
  id: string;
  simplified: string;
  traditional: string;
  pinyin: string;
  meaningVi: string;
  meaningEn: string;
  level: HskLevel;
  frequencyRank: number | null;
  radical: string;
  partOfSpeech: string[];
  context: WordContext | null;
};

export type RootCharacter = {
  character: string;
  traditional: string;
  pinyin: string;
  meaningVi: string;
  meaningEn: string;
  frequencyRank: number | null;
};

export type WordFamily = {
  root: string;
  rootWord: RootCharacter;
  members: VocabularyWord[];
};

export type AppView = "families" | "dictionary" | "practice" | "settings";

export type FamilyRange = "all" | "level";
