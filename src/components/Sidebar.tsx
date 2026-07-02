import { HSK_LEVELS, LEVEL_COLORS } from "../constants/hsk";
import { normalizeSearch } from "../lib/search";
import type { HskLevel, WordFamily } from "../types/vocabulary";

type SidebarProps = {
  activeLevel: HskLevel | null;
  activeRoot: string;
  families: WordFamily[];
  levelCounts: Record<HskLevel, number>;
  onLevelChange: (level: HskLevel | null) => void;
  onFamilyChange: (root: string) => void;
};

export function Sidebar({
  activeLevel,
  activeRoot,
  families,
  levelCounts,
  onLevelChange,
  onFamilyChange,
}: SidebarProps) {
  const totalCount = HSK_LEVELS.reduce((total, level) => total + levelCounts[level], 0);

  return (
    <aside className="sidebar" aria-label="Bộ lọc HSK và danh sách họ từ">
      <section className="sidebar-section">
        <span className="eyebrow">CẤP ĐỘ</span>
        <div className="level-list">
          <button
            className={`level-button ${activeLevel === null ? "active" : ""}`}
            type="button"
            onClick={() => onLevelChange(null)}
          >
            <span className="level-number all-levels">全</span>
            <span className="level-copy">
              <strong>Tất cả HSK</strong>
              <small>{totalCount.toLocaleString("vi-VN")} từ chuẩn hóa</small>
            </span>
          </button>

          {HSK_LEVELS.map((level) => (
            <button
              className={`level-button ${activeLevel === level ? "active" : ""}`}
              type="button"
              key={level}
              onClick={() => onLevelChange(level)}
              style={{ "--level-color": LEVEL_COLORS[level] } as React.CSSProperties}
            >
              <span className="level-number">{level}</span>
              <span className="level-copy">
                <strong>HSK {level}</strong>
                <small>{levelCounts[level].toLocaleString("vi-VN")} từ</small>
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="sidebar-section family-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">HỌ TỪ</span>
            <h2>Chữ trung tâm</h2>
          </div>
          <span>{families.length} nhóm</span>
        </div>

        <div className="family-list">
          {families.map((family) => (
            <button
              className={`family-item ${family.root === activeRoot ? "active" : ""}`}
              type="button"
              key={family.root}
              onClick={() => onFamilyChange(family.root)}
            >
              <span className="family-char">{family.root}</span>
              <span className="family-copy">
                <strong>{family.rootWord.pinyin}</strong>
                <small>{normalizeSearch(family.rootWord.meaningVi).slice(0, 28)}</small>
              </span>
              <span className="family-total">{family.members.length}</span>
            </button>
          ))}
        </div>
      </section>

      <div className="dataset-note">
        <span aria-hidden="true">✦</span>
        <p>
          <strong>HSK 2.0 · 6 cấp</strong>
          <br />
          Toàn bộ danh sách HSK 1–6 sau khi gộp biến thể trùng lặp.
        </p>
      </div>
    </aside>
  );
}
