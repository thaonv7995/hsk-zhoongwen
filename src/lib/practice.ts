let cachedTypingMode: "all" | "word" | "sentence" = "all";

try {
  const saved = localStorage.getItem("zizhi_typing_mode");
  if (saved === "word" || saved === "sentence" || saved === "all") {
    cachedTypingMode = saved;
  }
} catch (e) {
  // Ignore parse errors
}

export function saveTypingMode(mode: "all" | "word" | "sentence") {
  cachedTypingMode = mode;
  localStorage.setItem("zizhi_typing_mode", mode);
}

export function getTypingMode() {
  return cachedTypingMode;
}
