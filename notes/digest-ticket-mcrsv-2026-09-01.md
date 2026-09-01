---
type: note
title: Digest ticket-mcrsv — 2026-09-01
summary: Một guard đối chiếu env chỉ đúng khi nó quét cả cây thay vì mang sẵn danh sách file; đếm gộp cả batch làm ghế đã refund lẫn với vé mới; và verifier nêu hai finding thì phải xử lý cả hai, không chỉ cái đầu.
tags: [backend, debug, agent, redis]
created: 2026-09-01
updated: 2026-09-01
source: project `ticket-mcrsv` — session history (task 126–150, F20–F23)
---

CHỈ phần mới so với [[digest-ticket-mcrsv-2026-08-25]], [[digest-ticket-mcrsv-2026-08-26]],
[[digest-ticket-mcrsv-2026-08-27]], [[digest-ticket-mcrsv-2026-08-28]],
[[digest-ticket-mcrsv-2026-08-30]], [[digest-ticket-mcrsv-2026-08-31]].
Những thứ đã ghi ở đó (bảng trùng tên ở `public`, `.env` ghi hostname Docker Compose, `updated_by`
uuid rỗng, `errors.New` trượt `errors.As`, QR suy từ `ticket_id`, ảnh headless 390px là ảo ảnh,
nhiều lane cùng lái Chrome qua CDP, verdict phải đọc theo từng kết luận) không lặp lại.

## Bugs

**Consumer email nghe sai topic vì `.env` override default.** `KAFKA_TOPIC=email-notifications`
trong `.env` đè default `booking-events`, nên booking event thật không bao giờ tới email-worker.
Cùng họ với chuyện `env.example` được track chính là nguồn sinh `.env` sai.

**Guard đối chiếu `env.example` ↔ code mà mang sẵn danh sách file thì mù.** Vòng 1 của T134 dựng
guard chỉ soi vài file config, và nó **PASS** trong khi lane vừa xoá mất `LOG_LEVEL=info` — biến này
được đọc thật ở `internal/logger/logger.go` qua `main.go`. Verifier bắt được; vòng 2 đổi sang
`filepath.WalkDir` quét cả cây (bỏ `_test.go`) thì thí nghiệm quyết định cho kết quả đúng chiều:
guard hẹp PASS (mù), guard rộng báo `missing: [LOG_LEVEL LOG_OUTPUT_PATH]`.

**Đếm gộp cả batch làm ghế đã refund lẫn với vé mới (task 139/141).** Điều kiện kiểm tính nhất quán
đặt ở mức tổng hợp: `live + terminal == expected`. Ca hỗn hợp — một ghế của session A đã refund, một
ghế của session B chưa có vé — cho `1 + 1 = 2` ⇒ rơi vào nhánh terminal ⇒ rollback nhầm một giao dịch
hợp lệ. Cách sửa đúng là trả **trạng thái từng key** (`GetIssuedReservationKeyStatesTx`) chứ không
đếm tổng. Verifier FAIL hai vòng liên tiếp ở task này ⇒ dừng và hỏi user (đúng luật `looptasksv2`);
vòng 3 giải được bằng cách đưa sẵn **bảng 5 ca** để lane đối chiếu thay vì bảo nó "bỏ mệnh đề đó đi".

**`RetryJob` là code chết mà không ai biết.** Nó set `status → pending` nhưng không reset
`retry_count` (dù comment ghi "Reset job for retry"), và **không có poller nào đọc `status=pending`**
để requeue. Trước T135 thì `retry_count` luôn 0 nên không ai thấy; sau khi thêm
`GREATEST(retry_count, in-memory)` thì tương tác này thành tiềm ẩn. Kết cục: xoá hẳn, vì
`reconcileStaleJobsTask` đã phủ nhu cầu phục hồi.

**`git merge-base --is-ancestor` trả true vì nhánh chưa có commit nào.** Tôi đọc nó thành "đã merge
rồi" trong khi thực ra tôi **chưa commit** — việc vẫn nằm trên đĩa worktree. Một nhánh rỗng là tổ tiên
của mọi thứ; phép kiểm "đã merge chưa" phải chạy sau khi chắc chắn có commit.

## Techniques

**Vùng chạm không co theo zoom trong SVG**: `strokeWidth={44}` + `vectorEffect="non-scaling-stroke"`
+ `pointerEvents="stroke"` — vùng bắt giữ 44px ở mọi mức zoom trong khi handle nhìn thấy vẫn nhỏ.
Khi ba vùng 44px chồng lên nhau, lời giải là `clipPath` phân vùng chứ không phải thu vùng chạm.

**Test pinch-zoom bằng `Input.dispatchTouchEvent` qua CDP** sinh `PointerEvent` **thật** trong
Chromium — đo được điểm thế giới có neo đúng không (khoảng cách 100→200px ⇒ zoom 1→2, neo `(450,275)`
giữ nguyên), thay vì giả lập event bằng tay.

**Sinh proto trong CI là một bước, không phải giả định.** `test-go` đỏ mọi lần chạy vì 0 file
`.pb.go` được track và job không có bước sinh. Đóng bằng `make proto-gen-service` theo matrix, version
`protoc` **lấy từ header của chính stub đang có** chứ không pin bừa một số.

**Quarantine bảng chết bằng `SET SCHEMA <schema>_dead_<ngày>`** thay vì drop hay rename — lùi lại được,
và bắt buộc phải loại trừ trước những bảng vẫn đang được dùng (22 chuyển / 4 giữ).

## Context

- **Verifier nêu hai finding thì phải xử lý cả hai.** Ở F20 tôi mở task cho finding 1 rồi quên hẳn
  finding 2 (vùng chạm chồng lấn) — chỉ rà lại nhờ một thông báo trùng lặp mới bắt được. Verdict là
  một dòng, findings là một danh sách; đọc verdict xong chưa phải là đã đọc verifier.
- Và ngay sau đó: tôi nói "dừng agent đó" nhưng chỉ chạy lệnh **kiểm trạng thái** chứ không gọi
  `TaskStop`, nên nó thông báo lặp thêm hai lượt nữa. Tuyên bố sẽ làm ≠ đã làm.
- Verifier FAIL ở F20 hoá ra là **lỗi brief của tôi** (tôi bắt sửa một file không hề chứa handle
  resize) — cùng loại với FAIL giả ở [[digest-pdf-2026-09-01]]: một FAIL phải được phân loại trước
  khi giao lại. Xem [[cham-viec-agent-nen]].
- Máy tiếp tục là ràng buộc thật: swap 92–97% suốt phiên quyết định số lane mỗi lượt và task nào bị
  hoãn — xem [[digest-ticket-mcrsv-2026-08-18]].

→ [[redis-queue-khong-dung-chung-instance-cache]] · [[gate-tu-viet-la-nguon-xanh-gia]] · [[cham-viec-agent-nen]] · [[bang-chung-phan-biet-duoc]]
