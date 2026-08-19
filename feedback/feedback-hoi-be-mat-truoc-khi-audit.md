---
type: feedback
title: Yêu cầu mơ hồ về *bề mặt* thì hỏi, đừng tự chọn
summary: "Check CLS" có hai bề mặt hoàn toàn khác nhau (storefront của merchant vs embedded admin app cho Built for Shopify) — tôi tự chọn storefront và đốt trọn một vòng audit + verify vào sai đề.
tags: [feedback, avada, shopify, method, performance]
created: 2026-08-19
updated: 2026-08-19
source: project "subscriptions" — session history 2026-08-19 (task CLS)
---

# Yêu cầu mơ hồ về *bề mặt* thì hỏi, đừng tự chọn

Task viết: *"Check CLS giúp tôi gần đây đang bị cao hơn mức Shopify accept là good rồi
nhé"*. Tôi tự suy là **storefront** (theme app extension + scripttag widget trên store
merchant) và chạy trọn một vòng: audit → verifier FAIL → sửa → verifier FAIL → blocker →
xin thêm vòng. Đến lúc đó dantt mới nói: *"ko phải đâu đm, audit ở in-app cho BFS nhé"* —
đúng đề là **embedded admin app** (`packages/assets`), tiêu chí Built for Shopify.

**Why:** hai bề mặt không chia sẻ một dòng code, một chỉ số, hay một công cụ đo nào. Chọn
sai không làm ra kết quả kém — nó làm ra kết quả **không liên quan**, và mọi vòng verify sau
đó chỉ xác nhận rằng cái sai đề được viết chính xác. Chi phí một câu hỏi là vài giây; chi phí
đoán sai ở đây là một buổi sáng của cả agent lẫn verifier. Cùng họ với
[[bang-chung-phan-biet-duoc]]: verifier PASS trên sai đề vẫn là PASS.

**How to apply:** trước khi nhận một task điều tra/audit, kiểm xem danh từ trong task có
**hơn một hiện thân** trong hệ thống không — CLS (storefront hay admin app), "widget" (theme
extension hay scripttag hay app block), "portal" (classic hay new CP), "giá" (base hay
current hay catalog). Nếu có, hỏi **một câu, một lượt** rồi mới spawn agent; ghi câu trả lời
vào `BRIEF.md` để session sau không phải hỏi lại. Nếu bắt buộc phải đoán, viết giả định ra
ở dòng đầu báo cáo để nó bị bác sớm chứ không bị bác sau ba vòng verify.

Liên quan: [[feedback-plan-o-subagent-hoac-ghi-brief]] · [[brief-state-agent-loop]] ·
[[digest-subscriptions-2026-08-19]] · [[do-layout-shift-bang-browser-automation]] ·
[[subscriptions]]
