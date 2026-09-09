---
type: note
title: Digest Joy Subscription — 2026-09-09 (customer account extension Joy Wholefoods + đính chính auto-triage)
summary: Dựng extension customer account riêng cho Joy Wholefoods qua 11 task codex/verifier — phần lâu nhất không phải code mà là dựng được vòng lặp check→sửa→check; ba lỗi khác nhau đều làm SẬP CẢ extension (race header 401, Rules of Hooks, `Intl` ném lỗi trên chuỗi ngày), thao tác "Clean dev preview" xoá luôn page + menu item, và một tầng phân quyền 18 hàm của portal cũ bị extension mới bỏ qua hoàn toàn.
tags: [avada, subscription, shopify, extensions, agent, debug]
created: 2026-09-09
updated: 2026-09-09
source: project `subscriptions` — session history (session 44297bec dựng CAU Joy Wholefoods, session f2e74a78 check ticket Slack)
---

CHỈ phần mới. Phần landing joyxjoy của phiên dài `e02dbd91` đã ghi ở
[[digest-subscriptions-2026-09-08]] và [[digest-subscriptions-joyxjoy-2026-08-20]] — không lặp lại.
Việc mới ở đây là **customer account extension** (`customer-account-ui-wholefoods`), nhánh
`feat/wholefoods-portal`, 10 task theo plan + 1 task phát sinh, codex implement / Claude verify.

## Bugs

**Ba lỗi khác nhau, cùng một hậu quả: sập TOÀN BỘ extension, trang chỉ nói "problem loading".**
Không có error boundary nên bất kỳ ném lỗi nào ở nhánh render cũng làm trắng cả trang:

1. `Intl.DateTimeFormat` ném `RangeError: Invalid time value` khi nhận `Date` không hợp lệ. Helper
   cut-off khai hợp đồng nhận `Date`, chỗ gọi truyền **chuỗi** (`order.billingAttemptExpectedDate`)
   → `NaN` → ném. Lỗi kiểu này không lộ ở test vì fixture toàn `Date` thật.
2. **Vi phạm Rules of Hooks** — `General.js` có `return null` sớm ở dòng 37 rồi mới gọi
   `useCreateApi`/`useDeleteApi` ở dòng 54+. Số hook đổi giữa các lần render → React sập.
3. Một `useEffect(..., [])` bắn lúc mount, trước khi `customerAccountData` kịp có.

**401 vì header `X-Shopify-Shop-Id` undefined — và nguyên nhân là `loading` khởi tạo sai.**
Provider *đã* chặn children bằng `pageLoading`, nhưng `useFetchGraphql` khởi tạo `loading = false`
dù nó luôn fetch lúc mount ⇒ guard `!loading` đúng ngay lần render **đầu tiên**, request bay đi khi
`shopId` còn `undefined`, và **không có retry**. Trên đường truy tôi chẩn đoán sai **hai lần**
("metafield null", rồi "query không trả gì") — cả hai đều do đọc log của chính đoạn debug bắn trước
khi dữ liệu về. Bài học: khi log dùng để chẩn đoán chạy trong cùng vòng đời với thứ đang nghi, log
đó không phải bằng chứng độc lập. → [[bang-chung-phan-biet-duoc]].

**Điều hướng: extension cũ KHÔNG đi bằng URL.** Nó giữ view trong state và truyền `setCurrentId` qua
`GlobalContext`. Task mới dùng link `to=` nên URL đổi (`/subscriptions/<id>`) mà nội dung vẫn là danh
sách; nút back sau đó dính đúng lỗi ở chiều ngược lại. Trước khi thêm điều hướng phải đọc xem
extension đang có **cơ chế điều hướng nào**, không mặc định là router.

**`PUT /clientApi/order/product/add` trả shape thành công nhưng món không vào đâu cả.** Bằng chứng
phân biệt được: sau khi bấm `+ Add` chỉ có **đúng một** request và không có lời gọi nào khác; đơn tới
vẫn 2 item, subtotal không đổi qua mọi chu kỳ. Lỗi thật (`Subscription contract is invalid`, từ
Shopify lúc tạo billing-cycle draft) bị nuốt vì **mọi handler đều
`if (response.success) await reload(); return response.success;`** — giá trị trả về không đi đâu, nên
khách bấm vào khoảng không. Fix là đẩy lỗi có nguồn lên UI, không tự chế thông báo.
→ [[ack-khong-phai-hieu-ung]].

**Extension mới bỏ qua hoàn toàn tầng phân quyền của portal.** Repo có
`checkPermissionCustomerPortal.js` với **18 hàm gate** (`checkShowSwapProduct`, …) đọc từ
`shop.customerPortal` — dữ liệu mà `GlobalContext` của extension mới **đã load sẵn**. Viết lại UI mà
không nối vào tầng này nghĩa là mọi thiết lập merchant tắt/bật đều vô hiệu. Đây là lớp bug "tính năng
chạy đúng nhưng sai hoàn toàn về quyền" — chỉ tìm ra khi user hỏi *"logic swap bên custom hơi khác so
với logic gốc, bạn biết điều đó ko?"*.

**Verifier bắt worker tự chế nhãn.** Card danh sách ghi `Subscription ID: 26066485366` trong khi
mockup chỉ có id trần `#4000001001`. Loại lỗi này gate không thấy được vì nó không sai về kỹ thuật —
chỉ sai so với thứ đang được coi là hợp đồng (mockup).

**Chẩn đoán của auto-triage sai, và phân biệt được bằng HTML thô.** Ticket Slack (SB-16633, portal
trắng trên `mayas-stores.co.uk`): auto-triage đổ cho metafield và khuyên chạy
`exposeMetafieldsHeadless`. Hai giả thuyết (metafield null vs selector sai) cho triệu chứng **giống
hệt nhau** — nhưng nếu metafield null thì cả block app-embed sẽ vắng mặt trong HTML. Fetch HTML thật:
script app embed **có mặt đầy đủ** ⇒ gate metafield đã pass ⇒ lỗi nằm ở `customPageSelector`, field
tên **"Page customer portal selector"** trong app. Đừng chạy lệnh mà chẩn đoán tự động đề xuất trước
khi chứng minh chẩn đoán đó đúng.

## Techniques

- **Lái browser đã đăng nhập mà không đụng profile Chrome của user.** Harness (đúng) chặn đọc/copy
  thư mục profile Chrome vì đó là kho credential. Đường sạch: Playwright dựng **profile riêng trong
  scratchpad**, user login **đúng một lần** trong cửa sổ đó, session (73MB, cả admin lẫn customer
  account) lưu lại và tái dùng cho mọi lượt check sau. Nhờ đó đóng được vòng lặp
  check → sửa → check trên store thật.
- **`admin.shopify.com` chặn headless bằng Cloudflare** ("Your connection needs to be verified") —
  phải chạy headed cho phần admin. Nút trong admin dùng web component/shadow DOM nên `role` selector
  trượt, phải click theo toạ độ; và nhiều thao tác nằm trong iframe.
- **Mutation test vẫn là thứ chứng minh test không rỗng**: đổi Saturday sang thứ 4 làm 2 test đỏ,
  trong khi trước khi vá thì 7/7 vẫn xanh — lỗ hổng đó do **plan của tôi** viết ra, không phải worker.
- `rtk 0.42.4` **hỏng hẳn với jest**: `rtk proxy npx jest` exit 194 trong khi
  `node_modules/.bin/jest` chạy sạch 291 suite / 3156 test. Gate đỏ mà jest xanh ⇒ nghi công cụ đo
  trước khi nghi code. Nối tiếp phần `rtk` che output ở [[digest-subscriptions-2026-09-08]].
- Worktree cũ nằm **bên trong repo** (`.claude/worktrees/feat+tielenergy-custom/`) làm Shopify CLI
  báo `You can only have one "web" configuration file with the backend role` — CLI quét cả cây.

## Context

- Hạ tầng dev cho extension (đủ để dựng lại): xem [[cau-extension-chay-that-tren-store]].
- Quyết định kiến trúc: extension riêng, không đụng portal cũ — [[2026-09-09-portal-wholefoods-extension-rieng]].
- Backend **không cần endpoint mới**: `PUT /order/product/add` (`orderController.addProductToOrder`)
  và `addOneTimeLinesToFirstCycle()` (`manualSubscriptionService.js`) đã làm đúng luồng one-off.
- Jest ở repo này dùng `--testPathPatterns` (số nhiều); `--testPathPattern` bị CLI từ chối — plan viết
  sai làm worker mất một vòng.
- Đã xoá 26 file `commands/misc/*` chưa từng commit (theo yêu cầu của user) — không có git history để
  lấy lại; 13 `extensions/*/manifest.json` là artifact CLI tự sinh, cho vào gitignore.

Liên quan: [[subscriptions]] · [[digest-subscriptions-2026-09-08]] · [[ack-khong-phai-hieu-ung]] ·
[[bang-chung-phan-biet-duoc]] · [[fixture-khong-phai-hop-dong-du-lieu]] ·
[[feedback-claude-dieu-phoi-codex-implement]]
