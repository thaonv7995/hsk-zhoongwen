import { LEVEL_COLORS } from "../../constants/hsk";
import type { VocabularyWord, WordFamily } from "../../types/vocabulary";

const POSITIONS = [
  { x: 50, y: 10 },
  { x: 78, y: 22 },
  { x: 85, y: 50 },
  { x: 78, y: 78 },
  { x: 50, y: 90 },
  { x: 22, y: 78 },
  { x: 15, y: 50 },
  { x: 22, y: 22 },
];

type FamilyMapProps = {
  family: WordFamily;
  visibleWords: VocabularyWord[];
  selectedWordId: string;
  knownWords: Set<string>;
  onWordChange: (wordId: string) => void;
};

export function FamilyMap({
  family,
  visibleWords,
  selectedWordId,
  knownWords,
  onWordChange,
}: FamilyMapProps) {
  return (
    <div className="word-map" aria-label={`Sơ đồ họ từ ${family.root}`}>
      <svg className="map-lines" viewBox="0 0 100 100" aria-hidden="true">
        {visibleWords.map((word, index) => {
          const position = POSITIONS[index];
          if (!position) return null;
          return (
            <line
              className="map-line"
              x1="50"
              y1="50"
              x2={position.x}
              y2={position.y}
              key={word.id}
            />
          );
        })}
      </svg>

      <div className="root-node">
        <span className="root-char">{family.root}</span>
        <span className="root-pinyin">{family.rootWord.pinyin}</span>
        <span className="root-meaning">{family.rootWord.meaningVi}</span>
      </div>

      {visibleWords.map((word, index) => {
        const position = POSITIONS[index];
        if (!position) return null;
        return (
          <button
            className={`word-node ${word.id === selectedWordId ? "active" : ""}`}
            type="button"
            key={word.id}
            onClick={() => onWordChange(word.id)}
            style={
              {
                left: `${position.x}%`,
                top: `${position.y}%`,
                "--word-level-color": LEVEL_COLORS[word.level],
              } as React.CSSProperties
            }
            aria-label={`${word.simplified}, ${word.pinyin}, ${word.meaningVi}, HSK ${word.level}`}
          >
            <span className="node-char">{word.simplified}</span>
            <span className="node-copy">
              <strong>{word.pinyin}</strong>
              <small>{word.meaningVi}</small>
            </span>
            <span className="node-level">{word.level}</span>
            {knownWords.has(word.id) ? (
              <span className="node-known" aria-label="Đã nhớ">
                ✓
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
