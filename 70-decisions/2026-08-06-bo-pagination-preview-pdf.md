---
type: decision
title: PDF Invoice bỏ hẳn pagination phía client của preview, đổi sang highlight theo marker
summary: Xoá toàn bộ Plan 2 (computePhysicalPages + renderPages + reconcile anchor, ~3.9k dòng) vừa viết trong ngày; preview quay về một trang liền, PDF server giữ vai trò nguồn phân trang duy nhất, và công sức chuyển sang backbone highlight dựa trên marker liquid inert.
tags: [pdf, invoice, shopify, avada, architecture]
created: 2026-08-06
updated: 2026-08-06
status: active
review: 2026-11-06
---

# Preview của template editor: bỏ phân trang phía client, giữ 1 trang liền

**Bối cảnh:** Plan 2 muốn preview trong editor vẽ đúng số trang vật lý như PDF thật:
`computePhysicalPages` tái hiện engine trong browser (T1 spacer / T2 stretched container /
T3 native stride), `renderPages` vẽ từng tờ A4 rời, và Task G thêm **count-anchor** —
server render PDF thật một lần cho mỗi KIND_CONTEXT của một tập theme rồi client áp delta
có hướng để chỉnh số trang (`5d59705a2`, `9b007fd31`, `39ad2ee98`, `9a35cbfdb`, `68abc4a16`,
`a9003f529`, `022175f00`).

**Quyết định (`f2d9c5819`, cùng ngày 2026-08-04):** revert toàn bộ. 129 file, **−3.969
dòng**. Preview chỉ còn morphdom + highlight trên **một cột `.avada-preview-page` liền
mạch** — không frame, khe, guide, footer. PDF thật (Plan 1, server engine) là **nguồn phân
trang duy nhất**: `pageBreakEngine` + injection puppeteer giữ nguyên. Giữ lại `parsePageBox`
chỉ để sheet hiện đúng khổ giấy. Preview tách khỏi fixture test: dùng `previewOrder.json`
(3 item) thay `order.json` 12 item multi-page — verify 110 theme × 3 item = 0 template tràn.

**Why:** con đường này phải *xấp xỉ* một engine khác chứ không tái dùng được nó, và mỗi lần
xấp xỉ sai lại đẻ ra một tập theme phải quarantine — dấu vết còn nguyên trong chính các
commit dựng nó:

- `9b007fd31` phải sửa gate T2/T3 vì họ theme chỉ có `.Avada-Template-Page` rơi nhầm nhánh
  native và **chỉ đúng số trang do trùng hợp**; danh sách quarantine đi từ 22 xuống 9 theme
  nhưng lộ thêm residual mới (`tech_packing_slip`, `london_invoice`).
- Sai lệch quirks/standards giữa preview và bản capture PDF phải xử lý bằng cách thay logo
  giả 0×0 bằng logo thật trong guard — rồi `a9003f529` phát hiện chính con số golden `2`
  của họ CD là **artifact của fixture logo 0×0**, phải loại CD khỏi anchor set.
- Task G phải kéo cả server vào (render PDF thật thêm một lần mỗi KIND_CONTEXT) chỉ để chỉnh
  con số trang cho client — chi phí thật cho một thứ chỉ mang tính hiển thị.

Đổi lại, cùng ngày backbone khác được dựng và **đứng vững đến hết đợt**: highlight theo
marker `<!--cfg:KEY-->` chèn bằng tokenizer liquidjs, có invariant byte-equal chứng minh
marker inert (`177dcd755` → `c24ae63dc`). Đây mới là thứ merchant thấy khi sửa config.

**Tradeoff / đánh đổi:**

- **Mất:** preview không còn cho biết hoá đơn sẽ dài mấy trang hay dòng nào rơi qua biên —
  đúng lớp vấn đề đã tốn nhiều công ở [[digest-pdf-2026-07-29]] và [[digest-pdf-2026-07-30]]
  (dòng hàng xẻ đôi, khối tổng tiền vắt qua biên, header bảng không lặp). Merchant vẫn phải
  in ra mới biết. Vứt bỏ ~3.9k dòng đã có test xanh, gồm cả các phát hiện phụ đáng giá
  (`promotePrintMediaRules` bằng CSSOM chứ không regex, POS liên tục, margin `@page`).
- **Được:** một nguồn phân trang duy nhất — không còn hai engine phải khớp nhau, không còn
  quarantine set phải bảo trì mỗi lần thêm theme. Toàn bộ ngân sách công sức dồn vào
  highlight, thứ chạy trên **mọi** theme chứ không chỉ tập được anchor.
- **Rủi ro còn treo:** nếu sau này lại có yêu cầu "preview phải giống PDF từng trang", quyết
  định này phải mở lại — và lần đó nên bắt đầu từ phía server (render thật) chứ không phải
  xấp xỉ ở client.

**Phương án khác đã cân nhắc:**

- **Giữ Plan 2 và mở rộng anchor set** — chính là đường đang đi khi revert; mỗi theme mới lại
  là một lần đo thủ công.
- **Chỉ tắt Plan 2 sau cờ** thay vì xoá — không chọn: code chết mang theo test và golden phải
  bảo trì (golden 111 file phải strip `physicalPageCount`/`paper`/`containers` ngay trong
  commit revert).

## Liên quan
- [[shipped-pdf-2026-08-06]] — hash và bối cảnh đợt commit này.
- [[digest-pdf-2026-07-30]] · [[digest-pdf-2026-07-29]] — lớp vấn đề page-break mà preview
  giờ không giúp được nữa.
- [[pdf]]
