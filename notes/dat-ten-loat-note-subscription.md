---
type: note
title: Gộp hai lối đặt tên của loạt note subscription về `digest-/shipped-<app>-<ngày>`
summary: 11 note tháng 7 còn mang tên ngược (`subscription-digest-*`, `subscription-shipped-*`) trong khi 64 note sau và mọi job đều dùng `digest-subscriptions-*`/`shipped-subscriptions-*` — mỗi lần tra theo tên chỉ thấy một nửa loạt.
tags: [meta, brain, subscription]
created: 2026-09-01
updated: 2026-09-01
status: active
source: [[subscription-digest-2026-07-09]] · [[subscription-shipped-2026-07-13]] · [[digest-subscriptions-2026-07-17]] · [[shipped-subscriptions-2026-07-18]]
---

# Dứt điểm hai lối đặt tên của loạt note subscription

> **Chưa thực hiện tính đến 2026-09-01** — chưa file nào được đổi tên. Đây là kế hoạch đã kiểm
> (không va chạm tên, đã liệt kê đủ chỗ phải sửa theo), không phải một ý tưởng.
> Việc thực hiện đụng ~40 file nên cần người bấm nút — xem [[atomic-notes-principle]] về lý do
> tên file là một phần của giao diện tra cứu.

## Vấn đề

`bin/brain-graph` báo hai loạt đặt tên hai kiểu, cả hai đều là subscription:

| Loạt | Kiểu A (đa số) | Kiểu B (thiểu số, chỉ tháng 7) |
|---|---|---|
| digest | `digest-subscriptions-<ngày>` — **36 file** (+2 biến thể có hậu tố chủ đề: `-joyxjoy-`, `-volume-bundle-`) | `subscription-digest-<ngày>` — **8 file** |
| shipped | `shipped-subscriptions-<ngày>` — **28 file** | `subscription-shipped-<ngày>` — **3 file** |

Hệ quả cụ thể: `ls notes/ | grep '^digest-subscriptions'` bỏ sót toàn bộ tuần đầu tháng 7 — đúng
tuần chứa nền tảng installment và BQ cost attribution. Chính `skills/brain/SKILL.md` đã phải viết
một dòng cảnh báo để người tra không bị hụt, tức là chi phí này đang được trả bằng tay mỗi lần.

## Chọn kiểu A: `<loại>-<app>-<ngày>`

- **Job đang sinh ra note đã dùng kiểu A** — `prompts/digest.md` ghi `digest-<project>-{{TODAY}}`,
  `prompts/gitlog.md` ghi `shipped-<repo>-{{TODAY}}`. Đổi theo kiểu B nghĩa là sửa job và đổi tên
  65 file thay vì 11.
- Kiểu A **sắp xếp theo loại rồi tới app**, nên `ls notes/` gom digest với digest, shipped với shipped
  — hợp với cách brain đang tra (loại trước, app sau).
- Kiểu A dùng tên repo (`subscriptions`, số nhiều) — trùng với tên project note [[subscriptions]] và
  tên thư mục repo, nên không phải nhớ thêm biến thể số ít.

## Danh sách đổi tên chính xác (11 file, `git mv` trong `notes/`)

```
subscription-digest-2026-07-09.md   -> digest-subscriptions-2026-07-09.md
subscription-digest-2026-07-10.md   -> digest-subscriptions-2026-07-10.md
subscription-digest-2026-07-11.md   -> digest-subscriptions-2026-07-11.md
subscription-digest-2026-07-12.md   -> digest-subscriptions-2026-07-12.md
subscription-digest-2026-07-13.md   -> digest-subscriptions-2026-07-13.md
subscription-digest-2026-07-14.md   -> digest-subscriptions-2026-07-14.md
subscription-digest-2026-07-15.md   -> digest-subscriptions-2026-07-15.md
subscription-digest-2026-07-16.md   -> digest-subscriptions-2026-07-16.md
subscription-shipped-2026-07-13.md  -> shipped-subscriptions-2026-07-13.md
subscription-shipped-2026-07-14.md  -> shipped-subscriptions-2026-07-14.md
subscription-shipped-2026-07-16.md  -> shipped-subscriptions-2026-07-16.md
```

Không có va chạm tên: `digest-subscriptions-2026-07-09..16` và `shipped-subscriptions-2026-07-13/14/16`
đều **chưa tồn tại** (loạt kiểu A bắt đầu từ `digest-subscriptions-2026-07-17` và
`shipped-subscriptions-2026-07-18`).

**Không đổi tên** `subscription-installment-horizon-digest.md`. Nó không có ngày trong tên và không
thuộc loạt theo ngày — nó là note chủ đề (được 18 file link tới, gồm cả
[[2026-07-08-installment-mode-design]] và [[subscription-work-style]]). Đổi tên nó là một quyết định
khác, nên tách riêng.

## Chỗ phải sửa theo (nếu chỉ `git mv` thì hỏng 90 link)

1. **`[[wiki-links]]` trỏ tới 11 file trên: 119 lần xuất hiện trong 38 file.** Sửa bằng thay chuỗi
   `[[subscription-digest-2026-07-` → `[[digest-subscriptions-2026-07-` và
   `[[subscription-shipped-2026-07-` → `[[shipped-subscriptions-2026-07-` trên toàn repo
   (`.git` loại trừ). Lưu ý mẫu này **không** chạm `subscription-installment-horizon-digest`.
2. **`index.md`** — 11 dòng ở mục Notes trỏ trực tiếp bằng tên cũ (đã nằm trong bước 1, nhưng phải
   kiểm lại vì đây là bản đồ).
3. **`skills/brain/SKILL.md` dòng 39–41** — gỡ hẳn đoạn cảnh báo *"note subscriptions cũ còn tồn tại
   lối đặt tên ngược"*; sau khi đổi, gợi ý tra chỉ còn một pattern.
4. **`prompts/gitlog.md` dòng 23** — đang nhắc job cross-link tới `subscription-digest-*`; đổi thành
   `digest-subscriptions-*`, nếu không job sẽ tiếp tục sinh link theo tên đã chết.
5. **`bin/brain-graph` dòng 266** — có bước chuẩn hoá `subscription-shipped` ↔ `shipped-subscriptions`.
   Sau khi đổi tên, đoạn này **không còn tác dụng nhưng cũng vô hại**; đề xuất giữ lại vài tháng rồi
   mới gỡ, để nếu lùi thay đổi thì graph vẫn đúng.
6. **Chạy `bin/brain-lint`** sau cùng — link hỏng là dấu hiệu duy nhất cho biết còn sót chỗ nào.

## Tradeoff

- **`git mv` thuần sẽ làm hỏng 119 link cho tới khi bước 1 chạy xong** — hai bước phải đi cùng một
  lần làm, đừng dừng giữa chừng.
- **Đổi tên phá link tới file cũ ở ngoài brain** (bookmark, note ở máy khác, lịch sử chat). Không lùi
  lại được bằng chính brain — nhưng `git mv` giữ lịch sử và `git log --follow` vẫn lần được.
- **Diff của lần commit này sẽ rất to** (~40 file đổi nội dung). Đề xuất tách **hai commit**: một commit
  `git mv` thuần, một commit sửa link — để review được từng phần.

## ⚠️ Chưa xác minh

- Con số 119 lần xuất hiện / 38 file lấy từ `rg` tại 2026-09-01; sẽ trôi nếu có digest mới sinh
  trước lúc thực hiện. Đếm lại ngay trước khi chạy.
