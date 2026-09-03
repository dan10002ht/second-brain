---
type: feedback
title: Báo giờ theo giờ VN, không dán nguyên UTC
summary: Mọi mốc thời gian nói với user phải quy về Asia/Ho_Chi_Minh (UTC+7); nếu giữ giờ gốc của công cụ thì phải ghi rõ đó là UTC.
tags: [feedback, avada, skills]
created: 2026-09-03
updated: 2026-09-03
source: project `subscriptions` — session history 2026-09-03 (MR !2524 merged 04:06Z)
---

# Báo giờ theo giờ VN, không dán nguyên UTC

Tôi báo *"merged vào master lúc 04:06 hôm nay"* — đó là giá trị GitLab trả về
(`2026-09-03T04:06:34Z`), tức **11:06 sáng giờ VN**. User ở VN và chỉnh ngay.

**Why:** 04:06 là một mốc *có nghĩa* trong đời thật — nó nghe như đêm qua, như một job cron chạy
trong lúc không ai nhìn. Người đọc không có lý do gì để nghi đó là UTC, nên họ suy ra sai chuỗi sự
kiện: cái gì xảy ra trước, deploy đã kịp trước hay sau lần khách báo lỗi. Sai 7 tiếng đủ để đảo
thứ tự nguyên nhân — kiểu nhầm này đã cắn một lần ở [[digest-subscriptions-2026-08-28]] (đơn
`12:00:00Z` bị đọc là quá hạn trong khi ở `America/New_York` mới 8 giờ sáng).

**How to apply:** GitLab, GitHub, Cloud Logging, BigQuery, Firestore timestamp, `git log --date=iso`
— tất cả đều trả UTC. Quy về **UTC+7** trước khi viết cho user, hoặc ghi hẳn `04:06Z (11:06 VN)`.
Với dữ liệu của merchant thì mốc đúng là **timezone của shop**, không phải VN cũng không phải UTC —
khi đối chiếu dữ liệu thì vẫn so bằng ISO UTC, chỉ phần *nói ra* mới đổi múi giờ.

## Liên quan
- [[digest-subscriptions-2026-09-03]] · [[digest-subscriptions-2026-08-28]] · [[bang-chung-phan-biet-duoc]]
