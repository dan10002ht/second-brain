---
type: note
title: Claude Code cho tester/QA — cấu hình và sample từng phần
summary: Hướng dẫn tester dùng Claude Code từ con số không — bản đồ file cấu hình, sample nhỏ cho settings.json, statusline, CLAUDE.md, agent phụ, verifier, skill, hook, BRIEF-qa.md, kèm lộ trình 3 tuần.
tags: [ai, tooling, method, skills, learning]
created: 2026-08-05
source: settings/agents/skills thật đang chạy + skill looptasks
---

# Claude Code cho tester — cấu hình và sample

File này hướng dẫn **dùng công cụ**, không hướng dẫn cách test. Team test đã có quy trình
riêng cho chuyện đó.

Không cần biết code. Mỗi phần có: *nó là gì* (2–3 dòng) → **sample nhỏ copy được** →
*đặt ở đâu* → *khi nào dùng*.

## Bản đồ — có những file cấu hình nào

Toàn bộ Claude Code cấu hình bằng file text. Chỉ có 6 chỗ, không hơn:

| File | Ở đâu | Dùng làm gì | Ai cần |
|---|---|---|---|
| `settings.json` | `~/.claude/` | thiết lập chung: model, cho phép chạy lệnh gì, statusline | ai cũng cần |
| `statusline.sh` | `~/.claude/` | hiện thanh trạng thái (trong đó có % trí nhớ) | ai cũng cần |
| `CLAUDE.md` | trong repo | dặn sẵn: lệnh test, cấu trúc dự án, quy ước | ai cũng cần |
| `agents/*.md` | `~/.claude/` hoặc `<repo>/.claude/` | định nghĩa "trợ lý chuyên trách" | khi cần người chấm riêng |
| `skills/*/SKILL.md` | `<repo>/.claude/` | đóng gói quy trình lặp đi lặp lại | khi làm cùng một việc lần thứ 3 |
| `BRIEF-qa.md` | trong brain | danh sách việc để nó tự làm dần | khi có nhiều việc nhỏ tồn |

Không nhớ cũng không sao — **nhờ Claude tạo hộ**, nó biết đặt đúng chỗ. Sample dưới đây
để bạn **đọc lại xem nó làm đúng chưa**.

---

## 1. `settings.json` — bớt bị hỏi xin phép

**Là gì:** mặc định Claude hỏi bạn trước mỗi lần chạy lệnh. Ngày hỏi vài chục lần thì mệt.
File này khai báo trước những lệnh **an toàn, được chạy thẳng**.

**Sample nhỏ** (`~/.claude/settings.json`):

```json
{
  "permissions": {
    "allow": [
      "Read",
      "Grep",
      "Glob",
      "Bash(yarn test:*)",
      "Bash(npm test:*)",
      "Bash(git status:*)",
      "Bash(git diff:*)",
      "Bash(git log:*)",
      "Bash(ls:*)"
    ]
  },
  "statusLine": {
    "type": "command",
    "command": "bash ~/.claude/statusline.sh"
  }
}
```

**Đọc hiểu:** `Bash(yarn test:*)` = cho phép mọi lệnh bắt đầu bằng `yarn test`.
Dấu `*` là "gì cũng được ở phía sau".

**Nguyên tắc chọn:** chỉ cho sẵn lệnh **đọc và chạy test**. Đừng cho sẵn lệnh sửa/xoá
(`git commit`, `rm`) — mấy cái đó cứ để nó hỏi.

**Nhờ Claude làm hộ:**

> "Mở `~/.claude/settings.json` và thêm quyền chạy sẵn cho các lệnh test của dự án này.
> Đọc `package.json` để lấy đúng tên lệnh. Đừng thêm quyền cho lệnh git ghi hay xoá file."

---

## 2. `statusline.sh` — đồng hồ báo trí nhớ

**Là gì:** Claude chỉ nhớ những gì trong cuộc trò chuyện hiện tại, và bộ nhớ đó **có
giới hạn**. Kết quả mọi lệnh nó chạy cũng chiếm chỗ trong đó. Thanh trạng thái cho bạn
thấy đã dùng bao nhiêu phần trăm.

**Kết quả trông như:**

```
📁 subscriptions  master*  Opus 5  ctx 23%
```

**Cách bật** — không cần tự viết script, gõ nguyên câu này:

> "Bật statusline hiển thị phần trăm context. Lấy mẫu ở
> `~/projects/my-brain/10-projects/ai-eng-guide/ai-eng-02-context.md`, phần Monitor."

**Đọc con số:**

| `ctx` | Nghĩa |
|---|---|
| dưới 40% | thoải mái |
| 40–60% | xong việc đang làm thì `/clear`, đừng mở việc mới |
| trên 60% | không bắt đầu việc mới nữa |
| nhảy vọt đột ngột | bạn vừa cho nó đọc/chạy cái gì đó rất dài |

`/clear` = xoá cuộc trò chuyện, bắt đầu lại. **Không mất file nào.**

---

## 3. `CLAUDE.md` — dặn một lần, khỏi nhắc lại

**Là gì:** file đặt trong repo, Claude **tự đọc mỗi lần mở**. Cái gì phải nhắc lại ở mọi
session thì cho vào đây.

**Sample nhỏ** — phần tester nên thêm vào `CLAUDE.md` của repo:

```markdown
## Test
- chạy tất cả: `yarn test packages/functions`
- chạy một file: `yarn test <đường-dẫn>`
- cần emulator: `yarn emulator` ở terminal khác
- seed data: `node scripts/seed.js --shop=test-shop`
- output test rất dài → chỉ báo tóm tắt, xem đầy đủ khi có test đỏ
```

**Nhờ Claude làm hộ:**

> "Thêm mục `## Test` vào `CLAUDE.md` của repo này: lệnh chạy test, chạy một file,
> seed data. Đọc `package.json` và file CI để lấy đúng lệnh, **đừng đoán**."

**Lưu ý:** giữ ngắn. File này tốn chỗ trong trí nhớ ở **mọi** cuộc trò chuyện, kể cả
những lần không liên quan tới test.

---

## 4. Agent phụ — nhờ đọc hộ rồi tóm tắt

**Là gì:** Claude tạo được một bản sao của chính nó để làm việc riêng. Bản sao có
**bộ nhớ riêng**, làm xong chỉ trả về phần tóm tắt.

Ví dụ: sếp nhờ bạn đọc 200 trang rồi báo cáo 1 trang. Sếp không phải đọc 200 trang.

Đây là thứ tester dùng nhiều nhất, vì việc của bạn sinh ra rất nhiều chữ.

**Không cần cấu hình gì** — chỉ cần nói. Sample:

> "Tạo agent phụ chạy `yarn test packages/functions`. Báo lại: chạy xong đúng hay lỗi,
> tổng số pass/fail, và mỗi test đỏ thì cho tên test + 3 dòng lỗi đầu.
> **Đừng dán toàn bộ output.**"

> "Tạo agent phụ tìm trong `logs/prod-0805.log` các dòng chứa `orderId: 4512`.
> Trả tối đa 20 dòng kèm số dòng. **Đừng đọc cả file.**"

**Khi nào dùng:** việc phải đọc/chạy nhiều nhưng kết quả cần lại ngắn.

---

## 5. `verifier` — trợ lý chuyên chấm

**Là gì:** một agent phụ được định nghĩa sẵn thành file, **không có quyền sửa file**,
chỉ được chạy lệnh và đọc kết quả. Dùng để kiểm chứng thay vì để Claude tự chấm bài
của chính nó.

**Sample nhỏ** (`~/.claude/agents/qa-verifier.md`):

```markdown
---
name: qa-verifier
description: Kiểm chứng một fix/tính năng đã đạt yêu cầu chưa — chạy lệnh thật, đọc kết quả thật, trả ĐẠT / KHÔNG ĐẠT / CHƯA KIỂM CHỨNG ĐƯỢC kèm bằng chứng. Không sửa file.
tools: Read, Grep, Glob, Bash
model: sonnet
---

Bạn kiểm chứng độc lập. Bạn KHÔNG sửa file, KHÔNG chạy lệnh git ghi.

1. Không tin lời ai. Report của người sửa là **lời khai cần kiểm chứng**.
2. Bằng chứng = mã kết thúc của lệnh + output thật. Phải **trích nguyên văn**
   dòng output quyết định. Không trích được thì bạn chưa kiểm chứng.
3. Chạy theo thứ tự: typecheck → build → test. Đỏ ở đâu thì dừng ở đó.
4. **Lệnh không chạy được KHÔNG phải là đạt.** Timeout, thiếu dependency,
   output rỗng bất thường → trả **CHƯA KIỂM CHỨNG ĐƯỢC**.

Trả về: kết luận + lệnh đã chạy + mã kết thúc + dòng output quyết định.
```

**Đặt ở đâu:** `~/.claude/agents/` (dùng cho mọi dự án) hoặc `<repo>/.claude/agents/`
(riêng dự án đó, và được ưu tiên).

**Cách gọi:**

> "Giao cho `qa-verifier` kiểm chứng ticket SB-14901.
> Repo: `/Users/tôi/projects/subscriptions`.
> Đạt khi: `yarn test packages/functions/src/services/refund.test.js` không lỗi,
> và không có test nào khác đỏ thêm.
> Dev nói đã sửa các file: `<dán danh sách>` — đây là lời khai, phải tự kiểm chứng."

Điểm 4 trong file trên là điểm hay bị bỏ nhất: **chạy không được không phải là đạt.**

---

## 6. Skill — đóng gói một quy trình

**Là gì:** một file mô tả các bước của một việc bạn làm đi làm lại. Sau đó chỉ cần gõ
`/tên-skill` là nó làm theo đúng các bước đó.

Làm khi bạn nhận ra mình đang copy-paste cùng một đoạn yêu cầu **lần thứ ba**.

**Sample nhỏ** (`<repo>/.claude/skills/qa-verify/SKILL.md`):

```markdown
---
name: qa-verify
description: Kiểm chứng một ticket đã fix xong. Dùng khi user nói "verify ticket X", "kiểm tra fix này".
---

# qa-verify

`args` = mã ticket. Không có thì hỏi user, đừng đoán.

## Bước 1 — Lấy yêu cầu
Đọc ticket qua Jira. Không lấy được thì hỏi user dán AC vào.

## Bước 2 — Xác định điều kiện đạt
Từ AC, viết ra điều kiện kiểm được bằng lệnh. Không viết được thì hỏi user.

## Bước 3 — Kiểm chứng
Giao `qa-verifier` với điều kiện ở bước 2 và đường dẫn tuyệt đối của repo.
**Không tự chấm.**

## Bước 4 — Báo cáo
Kết luận + lệnh + mã kết thúc + output. Chưa kiểm chứng được thì nói rõ vướng ở đâu,
KHÔNG ghi là đạt.
```

**Gọi:** `/qa-verify SB-14901`

**Nguyên tắc:** skill **không nên biết** lệnh test riêng của app — cái đó để trong
`CLAUDE.md`. Như vậy copy skill sang dự án khác dùng được luôn.

---

## 7. Hook — luật tự động, không phụ thuộc nó có nhớ hay không

**Là gì:** skill là *lời dặn* (Claude có thể quên). Hook là *cơ chế* — một script tự
chạy tại một thời điểm cố định, luôn luôn chạy.

**Sample nhỏ:** chặn lỡ tay đẩy code lên remote.

`~/.claude/settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [{ "type": "command", "command": "bash ~/.claude/guard-push.sh" }]
      }
    ]
  }
}
```

`~/.claude/guard-push.sh`:

```bash
#!/usr/bin/env bash
cmd=$(cat | jq -r '.tool_input.command // ""')
if printf '%s' "$cmd" | grep -q "git push"; then
  echo "Không tự push. Hỏi người trước." >&2
  exit 2
fi
exit 0
```

**Đọc hiểu:** `PreToolUse` = chạy **trước** khi Claude dùng một công cụ.
`matcher: "Bash"` = chỉ áp cho lệnh terminal. Thoát với mã `2` = **chặn lại**.

**Khi nào cần:** khi có một điều tuyệt đối không được xảy ra. Với tester thường là:
không tự push, không tự sửa file test đang dùng làm bằng chứng.

Chưa cần hook ngay tuần đầu. Biết là có cái này để dùng khi cần.

---

## 8. `BRIEF-qa.md` + `/looptasks` — giao một danh sách việc

**Là gì:** bạn liệt kê việc vào một file; Claude đọc file, làm từng việc, đánh dấu xong,
ghi kết quả xuống dưới. Trạng thái nằm **trong file trên máy** nên tắt máy cũng không mất.

**Đặt ở đâu:**

```
~/projects/my-brain/10-projects/<tên-repo>/BRIEF-qa.md
```

**Sample nhỏ:**

````markdown
# subscriptions — việc QA

1. [ ] verify fix SB-14832 (webhook gọi 2 lần tạo 2 record)
   - KHÔNG sinh code, KHÔNG commit. Kết quả ghi thành báo cáo ngay dưới việc này.
   - đạt khi: gửi 2 webhook cùng orderId → chỉ có đúng 1 record

2. [ ] rà thư mục `services` xem file nào chưa có test
   - KHÔNG sinh code. Chỉ cần danh sách + cái nào nên làm trước.
````

**Ký hiệu:**

| | |
|---|---|
| `[ ]` | chưa làm |
| `[⏳ 14:32]` | đang làm, nhận lúc 14:32 |
| `[✅ 2026-08-05]` | xong ngày đó |

**Chạy:** mở Claude Code **tại thư mục repo code** (không phải thư mục brain):

```
/looptasks ~/projects/my-brain/10-projects/subscriptions/BRIEF-qa.md
```

**Một chỗ phải chú ý:** công cụ này sinh ra cho dev nên mặc định **tưởng việc nào cũng
đẻ ra code để lưu lại**. Việc QA thì thường không. Với việc chỉ ra báo cáo, bắt buộc
ghi thẳng vào mô tả:

```
- KHÔNG sinh code, KHÔNG commit. Kết quả là báo cáo ghi dưới việc này.
```

Không ghi thì nó sẽ đi tìm gì đó để sửa cho *có cái mà lưu*.

---

## 9. Jira — kéo ticket vào thẳng

Máy đã cắm sẵn Jira. Không cần cấu hình gì thêm, chỉ cần nói:

> "Lấy nội dung ticket SB-14901 và tóm tắt AC cho tôi."

> "Liệt kê các ticket đang ở trạng thái Ready for QA trong sprint hiện tại."

Đỡ được bước copy-paste, và ticket vào context ở dạng gọn thay vì cả trang web.

---

## Lộ trình 3 tuần

Đừng làm hết một lúc.

| Tuần | Làm gì | Xong thì được gì |
|---|---|---|
| **1** | Bật statusline · thêm mục `## Test` vào `CLAUDE.md` · tập thói quen `/clear` mỗi ticket | Không còn bị "nó quên mất tôi dặn gì" |
| **2** | Thêm `permissions` vào `settings.json` · tập dùng **agent phụ** cho mọi việc chạy test / đọc log | Đỡ bị hỏi xin phép, trí nhớ không đầy nữa |
| **3** | Tạo `qa-verifier` · gói quy trình hay lặp thành skill | Không còn tự chấm bài, kết luận có bằng chứng |

Hook và `/looptasks` để sau, khi thấy thật sự cần.

---

## Checklist cấu hình

- [ ] `~/.claude/settings.json` có `permissions.allow` cho lệnh test
- [ ] `~/.claude/settings.json` có `statusLine` → thấy `ctx %` dưới màn hình
- [ ] `CLAUDE.md` của repo có mục `## Test`, lệnh **chạy thử rồi** chứ không phải đoán
- [ ] `~/.claude/agents/qa-verifier.md` tồn tại
- [ ] Biết `/clear` làm gì và không sợ bấm nó

## Ba thói quen quan trọng hơn mọi cấu hình

1. **Một ticket một cuộc trò chuyện.** Xong thì `/clear` — nhưng trước khi clear, bảo nó
   ghi lại kết quả để bạn dán vào ticket
2. **Việc nặng thì giao agent phụ**, đừng để output dài chảy thẳng vào trí nhớ
3. **Đòi số, đừng nhận lời kể.** "Đã test, pass hết" không phải bằng chứng —
   lệnh + mã kết thúc + số pass/fail mới là

## Muốn đi sâu hơn

Mỗi lần một file, đừng đọc hết một lúc:

1. [[ai-eng-thuat-ngu]] — từ điển, tra khi gặp từ lạ
2. [[ai-eng-02-context]] — trí nhớ hoạt động thế nào
3. [[ai-eng-03-harness]] — verifier, skill, hook đầy đủ
4. [[ai-eng-04-loop]] — `/looptasks` đầy đủ
5. [[ai-eng-guide]] — bức tranh 5 tầng
