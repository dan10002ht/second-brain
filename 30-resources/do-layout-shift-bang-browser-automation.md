---
type: resource
title: Đo layout-shift (CLS) bằng browser automation — control test trước, kết luận sau
summary: Bộ luật đo CLS bằng agent-browser/Playwright — phần lớn "0 shift" là harness hỏng chứ không phải fix ăn; luôn chạy control test, dùng buffered:true, đo ≥5 lần vì baseline chập chờn, và assert trang đã render trước khi tin con số.
tags: [performance, debug, tooling, react]
created: 2026-08-06
source: project "subscriptions" — session history 2026-08-05/08-06 (chiến dịch giảm CLS in-app Joy Subscription)
---

# Đo layout-shift bằng browser automation

Rút từ chiến dịch giảm CLS của [[subscriptions]], nhưng không có gì riêng của Shopify —
áp cho bất kỳ web app nào đo Core Web Vitals bằng browser tự động.

## Luật cái: một số 0 chưa chứng minh điều gì

Trong cả chiến dịch, số lần "CLS = 0" do **harness hỏng** nhiều hơn số lần do fix ăn.
Ba cơ chế đã trả giá:

| Triệu chứng | Cơ chế thật |
|---|---|
| Mọi route ra 0, kể cả trang chưa fix | Script bám vào **tab nền** — tab ẩn không render nên không phát `layout-shift` entry |
| Observer chạy nhưng callback không bao giờ bắn | `PerformanceObserver` **live** không nhận entry khi eval chạy trong *isolated world*; phải `observe({type:'layout-shift', buffered: true})` |
| Tab mở nhiều giờ, qua nhiều navigation, ra 0 tuyệt đối | Tab đã ngừng ghi nhận shift — cả `body.style.marginTop='120px'` cũng không sinh entry |

**Control test** phát hiện cả ba: chèn một khối 200px vào đầu trang (hoặc set `marginTop`),
ép sinh một shift mà bạn *biết chắc* phải có. Control ra 0 ⇒ vứt phép đo, sửa harness, đừng
kết luận gì về code.

## Assert render, đừng chỉ assert con số

CLS của một trang vỡ cũng bằng 0. Đã có ca `useEffect` tham chiếu biến trước khi khai báo
làm trang không render bảng nào — 10 lần đo ra 0 hoàn toàn là ảo. Mỗi phép đo phải kèm một
assert nội dung (`rows === 10`, `doc.scrollHeight > N`), và nếu fix ghi state thì kiểm cả
**dấu vết fix đã chạy** (giá trị đã lưu trong storage), không chỉ kết quả.

## Baseline chập chờn — so tỉ lệ, không so một lần

Cùng một trang có thể ra 0.0432 ở lần 1 và 0 ở lần 2, tuỳ data về trước hay sau paint.
Chạy **≥5 lần mỗi nhánh** và so tỉ lệ (`3/5 có shift` vs `0/5`). "Ba lần đều 0" trên một
baseline vốn chập chờn không phải bằng chứng.

## Local không tái hiện thì tạo điều kiện, đừng suy diễn

API local trả quá nhanh nên state `loading` gần như không tồn tại → CLS luôn 0 ở cả hai
nhánh. Cách vào được: **throttle riêng request API**, giữ nguyên tốc độ load module dev
(để trang vẫn kịp cao lên và có chỗ cuộn). Kèm hai bẫy đi cùng:

- Throttle làm app boot chậm hẳn (đã gặp ~17s) — cửa sổ chờ ngắn hơn thì ra **0 giả**.
- Kiểm đúng **file/đường phục vụ thật**: dev server có thể serve một entry HTML khác với
  bản production, sửa nhầm file thì A/B ra số đẹp mà vô nghĩa.

## Đăng nhập và chọn đúng frame

- Auth nằm trong IndexedDB thì **state file không dùng được** — phải cho browser automation
  một **profile riêng**, người dùng login *một lần*, sau đó sweep tự động.
- App nhúng trong iframe (Shopify Admin, portal…): đo ở frame `top` là đo giao diện của
  **host**, không phải của app. Chọn đúng frame theo origin của app.

## Đọc kết quả trên dashboard

Điểm CWV là **p75**. Với 21 sample thì p75 chính là mẫu xấu thứ 6 — một phiên xấu kéo cả
điểm lên. Trước khi kết luận "app tệ đi", kiểm cỡ mẫu.

## Đối tượng thường là thứ tầm thường

Bucket lớn nhất đo được của một app thật hoá ra là **margin 8px mặc định của UA** trên boot
screen (`8,8 → 0,0`, 31/31 mẫu), không phải component nào. Kiểm reset ở entry HTML trước
khi đi soi từng component. Nhóm lớn thứ hai là một cờ `loading` khởi tạo `false` làm trang
paint sai chiều rộng rồi lật.

## Liên quan
- [[digest-subscriptions-2026-08-06]] — ca thật, kèm số đo.
- [[digest-subscriptions-2026-08-03]] — chiến dịch CLS giai đoạn trước.
- [[subscriptions]] · [[shopify-app-dev]]
