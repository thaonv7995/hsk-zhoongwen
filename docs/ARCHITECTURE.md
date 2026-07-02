# Architecture & code conventions

## Nguyên tắc

1. **Feature-first:** thành phần đặc thù nằm trong `src/features/<feature>`; layout chung nằm trong `src/components`.
2. **Dữ liệu bất biến:** `vocabulary.json` là đầu ra được sinh và kiểm tra. UI không sửa trực tiếp dữ liệu nguồn.
3. **Hàm thuần trước:** tìm kiếm, sắp xếp và tạo họ từ nằm trong `src/lib`; component chỉ điều phối state và render.
4. **Local-first:** tiến độ học chỉ lưu trong trình duyệt, không gửi dữ liệu ra ngoài.
5. **Progressive enhancement:** nếu trình duyệt không có Web Speech API, phần còn lại vẫn hoạt động.

## Quy ước TypeScript/React

- Bật `strict`, `noUncheckedIndexedAccess` và `noFallthroughCasesInSwitch`.
- Dùng `type` cho props và kiểu miền dữ liệu; import kiểu bằng `import type`.
- Component dùng named export; chỉ `App` dùng default export vì đây là composition root.
- Không dùng `any`; dữ liệu JSON được ép về kiểu miền tại một ranh giới duy nhất.
- State chỉ giữ định danh; dữ liệu dẫn xuất được tính qua `useMemo` khi có lợi.
- Event handler đặt tên theo hành động: `changeLevel`, `exploreWord`, `toggleKnown`.
- Chuỗi hiển thị bằng tiếng Việt; định danh code bằng tiếng Anh.

## Quy ước CSS

- Token thiết kế khai báo tại `:root`.
- Class dùng kebab-case và tên theo vai trò, không theo vị trí DOM.
- Breakpoint chính: 1180px, 840px và 540px.
- Tương tác có `:focus-visible`; animation tôn trọng `prefers-reduced-motion`.

## Mô hình họ từ

Một chữ được xem là chữ trung tâm khi:

1. Nó tồn tại trong từ điển 1.571 chữ/hình vị gốc.
2. Có ít nhất hai mục từ khác trong phạm vi HSK đang chọn chứa chữ đó để xuất hiện ở thanh điều hướng.

Khi đã chọn một chữ trung tâm, sơ đồ mặc định hiển thị toàn bộ thành viên của họ đó trong HSK 1–6. Người học có thể chuyển sang chỉ xem các thành viên thuộc cấp HSK hiện tại.

Từ điển hình vị tách khỏi 4.991 mục từ học để giữ được các gốc hữu ích như `学`, đồng thời không làm sai số lượng và tiến độ HSK.

Một từ có thể thuộc nhiều họ từ. Khi mở từ từ trang từ điển, app chọn họ có nhiều thành viên nhất để cung cấp nhiều kết nối học tập hơn.

## Thay đổi dữ liệu

Không sửa thủ công `src/data/vocabulary.json`. Chạy:

```bash
python3 scripts/generate_vocabulary.py \
  --hsk-json /path/to/complete.min.json \
  --anki-db /path/to/collection.anki2 \
  --output src/data/vocabulary.json \
  --roots-output src/data/roots.json
```

Sau đó chạy `npm run check`.

Pipeline đầy đủ chạy theo thứ tự:

1. `generate_vocabulary.py`: tạo danh sách HSK và hình vị gốc.
2. `enrich_examples.py`: chọn câu Trung–Việt tốt nhất từ các corpus song ngữ và câu biên soạn thủ công.
3. `npm run enrich:pinyin`: sinh pinyin có dấu thanh cho câu nguồn.
4. `npm run check`: xác thực dữ liệu, lint, typecheck và build.
