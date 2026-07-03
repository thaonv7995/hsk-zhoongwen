import { useEffect, useState } from "react";

export function useSpeechVoices() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (!("speechSynthesis" in window)) return;

    const updateVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      // Lọc các giọng có ngôn ngữ bắt đầu bằng zh (zh-CN, zh-TW, zh-HK)
      setVoices(allVoices.filter((v) => v.lang.startsWith("zh")));
    };

    updateVoices();
    window.speechSynthesis.addEventListener("voiceschanged", updateVoices);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", updateVoices);
  }, []);

  return voices;
}
