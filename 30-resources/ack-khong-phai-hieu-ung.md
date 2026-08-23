---
type: resource
title: Lệnh ghi báo OK không chứng minh hiệu ứng đã xảy ra
summary: Một mutation/job/deploy trả thành công chỉ chứng minh lời gọi được nhận, không chứng minh trạng thái đã đổi — kiểm `userErrors` + `exit 0` vẫn để lọt "9/14 group không tồn tại", nên bước đóng việc phải là đọc lại từ nguồn chuẩn bằng một đường khác với đường vừa ghi.
tags: [method, debug, backend, architecture]
created: 2026-08-23
updated: 2026-08-23
source: [[digest-subscriptions-2026-08-21]] · [[digest-subscriptions-joyxjoy-2026-08-20]] · [[digest-subscriptions-2026-08-20]] · [[digest-subscriptions-2026-08-17]] · [[digest-subscriptions-2026-08-22]] · [[digest-ticket-mcrsv-2026-08-22]] · [[digest-pdf-2026-08-21]]
---

# Lệnh ghi báo OK không chứng minh hiệu ứng đã xảy ra

Cái ack của một lệnh ghi (`userErrors` rỗng, `exit 0`, HTTP 200, job `DONE`, "deploy
succeeded") chỉ nói **lời gọi đã được nhận và không ném lỗi ở đường mình đang nhìn**. Nó
không nói trạng thái đích đã đổi. Hai câu đó khác nhau, và mọi lần chúng khác nhau thì
triệu chứng đều là *im lặng* — không có exception, không có log đỏ, không có gate nào vỡ.

## Bốn kiểu ack rỗng đã gặp

| Kiểu | Ví dụ thật | Cái đã kiểm mà vẫn lọt |
|---|---|---|
| **API nhận nhưng không sinh ra gì** | `sellingPlanGroupCreate` log tạo 12 group; hỏi Admin API thì **9/14 sản phẩm không có plan** | script *có* kiểm `userErrors`, *có* throw, exit 0 — ⚠️ tới nay **chưa giải thích được** |
| **Lỗi bị nuốt ở tầng dưới** | helper GraphQL destructure `{data, errors}` mà không throw ⇒ line 2 fail, draft vẫn commit với line 1 đã đổi | mã trả về của hàm gọi |
| **Việc được đánh dấu xong vô điều kiện** | `processedContracts.add()` chạy **cả ở nhánh lỗi** ⇒ job báo hoàn thành trong khi contract chưa xử lý | terminal status `DONE` |
| **Bước đi kèm không bao giờ chạy** | migration của task **đã merge** chưa từng áp vào DB dev (init container chỉ chạy lúc `compose up`) ⇒ mọi `POST /bookings` trả 500 suốt một ngày | MR đã merge, CI xanh |

Cùng họ nhưng đứng ở phía đọc: một request 404 bị `catch` nuốt im lặng khiến nhánh
lazy-fetch **chưa từng chạy một lần nào**, và một detector so bằng `NaN` (`NaN > 0.01` luôn
false) nên không bao giờ gắn cờ — 36 bản ghi lọt sạch. Đường ghi và đường kiểm cùng im lặng
là cách một trường dữ liệu hỏng sống lâu ([[du-lieu-hong-song-sot-vi-ba-lop-nhin-cho-khac]]).

## Luật

> Sau khi ghi, **đọc lại từ nguồn chuẩn bằng một đường khác với đường vừa ghi**, rồi mới
> gọi là xong. Đếm ra số, đừng đọc log.

"Một đường khác" là phần quan trọng. Đọc lại bằng chính client vừa ghi thì hai lượt chia
chung mọi giả định sai. Các cặp đã dùng được:

- ghi bằng script → đếm lại bằng Admin API (`9/14 box không có plan`, `203 group toàn shop
  mà chỉ 5 gắn vào box của mình`);
- sửa data → verify bằng **hai công cụ độc lập**, cùng ra 0 lệch;
- fix contract → đọc lại từ Shopify sau khi ghi, ngay trong chính script;
- vá lỗ P0 → chứng minh bằng **đường thật end-to-end** (đặt → capture → refund → đặt lại
  đúng ghế đó), không dừng ở test xanh.

## Phía deploy: cái mình đo có phản ánh cái mình vừa đẩy không

Cùng một bệnh, tầng khác. Ở đây ack là "đã push / đã merge", còn phép đo lại đang nhìn bản cũ:

- **Cache của platform**: fetch trang storefront sau mỗi lần push đều ra **1189534 byte
  giống hệt từng byte**. Đó không phải "fix không ăn", đó là "thứ mình fetch không phản ánh
  thay đổi" — thêm `?preview_theme_id=` là ra ngay. Kích thước lặp lại **chính xác** là dấu
  hiệu của cache, không phải của code.
- **Platform âm thầm vứt bớt**: push section + template trong **cùng một lệnh** thì setting
  mới bị loại khỏi template không một lời cảnh báo (nó kiểm template trước khi schema mới
  của section kịp cập nhật). Tách hai lệnh.
- **Mỹ từ trong output**: dòng `"Cleaning your remote theme"` không dọn gì — kiểm lại 417
  file còn nguyên.
- **Verify deploy bằng pipeline, không bằng thời gian merge**: MR merge `09:24Z` nhưng
  pipeline mới nhất trên nhánh đích là `02:44` cùng ngày ⇒ đã kết luận "chưa deploy" rồi
  phải rút lại sau khi kiểm riêng commit merge.
- **Chọn nhầm artefact để đo**: nhặt file CSS build bằng `ls -S` (lớn nhất) là sai — rule
  nằm ở file khác, và kết luận rút ra là "fix không ăn". Chọn bằng `grep -l <class>`.

## Hệ quả khi viết brief / done-criteria

Done-criteria phải là **hành vi quan sát được ở đầu ra**, không phải "test xanh" hay "lệnh
chạy không lỗi". Đã có chuỗi bốn lỗi liên tiếp mà unit test xanh còn luồng thật vẫn 500,
đến khi chốt cứng "booking thật trả 2xx" vào brief thì mới đi tới nơi. Và cách đọc tiến bộ
đúng trong chuỗi đó: **lỗi đổi** (`Invalid API Key` → `payment_intent_unexpected_state` →
lỗi ở service kế tiếp) chính là bằng chứng bản vá trước đã ăn.

## Liên quan

[[bang-chung-phan-biet-duoc]] · [[gate-tu-viet-la-nguon-xanh-gia]] ·
[[du-lieu-hong-song-sot-vi-ba-lop-nhin-cho-khac]] · [[cham-viec-agent-nen]] ·
[[do-be-ngang-headless-chrome]] · [[feedback-debug-phai-query-data-that]]
