---
type: decision
title: ticket-mcrsv — xếp doc theo vòng đời (reference/howto/plans/archive) thay vì theo chủ đề
summary: 61 file doc được xếp lại theo *hợp đồng với sự thật* chứ không theo chủ đề — living phải đúng hôm nay, archive bất biến và link chết trong đó không được sửa — kèm ADR, front-matter và CI check.
tags: [architecture, method, writing, tooling]
created: 2026-08-22
updated: 2026-08-22
review: 2026-11-22
source: project "ticket-mcrsv" — session history
---

`ticket-mcrsv` có 62 file doc; hôm rà soát phải dán banner STALE cho **12 file — 19% đang nói sai** so với code đang chạy (README ghi mọi service `🟡 Planning` kể cả service vừa smoke test xong; `MICROSERVICE_BEST_PRACTICES.md` 747 dòng mô tả hai service không tồn tại).

Chốt: xếp lại 61 file theo **vòng đời / hợp đồng với sự thật**, không theo chủ đề:

| Thư mục | Hợp đồng |
|---|---|
| `docs/reference/` | **living** — phải đúng **hôm nay**, CI kiểm |
| `docs/howto/` | living — hướng dẫn chạy được |
| `docs/plans/` | mục tiêu tương lai, được phép chưa đúng |
| `docs/archive/` | **ảnh chụp quá khứ, bất biến** |

Kèm: một ADR chốt luật, front-matter `last-verified`/`verified-by`, `scripts/check-docs.sh` chạy trong CI, và một generator sinh bảng port/service từ **code** chứ không chép tay.

## Why

- Phân loại theo chủ đề không trả lời được câu duy nhất người đọc cần: **file này có đang nói thật không**. Một file "Kiến trúc" có thể vừa là ý định vừa là hiện trạng, và đó chính là cách 19% doc trôi thành sai mà không ai chịu trách nhiệm.
- Có ranh giới living/archive thì mới **gate được**: chỉ living mới bị CI bắt phải đúng, nên gate không đỏ vĩnh viễn vì những file vốn dĩ là quá khứ.
- Số liệu trong doc (port, tên service) là thứ trôi nhanh nhất ⇒ sinh từ code, và checker phải bắt được **tổng quát** (thí nghiệm: tiêm sai số vào một service khác, checker vẫn phải đỏ).

## Tradeoff

- **Link chết trong `archive/` KHÔNG được sửa** — sửa là làm hỏng tính "ảnh chụp". Đổi lại checker phải bỏ qua 39 file archive, tức có một vùng repo mà CI cố ý không bảo vệ.
- Dời 61 file sinh **100 link chết** phải sửa tay; 32 chỗ máy không tự chọn được vì trùng tên file (3 file `01_SETUP_COMPLETE.md`, nhiều `README.md`).
- Front-matter `last-verified` tạo ra một **lời hứa CI không kiểm được**: ngay trong phiên này tôi điền hàng loạt và verifier lấy mẫu 3 file thì 2 sai. Luật kèm theo: chỉ điền ngày cho file **thực sự đã kiểm hôm đó**, chấp nhận để 8 file `living` không có ngày và CI báo — đó là sự thật, không phải nợ. → [[truong-last-verified]]
- Thêm một gate nữa phải nuôi. Bản `check-docs.sh` đầu tiên có 2 lỗi thật so với luật ADR và bỏ sót 17 README cấp service.

## Phương án đã bỏ

- **Giữ cây phẳng theo chủ đề, chỉ dán banner STALE** — rẻ hơn nhiều, nhưng banner là trạng thái tự khai, hết hạn im lặng, và không gate được.
- **Xoá thẳng doc sai** — mất luôn ngữ cảnh vì sao từng thiết kế thế; `archive/` giữ được mà không phải giả vờ nó còn đúng.

Liên quan: [[digest-ticket-mcrsv-2026-08-22]] · [[truong-last-verified]] · [[gate-tu-viet-la-nguon-xanh-gia]] · [[feedback-khong-dung-vs-chua-lam-toi]]
