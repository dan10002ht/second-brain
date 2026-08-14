---
type: resource
title: Chỗ nên bất đồng bộ mà viết đồng bộ — hậu quả nặng nhất là mất dữ liệu, không phải chậm
summary: Khung phân loại 6 nhóm lỗi sync/async dùng chung cho JS, Go, Java: chậm chỉ là hệ quả nhẹ nhất, hai hệ quả thật là mất việc âm thầm và gửi trùng; kèm 4 điều kiện bắt buộc khi đẩy việc ra nền.
tags: [architecture, backend, concurrency, patterns, nodejs, java, method]
created: 2026-08-14
updated: 2026-08-14
source: project "ticket-mcrsv" — session history 2026-08-13/14 (rà soát thật trên JS/Go/Java, rule `.claude/rules/async-and-blocking.md`)
---

# Sync/async: chậm là hệ quả nhẹ nhất

Câu hỏi mở đầu thường là "chỗ này viết đồng bộ thì chậm đúng không?". Sai trọng tâm. Rà soát thật
trên một repo microservice ba ngôn ngữ cho thấy các ca nặng nhất **không** biểu hiện thành chậm:

| Hệ quả | Ví dụ thật |
|---|---|
| **Sập service** | promise không `await` → unhandled rejection → `gracefulShutdown` tắt cả service khi Redis trục trặc một nhịp |
| **Mất việc âm thầm** | job đẩy vào hàng đợi bằng `.catch(() => {})`; không ai biết nó chưa từng chạy |
| **Gửi trùng** | goroutine không có ai reconcile, retry chồng lên bản đã gửi |
| Chậm | N+1 trong vòng lặp, `@Transactional` giữ qua I/O mạng |

## Bốn câu hỏi trước khi quyết

1. Việc này **hỏng thì ai biết**? (log? metric? hay im lặng)
2. Nếu tiến trình chết giữa chừng, **ai chạy lại**?
3. Nó có đang **giữ tài nguyên khan hiếm** qua ranh giới mạng không? (transaction, connection, lock)
4. Caller có **thật sự cần kết quả** để trả lời không?

## Sáu nhóm lỗi dùng chung ba ngôn ngữ

- **A** — gọi bất đồng bộ nhưng không `await` / không `wg.Add` trước `go func()`: promise/goroutine
  sống ngoài tầm kiểm soát của hàm sinh ra nó.
- **B** — nuốt lỗi (`catch(() => {})`, bỏ `err`): biến lỗi thành "không có chuyện gì xảy ra".
- **C** — `try/catch` bọc quanh một promise **không** `await`: trông như có bảo vệ, thực tế không
  bắt được gì vì promise settle sau khi hàm return.
- **D** — chờ đồng bộ thứ caller không cần (gọi HTTP bên thứ ba ngay trong đường trả response).
- **E** — **giữ transaction qua I/O mạng**: `@Transactional` bao quanh Kafka send / HTTP Stripe.
  Nặng thêm nếu client mạng **không set connect/read timeout** — timeout phải nhỏ hơn deadline
  của lớp gọi nó.
- **F** — đẩy ra nền nhưng không ai reconcile: job kẹt trạng thái trung gian nằm đó vĩnh viễn.

## Khi đẩy việc ra nền, phải đủ cả bốn

1. có đường **chạy lại** (retry hoặc reconcile theo lịch);
2. **không nuốt lỗi** — log kèm định danh đủ để tra (`jobType`, `userId`, `shopId`);
3. **dừng được** — tôn trọng context/stop channel, không `time.Sleep` mù;
4. có **ai đó đối soát** trạng thái treo, với ngưỡng suy ra từ config thật (ví dụ
   `2 × maxPossibleRetryDelay`), không phải số bịa.

## Bẫy khi đi rà

- **Spring AOP self-invocation**: gọi `this.xxx()` thì `@Transactional`/`REQUIRES_NEW` **không**
  có hiệu lực — phải tách sang bean riêng.
- Đừng chấm điểm bằng listicle best-practice. Rule đáng tin là rule viết từ **chỗ repo đã trả giá**,
  và mỗi nhóm lỗi nên trỏ tới một **khuôn đúng đang sống trong chính repo** để làm mẫu đối chiếu —
  nếu không, phần lớn finding sẽ là dương tính giả.

Liên quan: [[digest-ticket-mcrsv-2026-08-14]] · [[digest-ticket-mcrsv-2026-08-13]] ·
[[python-asyncio-blocking]] · [[caching-layers]] · [[bang-chung-phan-biet-duoc]] ·
[[controller-service-repository]]
