# Zìzhī HSK

Web app giúp người Việt học **trọn bộ HSK 1–6, khoảng 5.000 từ** theo mô hình:

> Cấp HSK → chữ trung tâm → họ từ → câu ví dụ trong ngữ cảnh → ôn tập

## Phạm vi dữ liệu

Ứng dụng dùng khung **HSK 2.0 (6 cấp)** với 4.991 mục từ duy nhất sau khi gộp các biến thể và mục trùng:

| Cấp độ | Số từ | Phạm vi                 |
| ------ | ----: | ----------------------- |
| HSK 1  |   150 | Toàn bộ nguồn chuẩn hóa |
| HSK 2  |   147 | Toàn bộ nguồn chuẩn hóa |
| HSK 3  |   298 | Toàn bộ nguồn chuẩn hóa |
| HSK 4  |   598 | Toàn bộ nguồn chuẩn hóa |
| HSK 5  | 1.298 | Toàn bộ nguồn chuẩn hóa |
| HSK 6  | 2.500 | Toàn bộ nguồn chuẩn hóa |

Tổng cộng: **4.991 từ**. Con số thường được gọi gọn là “5.000 từ HSK”; chín mục chênh lệch xuất phát từ việc chuẩn hóa và gộp biến thể/trùng lặp.

Mỗi từ đều có **một câu ví dụ tiếng Trung hoàn chỉnh, pinyin và bản dịch tiếng Việt**. Ứng dụng còn có **1.571 chữ/hình vị gốc** tạo thành 868 họ từ. Tập hình vị không được tính vào tiến độ 4.991 từ; nó giúp các chữ như `学 /xué/` vẫn làm trung tâm dù bản thân `学` không phải mục từ độc lập trong danh sách HSK 2.0.

Số lượng HSK 2–4 khác con số thường được công bố 1–3 mục do nguồn chuẩn hóa đã gộp biến thể/trùng lặp. App luôn hiển thị số bản ghi thực tế thay vì làm tròn thành đúng 5.000.

## Tech stack

- React 19 + TypeScript 6.
- Vite 8.
- ESLint 10 + typescript-eslint.
- Prettier.
- Dữ liệu JSON tĩnh; không cần backend.
- Web Speech API cho phát âm tiếng Trung.
- `localStorage` cho tiến độ cá nhân.
- `pinyin-pro` dùng ở pipeline dữ liệu để tạo pinyin theo ngữ cảnh câu.

## Chạy dự án

Yêu cầu Node.js 22 trở lên.

```bash
npm install
npm run dev
```

Mở [http://127.0.0.1:4173](http://127.0.0.1:4173).

## Kiểm tra chất lượng

```bash
npm run check
```

Lệnh trên chạy lần lượt:

1. Kiểm tra đủ 4.991 mục từ, không trùng ID/từ, đúng cấp HSK và mỗi từ có câu Trung–pinyin–Việt.
2. Kiểm tra định dạng Prettier.
3. ESLint với `--max-warnings 0`.
4. TypeScript project build và Vite production build.

## Cấu trúc thư mục

```text
.
├── docs/                    # Kiến trúc và quy ước code
├── public/                  # Tài nguyên tĩnh
├── scripts/                 # Sinh và kiểm tra dữ liệu
├── src/
│   ├── app/                 # Composition root
│   ├── components/          # Thành phần layout dùng chung
│   ├── constants/           # Hằng số HSK, màu, từ loại
│   ├── data/                # 4.991 mục từ + từ điển hình vị gốc
│   ├── features/            # Họ từ, từ điển, luyện tập
│   ├── hooks/               # React hooks có thể tái sử dụng
│   ├── lib/                 # Hàm thuần: tìm kiếm, nhóm từ, phát âm
│   ├── styles/              # CSS toàn cục và responsive
│   └── types/               # Kiểu miền dữ liệu
├── eslint.config.js
├── package.json
├── tsconfig*.json
└── vite.config.ts
```

## Nguồn dữ liệu

Xem [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). Không có ảnh hoặc audio từ nguồn ngoài được đóng gói vào app.

## Cài đặt trên Server Debian

Để cài đặt ứng dụng chạy như một process nền trên server Debian tại port `29579`, hãy kết nối vào server và chạy câu lệnh sau bằng quyền root hoặc sudo:

```bash
curl -fsSL https://raw.githubusercontent.com/thaonv7995/hsk-zhoongwen/main/install.sh | sudo bash
```

Sau khi cài đặt xong, ứng dụng sẽ chạy ngầm bằng `systemd` và có thể truy cập qua `http://<IP_CỦA_SERVER>:29579`.
Lệnh trên cũng tự động tạo ra một CLI tool tên là `zizhi-hsk` giúp bạn dễ dàng quản lý sau này:

- **Cập nhật lên bản mới nhất:**
  ```bash
  sudo zizhi-hsk update
  ```
- **Gỡ bỏ ứng dụng:**
  ```bash
  sudo zizhi-hsk remove
  ```
- **Xem trạng thái / log của tiến trình:**
  ```bash
  sudo systemctl status zizhi-hsk
  sudo journalctl -u zizhi-hsk -f
  ```
