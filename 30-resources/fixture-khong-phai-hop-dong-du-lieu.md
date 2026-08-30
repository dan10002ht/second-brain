---
type: resource
title: Fixture do chính mình dựng chỉ chứng minh code khớp giả định của mình
summary: Một test đỏ được, mutation đúng chiều, gate xanh — vẫn không chứng minh gì, nếu dữ liệu nó chạy trên đó do chính người viết code dựng ra; chỗ hỏng thật nằm ở khoảng cách giữa fixture và hợp đồng dữ liệu của producer thật.
tags: [method, debug, tooling, skills]
created: 2026-08-30
updated: 2026-08-30
source: [[digest-subscriptions-2026-08-25]] · [[digest-subscriptions-2026-08-24]] · [[digest-subscriptions-2026-08-27]] · [[digest-ticket-mcrsv-2026-08-26]] · [[digest-ticket-mcrsv-2026-08-28]] · [[digest-pdf-2026-08-24]] · [[digest-pdf-2026-08-28]]
---

# Fixture do chính mình dựng chỉ chứng minh code khớp giả định của mình

[[gate-tu-viet-la-nguon-xanh-gia]] nói về gate **không đỏ được**. Note này nói về ca khó chịu
hơn: gate đỏ được thật, mutation test bắt lỗi đúng chiều, verifier PASS — và tính năng vẫn vô
hiệu **100%** trên production. Vì thứ chưa ai chấm không phải cái gate, mà là **dữ liệu gate
chạy trên đó**.

Cùng một người viết code và viết fixture ⇒ fixture mang đúng giả định của code. Test khi đó
chứng minh code khớp với *giả định của mình*, không khớp với *thứ producer thật gửi sang*.

## Bốn hình dạng đã gặp trong một tuần

| Hình dạng | Ca cụ thể |
|---|---|
| **Field trong fixture mà producer thật không hề emit** | `variantStock.js` gate trên `variant.inventory_management`; Liquid không emit field đó ⇒ trần luôn `Infinity` ⇒ chặn vượt tồn kho **không chặn gì cả** trên prod, trong khi test xanh và mutation đỏ đúng chiều ([[digest-subscriptions-2026-08-25]]) |
| **Field production bắt buộc mà fixture không khai** | `QrCode` không có trong fixture; khi production siết lại, test fail-closed hàng loạt — đó là **vấn đề fixture**, không phải hồi quy ([[digest-ticket-mcrsv-2026-08-26]]) |
| **Fixture rỗng/nhẹ hơn dữ liệu thật** | Lane khai "không route nào tràn" nhưng đo trên event draft **không zone, không fixture**; đo lại với 4 zone tên dài + 1 fixture ra 12 phép thay vì 4 ([[digest-ticket-mcrsv-2026-08-28]]). Cùng họ: HTML còn merge tag chưa thay có sàn bề ngang **giả** vì `{{order.total_outstanding}}` là token 27 ký tự không có chỗ ngắt ([[digest-pdf-2026-08-28]]) |
| **Fixture đóng đinh hành vi sai thành "expected"** | `frequencyValue` đơn vị `month` bị dùng như tuần; test do chính lane viết ghi kỳ vọng khớp hành vi sai, gate xanh ([[digest-subscriptions-2026-08-24]]) |

Biến thể ở tầng môi trường, cùng một bệnh: **dev standalone không tái hiện được CLS của prod**
(0.0146 vs 0.31) vì bundle dev không minify, mất >14s dưới throttle nên run đầu còn kẹt ở boot
screen — số đo lúc đó nói về một trang khác. Lặp lại bốn ngày liên tiếp
([[digest-subscriptions-2026-08-25]] → [[digest-subscriptions-2026-08-28]]).

Và ở tầng script đo: đếm "bao nhiêu shop bị ảnh hưởng" bằng mảng `diff` dựng từ
`Object.entries(DEF)` thì in ra **giá trị mặc định**, không phải giá trị đang lưu — sai hai lần
liên tiếp về đúng con số quyết định có được ghi vào dữ liệu khách hay không
([[digest-pdf-2026-08-24]]).

## Cách bịt

**Ràng fixture vào chính producer, đừng ràng vào trí nhớ.** Bản vá đáng học ở
[[digest-subscriptions-2026-08-25]] là một test tên thẳng ra vấn đề —
`requires inventory_management in the production Liquid data contract` — buộc fixture JS phải
khớp đúng chuỗi Liquid emit. Đổi tên property, bỏ `| json`, đổi key sang camelCase: test đỏ.
Nó biến một giả định ngầm thành một phép kiểm.

| ❌ | ✅ |
|---|---|
| Fixture gõ tay theo trí nhớ về payload | Fixture trích từ payload thật một lần, kèm test khoá lại chuỗi/khai báo sinh ra nó |
| "Test xanh + mutation đỏ = xong" | Thêm một câu hỏi nữa: *dữ liệu này ai sinh ra, và mình có bằng chứng nó sinh ra đúng thế không* |
| Đo trên môi trường tiện tay (dev, standalone, event draft, HTML chưa render) | Đo trên thứ có **cùng hình dạng** với prod; nếu không được thì chỉ dùng số đo để xác nhận *một shift cụ thể biến mất*, không để kết luận tổng |
| Preview/"Send test" coi như đường thật | Nút preview thường chạy trên sample data (`storage/order.json`) — muốn dữ liệu thật thì đi đường script ([[digest-pdf-2026-08-25]]) |
| Script đếm tự chế rồi tin con số | Chứng minh phép đếm **phân biệt được** *đã lưu* với *đang ăn default* ([[bang-chung-phan-biet-duoc]]) |

## Vì sao nó sống dai

Ba lớp đều "chạy đúng" nên không lớp nào báo động — đúng cơ chế của
[[du-lieu-hong-song-sot-vi-ba-lop-nhin-cho-khac]]. Khác biệt là ở đây lớp thứ ba (test) không
chỉ im lặng mà còn **phát tín hiệu xanh**, nên nó đắt hơn: nó mua sự tự tin bằng một phép đo
không liên quan.

Với loop agent thì hệ quả nặng thêm một nấc: lane vừa viết code vừa viết test, nên fixture và
code sinh ra từ *cùng một* hiểu sai. Đây là lý do verifier phải khác họ model với executor
([[2026-08-04-looptasks-verifier-doc-lap]]) — nhưng verifier chỉ bắt được nếu nó tự dựng dữ
liệu chứ không nhận lại fixture của lane ([[cham-viec-agent-nen]]).

## Liên quan

[[gate-tu-viet-la-nguon-xanh-gia]] · [[bang-chung-phan-biet-duoc]] ·
[[du-lieu-hong-song-sot-vi-ba-lop-nhin-cho-khac]] · [[do-layout-shift-bang-browser-automation]] ·
[[do-be-ngang-headless-chrome]] · [[cham-viec-agent-nen]] · [[feedback-debug-phai-query-data-that]]
