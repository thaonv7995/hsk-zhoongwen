import { useCallback, useMemo, useState } from "react";

const STORAGE_KEY = "zizhi-hsk-known-words-v1";

function loadKnownWords(): Set<string> {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as unknown;
    return new Set(Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : []);
  } catch {
    return new Set();
  }
}

export function useKnownWords() {
  const [knownWords, setKnownWords] = useState<Set<string>>(loadKnownWords);

  const toggleKnown = useCallback((id: string) => {
    setKnownWords((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      return next;
    });
  }, []);

  return useMemo(() => ({ knownWords, toggleKnown }), [knownWords, toggleKnown]);
}
