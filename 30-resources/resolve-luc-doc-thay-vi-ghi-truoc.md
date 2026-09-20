---
type: resource
title: Resolve lúc đọc, không ghi trước — và cái giá thật của nó
summary: Khi một giá trị thuộc về chỗ khác (bundle, location, plan, hạn mức), chép nó vào từng bản ghi bằng backfill/job ghi ngược là tạo bản sao phải giữ đồng bộ — nên mặc định là resolve lúc đọc; đổi lại phải quét HẾT đường đọc (không gate nào bắt sót), chịu chi phí trên hot path, và biết đúng ba ca phải ghi cứng.
tags: [patterns, architecture, backend, firestore, shopify, avada, method]
created: 2026-09-20
updated: 2026-09-20
source: [[2026-09-15-bundle-sync-resolve-muon]] · [[2026-09-18-timezone-resolve-luc-doc]] · [[2026-09-15-pdf-temporary-plan-tang-gate]] · [[digest-subscriptions-2026-09-17]] · [[digest-subscriptions-bird-2026-09-14]] · [[2026-09-05-usagecount-live-tu-shopify]]
---

# Resolve lúc đọc, không ghi trước

> **Vì sao có note này** (gốc: `brain-weekly` 2026-09-20): trong 14 ngày, **bốn** quyết định độc
> lập ở **hai project khác nhau** (`subscriptions`, `pdf`) đều chọn cùng một nước đi mà chưa ai đặt
> tên. Đây là bản khái quát; chi tiết từng ca ở các note nguồn.
>
> Area gọi luật này ở mục *Nguyên tắc/gotcha xuyên suốt*: [[shopify-app-dev]].

## Bài toán

Một giá trị cần hiện ra ở nhiều chỗ: thành phần của fixed bundle, múi giờ của delivery location,
quyền dùng tính năng của một plan tạm, số lượt đã dùng của một mã giảm giá. Có hai chỗ để đặt nó:

| | **Ghi trước** (materialize) | **Resolve lúc đọc** (derive) |
|---|---|---|
| Cơ chế | job/backfill chép giá trị xuống từng bản ghi | mỗi đường đọc tự tra lại từ nguồn |
| Nguồn sự thật | hai (nguồn + bản sao) | một |
| Bản ghi mới | phải chờ job chạy | có ngay |
| Chi phí | 1 lần, đắt, chạy nền | nhiều lần, rẻ, trên đường người dùng |

## Luật

**Nếu giá trị thuộc về một thực thể khác thì đừng chép nó — tra lại lúc đọc.** Múi giờ là thuộc
tính của *delivery location*, không phải của *contract*. Thành phần bundle thuộc về *bundle*, không
thuộc về *contract*. Chép xuống là nhân bản một sự thật thuộc chỗ khác, và mọi bản sao đều có đúng
một cách hỏng: **lệch bản gốc mà không ai biết** → [[du-lieu-hong-song-sot-vi-ba-lop-nhin-cho-khac]].

## Vì sao "ghi trước" hỏng theo kiểu không sửa được bằng cách chạy lại

Ba lý do dưới đây là **giới hạn cấu trúc**, không phải bug của script — nên chạy lại backfill lần
thứ hai không đổi được gì:

1. **Nguồn không ngừng sinh bản ghi thiếu.** Bird không bao giờ đóng dấu `Customer TimeZone` cho
   contract Pick Up (đo được: Delivery 14/15 có, Pick Up **0/4**). Backfill là cuộc đuổi không bao
   giờ bắt kịp — mọi bản ghi tạo *sau* lượt chạy gần nhất đều trắng.
2. **Có bản ghi không ghi được.** Shopify từ chối update contract đang giữ billing cycle edit. Nó
   nằm ngoài tầm với của backfill hôm nay *và* mọi lần chạy về sau.
3. **Đường đọc có thể đè lên chỗ mình vừa ghi.** Ca đắt nhất của tuần: backfill ghi vào Firestore,
   đọc lại Firestore xác nhận đã ghi — mà tính năng **vẫn trắng**, vì endpoint đọc contract với
   `fullResp: true` rồi `{...doc, ...fromShopify}` ⇒ bản Shopify thắng ở **mỗi lượt đọc**. Ghi đúng
   field, **sai tầng** ([[digest-subscriptions-2026-09-17]]).

Hệ quả cho khâu verify: đọc lại bằng chính đường mình vừa ghi không chứng minh gì — phải đọc bằng
**đúng đường mà tính năng dùng** → [[ack-khong-phai-hieu-ung]].

## Trước khi ghi, hỏi đúng hai câu

- **"Ai đọc field này?"** — phạm vi backfill suy từ đường *đọc*, không từ chỗ dữ liệu đang sai.
  Hai lần trong tuần, câu này huỷ luôn cả việc: `sellingPlanName` của dòng con bundle sai thật,
  nhưng **không portal nào đọc nó** nên không backfill. Cùng lập luận đã chốt ở
  [[2026-09-14-backfill-bird-chi-don-chua-charge]].
- **"Ghi vào tầng này có tới được nơi tiêu thụ không?"** — "sửa Firestore có tới được Bird không,
  hay phải ghi lên Shopify?" là câu quyết định toàn bộ script, và nó trả lời được bằng một phép đo
  chứ không bằng đọc code ([[digest-subscriptions-bird-2026-09-14]]).

## Cái giá — trả thật, đừng ghi là 0

- **Phải quét HẾT đường đọc, và không gate nào bắt sót.** Bỏ job ghi ngược của bundle xong còn
  **4 commit nữa** mới hết chỗ đọc sót — mỗi commit là một màn hình khách đã nhìn thấy số cũ.
- **Phụ thuộc ẩn vào chính cái job vừa bỏ.** `willSyncEditedCycle` trước đây thành `true` *nhờ* job
  ghi `edited: true` xuống đơn; bỏ job là đường charge lặng lẽ bỏ qua bản sửa chu kỳ. Trước khi xoá
  một job ghi, grep xem có ai đang đọc **tác dụng phụ** của nó không.
- **Lỗi dời sang hot path.** Ghi trước hỏng lúc chạy script; resolve lúc đọc hỏng **lúc khách đang
  xem** — và trong surface không có error boundary thì đó là trắng cả màn hình
  ([[khong-error-boundary-hong-ca-man-hinh]]). Validate ngay tại chỗ đọc.
- **Cache là độ trễ có thật.** Cache 1 giờ nghĩa là lệch tới 1 giờ sau khi merchant sửa nguồn — hầu
  như vô hại với mốc neo theo ngày, nhưng không phải 0 ([[caching-layers]]).
- **Chi phí đường đọc thường chưa có số đo.** Chiều ngược lại thì đo được: shop 100 contract, mỗi
  lần merchant bấm Save = ~300 call Shopify + ~1000 Firestore write, so với **0**.

## Khi nào KHÔNG resolve muộn

Ba ca dưới đây phải ghi cứng, và nhầm là sửa lại lịch sử của khách:

- **Thứ đã thu tiền.** Đơn đã charge phải giữ giá/discount tại thời điểm mua. Cách chắc là chặn
  **trong resolver** (`status === UNBILLED` lọc ngay đầu hàm), không trông vào từng caller nhớ lọc.
- **Thứ dùng làm bằng chứng đối chiếu về sau** (audit, snapshot trước khi migrate).
- **Thứ nguồn không còn trả lời được** — bundle đã xoá, location đã gỡ: resolver phải trả nguyên xi
  giá trị cũ, không được trả rỗng.

Và một luật đi kèm khi buộc phải ghi: **mutation kiểu thay-cả-khối xoá field không gửi** —
`productSet.variants`, `SubscriptionDraftInput.customAttributes` đều vậy → đọc hiện trạng rồi nối
thêm, đừng ghi thẳng ([[mutation-ghi-nguyen-khoi-xoa-field-khong-gui]]).

## Và "không đoán" là một phần của luật

Khi nguồn trả về nhiều giá trị mâu thuẫn, để **trống** chứ không lấy giá trị phổ biến nhất. Đã đo
được ca thật: shop khai `America/New_York` trong khi Bird ghi `Asia/Saigon` cho **cùng một
location**. Một fallback sai còn tệ hơn không có fallback, vì nó không bao giờ hiện ra như một lỗ
trống — cùng họ với [[truong-last-verified]].

## Bốn ca nguồn

| Ca | Bỏ cái gì | Về cái gì |
|---|---|---|
| [[2026-09-15-bundle-sync-resolve-muon]] | job `REBUILD_UPCOMING_ORDERS_AFTER_BUNDLE_SYNC` | resolver thuần đọc, cắm vào 8 đường đọc |
| [[2026-09-18-timezone-resolve-luc-doc]] | `backfillCustomerTimeZone.js` | đọc từ location của shop, cache 1 giờ |
| [[2026-09-15-pdf-temporary-plan-tang-gate]] (project `pdf`) | `onSchedule` reset plan | `getEffectivePlan()` so ngày lúc đọc |
| [[2026-09-05-usagecount-live-tu-shopify]] | snapshot `usageCount` trong order doc | đọc live từ Shopify lúc tính giá |

Liên quan: [[subscriptions]] · [[pdf]] · [[shopify-app-dev]] ·
[[du-lieu-hong-song-sot-vi-ba-lop-nhin-cho-khac]] · [[ack-khong-phai-hieu-ung]] ·
[[mutation-ghi-nguyen-khoi-xoa-field-khong-gui]] · [[caching-layers]] ·
[[lich-dinh-ky-neo-theo-ngay-du-kien]] · [[khong-error-boundary-hong-ca-man-hinh]]

## ⚠️ Chưa xác minh

- Chi phí nhánh đọc chưa có số đo ở cả bốn ca — cả bốn quyết định đều ghi đây là việc phải đo ở mốc
  review (12/2026). Đừng trích note này như bằng chứng "resolve muộn rẻ hơn".
