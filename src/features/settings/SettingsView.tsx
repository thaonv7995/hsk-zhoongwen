import { useState } from "react";
import { useSpeechVoices } from "../../hooks/useSpeechVoices";
import { getSpeechSettings, saveSpeechSettings, speakChinese } from "../../lib/speech";

export function SettingsView() {
  const voices = useSpeechVoices();
  const [settings, setSettings] = useState(() => getSpeechSettings());

  const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newRate = parseFloat(e.target.value);
    const next = { ...settings, rate: newRate };
    setSettings(next);
    saveSpeechSettings(next.rate, next.voiceURI);
  };

  const handleVoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newVoice = e.target.value || null;
    const next = { ...settings, voiceURI: newVoice };
    setSettings(next);
    saveSpeechSettings(next.rate, next.voiceURI);
  };

  return (
    <section className="settings-card">
      <div className="section-heading">
        <h2>Cài đặt Âm thanh (Web Speech)</h2>
        <span>Thay đổi giọng đọc và tốc độ phát âm</span>
      </div>

      <div className="settings-form">
        <div className="form-group">
          <label htmlFor="rate-slider">
            Tốc độ đọc: <strong>{settings.rate.toFixed(1)}x</strong>
          </label>
          <input
            id="rate-slider"
            type="range"
            min="0.3"
            max="1.5"
            step="0.1"
            value={settings.rate}
            onChange={handleRateChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="voice-select">Giọng đọc (Voice)</label>
          <select id="voice-select" value={settings.voiceURI || ""} onChange={handleVoiceChange}>
            <option value="">-- Mặc định của hệ thống --</option>
            {voices.map((v) => (
              <option key={v.voiceURI} value={v.voiceURI}>
                {v.name} ({v.lang}) {v.localService ? "" : " - Online"}
              </option>
            ))}
          </select>
          <p className="setting-note">
            Lưu ý: Các giọng đọc "Online" yêu cầu có kết nối mạng và có thể bị trễ.
          </p>
        </div>

        <button
          className="primary-button"
          type="button"
          onClick={() => speakChinese("你好，欢迎学习中文！")}
        >
          ♪ Nghe thử (你好，欢迎学习中文)
        </button>
      </div>
    </section>
  );
}
