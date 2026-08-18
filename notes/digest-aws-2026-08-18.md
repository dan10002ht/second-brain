---
type: note
title: Digest aws 2026-08-18 — giấu nguồn đề không phải việc của commit message
summary: Khi cần bỏ dấu vết nguồn (Dojo/Neal) khỏi repo, chỗ khó không nằm ở commit message mà nằm trong chính nội dung câu hỏi (domain, tên bucket, tên directory), nhãn hiển thị trong app và comment của gate — phải quét theo chuỗi thương hiệu rồi force-push, không phải sửa message rồi coi là xong.
tags: [aws, certification, learning, tooling]
created: 2026-08-18
updated: 2026-08-18
source: project "aws" — session history 2026-08-17/18
---

# Digest — AWS learning platform (2026-08-18)

> Phần parser bóc đề (thụt lề bản `-layout`, option đứt qua trang, không tin report của
> agent) đã ghi ở [[digest-aws-2026-08-17]]; commit landed ở [[shipped-aws-2026-08-18]].
> Đây chỉ là phần mới.

## Techniques

**Xoá dấu vết nguồn: metadata là phần dễ, nội dung mới là phần thật.** Yêu cầu là "đừng để
lộ nguồn Dojo/Neal" — tôi hiểu nhầm lượt đầu thành "chê format commit message". Sau khi
quét theo chuỗi thương hiệu, dấu vết nằm ở bốn tầng:

| Tầng | Ví dụ tìm thấy |
|---|---|
| Commit message | subject + body nêu tên hai bộ đề |
| **Nội dung câu hỏi** | `api.tutorialsdojo.com`, `tdojo-finance`, `DirectoryTutorialsDojo1234` |
| Nhãn hiển thị trong app | tên set hiện ra UI |
| Comment trong code/gate | `sets.ts:16`, `check.mjs` |

Nội dung câu hỏi là tầng nguy hiểm nhất vì nó đi thẳng ra người dùng và không ai nghĩ tới
khi nghe "sửa commit message". Sau khi dọn: chạy lại gate + build (đảm bảo không vỡ),
verify **0 lần xuất hiện** tên nguồn trong toàn bộ diff, rồi `push --force-with-lease` để
bản trên remote cũng sạch — sửa message mà không force-push thì bản cũ vẫn còn trên GitHub.

**Bám convention commit của repo, không bám convention của mình.** 14 commit trước trong
repo đều là **một dòng subject, không body**; commit của tôi là cái duy nhất có body 20
dòng. Xem [[feedback-follow-conventions]].

## Context

- Hook `guard-main-branch.py` của repo này chặn cả `commit` lẫn `push` khi đang ở `main`,
  trái với ghi nhớ cũ "repo aws push thẳng main được". **Hook là cấu hình hiện hành → theo
  hook**: tạo nhánh, commit, fast-forward về `main`, rồi để người dùng tự chạy push.
  Liên quan [[feedback-git-guard-chi-chan-master]].
- Ký tự `!` chỉ chạy lệnh khi nó là **ký tự đầu tiên** của ô nhập; có khoảng trắng đứng
  trước thì nó tới dưới dạng tin nhắn chứ không chạy.

Bối cảnh: [[aws]] · [[aws-certification]]
