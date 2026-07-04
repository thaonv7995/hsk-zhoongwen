import { useMemo, useState, useEffect } from "react";
import { speakChinese } from "../../lib/speech";
import { getTypingMode } from "../../lib/practice";
import type { VocabularyWord } from "../../types/vocabulary";

type TypingTask = {
  id: string;
  targetText: string;
  pinyin: string;
  meaningVi: string;
  type: "word" | "sentence";
  sourceWordId: string;
};

type TypingPracticeProps = {
  words: VocabularyWord[];
};

export function TypingPractice({ words }: TypingPracticeProps) {
  const tasks = useMemo(() => {
    return words.flatMap((word) => {
      const result: TypingTask[] = [
        {
          id: `word-${word.id}`,
          targetText: word.simplified,
          pinyin: word.pinyin,
          meaningVi: word.meaningVi,
          type: "word",
          sourceWordId: word.id,
        },
      ];
      if (word.context) {
        result.push({
          id: `sentence-${word.id}`,
          targetText: word.context.zh,
          pinyin: word.context.pinyin,
          meaningVi: word.context.vi,
          type: "sentence",
          sourceWordId: word.id,
        });
      }
      return result;
    });
  }, [words]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPinyin, setShowPinyin] = useState(true);

  // Lấy giá trị cài đặt một lần khi render
  const taskType = getTypingMode();

  const filteredTasks = useMemo(() => {
    if (taskType === "all") return tasks;
    return tasks.filter((t) => t.type === taskType);
  }, [tasks, taskType]);

  // Shuffle tasks initially
  const shuffledTasks = useMemo(() => {
    const shuffled = [...filteredTasks];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = shuffled[i] as TypingTask;
      shuffled[i] = shuffled[j] as TypingTask;
      shuffled[j] = temp;
    }
    return shuffled;
  }, [filteredTasks]);

  const task = shuffledTasks[currentIndex];

  if (!task) return <div className="empty-panel">Không có dữ liệu luyện gõ.</div>;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isSuccess) return;
    const value = e.target.value;
    setInputValue(value);

    // Strip punctuation for matching maybe?
    // Let's just do exact match or exact match ignoring punctuation
    const normalize = (text: string) => text.replace(/[.,!?，。！？\s]/g, "");
    
    if (normalize(value) === normalize(task.targetText)) {
      setIsSuccess(true);
      speakChinese(task.targetText);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Next task on Enter when successful
    if (e.key === "Enter" && !e.metaKey && !e.ctrlKey && isSuccess) {
      e.preventDefault();
      setInputValue("");
      setIsSuccess(false);
      setCurrentIndex((prev) => (prev + 1) % shuffledTasks.length);
      return;
    }

    // Play audio on Cmd/Ctrl + Enter
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      speakChinese(task.targetText);
      return;
    }

    // Skip on Cmd/Ctrl + ArrowRight
    if (e.key === "ArrowRight" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      setInputValue("");
      setIsSuccess(false);
      setCurrentIndex((prev) => (prev + 1) % shuffledTasks.length);
      return;
    }
  };

  return (
    <section className="practice-card">
      <div className="practice-heading">
        <div>
          <span className="eyebrow">{task.type === "word" ? "LUYỆN TỪ VỰNG" : "LUYỆN GÕ CÂU"}</span>
          <h2>Gõ lại cho đúng</h2>
        </div>
        <div className="session-score">
          <button 
            type="button" 
            onClick={() => setShowPinyin(!showPinyin)}
            title={showPinyin ? "Ẩn Pinyin" : "Hiện Pinyin"}
            style={{ 
              background: "none", border: "none", cursor: "pointer", 
              color: "var(--text-light)", display: "flex", alignItems: "center", gap: "6px" 
            }}
          >
            {showPinyin ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                <line x1="2" y1="2" x2="22" y2="22" />
              </svg>
            )}
            <span style={{ fontSize: "14px" }}>Pinyin</span>
          </button>
        </div>
      </div>
      
      <div className="typing-stage" style={{ textAlign: "center", padding: "10px 20px", width: "100%" }}>
        <div 
          className="typing-target" 
          style={{ 
            fontSize: task.type === "word" ? "160px" : "70px", 
            fontFamily: "'Songti SC', 'Noto Serif CJK SC', serif",
            lineHeight: 1.2,
            color: isSuccess ? "var(--green)" : "#222",
            transition: "color 0.3s ease",
            marginBottom: "10px",
            wordBreak: "keep-all"
          }}
        >
          {task.targetText}
        </div>
        
        <div 
          className="typing-pinyin" 
          style={{ 
            fontSize: task.type === "word" ? "32px" : "24px", 
            fontWeight: 600, 
            color: "var(--coral)",
            opacity: showPinyin ? 1 : 0,
            pointerEvents: showPinyin ? "auto" : "none",
            transition: "opacity 0.2s ease"
          }}
        >
          {task.pinyin}
        </div>
        
        <div className="typing-meaning" style={{ fontSize: "20px", color: "var(--text-light)", marginTop: 8, marginBottom: 24 }}>
          {task.meaningVi}
        </div>

        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Dùng bộ gõ Pinyin để gõ lại..."
          style={{
            width: "100%",
            maxWidth: "600px",
            padding: "16px 20px",
            fontSize: "24px",
            borderRadius: "12px",
            border: `2px solid ${isSuccess ? "var(--green)" : "#ddd"}`,
            outline: "none",
            textAlign: "center",
            boxShadow: isSuccess ? "0 0 15px rgba(46, 204, 113, 0.2)" : "0 4px 10px rgba(0,0,0,0.05)",
            transition: "all 0.3s ease"
          }}
          autoFocus
        />
        
        {isSuccess && (
          <div style={{ marginTop: 16, color: "var(--green)", fontWeight: "bold", animation: "fadeIn 0.3s" }}>
            ✓ Chính xác! Ấn Enter để tiếp tục.
          </div>
        )}

        <div style={{ marginTop: 24, display: "flex", justifyContent: "center", gap: "12px" }}>
          <button 
            className="secondary-button" 
            onClick={() => speakChinese(task.targetText)}
            title="Phím tắt: Cmd/Ctrl + Enter"
          >
            ♪ Nghe lại <small style={{ opacity: 0.6, fontWeight: "normal" }}>⌘↵</small>
          </button>
          <button 
            className="secondary-button" 
            title="Phím tắt: Cmd/Ctrl + ➔"
            onClick={() => {
              setInputValue("");
              setIsSuccess(false);
              setCurrentIndex((prev) => (prev + 1) % shuffledTasks.length);
            }}
          >
            Bỏ qua <small style={{ opacity: 0.6, fontWeight: "normal" }}>⌘➔</small>
          </button>
        </div>
      </div>
    </section>
  );
}
