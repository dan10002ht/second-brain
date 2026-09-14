---
type: note
title: Digest Joy Subscription — 2026-09-14 (Bird/Easy Routes ở sprayfreefarmacy: 6 lỗi, một gốc chung là shop bật cả hai app giao hàng)
summary: Đơn subscription không route đúng bên Bird vì converter Zapiet→Bird chọn nhầm id và vì code lấy `data.data[0]` làm location mặc định; Bird có API công khai tra id↔tên zone nên mọi kết luận đều đối chứng được bằng ba nguồn độc lập; và `git tag --contains` báo "chưa deploy" chỉ vì `git fetch origin master` không kéo tag về.
tags: [avada, subscription, shopify, shipping, debug, nodejs]
created: 2026-09-14
updated: 2026-09-14
source: project `subscriptions` (worktree `fix/bird-delivery-attrs`) — session history 2026-09-13/14 (session acbbae46 ticket enterprise sprayfreefarmacy; session 4b3f8c93 SB-16764)
---

# Digest — Bird delivery attributes, 2026-09-14

Khách enterprise `sprayfreefarmacy.myshopify.com` báo đơn subscription về sai chỗ bên Bird/Easy
Routes (nằm ở mục *unrouted*, hiện `Zone 4`/`Zone 11` thay vì `Rocklea pickup`). Kết thúc: MR !2581
merge + deploy `v2.35.27`, backfill 128/128 doc trên prod.

## Bugs — 6 lỗi, xếp theo thứ tự khách đau

1. **Converter chọn nhầm id lúc Zapiet → Bird.** Điều kiện gốc: shop bật **cả hai** app giao hàng
   (`zapiet` và `bird` đều `enable: true`) — không ai tắt Zapiet sau khi chuyển sang Bird. Đây là
   điều kiện làm mọi lỗi còn lại có đất sống.
2. **`data.data[0]` làm location mặc định.** Khi không tra được location theo yêu cầu, code lấy
   **phần tử đầu danh sách** Bird trả về — nên đơn pickup mang id của một delivery zone. Ca Tara
   Hamilton trong ảnh merchant chính là cái này (sai **namespace**: pickup mang id delivery zone).
3. **Ngày giao đóng băng** trên các đơn chưa charge: đơn giữ ngày cũ của contract. Đây là lỗi **mass**
   trong store, khác nhóm với lỗi mất id (nhóm cụ thể).
4. **Ngày của cycle đuôi** tính sai (test đỏ đúng giá trị đang kẹt trên prod: `Received: "Jun 3, 2026"`).
5. **`birdService` không guard method** và không truyền `preferredLocationId` xuống.
6. **Charge 3 lần trong 6 ngày** — dựng được timeline đầy đủ bằng cách **giải mã `idempotencyKey`**
   (format `appCycle_auto_shopifyCycle_retry_`), không cần log.

**Một lỗi do chính tôi tạo ra trong MR:** fix #6 ban đầu có fallback "match location theo postcode".
Audit lại thì nó **gán nhầm được** — hai location khác nhau chung postcode. Đã bỏ, và sửa test cho
khớp hành vi mới (bỏ 2 case dựa trên zip, thêm case chống gán nhầm).

**Một giả thuyết của tôi bị dữ liệu bác bỏ:** tôi nghi contract **tạo mới** cũng dính. Đếm thật:
11 contract tạo từ checkout có attribute Bird, **10 có cờ `birdIntegrated`** — nên luồng tạo mới
phần lớn lành.

## Techniques

**Bird có API công khai để tra id ↔ tên zone** — chính endpoint app đang gọi, chạy lại được bất cứ
lúc nào, chỉ đọc:

```bash
curl -s -X POST 'https://picdel.birdchime.com/api/v3/delivery/locations' \
  -H 'Content-Type: application/json' -d '{...}'
# và /api/v3/pickup/locations cho điểm pickup
```

**Ba nguồn độc lập cho mỗi id**, dùng để trả lời câu "id này ở đâu ra": (1) danh mục Bird qua API
trên, (2) lịch sử đơn của chính khách đó, (3) attribute trên contract. Khách tự kiểm được cả ba —
đó là lý do nên đưa nguồn thay vì đưa kết luận.

**Ảnh merchant gửi là một nguồn bằng chứng tôi chưa từng nhìn tới.** Nó **lật ngược hai kết luận**
của tôi (Elle Bain thực ra đang route bình thường). Trước khi báo "contract này sai", phải đối chiếu
với thứ merchant đang nhìn thấy.

**`merge` chưa chắc là `deploy`, và phép kiểm deploy cũng hỏng được.** `git tag --contains` trả rỗng
→ tôi kết luận "chưa deploy" — **sai**, vì `git fetch origin master` **không kéo tag về**. Sau khi
fetch tag: `v2.35.27` trỏ đúng merge commit, pipeline xanh. Bước cuối vẫn không phải "job xanh" mà
là chạy `resolve-functions.js` với đúng danh sách file đã đổi để biết deploy **có sót function
nào không** (kết quả: `functions` = deploy toàn bộ). → [[ack-khong-phai-hieu-ung]].

**Phạm vi backfill phải kiểm trước khi chọn đường ghi:** "sửa Firestore có tới được Bird không, hay
phải ghi lên Shopify?" — câu này quyết định toàn bộ script, và nó trả lời được bằng một phép đo, không
bằng suy luận từ code.

**Script backfill đọc sai tham số** (`--apply` bị hiểu thành tên shop) nhưng **fail an toàn**: không
tìm thấy shop → thoát, chưa ghi gì. Kiểu hỏng nên nhắm tới khi viết script ghi vào prod.

## Bugs — SB-16764 (session 4b3f8c93, bundle line price)

- `ProductItem.js` lấy giá dòng từ nguồn sai ⇒ **dòng và tổng trong cùng một widget chênh nhau**.
- Sticky bar (mobile) gate sai điều kiện.
- `originalTotal` thiếu `× prepaidMultiply`.

**Mutation-check bằng cách revert đúng 2 dòng fix** → 3 test fail đúng chỗ; rồi restore. Không có
bước này thì "test xanh" không chứng minh gì. Verify cuối chạy **trên prod thật**
(`dentalaccess.com.br`) bằng `agent-browser`: untick selling plan thứ 3 → badge giảm giá biến mất,
`Total R$27.98 = 14.80 + 13.18`. Bẫy gặp phải: **hai bản widget trong DOM** (bấm nhầm bản ẩn),
dropdown là custom chứ không phải `<select>`, và hook chặn mọi lệnh chứa `eval` nên phải dùng
snapshot.

## Context

- Còn treo, đã bàn giao cho dantt/PO: 2 contract vẫn sai mã (Elle Bain `262150` Bird không đọc
  được suốt 21 cycle — **chưa bao giờ** route đúng, không phải mới hỏng; James Macris `109747` lịch
  sử nói Zone 1 còn tên nói Zone 8); 2 contract không có thông tin giao hàng nào (Tahnee Marsh —
  *chưa xác minh* có phải khách Bird không; Zahn Brazil còn mang attribute Zapiet); và đề nghị hỏi
  merchant tắt Zapiet.
- **25 đơn quá khứ cố ý KHÔNG sửa** — xem [[2026-09-14-backfill-bird-chi-don-chua-charge]].
- `handleBirdAddressUpdate` sau bản fix lấy `preferredLocationId` nên **đổi địa chỉ không còn cập
  nhật zone** — hệ quả từ chính bản fix, đã nêu ra.

Liên quan: [[subscriptions]] · [[ack-khong-phai-hieu-ung]] · [[bang-chung-phan-biet-duoc]] ·
[[2026-09-10-cutoff-theo-delivery-day]] · [[2026-09-14-backfill-bird-chi-don-chua-charge]] ·
[[feedback-bug-la-bug-khong-cho-po-chot]] (framing "cần PO chốt" bê từ report SB-16764) ·
[[feedback-ra-het-duong-verify]] (lượt verify trên prod bằng `agent-browser`) ·
[[tien-khong-duoc-lay-float-lam-chuan]] · [[digest-subscriptions-2026-09-14]]
