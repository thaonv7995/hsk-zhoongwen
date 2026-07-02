import { LEVEL_COLORS, PART_OF_SPEECH } from "../../constants/hsk";
import { speakChinese } from "../../lib/speech";
import type { VocabularyWord } from "../../types/vocabulary";

type WordDetailProps = {
  word: VocabularyWord;
  root: string;
  isKnown: boolean;
  onToggleKnown: (id: string) => void;
};

export function WordDetail({ word, root, isKnown, onToggleKnown }: WordDetailProps) {
  const labels = word.partOfSpeech
    .map((code) => PART_OF_SPEECH[code] ?? code)
    .filter((label, index, values) => values.indexOf(label) === index)
    .slice(0, 3);

  return (
    <aside
      className="detail-card"
      aria-live="polite"
      style={{ "--detail-color": LEVEL_COLORS[word.level] } as React.CSSProperties}
    >
      <div className="detail-band" />
      <div className="detail-inner">
        <div className="detail-heading">
          <span>
            HSK {word.level} · Họ từ {root}
          </span>
        </div>

        <div className="detail-word-row">
          <div className="detail-word">{word.simplified}</div>
          <button
            className="round-button detail-word-sound"
            type="button"
            onClick={() => speakChinese(word.simplified)}
            aria-label={`Nghe ${word.simplified}`}
            title={`Nghe ${word.simplified}`}
          >
            ♪
          </button>
        </div>
        <div className="detail-pinyin">{word.pinyin}</div>
        <div className="detail-meaning">{word.meaningVi}</div>

        <dl className="word-meta">
          {word.traditional !== word.simplified ? (
            <>
              <dt>Phồn thể</dt>
              <dd>{word.traditional}</dd>
            </>
          ) : null}
          {labels.length ? (
            <>
              <dt>Từ loại</dt>
              <dd>{labels.join(" · ")}</dd>
            </>
          ) : null}
          {word.radical ? (
            <>
              <dt>Bộ</dt>
              <dd>{word.radical}</dd>
            </>
          ) : null}
        </dl>

        <div className="detail-divider" />
        <section className="context-block">
          {word.context ? (
            <>
              <div className="context-heading">
                <span className="eyebrow">CÂU VÍ DỤ TRONG NGỮ CẢNH</span>
                <button
                  className="context-sound"
                  type="button"
                  aria-label={`Nghe câu ví dụ có từ ${word.simplified}`}
                  onClick={() => speakChinese(word.context?.zh ?? word.simplified)}
                >
                  ♪ Nghe câu
                </button>
              </div>
              <p className="context-hanzi">{word.context.zh}</p>
              <p className="context-pinyin">{word.context.pinyin}</p>
              <p className="context-vi">{word.context.vi}</p>
            </>
          ) : (
            <>
              <span className="eyebrow">CÂU VÍ DỤ TRONG NGỮ CẢNH</span>
              <p className="context-empty">Cần đồng bộ lại dữ liệu câu ví dụ cho mục từ này.</p>
            </>
          )}
        </section>

        <button
          className={`known-button ${isKnown ? "is-known" : ""}`}
          type="button"
          onClick={() => onToggleKnown(word.id)}
        >
          {isKnown ? "✓ Đã ghi nhớ" : "+ Đánh dấu đã nhớ"}
        </button>
      </div>
    </aside>
  );
}
