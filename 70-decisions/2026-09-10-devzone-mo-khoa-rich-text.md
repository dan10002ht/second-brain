---
type: decision
title: Khoá read-only rich text editor giữ nguyên, nhưng mở được cho từng shop bằng cờ DevZone
summary: Thay vì để rich text editor bị khoá cứng ở mọi surface (stop-gap chống phishing HTML trong email), thêm cờ `enableRichTextEditing` theo shop trong DevZone gỡ khoá cho một shop đã được xét, kèm audit hai chiều — đổi một biện pháp an ninh tuyệt đối thành một biện pháp có ngoại lệ vận hành được.
tags: [avada, subscription, shopify, auth]
created: 2026-09-11
updated: 2026-09-11
status: active
review: 2026-12-11
source: repo `subscriptions` — git log 2026-09-10 (`22c80e794`, merge `834a90f09` = `v2.35.22`, MR !2574; khoá gốc `52bfd3861`)
---

## Quyết định

`52bfd3861` trước đó ép `readonly` cho **RichTextEditor ở mọi surface** như một stop-gap chặn HTML
phishing bị soạn vào email subscription. Hệ quả ngoài ý muốn: merchant có nhu cầu chính đáng sửa nội
dung email của chính họ cũng bị chặn, và support **không có đường nào** phục vụ.

Chốt ở `22c80e794` (`v2.35.22`): giữ nguyên trạng thái khoá làm mặc định, thêm một quick-tool DevZone
`enableRichTextEditing` gỡ khoá **cho đúng một shop**.

- `readonly` vẫn bị ép **sau** spread `...props`, nên khi shop còn khoá thì không caller nào bật lại
  được bằng config. Cờ bật rồi thì prop `readonly` mới có tiếng nói trở lại — Translations vẫn truyền
  `readonly` nên HTML translation read-only ở cả hai trạng thái.
- Banner bảo trì "Edit email" bị bỏ qua khi cờ bật (nếu không nó báo không sửa được trong khi sửa được).
- Action DevZone **ép kiểu boolean** thay vì ghi thẳng payload, và audit hai chiều
  `RICH_TEXT_EDITING_UNLOCKED` / `_RELOCKED`.
- Cờ nằm ở `TOGGLE_ITEMS`, **không** ở `GROWTH_HACK_FEATURES` / `GROWTH_HACK_DEFAULTS` ⇒ không install
  mới nào tự ghi cờ này.

## Why

- **Khoá tuyệt đối là công cụ cùn.** Nó chặn cả kẻ tấn công lẫn merchant hợp lệ; giữ nguyên nghĩa là
  chấp nhận support không phục vụ được ai — chi phí đó đã hiện thực, còn rủi ro phishing chỉ hiện thực
  ở shop không được xét.
- **Ngoại lệ phải tường minh và ghi lại được.** Đây là lần **gỡ một biện pháp an ninh**, nên "ai bật,
  lúc nào" phải truy được từ audit log — đó là lý do có cả hai chiều `_UNLOCKED`/`_RELOCKED`, không chỉ
  chiều mở.
- **Chỗ đặt cờ nói lên cờ là gì.** `TOGGLE_ITEMS` = override bảo trì cho một shop đã xét;
  `GROWTH_HACK_FEATURES` = tính năng theo gói. Đặt nhầm chỗ là biến một ngoại lệ an ninh thành thứ
  phát tán theo default cho mọi install mới. Cùng nguyên tắc với
  [[chan-agent-bang-cau-hinh]]: rào chắn nằm ở default, không nằm ở lời dặn.
- Repo đã có sẵn pattern DevZone bật tính năng theo shop — cùng đường với
  [[2026-09-10-devzone-hide-recurring-pricing]] ship cùng ngày, không phải cơ chế mới.

## Tradeoff

- **Bán kính nổ khi mở là thật và rộng hơn "một ô editor":** nội dung email + title form COD trở nên
  sửa được, kể cả các nút toolbar Variables và Upload Image mà khoá đã làm trơ. Chính đường phishing
  ban đầu mở lại cho shop đó.
- **Không có hạn tự đóng.** Cờ bật là bật cho tới khi ai đó nhớ tắt; không có TTL, không có nhắc.
  Audit log ghi được *ai bật*, không ép được *đóng lại*.
- **Ngoại lệ vận hành che mất động cơ sửa gốc.** Gốc là "HTML soạn vào email chưa được sanitize"; có
  van xả rồi thì áp lực làm sanitize giảm, và khoá read-only dễ ở lại vĩnh viễn như hiện trạng.
- **Bảo vệ nằm ở thứ tự trong file.** Đảm bảo "không caller nào bật lại được" đến từ việc `readonly`
  đứng sau `...props`; một lần refactor sắp xếp lại là mất, và cái giữ nó là một test khoá theo thứ tự
  nguồn — mạnh hơn không có gì, nhưng vẫn là một phép kiểm cú pháp cho một tính chất an ninh.
  → [[gate-quet-ma-nguon-bang-ast]]

## Bằng chứng

`22c80e794` (6 file: `RichTextEditor.js`, `DevZone/constants.js`, `Settings/Form/EditEmail.js`,
`devZoneController.js` + 2 test) → merge `834a90f09` (MR !2574) → tag `v2.35.22`. Khoá gốc được commit
body dẫn là `52bfd3861`.

Liên quan: [[shipped-subscriptions-2026-09-11]] · [[subscriptions]] ·
[[2026-09-10-devzone-hide-recurring-pricing]] · [[chan-agent-bang-cau-hinh]] ·
[[gate-quet-ma-nguon-bang-ast]]
