---
type: decision
title: Box editor bỏ App Bridge v3 fullscreen, chuyển sang max modal + iframe route
summary: Joy Subscription gỡ hẳn @shopify/app-bridge v3 khỏi packages/assets và thay cơ chế fullscreen của box editor bằng max modal App Bridge v4 với iframe trỏ vào route /box-frame/*; đổi lại phải tự dựng bridge 2 chiều giữa 2 frame, Save/Discard sống ở TitleBar do host sở hữu (không disable được), và nút X đóng modal làm mất thay đổi chưa lưu.
tags: [subscription, shopify, avada, react, architecture]
created: 2026-08-06
updated: 2026-08-06
status: active
review: 2026-11-06
---

# Box editor: bỏ App Bridge v3 fullscreen → max modal + route `/box-frame/*`

**Bối cảnh:** bấm X ở box editor không quay về Settings. `useFullscreen.js` nghe
`Fullscreen.Action.EXIT` bằng App Bridge **v3** trong khi app đã chạy **v4** — host không
phát event v3 về instance legacy nên callback không bao giờ chạy (`805d060d2`). Xác minh qua
Shopify dev MCP: v4 **không có Fullscreen API**, max modal là thay thế chính thức.

**Quyết định** (nhánh `fix/appbridge-box-editor-max-modal`, chưa vào master tính đến 08-05):

- Gỡ App Bridge v3 khỏi `helpers.js` — `authenticatedFetch` → global fetch của v4
  (`c7f92188e`), rồi xoá `useFullscreen.js` + `MaxModalContext.js` và gỡ hẳn 2 package
  `@shopify/app-bridge` / `app-bridge-utils` khỏi `packages/assets` (`4b24fbe6c`).
- 4 route `/settings/<kind>-box/*` trỏ vào shim `BoxEditorRoute`: embedded thì mở max modal
  với iframe trỏ `/box-frame/*`, standalone render inline như cũ (`e2c114f28`).
- Tự dựng `boxFrameSrc` + `boxFrameBridge` (postMessage có validate origin tuyệt đối,
  mỗi chiều chỉ nhận nửa từ vựng của mình) và `AppFrameLayout` cho iframe con
  (`5570e04f2`, `7b5f9ef59`, `3e97da2e2`, `03e0284fd`).
- Save/Discard đặt ở `<TitleBar>` của modal, **luôn hiện và luôn bật** (quyết định sản phẩm),
  chỉ gửi command xuống frame con; `BoxFrameCommands` đặt ở layout chứ không ở từng page vì
  cả 3 họ editor (sub box V1, V2, bundle box) đều publish handler vào `SaveTopBarContext`.

**Why:**

- **P0 spike đo được, không phải suy luận** (`c4a7970b3`): trong iframe của modal, v4 global
  fetch `/api/shops` trả **HTTP 200**, còn v3 `fetchAuthenticatedApi` **timeout 10s**. Lý do:
  v3 lấy session token bằng postMessage lên parent mà nó *giả định* là Shopify admin — trong
  modal iframe parent lại là frame app nên token không bao giờ về, API treo, editor đứng ở
  skeleton. Nghĩa là **không thể giữ v3 và làm max modal cùng lúc** — bỏ v3 là điều kiện chặn.
- Cơ chế cũ đã chết sẵn: v4 không phát event v3, nên `useFullscreen` chỉ còn là code không
  bao giờ chạy đúng.
- Đảo kết luận giữa chừng (`b4807ad78`): §8ter chốt "save bar phải là Polaris tự vẽ trong
  frame con" vì thử `ui-save-bar` thấy không render rồi suy ra chrome của host dùng không
  được — **nhưng chưa thử `ui-title-bar`**. Đo lại: `<TitleBar>` làm con của
  `<Modal variant=max src=...>` render **native** vào chrome modal và click về đúng handler
  React ở frame cha. Save bar không thuộc chrome của modal, title bar thì có.

**Tradeoff / đánh đổi:**

- **Mất:**
  - Nút X do host sở hữu và **không chặn được** — đo ở Task 0c (`ae5b2337d`): save bar đang
    hiện, bấm X đóng ngay. Người dùng chốt chấp nhận: X đóng luôn và **mất thay đổi chưa lưu**.
  - Nút trên TitleBar không disable được → phải tự chốt chống double-click bằng ref.
  - Phải tự viết và tự test một lớp bridge 2 chiều (origin check, từ vựng tách chiều,
    `Array.isArray` guard) — thứ trước đây host lo.
  - Sinh ra một họ bug mới của kiến trúc 2 frame: `history.replace` làm React remount modal
    → iframe **reload mất hết thứ merchant đang gõ** (`0bef50483`); ghi đè `history.state`
    bằng null làm lệch `allKeys` của history@4 (`959272a1a`); Save lần 2 lúc Edit còn load
    chunk **tạo box thứ 2** (`f9a931bf6`); Save trên title bar **im lặng không làm gì** vì
    handler publish sau gate snapshot (`14345a593`).
- **Được:** API trong iframe con chạy được (200 thay vì treo), một đường code duy nhất cho
  cả 3 họ editor, và bỏ được nguyên một major dependency đã hết vòng đời cùng hook chết theo nó.

**Phương án khác đã cân nhắc:**

- **Giữ v3 song song với v4** — loại, chính là nguyên nhân treo API trong nested iframe.
- **Save bar Polaris tự vẽ trong frame con** (§8ter) — đã làm ở Task 4 rồi bỏ: `position:fixed`
  ăn theo viewport của iframe nên bar rơi giữa màn hình, đè toolbar editor, chữ trắng trên nền trắng.
- **Dùng `shopify.modal.show/hide`** thay prop `open/onHide` — bỏ, ghi lý do trong plan
  (`99dc892c4`).
- **E2E cho đợt này** (Task 10) — cắt khỏi scope theo quyết định người dùng.

## Liên quan
- [[shipped-subscriptions-2026-08-06]] — các hash trên nằm ở mục "còn trên nhánh".
- [[subscriptions]] · [[app-development]] — extensions/embedded app Shopify.
- [[digest-subscriptions-2026-07-31]] — cùng họ lỗi "file locale colocated không phải nguồn runtime".
