---
type: resource
title: Phép kiểm xanh vì nó quan sát sai tầng, sai phạm vi, sai đơn vị đếm
summary: Một test/gate chạy thật, đỏ được thật, dữ liệu không giả — vẫn vô dụng nếu nó quan sát artefact ở tầng TRƯỚC chỗ bug sinh ra, quét phạm vi không chứa chỗ bug, hoặc đếm bằng đơn vị mà bug không làm đổi.
tags: [method, debug, tooling, skills]
created: 2026-09-06
updated: 2026-09-06
source: [[digest-subscriptions-2026-09-03]] · [[digest-ticket-mcrsv-2026-09-04]] · [[digest-ticket-mcrsv-2026-09-01]] · [[digest-pdf-2026-09-01]]
---

# Phép kiểm xanh vì nó quan sát sai tầng, sai phạm vi, sai đơn vị đếm

Có ba note trong brain nói về việc không tin một tín hiệu xanh, và chúng đã chiếm ba chỗ khác nhau:

| Note | Thứ hỏng |
|---|---|
| [[gate-tu-viet-la-nguon-xanh-gia]] | gate **không đỏ được** (`$?` bị nuốt, SKIP im lặng) |
| [[fixture-khong-phai-hop-dong-du-lieu]] | gate đỏ được, nhưng **dữ liệu** nó chạy trên đó do chính mình dựng |
| [[bang-chung-phan-biet-duoc]] | kết luận dựa trên **bằng chứng vắng mặt** |

Note này là chỗ thứ tư, và là chỗ khó nghi nhất: gate đỏ được thật, dữ liệu lấy từ producer thật,
kết luận có bằng chứng dương — nhưng **cái nó nhìn không phải cái hỏng**. Phép kiểm chỉ canh được
đúng thứ nó quan sát, và ba biến số hay đặt sai là **tầng**, **phạm vi**, **đơn vị đếm**.

## Ba biến số

### 1. Tầng — quan sát TRƯỚC bước biến đổi sinh ra bug

Bug sống sau một bước transform (compile, render, cast). Phép kiểm đọc bản trước bước đó nên nó
xanh kể cả khi bug còn nguyên.

- **`sqlx` compile named parameter trước khi gửi xuống driver**, nên dấu `:` của `::timestamptz` bị
  ăn mất. Test hồi quy vòng 1 so **chuỗi SQL trước bước compile** ⇒ xanh với cả bản hỏng. Vòng 2 dùng
  `sqlmock.QueryMatcherFunc` kiểm SQL **sau** compile và từ chối mọi dấu `:` còn sót
  ([[digest-ticket-mcrsv-2026-09-04]]).
- **Test khoá markup đếm trong source thay vì trong HTML render**: `width:60px` khai 3 lần trong
  source nhưng template lặp qua từng dòng hàng nên đầu ra có 11 ([[digest-pdf-2026-09-01]]).

Cùng hình dạng với việc đo bề ngang trên HTML còn merge tag chưa thay — đã ghi ở
[[fixture-khong-phai-hop-dong-du-lieu]] và [[layout-email-html-co-duoc]]. Khác biệt: ở đó thứ sai là
dữ liệu, ở đây thứ sai là **thời điểm quan sát**.

### 2. Phạm vi — quét một danh sách mang sẵn thay vì quét cả cây

Guard đối chiếu `env.example` ↔ code chỉ soi vài file config đã liệt kê. Lane xoá mất
`LOG_LEVEL=info` — biến được đọc thật ở `internal/logger/logger.go` — mà guard vẫn **PASS**. Đổi sang
`filepath.WalkDir` quét cả cây thì thí nghiệm quyết định cho kết quả đúng chiều: guard hẹp PASS (mù),
guard rộng báo `missing: [LOG_LEVEL LOG_OUTPUT_PATH]` ([[digest-ticket-mcrsv-2026-09-01]]).

Một danh sách file gõ tay trong gate là một allowlist ngầm: nó đóng băng phạm vi tại lúc viết, còn
code thì di chuyển. Cùng lý do [[gate-quet-ma-nguon-bang-ast]] bác regex — ở đó biến số là cú pháp,
ở đây là vị trí.

### 3. Đơn vị đếm — bug không làm đổi con số đang nhìn

Sau refactor, ranh giới mock giữ bằng `jest.requireActual` làm cả suite `contractService.test.js`
**chạy mà đăng ký 0 test**. Gate vẫn báo **271 suite pass**; chỉ tổng số test tụt **2899 → 2857**.
Luật của repo là *chấm theo suite, không đọc dòng `Tests:`* — đúng để bắt suite đỏ, **mù trước suite
xanh mà rỗng** ([[digest-subscriptions-2026-09-03]]).

Đây là mặt đối xứng của một dòng đã có trong [[gate-tu-viet-la-nguon-xanh-gia]] (*suite chết lúc load
đóng góp 0 test nên dòng `Tests:` vẫn trông xanh*). Hai chiều ngược nhau, nên **không có một con số
nào đủ**: phải đọc cả hai và so với baseline của chính worktree đang chạy.

## Cách bịt

Chung một phép thử cho cả ba: **đưa dạng hỏng đã biết vào và bắt phép kiểm phân biệt được.** Không
phải "test có đỏ khi tôi phá code không" (đó là mutation test, đã có ở
[[gate-tu-viet-la-nguon-xanh-gia]]) mà là *"nếu bug gốc còn nguyên, phép kiểm này có đỏ không"* —
chạy nó trên chính commit trước bản vá.

| ❌ | ✅ |
|---|---|
| Assert trên chuỗi/đối tượng mình cầm sẵn trong tay | Assert trên artefact **sau** bước biến đổi cuối cùng trước khi hệ thống thật dùng nó |
| Gate mang danh sách file/biến/route gõ tay | Quét cả cây rồi loại trừ tường minh (`WalkDir` + bỏ `_test.go`), để chỗ mới tự động lọt vào phạm vi |
| Một con số tổng hợp (suite pass, `live + terminal == expected`) | Trạng thái **từng đơn vị**; con số tổng hợp gộp hai trạng thái khác nhau thành một ([[digest-ticket-mcrsv-2026-09-01]]) |
| Baseline lấy từ brief / từ nhánh đang mở | Đo baseline **trong chính worktree vừa dựng**, cả hai con số ([[brief-state-agent-loop]]) |

## Vì sao nó đắt hơn một gate hỏng thường

Gate không đỏ được thì sớm muộn có người nghi. Gate ở đây **đỏ được, và đã từng đỏ đúng** — nên nó
mua được sự tự tin thật. Ba lần trong một tuần, ở ba repo khác nhau, nó dẫn tới cùng một kết cục:
bản vá được merge kèm một test "chứng minh" nó đúng, mà test đó xanh cả khi chưa vá.

Với loop agent thì thêm một nấc: lane viết cả code lẫn phép kiểm nên hai thứ dùng chung một hiểu sai
về tầng. Verifier khác họ model chỉ bắt được nếu brief bắt nó **chạy phép kiểm trên bản chưa vá**,
chứ không chỉ đọc lại phép kiểm ([[cham-viec-agent-nen]] · [[2026-08-04-looptasks-verifier-doc-lap]]).

## Liên quan

[[gate-tu-viet-la-nguon-xanh-gia]] · [[fixture-khong-phai-hop-dong-du-lieu]] ·
[[bang-chung-phan-biet-duoc]] · [[gate-quet-ma-nguon-bang-ast]] · [[brief-state-agent-loop]] ·
[[du-lieu-hong-song-sot-vi-ba-lop-nhin-cho-khac]]

Ca mới cùng hình dạng: [[digest-subscriptions-2026-09-06]] — so giá contract với **catalog hiện
tại** thì 4 ca trông giống hệt nhau; chỉ khi đối chiếu **đơn đã charge** (artefact sau bước biến
đổi cuối) mới tách được 3 bug khỏi 1 đúng.

Cùng họ, khác chỗ hỏng: [[so-anh-khong-so-chu]] — phép kiểm dùng **sai đơn vị** (đo giao diện bằng
text) chứ không phải sai tầng.
