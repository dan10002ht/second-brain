---
type: note
title: Digest Mooni 2026-07-20 — QA artifact có owner, mô hình "liên hệ để đặt", bẫy test/Docker
summary: Phần mới của Mooni: bỏ giỏ hàng để né đăng ký TMĐT, bộ artifact QA 5 file mỗi file 1 owner, bug ORDER BY không tất định + rate-limit thiết kế sai, và loạt kỹ thuật viết held-out chống gian lận.
tags: [method, tooling, debug, postgresql, nextjs]
created: 2026-07-20
updated: 2026-07-21
source: project "moonie" — session history (mined 2026-07-20)
---

# Digest Mooni — 2026-07-20 (CHỈ phần mới)

Đã loại phần đã có trong [[digest-moonie-2026-07-17]] và [[digest-moonie-2026-07-18]]
(harness generator→evaluator→held-out→screenshot, testcontainers/Colima socket,
`CGO_ENABLED=0`, golangci-lint v2, package-lock lệch platform, security hardening).

## Feedback

- **Mọi trang list phải phân trang**, không list-all — áp cho cả admin lẫn API (`{items, total}` + offset).
- **Automation tốt ≠ có hồ sơ QA**: có 22 file test Go nhưng thiếu tầng báo cáo test-case pass/fail trace về requirement. Đây là gap user tự nhận ra, không phải mình đề xuất.
- **Skill phải tái dùng nhiều app**: xây trong project trước rồi tách; điều kiện là *mọi thứ riêng của project gói gọn trong 1 file config ở root*, skill không biết gì về project.
- **Disk là ràng buộc thật** — chủ động giữ Docker nhẹ, đừng để phình.
- User cảnh giác failure mode **"làm qua loa cho xong 1 context session"** → phải có bằng chứng gate thật, không tự khai.
- Theo dõi tiến độ 3 mức: `BRIEF.md` (đang làm gì) / `PROGRESS.md` (handoff giai đoạn) / `CHANGELOG.md` (đã giao gì).

## Decisions

- **Bỏ giỏ hàng, dùng mô hình "liên hệ để đặt" qua lead form.** *Why:* né đăng ký TMĐT với Bộ Công Thương. Kéo theo: mọi CTA mở bottom sheet form.
- **Form nằm trong bottom sheet + nút Zalo/Gọi nhanh phụ** (không chỉ deep-link chat). *Why:* mọi CTA đều bắt được lead vào admin + Telegram.
- **Convert lead → tạo đơn nháp, KHÔNG tự tạo customer.** *Why:* admin còn phải nhập món; tách customer khỏi lead tránh rác dữ liệu.
- **Xoá sản phẩm = xoá mềm (`hidden`).** *Why:* đơn cũ tham chiếu sản phẩm, xoá cứng phá lịch sử.
- **Artifact QA: 5 file trong `docs/qa/`, mỗi file MỘT owner + nhịp cập nhật riêng**, ID test trace về `REQ-xxx`. *Why:* không có owner thì tài liệu QA mục nát ngay vòng 2. (chưa xác minh — mới chốt thiết kế, chưa chạy thật)
- **Chạy task tuần tự, không fan-out song song** khi các task cùng commit vào một repo. Ngoại lệ: song song được khi thao tác trên file tách biệt (generator + qa-evaluator).

## Bugs

- **`ORDER BY` không tất định** khi nhiều sản phẩm cùng `display_order` → phân trang nhảy/lặp item. Fix: tie-break bằng cột duy nhất.
- **Rate limit 5/phút quá thấp** → chặn nhầm khách thật sau NAT doanh nghiệp. Root cause là **quyết định thiết kế nghiệp vụ**, không phải bug code; held-out test phơi ra. Fix: 20/phút (login riêng 10/phút).
- **`overflow-hidden` trên bảng chi tiết đơn ở mobile cắt mất cột "Thành tiền"** — mất thông tin, không chỉ xấu. Chỉ design-evaluator bắt được.
- **Font Playfair thiếu subset dấu tiếng Việt** → hỏng hiển thị toàn app, lộ ở trang admin đầu tiên.
- **Hardcode hex trong JSX** dù CLAUDE.md cấm — grep là cách verify rẻ, nên đưa hẳn vào gate.
- **Warning collation sau khi đổi `postgres:16` → `16-alpine`**: volume cũ tạo dưới glibc mở bằng musl → không refresh được (khác provider); chỉ sạch khi tạo volume fresh + migrate + seed lại. Prod thì phải dump/restore.
- **Nhãn UI nhập nhằng gây va chạm selector**: nút "Chuyển thành đơn" vs status "Đã chuyển đơn" — nhầm cho cả người dùng thật, nên sửa code (đổi nhãn + `aria-label`) chứ không chỉ sửa test.

## Techniques

- **`timeout` không có trên macOS** (`exit=127`). Và lệnh verify giữ server nền sống sẽ bị kill ở 120s (`exit 144` = bị kill, không phải fail) → chạy nền + ghi output ra file.
- **Held-out gặp chính rate-limit của app** → seed dữ liệu bằng `psql` trực tiếp thay vì bắn qua form public, hoặc retry-on-429.
- **Viết held-out chắc**: selector structural + `name` + `aria-label` (không dựa nhãn hiển thị); `setInputFiles` cho upload; cleanup theo prefix; luôn assert **DB thật** để chống gian lận; dung sai method/status code nhưng không dung sai trạng thái dữ liệu.
- **"Chất chỉ thị" trong seed test**: đặt sản phẩm `hidden` với `display_order` NHỎ NHẤT → chứng minh nó bị loại do *status*, không phải do sắp xếp.
- **Test snapshot giá**: đổi giá sản phẩm rồi assert đơn cũ không đổi → chứng minh snapshot thật, không phải join runtime.
- **Bắt test fail-trước-sửa, pass-sau-sửa** → bằng chứng test thật sự bắt lỗi, không phải test luôn-xanh.
- **Dọn Docker 3.0GB → 1.1GB**: `docker system df` đo trước → xoá image mồ côi (~1.25GB) → chuẩn hoá `postgres:16-alpine`, nhớ đổi **cả compose lẫn testcontainers trong test**.
- **Sửa CHANGELOG bằng script/anchor hay hỏng** (em-dash, thứ tự đảo) → dùng Edit trực tiếp rồi kiểm lại thứ tự entry.
- `sleep` foreground bị chặn → poll CI/agent bằng lệnh nền tự báo.

## Liên kết gợi ý

[[digest-moonie-2026-07-17]] · [[digest-moonie-2026-07-18]] · [[digest-claude-chat-2026-07-17]] · [[atomic-notes-principle]] · [[moc-learning-pkm]]
