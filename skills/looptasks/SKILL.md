---
name: looptasks
description: Nhặt task từ file task list (mặc định BRIEF.md của project), implement từng cái bằng subagent Sonnet 5, mark done, ghi changelog. Chạy song song các task độc lập. Dùng khi user muốn tự động xử lý một danh sách task, hoặc gọi qua /loop để lặp định kỳ tự nhặt task mới.
---

# looptasks — nhặt task từ file, giao subagent làm, mark done

Main agent **orchestrate + verify**, KHÔNG tự viết code. Code do subagent Sonnet 5 làm.

## Input

`args` = đường dẫn file task. **cwd vẫn là repo project** (để `CLAUDE.md` + settings của repo
được load) — chỉ file task là trỏ đi nơi khác.

Mặc định file task sống ở brain, **ngoài repo code**:

```
~/projects/my-brain/10-projects/<tên-repo>/BRIEF.md
```

Lý do: repo của team sạch, tự sync đa máy qua brain-sync, và **worktree không bao giờ thấy file
này** nên subagent không thể sửa/commit nhầm làm revert trạng thái checkbox lúc merge.

Không có args → thử `~/projects/my-brain/10-projects/<tên-thư-mục-cwd>/BRIEF.md`, rồi `BRIEF.md`
ở project root. Không thấy cái nào → **hỏi user, đừng đoán, đừng tự tạo file rỗng.**

`BRIEF.md` cố ý **nằm ngoài graph wiki** (`brain-lint` bỏ qua mọi file tên `BRIEF*`): nó là state
của loop, không phải knowledge, và mọi project đều dùng cùng tên nên slug sẽ đụng nhau.

Task list dùng chung với đồng đội thì là ngoại lệ: để trong repo, trên nhánh feature.

## Định dạng task

```markdown
1. [ ] làm xyz
2. [⏳ 14:32] đang làm abc
3. [✅ 2026-08-02] đã xong kkk
```

- `[ ]` / `[]` → chưa done, cần làm
- `[⏳ HH:MM]` → đang có agent nhận (xem mục Lock bên dưới)
- `[✅ YYYY-MM-DD]` / `[✅]` / `[x]` → xong, **bỏ qua**

Task có thể có dòng con (bullet, sub-detail) — đọc hết block thuộc task đó làm context.

---

## Bước 1 — Đọc file, lọc task

Liệt kê task chưa done. **Không còn task nào → report "no pending tasks" và dừng.**
Đang trong `/loop` thì chờ lần sau. **Tuyệt đối không tự bịa việc, không mở rộng scope.**

### Lock — chống hai iteration chồng nhau

Loop 5 phút mà task chạy 8 phút thì iteration sau sẽ fire khi trước chưa xong.
`[⏳ HH:MM]` là mutex trên đĩa, sống sót qua restart:

- `[⏳]` stamp **dưới 30 phút** → đang chạy thật → **bỏ qua task này**
- `[⏳]` stamp **quá 30 phút** → mồ côi (loop trước bị ngắt) → nhận lại, coi như chưa làm
- `[⏳]` **không có stamp** (format cũ) → coi là mồ côi

## Bước 2 — Xác định task nào chạy song song được

Mặc định **chạy song song các task độc lập**. Nhưng "độc lập" phải *xác định*, không phán từ tiêu đề.

Với mỗi task, xác định **vùng file nó sẽ chạm** — đọc mô tả task, rồi grep/glob để tìm file liên quan.
Việc này rẻ (đọc + tìm, không sửa gì); nếu nhiều task thì spawn agent `Explore` chạy song song để recon.

Dựng ma trận va chạm:

- **Không giao nhau** → song song, mỗi agent một worktree
- **Giao nhau**, hoặc **không xác định được** vùng chạm → **tuần tự** (mặc định an toàn khi thiếu thông tin)
- Task nói "refactor toàn bộ", "đổi tên xuyên repo", đụng file config/schema/type dùng chung → luôn tuần tự

Log cho user biết đã chia nhóm thế nào trước khi chạy.

## Bước 3 — Nhận task

**NGAY khi nhận**, sửa file task `[ ]` → `[⏳ HH:MM]` (giờ hiện tại). Nhận nhiều task song song thì
mark hết. Đây là bước đầu tiên, trước khi spawn agent — nếu spawn trước, iteration khác có thể cướp task.

## Bước 4 — Giao subagent

Mỗi task một agent, `model: "sonnet"`. Nhóm song song → thêm `isolation: "worktree"` để agent
có checkout riêng; đoán sai độ độc lập thì vẫn không ai đè lên ai. Nhóm tuần tự chạy thẳng
trong thư mục hiện tại, lần lượt.

Brief phải đủ:

- Project path, mô tả task **nguyên văn** + mọi dòng con
- File/context liên quan (kết quả recon ở bước 2)
- Done-criteria **cụ thể, kiểm được**: `tsc` exit 0, build xanh, test pass, thay đổi surgical
- Convention của repo (đọc `CLAUDE.md` của project nếu có)

**Ràng buộc bắt buộc ghi vào brief của mọi subagent:**

> Chỉ sửa file và chạy build/test. **KHÔNG chạy git** (add/commit/checkout/stash/branch/merge).
> **KHÔNG sửa file task list.** Không mở rộng scope ngoài task được giao.
> Xong thì report: file nào đã sửa, cách làm, kết quả verify.

Rào này xoá nguyên lớp rủi ro agent này `checkout` phá việc agent khác.

## Bước 5 — Verify

Chờ agent xong, đọc report. **Không tin report — tự verify.** Chạy đúng done-criteria
(`tsc` / build / test tuỳ task) và **đọc output thật** trước khi kết luận.

Nhóm worktree: verify trong worktree của nó, xanh rồi mới merge về nhánh làm việc.
Merge **lần lượt từng cái**, verify lại sau mỗi lần merge — conflict lúc merge là chuyện
bình thường, gỡ ngay tại chỗ.

## Bước 6 — Đóng task

Xong và verify xanh:

1. Sửa file task `[⏳ HH:MM]` → `[✅ YYYY-MM-DD]` (ngày hôm nay — cần cho bước dọn)
2. Viết tóm tắt **ngay dưới task, indent**: file nào sửa, cách làm, verify status
3. Cập nhật `CHANGELOG.md` ở project root (tạo nếu chưa có) — 1 entry theo ngày.
   Repo đã có convention changelog riêng thì **theo convention đó**, đừng áp khuôn mới.
4. Report cho user: task nào vừa xong, tóm tắt ngắn

**Fail / blocker** (thiếu credential, task mô tả không rõ, verify đỏ):
ghi blocker dưới task, **ĐỪNG mark done**, trả `[⏳]` về `[ ]`, report user. Không đoán bừa để cho xong.

## Bước 7 — Dọn task cũ (housekeeping)

Chạy **một lần mỗi iteration, sau khi đóng task**. Giữ `BRIEF.md` là danh sách việc *đang sống*,
không phải kho lưu trữ — file phình lên thì mỗi iteration lại tốn công đọc lại thứ đã xong.

Task `[✅ YYYY-MM-DD]` **quá 3 ngày** → cắt khỏi `BRIEF.md`, append sang `BRIEF-done.md`
cùng thư mục (tạo nếu chưa có), **giữ nguyên tóm tắt indent bên dưới** — đó là lịch sử,
đừng vứt. Nhóm theo ngày:

```markdown
## 2026-08-04
- [✅] fix format tiền ở export CSV
  - Sửa `app/utils/money.js`; verify: tsc exit 0, test pass
```

Quy tắc:

- Task xong **trong vòng 3 ngày** → để nguyên trong `BRIEF.md` (user còn muốn thấy việc vừa làm)
- `[✅]` **không có ngày** (format cũ) → để nguyên, không đoán ngày
- Chỉ dọn khi có ít nhất 1 task đủ điều kiện. Không có thì bỏ qua im lặng, đừng tạo file rỗng
- `BRIEF-done.md` cũng ngoài graph — cùng tiền tố `BRIEF` nên `brain-lint` đã bỏ qua sẵn

---

## Nguyên tắc

- **Main agent không viết code.** Chỉ orchestrate, verify, bookkeeping.
- **Idempotent.** `[✅]` bỏ qua tuyệt đối. Lock có timestamp lo phần `[⏳]`.
- **Không tự thêm task, không mở rộng scope.** Làm đúng cái file ghi.
- **Surgical.** Mỗi thay đổi trace được về đúng một task.
- **Git do main agent làm.** Repo project: tạo nhánh, hỏi trước khi commit (xem `brain-core.md`).
- **File task ở brain thì KHÔNG commit nó.** Cứ sửa và để đó — `brain-sync` 20:00 mỗi tối tự
  commit + push master. Đừng commit brain giữa chừng chỉ để lưu một cái checkbox.

## Chạy định kỳ

Ưu tiên user gọi `/loop 5m /looptasks <file>`. Gọi trực tiếp mà user muốn lặp thì tạo cron
`*/5 * * * *` với prompt `/looptasks <file>`. Dừng: xoá cron, hoặc user bảo dừng.
