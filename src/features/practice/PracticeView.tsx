import { useMemo, useState } from "react";
import { speakChinese } from "../../lib/speech";
import type { VocabularyWord } from "../../types/vocabulary";

type QuizQuestion = {
  answer: VocabularyWord;
  options: VocabularyWord[];
};

type PracticeViewProps = {
  words: VocabularyWord[];
  knownWords: Set<string>;
  onToggleKnown: (id: string) => void;
};

function shuffled<T>(items: T[], seed: number): T[] {
  const result = [...items];
  let state = seed + 1;
  const random = () => {
    state = (state * 1_664_525 + 1_013_904_223) % 4_294_967_296;
    return state / 4_294_967_296;
  };

  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [result[index], result[target]] = [result[target]!, result[index]!];
  }
  return result;
}

function createQuestion(words: VocabularyWord[], seed: number): QuizQuestion | null {
  if (words.length < 4) return null;
  const answer = words[(seed * 97 + 41) % words.length];
  if (!answer) return null;
  const distractors = shuffled(
    words.filter((word) => word.meaningVi !== answer.meaningVi),
    seed + 17,
  ).slice(0, 3);
  return { answer, options: shuffled([answer, ...distractors], seed + 31) };
}

import { TypingPractice } from "./TypingPractice";

export function PracticeView({ words, knownWords, onToggleKnown }: PracticeViewProps) {
  const [mode, setMode] = useState<"quiz" | "typing">("typing");
  const [questionSeed, setQuestionSeed] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const [total, setTotal] = useState(0);
  const question = useMemo(() => createQuestion(words, questionSeed), [questionSeed, words]);

  if (!question) return <div className="empty-panel">Chưa đủ từ để tạo câu hỏi.</div>;

  const answered = selectedId !== null;
  const wasCorrect = selectedId === question.answer.id;

  const answer = (word: VocabularyWord) => {
    if (answered) return;
    setSelectedId(word.id);
    setTotal((value) => value + 1);
    if (word.id === question.answer.id) setCorrect((value) => value + 1);
  };

  const next = () => {
    setSelectedId(null);
    setQuestionSeed((value) => value + 1);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div className="practice-mode-switch" style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
        <button 
          className={`secondary-button ${mode === "typing" ? "active" : ""}`}
          onClick={() => setMode("typing")}
          style={mode === "typing" ? { background: "var(--coral)", color: "white", borderColor: "var(--coral)" } : {}}
        >
          Luyện gõ
        </button>
        <button 
          className={`secondary-button ${mode === "quiz" ? "active" : ""}`}
          onClick={() => setMode("quiz")}
          style={mode === "quiz" ? { background: "var(--coral)", color: "white", borderColor: "var(--coral)" } : {}}
        >
          Trắc nghiệm
        </button>
      </div>

      {mode === "typing" ? (
        <TypingPractice words={words} />
      ) : (
        <section className="practice-card">
          <div className="practice-heading">
            <div>
              <span className="eyebrow">ÔN NHANH</span>
              <h2>Chọn nghĩa đúng</h2>
            </div>
            <div className="session-score">
              <small>Phiên này</small>
              <strong>
                {correct}/{total}
              </strong>
            </div>
          </div>

          <div className="quiz-stage">
        <span className="quiz-level">HSK {question.answer.level}</span>
        <button
          className="round-button quiz-sound"
          type="button"
          onClick={() => speakChinese(question.answer.simplified)}
          aria-label={`Nghe ${question.answer.simplified}`}
        >
          ♪
        </button>
        <div className="quiz-word">{question.answer.simplified}</div>
        <div className="quiz-pinyin">{question.answer.pinyin}</div>
        <p className="quiz-prompt">Chọn nghĩa tiếng Việt phù hợp:</p>

        <div className="quiz-options">
          {question.options.map((option, index) => {
            const isAnswer = option.id === question.answer.id;
            const isSelected = option.id === selectedId;
            const stateClass = answered ? (isAnswer ? "correct" : isSelected ? "wrong" : "") : "";
            return (
              <button
                className={`quiz-option ${stateClass}`}
                type="button"
                key={option.id}
                disabled={answered}
                onClick={() => answer(option)}
              >
                <span>{index + 1}</span>
                {option.meaningVi}
              </button>
            );
          })}
        </div>

        <div className="quiz-footer">
          <div>
            {answered ? (
              <p className={wasCorrect ? "feedback-good" : "feedback-bad"}>
                {wasCorrect ? "Chính xác." : `Đáp án đúng: ${question.answer.meaningVi}.`}
              </p>
            ) : (
              <p>Chọn một đáp án để kiểm tra.</p>
            )}
            {answered ? (
              <button
                className={`quiz-known ${knownWords.has(question.answer.id) ? "active" : ""}`}
                type="button"
                onClick={() => onToggleKnown(question.answer.id)}
              >
                {knownWords.has(question.answer.id) ? "✓ Đã nhớ" : "+ Đánh dấu đã nhớ"}
              </button>
            ) : null}
          </div>
          <button className="primary-button" type="button" onClick={next} disabled={!answered}>
            Câu tiếp theo →
          </button>
        </div>
      </div>
    </section>
      )}
    </div>
  );
}
