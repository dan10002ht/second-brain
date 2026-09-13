---
type: resource
title: Surface không có error boundary — bán kính hỏng luôn là cả màn hình
summary: Trong một surface nhúng (Customer Account extension, portal, widget theme) không ai dựng error boundary, mọi lỗi ném ở nhánh render đều cho ĐÚNG MỘT triệu chứng "trắng trang" — nên triệu chứng không mang thông tin chẩn đoán, và crash phụ thuộc dữ liệu hay bị quy oan cho thay đổi vừa làm.
tags: [react, extensions, shopify, debug, patterns]
created: 2026-09-13
updated: 2026-09-13
source: [[digest-subscriptions-2026-09-09]] · [[digest-subscriptions-2026-09-10]] · [[digest-subscriptions-2026-09-12]]
---

# Surface không có error boundary — bán kính hỏng luôn là cả màn hình

Áp cho mọi surface React/Preact chạy **trong nhà người khác**: Shopify Customer Account UI
extension, customer portal nhúng, widget trong theme, app block. Ở đó mình không sở hữu trang lỗi
của host, và mặc định **không có error boundary nào**.

## Hệ quả 1 — triệu chứng không phân biệt được nguyên nhân

Trong một đợt dựng portal Wholefoods, **năm cơ chế khác hẳn nhau** cho ra cùng một màn hình
"problem loading" / trắng trang:

| Cơ chế | Vì sao ném |
|--------|-----------|
| `Intl.DateTimeFormat` ném `RangeError` | helper khai nhận `Date`, chỗ gọi truyền **chuỗi** → `NaN` |
| Vi phạm Rules of Hooks | `return null` sớm rồi mới gọi hook ⇒ số hook đổi giữa các lần render |
| `useEffect(..., [])` bắn trước khi dữ liệu context kịp có | race lúc mount |
| Destructure không default (`calculateCurrentPriceByTier`) | line nào tra plan không ra là ném |
| `if (disabled) return null` | không ném, nhưng **unmount cả lưới** — nhìn giống hệt crash |

Vì mọi nguyên nhân cho cùng một hình ảnh, **quan sát triệu chứng là vô ích**. Chẩn đoán phải bắt đầu
từ stack trace/console của chính surface đó, không từ "trang trắng nghĩa là gì". Đây đúng là ca
[[phep-kiem-quan-sat-sai-tang]]: nhìn artefact ở tầng mà bug không làm đổi.

## Hệ quả 2 — crash phụ thuộc dữ liệu bị quy oan cho thay đổi vừa làm

Destructure không guard chỉ ném **với contract thiếu field**: contract A render bình thường,
contract B trắng trang. Bug có sẵn từ trước, nhưng vì nó lộ ra ngay sau một lần deploy nên phản xạ
đầu tiên là đổ cho diff vừa merge. Trước khi revert, thử đúng bộ dữ liệu cũ trên build cũ.

Kèm theo: **test xanh cả khi bỏ guard**, vì fixture do chính người viết dựng không mang hình dạng
thật của dữ liệu → [[fixture-khong-phai-hop-dong-du-lieu]].

## Rút ra

- **Error boundary theo từng section, không phải một cái ở gốc.** Một cái ở gốc chỉ đổi trang trắng
  thành thông báo lỗi trắng; mục tiêu là một section hỏng thì phần còn lại vẫn dùng được.
- **Cờ kỹ thuật không được làm điều kiện hiển thị.** `disabled`/`loading`/`initLoad` nghĩa là "đang
  có request bay" chứ không phải "không có gì để hiện". Khoá đúng nút vừa bấm, giữ nguyên phần còn
  lại. (Cùng họ với lỗi `initLoad` ở [[digest-subscriptions-2026-09-11]].)
- **Mọi chỗ deref dữ liệu từ backend phải có default**, vì một doc thiếu field là chuyện thường ở
  Firestore — đã vấp đúng dạng này trước đó ([[digest-subscriptions-2026-08-06]]).
- Hàm format của platform (`Intl`, `toLocaleString`) **ném chứ không trả giá trị rỗng**; ở surface
  không boundary thì một chuỗi ngày lạ đủ để giết cả trang.

## Khi nào mở lại trang này

Khi một extension/portal/widget báo "trắng trang" hoặc "problem loading", **trước khi** đi truy
metafield, cache hay cấu hình — và khi bắt đầu dựng một surface nhúng mới.

Liên quan: [[cau-extension-chay-that-tren-store]] · [[so-anh-khong-so-chu]] ·
[[bang-chung-phan-biet-duoc]] · [[shopify-app-dev]] · [[subscriptions]] ·
[[2026-09-09-portal-wholefoods-extension-rieng]]
