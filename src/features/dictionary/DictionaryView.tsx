import { useMemo, useState } from "react";
import { LEVEL_COLORS } from "../../constants/hsk";
import { speakChinese } from "../../lib/speech";
import type { VocabularyWord } from "../../types/vocabulary";

const PAGE_SIZE = 30;

type DictionaryViewProps = {
  words: VocabularyWord[];
  knownWords: Set<string>;
  onToggleKnown: (id: string) => void;
  onExploreWord: (word: VocabularyWord) => void;
  canExploreWord: (word: VocabularyWord) => boolean;
};

export function DictionaryView({
  words,
  knownWords,
  onToggleKnown,
  onExploreWord,
  canExploreWord,
}: DictionaryViewProps) {
  const [page, setPage] = useState(0);
  const [selectedWordId, setSelectedWordId] = useState("");
  const pageCount = Math.max(1, Math.ceil(words.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const visibleWords = useMemo(
    () => words.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE),
    [safePage, words],
  );
  const selectedWord =
    words.find((word) => word.id === selectedWordId) ?? visibleWords[0] ?? words[0];

  const changePage = (nextPage: number) => {
    const bounded = Math.max(0, Math.min(nextPage, pageCount - 1));
    setPage(bounded);
    setSelectedWordId(words[bounded * PAGE_SIZE]?.id ?? "");
  };

  return (
    <section className="dictionary-card">
      <div className="dictionary-heading">
        <div>
          <span className="eyebrow">TRA CỨU NHANH</span>
          <h2>{words.length.toLocaleString("vi-VN")} mục từ</h2>
        </div>
        <p>Chọn một mục từ để xem câu ví dụ, pinyin và nghe phát âm.</p>
      </div>

      {selectedWord ? (
        <aside
          className="dictionary-preview"
          aria-live="polite"
          style={{ "--preview-color": LEVEL_COLORS[selectedWord.level] } as React.CSSProperties}
        >
          <div className="preview-word-block">
            <span className="preview-level">HSK {selectedWord.level}</span>
            <div className="preview-word-row">
              <strong>{selectedWord.simplified}</strong>
              <button
                className="round-button preview-word-sound"
                type="button"
                aria-label={`Nghe ${selectedWord.simplified}`}
                title={`Nghe ${selectedWord.simplified}`}
                onClick={() => speakChinese(selectedWord.simplified)}
              >
                ♪
              </button>
            </div>
            <em>{selectedWord.pinyin}</em>
            <span>{selectedWord.meaningVi}</span>
          </div>

          <div className="preview-context">
            {selectedWord.context ? (
              <>
                <div className="context-heading">
                  <span className="eyebrow">CÂU VÍ DỤ</span>
                  <button
                    className="context-sound"
                    type="button"
                    aria-label={`Nghe câu ví dụ có từ ${selectedWord.simplified}`}
                    onClick={() =>
                      speakChinese(selectedWord.context?.zh ?? selectedWord.simplified)
                    }
                  >
                    ♪ Nghe câu
                  </button>
                </div>
                <p className="context-hanzi">{selectedWord.context.zh}</p>
                <p className="context-pinyin">{selectedWord.context.pinyin}</p>
                <p className="context-vi">{selectedWord.context.vi}</p>
              </>
            ) : (
              <p className="context-empty">Cần đồng bộ lại dữ liệu câu ví dụ cho mục từ này.</p>
            )}
          </div>

          <div className="preview-actions">
            <button
              className={knownWords.has(selectedWord.id) ? "known" : ""}
              type="button"
              onClick={() => onToggleKnown(selectedWord.id)}
            >
              {knownWords.has(selectedWord.id) ? "✓ Đã nhớ" : "+ Đánh dấu đã nhớ"}
            </button>
            {canExploreWord(selectedWord) ? (
              <button type="button" onClick={() => onExploreWord(selectedWord)}>
                Mở họ từ →
              </button>
            ) : null}
          </div>
        </aside>
      ) : null}

      <div className="word-table" role="table" aria-label="Danh sách từ vựng HSK">
        <div className="word-row word-row-head" role="row">
          <span>Từ</span>
          <span>Pinyin</span>
          <span>Nghĩa tiếng Việt</span>
          <span>Cấp độ</span>
          <span>Trạng thái</span>
        </div>
        {visibleWords.map((word) => {
          const isKnown = knownWords.has(word.id);
          return (
            <div
              className={`word-row ${selectedWord?.id === word.id ? "selected" : ""}`}
              role="row"
              key={word.id}
            >
              <button
                className="table-word"
                type="button"
                aria-label={`Xem chi tiết ${word.simplified}`}
                aria-pressed={selectedWord?.id === word.id}
                onClick={() => setSelectedWordId(word.id)}
              >
                {word.simplified}
              </button>
              <span className="table-pinyin">{word.pinyin}</span>
              <span className="table-meaning">{word.meaningVi}</span>
              <span
                className="table-level"
                style={{ "--table-level-color": LEVEL_COLORS[word.level] } as React.CSSProperties}
              >
                HSK {word.level}
              </span>
              <span className="table-actions">
                <button
                  className="mini-action"
                  type="button"
                  aria-label={`Nghe ${word.simplified}`}
                  onClick={() => speakChinese(word.simplified)}
                >
                  ♪
                </button>
                <button
                  className={`mini-action ${isKnown ? "known" : ""}`}
                  type="button"
                  aria-label={
                    isKnown ? `Bỏ đánh dấu ${word.simplified}` : `Đánh dấu ${word.simplified}`
                  }
                  onClick={() => onToggleKnown(word.id)}
                >
                  ✓
                </button>
              </span>
            </div>
          );
        })}
      </div>

      <div className="dictionary-footer">
        <span>
          Trang {safePage + 1} / {pageCount}
        </span>
        <div className="page-buttons">
          <button type="button" onClick={() => changePage(safePage - 1)} disabled={safePage === 0}>
            ← Trước
          </button>
          <button
            type="button"
            onClick={() => changePage(safePage + 1)}
            disabled={safePage === pageCount - 1}
          >
            Sau →
          </button>
        </div>
      </div>
    </section>
  );
}
