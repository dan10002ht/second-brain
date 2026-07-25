---
type: note
title: Joy Subscription artifacts repo — cơ chế & dọn dẹp
summary: React artifacts tách hosting khỏi deploy để giữ chunk cũ (chống blank/404), cách dọn repo phồng an toàn bằng comm -23 + xargs.
tags: [artifacts, cdn, firebase, shopify, tooling, debug]
created: 2026-07-24
source: project "artifact" (joy-subscription-artifacts) session history
---

# Joy Subscription artifacts repo — cơ chế & dọn dẹp

Digest đầu tiên cho [[joy-subscription-artifacts]]. Ghi lại vì sao repo này tồn tại và
cách dọn khi nó phồng (thao tác destructive trên repo dùng chung với CI).

## Decisions / cơ chế (why)
- **Vì sao cần "React artifacts":** mỗi trang lazy-load bằng `React.lazy` → tên chunk có
  content-hash, **đổi mỗi lần build**. Nếu deploy đè thẳng lên Firebase Hosting, chunk cũ bị
  xoá → khách đang mở app giữa chừng gặp **trang trắng / 404** cho tới khi reload. Giải pháp:
  build xong **không** deploy hosting ngay; chỉ `deploy --only functions,firestore,storage`,
  rồi **push file React đã build sang một git repo dùng chung** (artifacts) và deploy hosting
  từ đó ở bước sau → **giữ song song bản cũ + bản mới**, không ai bị 404 giữa session.
- **KHÔNG BAO GIỜ bỏ dòng** `firebase deploy --only firestore,functions,storage ... --force`
  trong pipeline — cố ý tách hosting ra khỏi bước này. (comment trong repo cũng cảnh báo.)

## Techniques (dọn repo)
- **Tính file cũ để xoá (giữ 2 tuần gần nhất):**
  - `git log --name-only --pretty="format:" --since="2 weeks ago" -- static/assets static/scripttag | sort | uniq > changed_files.txt`
  - `git ls-tree -r HEAD --name-only static/assets static/scripttag | sort > all_files.txt`
  - `comm -23 all_files.txt changed_files.txt > files_to_remove.txt` (tracked nhưng không đổi 2 tuần).
- **Xoá nhanh:** `xargs ... rm -f` **nhanh hơn nhiều** vòng `while read` bash (92k file → bash timeout).
  `rm -f` bỏ qua file thiếu nên bulk-remove an toàn; chạy nền để tránh timeout.
- **Safety trước khi xoá:** verify overlap giữa "giữ" và "xoá" = 0; đếm file còn lại phải khớp
  số file đã đổi trong cửa sổ.

## Gotchas
- **`.git` không nhỏ lại** sau khi dọn (2.4G) vì history vẫn giữ blob cũ — commit dọn chỉ
  **chặn phình thêm**, không co lịch sử. Working tree `static/` giảm mạnh (3.3G → 435M).
- Các file `.txt` helper (all_files/changed_files/files_to_remove) **thực ra được track/commit**
  trong repo này — đừng nhầm là rác local; và bản `.txt` cũ **stale** dễ làm sai (list cũ 33k dòng
  trong khi repo đang track 105k file) → luôn regenerate list mới.
- Repo nặng đĩa → xoá clone local khi không cần (liên quan dọn đĩa: [[digest-claude-chat-2026-07-17]]).

## Cách làm việc (feedback)
- Thao tác **destructive trên repo dùng chung CI**: điều tra trạng thái tươi trước, safety-check,
  commit **local** và **để con người tự push** lên `origin/main` (đúng kỷ luật branch).

Liên quan: [[joy-subscription-artifacts]] · [[subscriptions]] · [[caching-layers]] (cache-busting/CDN) ·
[[subscriptions-debug-runbook]] (khi deploy hosting lỗi) · [[digest-subscriptions-2026-07-24]] (cùng ngày, phía app).
