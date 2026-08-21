---
type: note
title: Digest subscriptions 2026-08-21 — dựng store dev cho landing joyxjoy: seed, theme, và những chỗ đường ống tự nói dối
summary: CHỈ phần mới của việc đưa landing joyxjoy chạy thật trên store dev — `ETIMEDOUT` của Shopify Admin API là chập chờn theo từng call chứ không theo store; `sellingPlanGroupCreate` báo thành công mà 9/14 group không tồn tại; token app không ghi được theme (Shopify CLI thì được); Shopify cache trang theo theme nên phải `?preview_theme_id=`; và gỡ worktree xoá luôn 13MB ảnh mockup mà `git status` không hề nhắc.
tags: [avada, subscription, shopify, storefront, debug, tooling]
created: 2026-08-21
updated: 2026-08-21
source: project "subscriptions" — session history 2026-08-19→21 (session e02dbd91 + 5f9e876d), nhánh `feat/joyxjoy-landing`, `feat/portal-preview`
---

# Digest — Joy Subscription (2026-08-21)

**CHỈ phần mới.** Root cause trang trắng đã ghi ở [[digest-subscriptions-joyxjoy-2026-08-20]];
commit landed ở [[shipped-subscriptions-2026-08-21]]; hướng seed qua HTTP thật ở
[[2026-08-20-seed-dev-qua-luong-http-that]]. Ở đây là phần *vận hành* — đưa trang chạy được
trên `dantt-subscription-box.myshopify.com` bằng dữ liệu clone từ store khách.

## Bugs

**`ETIMEDOUT` không phải do store, mà chập chờn theo từng call.** Script clone chết đúng ở
lần **ghi đầu tiên** (`cloneProduct`, 0 sản phẩm được tạo), hai lần liên tiếp — nên tôi kết
luận "đường tới store dev bị chặn". Sai:

- `curl` tới đúng host đó thông (401, connect 0.05s), nhưng cùng tiến trình gọi query tối
  giản `{ shop { name } }` cũng `ETIMEDOUT`.
- Hai domain resolve về **cùng một IP** (`23.227.38.74`) ⇒ không thể là vấn đề mạng tới host.
- Chạy đối chứng: lượt sau store *nguồn* thông cả 4 lần.

⇒ Lỗi ở tầng call, không ở tầng store. Lời giải là **retry**, không phải đổi đường đi. Sau
khi thêm retry: 105 tạo + 8 cập nhật, 7 collection, 91 lượt gán, **0 lỗi, 0 retry**.

**`sellingPlanGroupCreate` báo thành công mà group không tồn tại.** Log ghi tạo cho 12 box,
script **có** kiểm `userErrors` và throw, exit 0, không lỗi nào. Hỏi thẳng Admin API (nguồn
chuẩn): **9/14 box không có plan**, và đếm toàn shop ra 203 group mà chỉ **5** gắn vào box của
ta. Mutation được gọi, được báo OK, nhưng không sinh ra group. ⚠️ **chưa giải thích được** —
để nguyên đây làm mốc cho lần sau.

**Seed ghi tắt Firestore không tương đương merchant bấm Save.** Task 1 FAIL đúng chỗ này: gate
xanh, dry-run an toàn, idempotent — nhưng script tạo product Shopify thuần, **không đi qua**
`fixedBundleService`/`productBundleRepository`, nên thiếu `bundleType`, metafield
`avada_fixed_bundle`, và metafield tổng `avada_custom_landing` (thứ Liquid thật sự đọc). Sau
khi đổi sang đi qua route HTTP thật: `avada_custom_landing` **tự sinh 14 bundle**, đúng vì
`rebuildCustomLandingMetafield` là hook phụ trên đường đó.

**`productBundleRepository.js:2` tự tạo `new Firestore()` riêng** từ
`@google-cloud/firestore` — client này **không** dùng credential mà script đã nạp, nên script
chết vì thiếu project id dù đã có service account.

**`category` là enum bắt buộc.** `sellingPlanGroupCreate` ở version Shopify đang dùng bắt phải
có `category`; nguồn chuẩn không phải là đoán mà là chính code app:
`helpers/utils/getSellingPlanVariables.js:302` gửi `category: 'SUBSCRIPTION'`.

**Cả hai section staples và one-off nhận CÙNG mảng `categories`** (`LandingApp.js:183-184`)
nên hiện y hệt nhau — 97 sản phẩm từ 7 collection. Và tab **"All" = gộp 7 category đã cấu
hình**, không phải toàn bộ store (đang chờ BA chốt, task 25 `[⏸️]`).

## Techniques

**Token app không ghi được theme; Shopify CLI thì được.** Tôi khẳng định "cài section vào
theme tự động hoá được bằng token của app" rồi phải rút lại ngay trong phiên. `shopify theme
push` có toàn quyền, và nó lộ ra thứ app API giấu mất: store dev có một theme **`[live]`**.
Hai chi tiết đi kèm:

- Dòng `"Cleaning your remote theme"` chỉ là mỹ từ — kiểm lại 417 file còn nguyên, 2 file mới
  đã vào.
- Push vào theme **live** kèm `--force` bị harness chặn, và chặn đúng. Bỏ `--force` thì push
  được.

**Shopify cache trang theo theme — dấu hiệu là kích thước trang y hệt từng byte.** Fetch trang
sau mỗi lần push đều ra `1189534` byte. Đó không phải "fix không ăn", đó là "thứ tôi fetch
không phản ánh thay đổi". Thêm `?preview_theme_id=<id>` là ra ngay.

**Giới hạn 25 ký tự** áp cho cả **tên section lẫn id của setting** trong schema theme — cùng
loại lỗi vấp hai lần trong một phiên.

**Playwright lệch phiên bản chromium** (gói e2e cần build 1208, cache có 1228): dùng Chrome hệ
thống qua `channel` thay vì tải thêm browser.

**Storefront password chặn `curl`** — trang trả 200, 11KB, title là tên store: đó là trang
mật khẩu, không phải trang của mình.

## Context — worktree

**Gỡ worktree xoá luôn thứ `git status` không nhắc.** Khi gộp `feat/joyxjoy-landing` từ
worktree về repo chính, `git status` trong worktree chỉ báo **một** mục chưa commit
(`docs/joyxjoy-theme/`). Nhưng thư mục mockup có **165 file ảnh, 13MB** cố ý *không* commit và
được che bởi exclude — chúng vô hình với `git status` và sẽ biến mất cùng thư mục worktree.
Phải backup ra ngoài trước (`168 file = 3 theme + 165 ảnh`), rồi khôi phục sau khi gỡ.

Kèm hai chi tiết:

- `git rev-parse` trỏ exclude về `.git/info/exclude` của **repo chính** — file này **dùng
  chung cho mọi worktree**, không phải mỗi worktree một bản.
- Worktree mới dựng từ `master` **không có** file gitignored (4 file env, `node_modules`) và
  cũng không có file **untracked** ở repo chính (spec, mockup) — phải kéo tay, và phải ghi vào
  BRIEF trước khi giao agent để nó không đốt một vòng tự khám phá.
- Không được gỡ worktree khi còn agent đang ghi file trong đó.

## Context — chấm agent

- **Đừng kết luận agent "báo cáo việc nó không làm" bằng mtime.** Tôi grep thấy `ONEOFF` xuất
  hiện 0 lần và file sửa lần cuối *trước* lúc tôi gửi yêu cầu ⇒ kết luận agent bịa. Thực tế nó
  vẫn đang chạy dở. Phải đính chính. Ngưỡng đúng là *agent đã kết thúc lượt chưa*, không phải
  mtime.
- **Bảng audit của agent nói "khớp" vẫn phải chấm.** Agent audit filterbar báo khớp mockup;
  đối chiếu tay ra thiếu ba thứ. Cùng phiên, một grep của chính tôi trượt vì chuỗi là text JSX
  chứ không nằm trong nháy — phải đính chính lần nữa.
- Verifier trong lô này chấm bằng **mutation test** chứ không đọc code rồi gật: gỡ
  `delivery_policy` → 3 test đỏ; hoist state ra module-level *và* thêm event bus để hai
  instance thật sự dùng chung state; thay `act()` bằng `setTimeout(0)` chạy 3 lần → đỏ 2/3.
  Đây là dạng bằng chứng đáng tin, đúng tinh thần [[2026-08-04-looptasks-verifier-doc-lap]].
- **Song song thì chia theo vùng file, không theo số task.** Cả lô 19 task xếp lịch quanh đúng
  một câu hỏi: task này có đụng `LandingApp.js` / `ProductPickerSection.js` không. Nhiều
  iteration cố ý **không nhận task mới** vì lý do đó — và đó là quyết định, không phải loop
  chạy rỗng.

## ⚠️ Chưa xác minh

- 9/14 `sellingPlanGroupCreate` không tạo ra group dù mutation báo OK — chưa có lời giải.
- `assertIsQuery()` trong script clone chỉ là regex `^\s*mutation\b` (case-sensitive), lách
  được bằng comment dẫn đầu hoặc document nhiều operation. Đây là rào chắn *duy nhất* giữa
  script và store production của khách (xem [[chan-agent-bang-cau-hinh]]).

## Liên quan

[[subscriptions]] · [[digest-subscriptions-joyxjoy-2026-08-20]] ·
[[shipped-subscriptions-2026-08-21]] · [[2026-08-20-seed-dev-qua-luong-http-that]] ·
[[2026-08-19-page-custom-o-theme-khach]] · [[digest-subscriptions-2026-08-19]] ·
[[brief-state-agent-loop]] · [[chan-agent-bang-cau-hinh]] · [[bang-chung-phan-biet-duoc]]
