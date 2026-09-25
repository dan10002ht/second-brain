---
type: note
title: Digest subscriptions (Joy Wholefoods) — 2026-09-25 (chữ ra Times là lỗi theme khách, và cách test một fix theme mà không đụng theme khách)
summary: Landing joywholefoods ra font serif vì theme khách set `--font-body-family` từ `settings.custom_font2` KHÔNG có dấu nháy, mà tên font là "DM Sans 9pt" — token `9pt` làm cả declaration `font-family` vô hiệu; chứng minh bằng repro CSS, test bằng `--init-script` của agent-browser tiêm đúng 2 dòng sắp sửa vào trang thật, và cuối cùng chọn sửa trong file của app chứ không sửa layout toàn cục của khách.
tags: [subscription, shopify, avada, storefront, debug, gotcha]
created: 2026-09-25
updated: 2026-09-25
source: project `subscriptions` — session history, worktree `wholefoods-fonts` (MR !2641 → revert → !2642)
---

# Digest — Joy Wholefoods, font landing ra Times

Cùng vòng việc với [[digest-subscriptions-2026-09-24]] nhưng khác loại hẳn: đây là **theme/CSS**,
không phải dữ liệu contract.

## Bug

Landing `joywholefoods.com.au/pages/…?view=build-your-subscription` render bằng **Times** thay vì
font thương hiệu. Giao diện do Preact render nên phản xạ đầu là đi tìm CSS của app — sai chỗ.

Kiến trúc font của app:

```css
--jw-font-body:    var(--font-body-family,  'DM Sans'), -apple-system, …
--jw-font-heading: var(--font-heading-family,'Holiday Jou…'), …
```

`--font-body-family` do **theme của khách** đặt, trong `layout/theme.liquid`:

```liquid
--font-body-family:{{ settings.custom_font2 }};
```

Giá trị thật là `DM Sans 9pt` — **tên font có token `9pt`**, và Liquid in ra **không có dấu nháy**.
Bảng repro (đã chạy, không suy đoán):

| CSS | Kết quả |
|---|---|
| `var(--raw)` với raw = `DM Sans 9pt` | **Times** |
| `var(--raw), -apple-system, sans-serif` | **Times** |
| `"DM Sans 9pt", sans-serif` | đúng font |

Dấu hiệu phân biệt sớm: `p` (hard-code có nháy) ra đúng font, còn `body` (thay biến thô) ra Times —
**chỗ nào thay biến thô thì chết, chỗ nào hard-code thì sống**. Và phạm vi không chỉ landing: `body`
của **toàn theme**, kể cả trang collection, cũng là Times. Kiến thức tổng quát tách riêng ở
[[css-var-khong-quote-lam-chet-ca-declaration]].

Một bug riêng nằm ngay dòng bên cạnh, **không sửa** vì khách không yêu cầu: `--font-heading-weight`
lấy `.weight` của `settings.custom_font2`, mà đó là chuỗi nên giá trị rỗng.

Bản vá cũng phải tránh đúng cái bẫy nó vừa sửa: nếu bọc nháy mà vẫn nối
`{{ ...fallback_families }}` thì khi fallback rỗng sẽ ra `"DM Sans 9pt", ;` — dấu phẩy thừa lại làm
chết declaration y như cũ. Nên bỏ hẳn phụ thuộc vào biến đó.

## Techniques

**Test một fix theme mà không đụng theme khách.** `agent-browser --init-script` chạy trước khi trang
load, đủ để tiêm đúng 2 dòng CSS sắp sửa rồi load lại **trang thật của store**:

```
body: Times  →  "DM Sans 9pt", sans-serif
```

Đối chiếu trước/sau từng dòng chữ của landing. Đây là bằng chứng phân biệt được, khác hẳn với
"đọc code thấy đúng" — và nó trả lời được câu dantt hỏi thẳng: *"bạn test thử bằng cách override lại
request hay css xong test thử xem đúng như khách mong muốn hay ko chứ?"*

Hai bẫy đo đạc trong cùng vòng việc này:

- `get html "body"` **không lấy được `<head>`**, nên không kết luận được font có tải thật hay không —
  phải chụp trang ra nhìn. (Có tải thật; nghĩa là thêm nháy sẽ ra đúng font thương hiệu chứ không rơi
  về sans mặc định.)
- URL bị **strip mất `preview_theme_id`** → đang đo **theme live** trong khi tưởng đang đo draft.
  Hai theme khác nhau, kết luận "step 2 rỗng" sai vì thế. Luôn xác nhận lại `themeId` thực tế đang
  render trước khi tin phép đo. Và agent-browser **không có cache-buster** như `curl`.

## Context

- `docs/joyxjoy-theme/layout/theme.liquid` trong repo là **bản export theme của khách**, không phải
  file app deploy được — sửa vào đó chỉ để giữ bản latest, không tự tới store.
- Quyết định chọn phạm vi vá: [[2026-09-25-fix-font-trong-file-cua-app]] (B thay vì A). MR !2641 đã
  merge phương án A rồi phải revert; MR !2642 mang phương án B.
- "Live" ở đây có hai nghĩa khác nhau (MR merge vào master ≠ theme khách đã đổi) — chỗ này đã làm
  lệch nhau một lượt trao đổi.

Liên quan: [[subscriptions]] · [[css-var-khong-quote-lam-chet-ca-declaration]] ·
[[2026-09-25-fix-font-trong-file-cua-app]] · [[digest-subscriptions-2026-09-25]] ·
[[bang-chung-phan-biet-duoc]] · [[prop-sai-bi-bo-qua-im-lang]] · [[shopify-app-dev]]
