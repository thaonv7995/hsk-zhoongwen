import { use, useEffect, useMemo, useState } from "react";
import { AppHeader } from "../components/AppHeader";
import { Sidebar } from "../components/Sidebar";
import { HSK_LEVELS } from "../constants/hsk";
import { DictionaryView } from "../features/dictionary/DictionaryView";
import { FamilyExplorer } from "../features/families/FamilyExplorer";
import { PracticeView } from "../features/practice/PracticeView";
import { useKnownWords } from "../hooks/useKnownWords";
import { wordMatchesQuery } from "../lib/search";
import { buildFamilies, compareWords, findBestFamilyForWord } from "../lib/vocabulary";
import type {
  AppView,
  FamilyRange,
  HskLevel,
  RootCharacter,
  VocabularyWord,
} from "../types/vocabulary";

const dataPromise = Promise.all([
  fetch(new URL("../data/vocabulary.json", import.meta.url)),
  fetch(new URL("../data/roots.json", import.meta.url)),
]).then(async ([vocabularyResponse, rootsResponse]) => {
  if (!vocabularyResponse.ok) {
    throw new Error(`Unable to load vocabulary: ${vocabularyResponse.status}`);
  }
  if (!rootsResponse.ok) throw new Error(`Unable to load roots: ${rootsResponse.status}`);
  const vocabulary = (await vocabularyResponse.json()) as VocabularyWord[];
  const roots = (await rootsResponse.json()) as RootCharacter[];
  return { vocabulary: vocabulary.sort(compareWords), roots };
});

export default function App() {
  const { vocabulary, roots } = use(dataPromise);
  const [activeLevel, setActiveLevel] = useState<HskLevel | null>(null);
  const [activeRoot, setActiveRoot] = useState("");
  const [selectedWordId, setSelectedWordId] = useState("");
  const [familyRange, setFamilyRange] = useState<FamilyRange>("all");
  const [view, setView] = useState<AppView>("families");
  const [query, setQuery] = useState("");
  const { knownWords, toggleKnown } = useKnownWords();

  const levelCounts = useMemo(
    () =>
      Object.fromEntries(
        HSK_LEVELS.map((level) => [
          level,
          vocabulary.filter((word) => word.level === level).length,
        ]),
      ) as Record<HskLevel, number>,
    [vocabulary],
  );

  const scopeWords = useMemo(
    () => (activeLevel ? vocabulary.filter((word) => word.level === activeLevel) : vocabulary),
    [activeLevel, vocabulary],
  );
  const allFamilies = useMemo(() => buildFamilies(vocabulary, roots), [roots, vocabulary]);
  const scopedFamilies = useMemo(() => buildFamilies(scopeWords, roots), [roots, scopeWords]);
  const navigationFamily =
    scopedFamilies.find((family) => family.root === activeRoot) ?? scopedFamilies[0];
  const completeFamily = allFamilies.find((family) => family.root === navigationFamily?.root);
  const currentFamily =
    activeLevel && familyRange === "all" ? (completeFamily ?? navigationFamily) : navigationFamily;
  const filteredWords = useMemo(
    () => scopeWords.filter((word) => wordMatchesQuery(word, query)),
    [query, scopeWords],
  );
  const scopeKnownCount = scopeWords.filter((word) => knownWords.has(word.id)).length;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "/" && document.activeElement?.tagName !== "INPUT") {
        event.preventDefault();
        document.querySelector<HTMLInputElement>(".search-box input")?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const changeLevel = (level: HskLevel | null) => {
    setActiveLevel(level);
    setActiveRoot("");
    setSelectedWordId("");
    setFamilyRange("all");
  };

  const changeFamily = (root: string) => {
    const family = scopedFamilies.find((item) => item.root === root);
    setActiveRoot(root);
    setSelectedWordId(family?.members[0]?.id ?? "");
    setView("families");
  };

  const changeFamilyRange = (range: FamilyRange) => {
    setFamilyRange(range);
    if (
      range === "level" &&
      navigationFamily &&
      !navigationFamily.members.some((word) => word.id === selectedWordId)
    ) {
      setSelectedWordId(navigationFamily.members[0]?.id ?? "");
    }
  };

  const changeQuery = (nextQuery: string) => {
    setQuery(nextQuery);
    if (nextQuery.trim()) setView("dictionary");
  };

  const exploreWord = (word: VocabularyWord) => {
    const scopedFamily = findBestFamilyForWord(word, scopedFamilies);
    const family = scopedFamily ?? findBestFamilyForWord(word, allFamilies);
    if (!family) return;
    if (!scopedFamily) setActiveLevel(null);
    setActiveRoot(family.root);
    setSelectedWordId(word.id);
    setView("families");
  };

  return (
    <div className="app-shell">
      <AppHeader
        query={query}
        knownCount={knownWords.size}
        totalCount={vocabulary.length}
        onQueryChange={changeQuery}
      />

      <Sidebar
        activeLevel={activeLevel}
        activeRoot={currentFamily?.root ?? ""}
        families={scopedFamilies}
        levelCounts={levelCounts}
        onLevelChange={changeLevel}
        onFamilyChange={changeFamily}
      />

      <main id="main" className="main-content">
        <section className="hero-row">
          <div>
            <div className="breadcrumb">
              <span>{activeLevel ? `HSK ${activeLevel}` : "HSK 1–6"}</span>
              <span aria-hidden="true">/</span>
              <strong>
                {view === "families"
                  ? `${currentFamily?.root ?? "—"} · ${currentFamily?.rootWord.pinyin ?? ""}`
                  : view === "dictionary"
                    ? "Từ điển"
                    : "Luyện tập"}
              </strong>
            </div>
            <h1>Một chữ, nhiều kết nối.</h1>
            <p>
              {scopeWords.length.toLocaleString("vi-VN")} từ trong phạm vi đang chọn ·{" "}
              {scopeKnownCount.toLocaleString("vi-VN")} từ đã nhớ
            </p>
          </div>

          <div className="view-switcher" role="tablist" aria-label="Chế độ học">
            <ViewTab
              active={view === "families"}
              label="Họ từ"
              onClick={() => setView("families")}
            />
            <ViewTab
              active={view === "dictionary"}
              label="Từ điển"
              onClick={() => setView("dictionary")}
            />
            <ViewTab
              active={view === "practice"}
              label="Luyện tập"
              onClick={() => setView("practice")}
            />
          </div>
        </section>

        {view === "families" ? (
          <FamilyExplorer
            family={currentFamily}
            selectedWordId={selectedWordId}
            knownWords={knownWords}
            onWordChange={setSelectedWordId}
            onToggleKnown={toggleKnown}
            activeLevel={activeLevel}
            familyRange={familyRange}
            completeCount={completeFamily?.members.length ?? currentFamily?.members.length ?? 0}
            scopedCount={navigationFamily?.members.length ?? 0}
            onRangeChange={changeFamilyRange}
          />
        ) : null}

        {view === "dictionary" ? (
          <DictionaryView
            words={filteredWords}
            knownWords={knownWords}
            onToggleKnown={toggleKnown}
            onExploreWord={exploreWord}
            canExploreWord={(word) => Boolean(findBestFamilyForWord(word, allFamilies))}
          />
        ) : null}

        {view === "practice" ? (
          <PracticeView words={scopeWords} knownWords={knownWords} onToggleKnown={toggleKnown} />
        ) : null}
      </main>
    </div>
  );
}

type ViewTabProps = {
  active: boolean;
  label: string;
  onClick: () => void;
};

function ViewTab({ active, label, onClick }: ViewTabProps) {
  return (
    <button
      className={`view-tab ${active ? "active" : ""}`}
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
