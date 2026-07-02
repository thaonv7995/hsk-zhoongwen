type AppHeaderProps = {
  query: string;
  knownCount: number;
  totalCount: number;
  onQueryChange: (query: string) => void;
};

export function AppHeader({ query, knownCount, totalCount, onQueryChange }: AppHeaderProps) {
  return (
    <header className="topbar">
      <a className="brand" href="#main" aria-label="Trang chủ Zìzhī HSK">
        <span className="brand-mark" aria-hidden="true">
          字
        </span>
        <span className="brand-copy">
          <strong>Zìzhī HSK</strong>
          <small>Học một chữ, mở cả nhánh từ</small>
        </span>
      </a>

      <label className="search-box">
        <span className="search-icon" aria-hidden="true">
          ⌕
        </span>
        <input
          value={query}
          type="search"
          placeholder={`Tìm trong ${totalCount.toLocaleString("vi-VN")} từ: chữ Hán, pinyin, nghĩa…`}
          onChange={(event) => onQueryChange(event.target.value)}
        />
        <kbd>/</kbd>
      </label>

      <div
        className="progress-pill"
        title={`Tiến độ ghi nhớ trên toàn bộ ${totalCount.toLocaleString("vi-VN")} từ`}
      >
        <span className="progress-check" aria-hidden="true">
          ✓
        </span>
        <span>
          <strong>{knownCount.toLocaleString("vi-VN")}</strong>/{totalCount.toLocaleString("vi-VN")}
        </span>
      </div>
    </header>
  );
}
