let cachedRate = 0.78;
let cachedVoiceURI: string | null = null;

try {
  const saved = localStorage.getItem("zizhi_speech_settings");
  if (saved) {
    const parsed = JSON.parse(saved);
    if (typeof parsed.rate === "number") cachedRate = parsed.rate;
    if (typeof parsed.voiceURI === "string" || parsed.voiceURI === null) {
      cachedVoiceURI = parsed.voiceURI;
    }
  }
} catch (e) {
  // Bỏ qua lỗi parse
}

export function saveSpeechSettings(rate: number, voiceURI: string | null) {
  cachedRate = rate;
  cachedVoiceURI = voiceURI;
  localStorage.setItem("zizhi_speech_settings", JSON.stringify({ rate, voiceURI }));
}

export function getSpeechSettings() {
  return { rate: cachedRate, voiceURI: cachedVoiceURI };
}

export function speakChinese(text: string): void {
  if (!("speechSynthesis" in window)) return;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "zh-CN";
  utterance.rate = cachedRate;

  if (cachedVoiceURI) {
    const voice = window.speechSynthesis.getVoices().find((v) => v.voiceURI === cachedVoiceURI);
    if (voice) utterance.voice = voice;
  } else {
    // Thử tìm giọng Chinese mặc định tốt nếu người dùng chưa chọn
    const voices = window.speechSynthesis.getVoices();
    const defaultChinese = voices.find((v) => v.lang.startsWith("zh") && v.localService);
    if (defaultChinese) utterance.voice = defaultChinese;
  }

  window.speechSynthesis.speak(utterance);
}
