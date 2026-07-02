import { useMemo, useState } from "react";
import { speakChinese } from "../../lib/speech";
import type { FamilyRange, HskLevel, WordFamily } from "../../types/vocabulary";
import { FamilyMap } from "./FamilyMap";
import { WordDetail } from "./WordDetail";

const PAGE_SIZE = 8;

type FamilyExplorerProps = {
  family: WordFamily | undefined;
  selectedWordId: string;
  knownWords: Set<string>;
  activeLevel: HskLevel | null;
  familyRange: FamilyRange;
  completeCount: number;
  scopedCount: number;
  onWordChange: (wordId: string) => void;
  onToggleKnown: (id: string) => void;
  onRangeChange: (range: FamilyRange) => void;
};

export function FamilyExplorer({
  family,
  selectedWordId,
  knownWords,
  activeLevel,
  familyRange,
  completeCount,
  scopedCount,
  onWordChange,
  onToggleKnown,
  onRangeChange,
}: FamilyExplorerProps) {
  const [pageByRoot, setPageByRoot] = useState<Record<string, number>>({});
  const page = family ? (pageByRoot[family.root] ?? 0) : 0;
  const pageCount = family ? Math.max(1, Math.ceil(family.members.length / PAGE_SIZE)) : 1;
  const safePage = Math.min(page, pageCount - 1);
  const visibleWords = useMemo(
    () => family?.members.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE) ?? [],
    [family, safePage],
  );
  const selectedWord =
    family?.members.find((word) => word.id === selectedWordId) ??
    visibleWords[0] ??
    family?.members[0];

  if (!family || !selectedWord) {
    return (
      <div className="empty-panel">
        <strong>Chưa có họ từ phù hợp.</strong>
        <p>Hãy chọn “Tất cả HSK” hoặc một cấp độ khác.</p>
      </div>
    );
  }

  const changePage = (nextPage: number) => {
    const bounded = Math.max(0, Math.min(nextPage, pageCount - 1));
    setPageByRoot((current) => ({ ...current, [family.root]: bounded }));
    const firstWord = family.members[bounded * PAGE_SIZE];
    if (firstWord) onWordChange(firstWord.id);
  };

  return (
    <div className="explore-grid">
      <section className="map-card" aria-labelledby="family-map-title">
        <div className="card-topline">
          <div>
            <span className="eyebrow">SƠ ĐỒ HỌ TỪ</span>
            <h2 id="family-map-title">
              Các từ có chữ <span>{family.root}</span>
            </h2>
          </div>
          <button className="sound-button" type="button" onClick={() => speakChinese(family.root)}>
            ♪ Nghe chữ gốc
          </button>
        </div>

        {activeLevel ? (
          <div className="family-range-switch" role="group" aria-label="Phạm vi họ từ">
            <button
              className={familyRange === "all" ? "active" : ""}
              type="button"
              aria-pressed={familyRange === "all"}
              onClick={() => onRangeChange("all")}
            >
              Toàn bộ họ · {completeCount}
            </button>
            <button
              className={familyRange === "level" ? "active" : ""}
              type="button"
              aria-pressed={familyRange === "level"}
              onClick={() => onRangeChange("level")}
            >
              Chỉ HSK {activeLevel} · {scopedCount}
            </button>
          </div>
        ) : null}

        <FamilyMap
          family={family}
          visibleWords={visibleWords}
          selectedWordId={selectedWord.id}
          knownWords={knownWords}
          onWordChange={onWordChange}
        />

        <div className="map-footer">
          <span>
            {safePage * PAGE_SIZE + 1}–{Math.min((safePage + 1) * PAGE_SIZE, family.members.length)}{" "}
            / {family.members.length} từ
          </span>
          <div className="page-buttons">
            <button
              type="button"
              onClick={() => changePage(safePage - 1)}
              disabled={safePage === 0}
            >
              ←
            </button>
            <span>
              {safePage + 1}/{pageCount}
            </span>
            <button
              type="button"
              onClick={() => changePage(safePage + 1)}
              disabled={safePage === pageCount - 1}
            >
              →
            </button>
          </div>
        </div>
      </section>

      <WordDetail
        word={selectedWord}
        root={family.root}
        isKnown={knownWords.has(selectedWord.id)}
        onToggleKnown={onToggleKnown}
      />
    </div>
  );
}
