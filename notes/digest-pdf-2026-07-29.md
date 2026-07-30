---
type: note
title: Digest PDF Invoice — engine page-break Puppeteer, scale ẩn của Chrome, dev store scope rỗng (2026-07-29)
summary: Root cause dòng bị xẻ đôi qua biên trang (engine cộng dồn chiều cao + Chrome tự scale khi nội dung tràn khổ), quyết định đảo từ fix chung sang vá CSS riêng cho store, và cụm gotcha Shopify dev store scope rỗng / managed install.
tags: [pdf, invoice, shopify, debug, avada, method]
created: 2026-07-29
source: project "pdf" (PDF Invoice for Shopify) — session history
---

# Digest PDF Invoice — 2026-07-29

> Chỉ ghi phần **mới** so với [[digest-pdf-2026-07-21]], [[digest-pdf-2026-07-23]],
> [[digest-pdf-apiv1-workflow-2026-07-21]], [[shipped-pdf-2026-07-22]].

## Feedback

- **Đừng bịa tên người trong thread Slack.** Thread chỉ có user ID; đã gán bừa
  "anh Vinh" và bị user bắt ("vinh nào vậy ????"). Phải tra `users.info` rồi mới
  nhắc tên/mention. Cùng lỗi lặp lại ở [[digest-subscriptions-2026-07-29]] →
  quy tắc: **không có tên trong data thì không viết tên**.
- **Fix một bộ template không phải là xong** — user yêu cầu "đối chiếu nốt 4 bộ
  còn lại" và việc đó tìm ra một lỗi thật (bộ Tech) mà bản fix đầu bỏ sót.
  Cùng họ với [[feedback-follow-conventions]] (sửa là quét mọi chỗ tương tự).
- **Báo cáo thật khi chưa xong.** Sau nhiều vòng vá từng ca, kết luận đúng là
  "**Chưa xong. Đừng merge**" kèm bảng ca nào pass/fail — thay vì vá tiếp rồi
  tuyên bố hoàn thành.
- **Soát diff trước khi nói xong**: `__tests__/print/dbg.test.js` (file debug tạm)
  đã lọt vào commit đầu, chỉ lộ ra khi user hỏi lại "fix done r đúng ko?".

## Decisions

- **Đảo hướng: bỏ fix chung, vá CSS riêng cho từng template của store.**
  *Why:* fix trong engine đụng **mọi** template của **mọi** store, kể cả các bộ
  đã custom riêng cho khách — user nêu đúng rủi ro này. *Tradeoff:* không xử lý
  gốc, phải lặp lại thủ công cho store khác; đổi lại blast radius = 1 store.
  CSS được ghi thẳng vào doc template trong Firestore prod và **kiểm chứng bằng
  render từ chính doc đó**, không phải bản sao trong bộ nhớ.
- **Revert nguyên merge commit thay vì revert từng commit.** Nhánh fix đã merge
  vào master và master còn commit của người khác xen giữa → `git revert` cả merge
  gọn trong 1 commit và không đụng commit người khác. Revert xong **push lên nhánh
  mới**, không đẩy master ([[feedback-git-branch-discipline]]).

## Bugs (root cause)

- **Engine page-break là code tự viết trong Puppeteer, không dùng CSS
  `break-inside`** — nó **cộng dồn chiều cao thủ công** nên sai số tích luỹ, lệch
  đúng một dòng là dòng hàng bị xẻ đôi qua biên trang.
- **`break-inside: avoid` vô hiệu vì container gốc là `display: flex`** — Chrome
  không fragment được nội dung bên trong flex container lúc in. Đây là lý do
  "thêm CSS guard" không có tác dụng gì.
- **Hằng số bí ẩn `PAGE_HEIGHT.TECH = 1220` (thay vì 1122) là do Chrome tự thu
  nhỏ khi in.** Template Tech không set width cố định, nội dung rộng hơn khổ in
  (793.3px) → Chrome scale nhỏ toàn trang → chiều cao trang quy về toạ độ DOM
  không còn là bội số của 1122. Bất kỳ engine nào đo bằng toạ độ DOM đều phải
  tính tới tỉ lệ scale này. *(1220 ≈ 1122/0.92)*
- **Đo layout trước khi font web load xong**: `document.fonts.ready` chỉ được chờ
  ở bước **xuất PDF**, sau khi engine đã tính toán → font đổi thì chiều cao đổi.
  Hệ quả phụ: font tải qua mạng không ổn định làm **kết quả dao động giữa các lần
  chạy** (item 8 → item 33) — phải chạy lặp nhiều lượt mới loại được nhiễu.
- **Leak nguyên một Chromium mỗi request** khi `outputFormat: 'html'`:
  `return page.evaluate(...)` đặt trong `try`, nên `finally` đóng browser **trước
  khi** evaluate kịp resolve. Triệu chứng nhìn thấy là test bị treo.
- **Patch CSS `height: auto !important` làm nén 8 trang xuống 6** khi in gộp
  nhiều template: `#adjustTemplateContainers` cố tình xoá `<br>` + div
  `page-break-after` sau mỗi `.Template-Container` và tự set chiều cao — patch đè
  lên cơ chế đó thì tài liệu không còn lấp trọn trang.
- **Template refund rỗng dính vào trang của tài liệu kế tiếp**: khi không có
  refund, template chỉ render khối `.empty-noti`, **không có `.Template-Container`**
  → không được cấp chiều cao lấp trang. Lỗi có sẵn, không do patch (chứng minh
  bằng cách so `live` vs `none`).
- **Shim `cc` của wrapper Claude Code phá `node-gyp`**: `~/.local/bin/cc` đứng
  trước clang trong PATH → build `sharp` fail với thông báo lạc đề
  (`ERROR: 'claude' không có trong PATH`). Fix: đổi wrapper sang tên khác (`cca`).
  Cùng họ với ghi chú CGO của [[digest-moonie-2026-07-18]].

## Techniques

- **Ground truth = xuất PDF ra ảnh rồi nhìn** (poppler/`pdftoppm`), không tin số
  đo DOM. Đo lại bằng cách re-render sinh ra "crossing ảo" — engine tự đo báo 0
  dòng vắt biên trong khi PDF vẫn cắt, và ngược lại.
- **Detector "text bị xẻ đôi" dễ sai cả hai chiều**: phải bắt được ca chuỗi xuất
  hiện ở **cả hai** trang; và chuỗi con gây false positive (`FACTURE PRO FORMA`
  chứa cả `FACTURE` lẫn `PRO FORMA`; `namePages: []` nghĩa là template in `title`
  chứ không in `name`, không phải bị cắt).
- **Tái hiện bằng đúng template thật của khách trong Firestore** (chỉ đọc), không
  bằng fixture tự chế: một fixture thiếu `fontSize` sinh ra `font-size: px;` làm
  layout khác hẳn và dẫn tới chẩn đoán sai suốt mấy vòng.
- **Post-pass đo hình học thật + lặp đến khi hội tụ** (`moved = 0`) là hướng đúng
  hơn engine cộng dồn; nhưng phải **đánh dấu spacer do chính post-pass chèn** để
  vòng sau không đo lại chúng.

## Gotcha — Shopify dev store & deploy extensions

- **Store Developer Preview có `access_scopes` rỗng** dù token hợp lệ (GraphQL
  trả 200). Với **managed install** (`use_legacy_install_flow = false`),
  `shopify app deploy` **không** cấp scope cho store — deploy bao nhiêu lần cũng
  vậy. Scope chỉ về khi app được mở lại / `yarn dev` chạy token exchange.
- **`include_config_on_deploy` bị CLI 3.91 xoá khỏi `shopify.app.toml`** (Dev
  Dashboard không còn dùng key này) — sửa file xong CLI ghi đè lại.
- **"New version created, but not released"** vì extension cần `network_access`
  chưa được duyệt → tạm tắt `network_access` ở extension đó để release được, rồi
  `git checkout` hoàn nguyên.
- **Mở khoá template trả phí cho shop dev**: đổi field `shop.plan` (**không phải**
  `planName`) sang `ultimate_24` là **chưa đủ** — nút Upgrade đọc **doc template**
  chứ không đọc plan, phải gọi `TemplateService.generateTemplates(shopId, paidTemplates)`
  để sinh 12 doc template trả phí.

## Liên quan

[[pdf]] · [[digest-pdf-2026-07-21]] · [[digest-pdf-2026-07-23]] ·
[[digest-pdf-apiv1-workflow-2026-07-21]] · [[shipped-pdf-2026-07-22]] ·
[[digest-subscriptions-2026-07-29]] · [[shopify-app-dev]] ·
[[feedback-follow-conventions]] · [[feedback-git-branch-discipline]]
