---
type: note
title: Digest Joy Subscription — 2026-09-03
summary: Phí ship là thuộc tính của CONTRACT còn lines là thuộc tính của CYCLE, nên khách sửa một kỳ thì kỳ đó thừa hưởng phí ship cũ; và `jest.requireActual` làm cả một suite chạy mà đăng ký 0 test — số suite không đổi trong khi mất 42 test.
tags: [avada, subscription, shopify, shipping, billing, debug, agent]
created: 2026-09-03
updated: 2026-09-03
source: project `subscriptions` — session history 2026-09-02/09-03 (kookut phí ship theo kỳ, MR !2524, SB-16175)
---

CHỈ phần mới so với [[digest-subscriptions-2026-08-28]], [[digest-subscriptions-2026-09-01]],
[[2026-08-28-shipping-lay-gia-tu-rate-table]] và [[jsub-260903-upcoming-order]].
Đợt sửa 28/08 (!2513, đọc giá ship từ rate table của merchant) là **tầng contract**;
cái ghi ở đây là **tầng cycle** — hai bug khác nhau, ngược chiều nhau.

## Bugs

**`deliveryPrice` là thuộc tính của CONTRACT, còn `lines` là thuộc tính của từng CYCLE.**
Khách sửa đơn sắp tới (bớt hàng xuống dưới ngưỡng free ship, hoặc thêm hàng vượt ngưỡng) thì
`orderService.handleOrderUpdate` ghi lại `lines` cho riêng kỳ đó nhưng **không tính lại phí ship**
— kỳ đó thừa hưởng `deliveryPrice` đóng băng trên contract. Với merchant dùng rate phân tầng theo
`TOTAL_PRICE` thì đó là thu sai tiền theo cả hai chiều: contract `147888865661` giữ 10 CHF cho một
giỏ 47.88 (đáng ra thu, khách kêu ngược lại là *"sao vẫn bị thu"* vì kỳ trước 51.30 được free).
Sửa: gọi resolver rate table cho **chính bộ lines đang được dựng lại của kỳ đó**, không lấy giỏ
của contract gốc và cũng không quote lại cart. MR !2524, merged 03/09 **11:06 giờ VN**.

**Chỗ chèn fix suýt sai vì `cycleIndex` của app ≠ `shopifyCycleIndex`.** Kế hoạch đầu của tôi là
móc vào đường ghi theo index của app — nhưng app **cố ý** không đồng bộ hai chỉ số này. Cơ chế thật
nằm trong luồng billing attempt: `willSyncEditedCycle = (shopifyCycleIndex !== cycleIndex && edited)`
→ `handleSyncEditedContractToCurrentCycle` xoá edit cũ trên **cycle hiện tại theo lịch của Shopify**,
tạo draft mới rồi copy dòng đã sửa sang. Nên chỗ duy nhất đúng để tính lại phí ship là **hàm sync
đó**, không phải chỗ ghi theo index app. Câu hỏi của user (*"bạn sửa trên cycleIndex nào?"*) là thứ
lộ ra điều này — xem [[digest-subscriptions-2026-07-27]] về cùng họ lỗi lấy sai nguồn sự thật.

**`jest.requireActual` làm suite chạy nhưng đăng ký 0 test — hỏng hoàn toàn im lặng.**
Sau refactor, tôi giữ ranh giới mock cũ bằng `requireActual`; gate vẫn báo **271 suite pass**, nhưng
tổng test tụt **2899 → 2857**. 42 test biến mất là trọn suite `contractService.test.js`. Luật của repo
là *chấm theo suite, không đọc dòng `Tests:`* — đúng cho việc phát hiện suite đỏ, nhưng **mù trước
việc suite xanh mà rỗng**. Phải đọc cả hai con số và so với baseline.

**Cache theo identity của object làm mock ở test sau vô tác dụng.** Hàm bọc mới cache rate table theo
`shop` (cùng một object xuyên suốt batch billing — verifier đã trace và xác nhận điều đó là đúng cho
production). Hệ quả trong test: mock đổi ở case thứ hai không ăn vì lượt đầu đã cache. Test phải tự
clear cache trong `beforeEach`, không phải sửa mock.

**Smoke test quét import bằng regex không bỏ comment.** Chuỗi `from "free"` nằm trong câu văn
*distinguish "no price" from "free"* của chính comment tôi viết bị hiểu thành một `import`. Cùng họ với
[[gate-quet-ma-nguon-bang-ast]]: cú pháp còn là biến số thì gate còn khe.

## Techniques

**Dựng lại đúng hình dạng lỗi trên store test rồi chạy đúng đường code production.**
Store test `ag-dantt-prod1` ban đầu không có rate phân tầng nào (chỉ "Standard" 0đ vô điều kiện) nên
không có ngưỡng để vượt — tức **không thể phân biệt fix đúng hay sai**. Dựng bằng
`priceConditionsToCreate` (TOTAL_PRICE ≥ 500) rồi chạy thẳng `handleOrderUpdate`: giỏ 840 → ghi 0,
giỏ 420 → ghi 30. Đó là bằng chứng end-to-end đầu tiên; unit test xanh trước đó không chứng minh được
điều này. Kèm hai bẫy: phải chạy code của **master đã deploy** (dựng worktree riêng) chứ không phải
nhánh đang làm, và Shopify timeout giữa chừng nên phải chia nhỏ từng bước để một lượt hỏng không mất cả.

**Sửa hiển thị của 3 kỳ sai mà không đụng vào contract của khách.** Không dùng mẹo "sửa dòng giả rồi
sửa lại" — nó tạo hai lần chỉnh số lượng trên contract thật và có thể bắn email. Cách dùng: commit
draft cycle với `deliveryPrice` **do chính resolver tính ra**, không nhập tay số, rồi verify bằng
script audit độc lập (3 → 0).

**Baseline phải đo trong chính worktree vừa dựng.** Brief đầu tiên tôi ghi 214 suite / 2088 test —
đó là con số của nhánh kookut, `origin/master` thật là **270 / 2882**. Giao lane một baseline sai là
giao nó một môi trường sai; sửa brief trước khi dispatch. Xem [[brief-state-agent-loop]].

**Verifier tự vô hiệu hoá logic mới bằng `sed` để chứng minh test thật sự bắt được** — FAIL vòng 1
của lane T32 hoá ra là lỗi tiêu chí trong brief của tôi, không phải lỗi lane. Phân loại FAIL trước
khi giao lại: [[cham-viec-agent-nen]].

## Context / gotcha

- **Push thêm commit lên một nhánh mà MR đã merged thì commit không vào MR đó.** Push `!2509` thành
  công nhưng MR đã merged tại sha trước đó ⇒ hai commit lơ lửng, phải mở MR mới. Kiểm trạng thái MR
  **trước** khi push tiếp, đừng suy từ "nhánh vẫn còn". Kèm luật mới rút ra từ chính phiên này:
  [[feedback-chi-tao-mr-user-merge]] — agent dừng ở bước tạo MR, người bấm merge là user.
- GitLab trả timestamp **UTC**; `2026-09-03T04:06:34Z` là **11:06 sáng giờ VN** → xem
  [[feedback-bao-gio-theo-gio-vn]].
- Hook git chặn mọi lệnh có chữ `master` trong chuỗi, kể cả lệnh chỉ đọc. Đường vòng hợp lệ: chạy
  truy vấn từ một worktree khác — chúng dùng chung ref store.
- Deploy chỉ chặn tái diễn, **không chữa dữ liệu cũ**. Sau khi !2524 lên prod, 3 kỳ đang sai vẫn sai
  cho tới khi có **sự kiện** (khách sửa dòng, hoặc billing attempt) kích hoạt code mới chạy.
- SB-16175 (card *Customer portal version*) chỉ là việc UI thường: worker Orca → verifier PASS →
  `yarn trans`. Đáng ghi đúng một điều: `yarn trans` báo **377 từ** trong khi diff `en.json` chỉ 6/4
  — con số đó là backlog tích tụ sẵn trên nhánh, không phải thay đổi của mình. Đọc diff trước khi
  hoảng.

→ [[subscriptions]] · [[subscriptions-debug-runbook]] · [[2026-08-28-shipping-lay-gia-tu-rate-table]] ·
[[gate-tu-viet-la-nguon-xanh-gia]] · [[bang-chung-phan-biet-duoc]] · [[brief-state-agent-loop]]
