---
type: note
title: Layer 2 — Context
summary: Quản lý context window — context là ngân sách chứ không phải kho; CLAUDE.md làm nền, grep thay vì paste cả repo, đẩy state ra đĩa, monitor bằng ctx% trên statusline và biết lúc nào clear/compact/mở session mới.
tags: [ai, tooling, method, memory]
created: 2026-08-05
---

# Layer 2 — Context

## Layer này là gì

Context = **toàn bộ text model nhìn thấy khi trả lời**. Gồm: system prompt, `CLAUDE.md`,
lịch sử chat, file nó đã đọc, output mọi lệnh Bash nó chạy. Vai của bạn: **editor** —
quyết định cái gì vào, cái gì không.

Nguyên tắc gói gọn một câu:

> Context là **ngân sách**, không phải kho. Mỗi thứ bạn nhét vào làm loãng những thứ khác.

Hai chiều đều hỏng:

| Sai lầm | Biểu hiện | Hậu quả |
|---|---|---|
| Nhồi quá nhiều | paste cả file 2000 dòng "cho chắc" | context rot — phần giữa bị bỏ sót |
| Để trống | `fix cái webhook này` | model đoán, sửa nhầm 1 trong 3 chỗ handle webhook |

## Khi nào bạn đang ở đây

- Nó sửa **đúng logic nhưng sai file** — repo có nhiều chỗ giống nhau, nó chỉ thấy một
- Nó viết lại thứ đã có sẵn trong repo (util trùng, helper trùng)
- Phiên chat dài rồi thì nó bắt đầu quên ràng buộc bạn nêu ở đầu
- Hai agent song song ra hai kết quả không khớp nhau

## Cơ bản

**1. `CLAUDE.md` là nền — đưa vào đó thứ đúng ở MỌI lượt.**

Ba tầng, nạp tự động:

| File | Phạm vi | Ghi gì |
|---|---|---|
| `~/.claude/CLAUDE.md` | mọi repo | cách làm việc chung, ngôn ngữ giao tiếp |
| `<repo>/CLAUDE.md` | repo đó | stack, cấu trúc thư mục, lệnh build/test, convention commit |
| `<repo>/<thư-mục>/CLAUDE.md` | thư mục con | quy ước riêng của package đó |

Giữ **mỏng**. File này tốn token ở *mọi* lượt chat — nhét 300 dòng vào là bạn trả tiền
cho 300 dòng đó suốt ngày. Thứ chỉ đúng đôi lúc thì để trong skill hoặc note, không để đây.

**2. Grep ra chỗ liên quan rồi mới đưa, đừng paste cả repo.**

- Đừng: Paste `orderService.js` 1800 dòng
- Nên: `rg -n "syncOrder" packages/functions/src` → đưa 3 chỗ thật sự liên quan

Claude Code tự đọc file được — thường chỉ cần **chỉ đường**: "logic sync nằm ở
`packages/functions/src/services/orderService.js`, chỗ tương tự còn ở `webhookHandler.js`".

**3. `/clear` giữa hai việc khác nhau.**

Chat xong bug A rồi hỏi tiếp feature B trong cùng session = model vẫn đang mang theo
toàn bộ context của A. Vừa tốn tiền vừa gây nhiễu (nó hay kéo A vào B).
Việc mới → `/clear`.

**4. Sửa lỗi thì quét HẾT chỗ tương tự, và nói cho nó biết điều đó.**

Đây là convention của team. Đưa vào prompt: "grep mọi nơi dùng cùng pattern, đừng chỉ
sửa chỗ tôi chỉ". Không nói thì nó sửa đúng một chỗ và báo xong.

**5. Đừng để một session sống quá lâu.** Session dài → compact → sau compact model
nhớ mờ. Nếu việc dài, đẩy state ra file (xem Nâng cao) rồi mở session mới.

## Nâng cao

**Chia context, đừng nhồi context.** Subagent có context window **riêng**. Việc cần đọc
nhiều mà chỉ cần một câu trả lời (recon, khảo sát, tìm chỗ dùng) thì giao subagent:
nó đọc 40 file trong context của nó, trả về 5 dòng vào context của bạn.

Đây là lý do `/looptasks` dùng agent `Explore` để recon vùng file trước khi chia task.

**Đẩy state bền ra đĩa.** Cái gì phải sống lâu hơn một session thì không được ở trong
context. Ví dụ đang chạy thật:

- `BRIEF.md` — task list của `/looptasks`, checkbox `[ ]` / `[⏳ HH:MM]` / `[✅ ngày]`.
  Sống qua restart, sync đa máy, cron 5 phút đọc lại được
- `.claude/content-plan/<KEY>.json` (project aws) — plan bền trên đĩa, resume được qua
  nhiều phiên ([[digest-aws-2026-07-27]])
- Second brain — xem [[ai-eng-03-harness]]

**Không đứa nào được vừa viết vừa chấm.** Verifier phải có context **sạch**: nó không
nên thấy report của agent viết code. Thấy rồi thì nó có xu hướng tin. Trong `/looptasks`
quy tắc là không dán report của coder vào brief của verifier; buộc phải đưa thì gắn nhãn
"tuyên bố của agent, cần kiểm chứng".

**Agent song song không chia sẻ context — và đó là bug chờ xảy ra.** Ở project aws,
3 bài capstone sinh song song: cap-01/02 dùng ví dụ "TaskShare", cap-03 dùng "Quicklink"
— vì không agent nào thấy output của agent kia ([[digest-aws-2026-07-27]]).
Việc cần **liền mạch** thì đừng fan-out, hoặc phải chốt trước phần chung rồi mới bung.

**Cẩn thận output Bash.** Một lệnh `yarn build` in 2000 dòng là 2000 dòng vào context.
Lọc trước: `2>&1 | tail -30`, `grep -c`, `--silent`.

## Setup — `CLAUDE.md` cho một repo Avada

`/init` sinh bản nháp từ codebase. Đừng giữ nguyên bản nháp đó — nó dài và mô tả lại
thứ code đã nói. Cắt còn khung này:

````markdown
# <tên app>

## Stack
Node 20 · Firebase Functions · Firestore · Redis · Preact + Polaris · monorepo yarn workspaces

## Lệnh
- build: `yarn build`
- test: `yarn test packages/functions`
- typecheck: `yarn tsc --noEmit`
- lint: `yarn lint` (chỉ chạy trên file đã sửa, đừng chạy cả package)

## Cấu trúc
- `packages/functions/` — backend; webhook handler ở `src/handlers/`
- `packages/assets/` — embedded app (Preact)
- `packages/extensions/` — theme app extension

## Convention
- Commit: `type - role - scope`, không thêm trailer
- Không làm việc thẳng trên `master` — tạo nhánh
- Text hiển thị cho merchant: **tiếng Anh**
- Multi-tenant: mọi query Firestore phải kèm `shopId`

## Cạm bẫy repo này
- <lỗi đã trả giá, mỗi cái 1 dòng>
````

Ba nguyên tắc khi viết file này:

1. **Dưới ~60 dòng.** Nó tốn token ở mọi lượt chat, kể cả lượt không liên quan
2. **Chỉ ghi thứ không suy ra được từ code.** Cấu trúc thư mục thì `ls` là ra — đừng chép vào
3. **Lệnh phải chạy được thật.** Ghi `yarn test` mà repo dùng `yarn test:unit` thì agent
   chạy sai rồi báo "test không tồn tại"

Ba tầng, nạp chồng lên nhau:

| File | Ghi gì |
|---|---|
| `~/.claude/CLAUDE.md` | cách làm việc chung, ngôn ngữ giao tiếp, kỷ luật git |
| `<repo>/CLAUDE.md` | khung ở trên — commit vào repo cho cả team |
| `<repo>/packages/x/CLAUDE.md` | chỉ khi package đó có quy ước riêng thật |

`CLAUDE.md` import được file khác bằng `@đường-dẫn` trên một dòng riêng:

```
@RTK.md
@/Users/ban/projects/my-brain/brain-core.md
```

Tiện, nhưng nhớ file được import **cũng vào context mọi lượt** — chi phí y hệt như viết
thẳng vào. Cách chia tầng cho khỏi trả tiền oan: xem [[ai-eng-03-harness]].

Lệnh hằng ngày:

```
/init      sinh nháp CLAUDE.md từ codebase
/clear     xoá context, bắt đầu việc mới
/context   xem context đang chiếm bao nhiêu, tách theo nhóm
/compact   nén lịch sử chat lại (xem mục dưới — đây là cứu vãn, không phải công cụ)
```

## Monitor — nhìn thấy context đang đầy tới đâu

Vấn đề của layer 2 là **bạn không thấy nó**. Context đầy dần một cách im lặng cho tới
lúc model bắt đầu quên. Cách chữa: đưa con số lên statusline, nhìn thấy mọi lượt.

### Bật `ctx %` trên statusline

`~/.claude/settings.json`:

```json
{
  "statusLine": {
    "type": "command",
    "command": "bash ~/.claude/statusline.sh",
    "padding": 0
  }
}
```

`~/.claude/statusline.sh` — Claude Code đẩy một JSON vào stdin mỗi lượt, trong đó có
`transcript_path`; phần trăm tính từ usage của lượt cuối:

```bash
#!/usr/bin/env bash
# Hiện: 📁 thư mục   nhánh(*=bẩn)   model   ctx N%
input=$(cat)

model=$(printf '%s' "$input" | jq -r '.model.display_name // "?"')
model_id=$(printf '%s' "$input" | jq -r '.model.id // ""')
dir=$(printf '%s' "$input" | jq -r '.workspace.current_dir // .cwd // ""')
transcript=$(printf '%s' "$input" | jq -r '.transcript_path // ""')

ctx=""
if [ -n "$transcript" ] && [ -f "$transcript" ]; then
  used=$(tail -n 400 "$transcript" 2>/dev/null | jq -s '
    [ .[]
      | select(.isSidechain != true)          # bỏ entry của subagent — context của chúng riêng
      | select(.type == "assistant")
      | select(.message.usage != null)
      | .message.usage
    ] | last
    | if . == null then 0 else
        (.input_tokens // 0) + (.cache_read_input_tokens // 0)
        + (.cache_creation_input_tokens // 0) + (.output_tokens // 0)
      end
  ' 2>/dev/null)
  if [ -n "$used" ] && [ "$used" != "null" ] && [ "$used" -gt 0 ] 2>/dev/null; then
    limit=200000
    case "$model_id" in *1m*) limit=1000000;; esac
    reserve=45000                              # chỗ dành cho output + buffer trước auto-compact
    pct=$(( used * 100 / (limit - reserve) ))
    [ "$pct" -gt 100 ] && pct=100
    ctx="ctx ${pct}%"
  fi
fi

printf "%b" "\033[2m📁\033[0m $(basename "$dir")  \033[2m${model}\033[0m  \033[36m${ctx}\033[0m"
```

Ba chi tiết trong script không phải tuỳ tiện:

| Chi tiết | Vì sao |
|---|---|
| Bỏ `isSidechain` | Subagent có context window **riêng**. Cộng vào là con số vô nghĩa |
| Cộng cả `output_tokens` | Output lượt vừa rồi nằm trong input của lượt kế tiếp |
| `reserve=45000` | Window không dùng hết được — phải chừa chỗ cho output và buffer trước auto-compact |

`reserve` là **hằng số ước lượng**. Chạy `/context` để đối chiếu, lệch nhiều thì chỉnh lại.

### Đọc con số đó thế nào

| ctx % | Làm gì |
|---|---|
| dưới 40 | Thoải mái, không phải nghĩ |
| 40–60 | Xong việc đang làm thì `/clear` trước khi bắt việc mới. **Đừng** mở việc mới ở đây |
| 60–80 | Không bắt đầu việc mới. Chốt state ra file trước khi đi tiếp |
| trên 80 | Sắp auto-compact. Ghi state ra đĩa **ngay**, rồi `/clear` |

Ngưỡng này là kinh nghiệm dùng, không phải giới hạn kỹ thuật — chất lượng giảm dần chứ
không rơi đột ngột ở một mốc nào.

## Khi nào mở session mới

Phần trăm chỉ là một tín hiệu, và không phải tín hiệu quan trọng nhất. **Đổi việc thì
`/clear`, bất kể ctx bao nhiêu** — session 15% context nhưng đang mang theo cả cuộc debug
Firestore thì vẫn kéo Firestore vào task CSS tiếp theo.

Dấu hiệu phải mở session mới, kể cả khi ctx còn thấp:

- Đổi sang việc khác — kể cả cùng repo
- Model bắt đầu **quên ràng buộc bạn nêu ở đầu** (viết tiếng Việt vào text merchant, commit khi bảo đừng)
- Nó **sửa lại thứ vừa sửa xong**, hoặc đề xuất thứ đã bị bác
- Vừa auto-compact xong mà việc vẫn còn dài — sau compact nó nhớ mờ, đừng cố đi tiếp
- Bạn vừa cho nó thăm dò sai hướng và đọc một đống file không liên quan

### `/compact` vs `/clear` vs session mới

| | Làm gì | Dùng khi |
|---|---|---|
| `/compact` | Nén lịch sử thành tóm tắt, **giữ mạch việc** | Đang giữa một việc dài không cắt được. Chi tiết sẽ mất — chấp nhận |
| `/clear` | Xoá sạch, giữ nguyên `CLAUDE.md` | Đổi việc. Đây là cái dùng nhiều nhất |
| Session mới | Như `/clear` nhưng cwd/plugin nạp lại từ đầu | Đổi repo, hoặc vừa sửa `CLAUDE.md`/settings |

`/compact` là **cứu vãn, không phải công cụ**. Cần compact giữa việc nghĩa là state lẽ ra
phải nằm trên đĩa từ đầu.

### Handoff trước khi clear

Đừng `/clear` khi trong đầu nó còn thứ chưa ghi xuống. Một câu trước khi clear:

```
Trước khi tôi clear: ghi vào <BRIEF.md / note> — đang làm tới đâu,
đã thử gì không được (kèm lý do), file nào đã đụng, bước tiếp theo là gì.
Ngắn gọn, đủ để session sau đọc là làm tiếp được.
```

Session sau mở lên, đưa nó file đó là chạy tiếp — không phải kể lại từ đầu.

## Cạm bẫy

| Đừng | Nên thay bằng |
|---|---|
| Paste cả file rồi hỏi "có bug không" | Chỉ đường + mô tả triệu chứng, để nó tự đọc phần nó cần |
| Nhét mọi convention vào `CLAUDE.md` cho đủ | `CLAUDE.md` mỏng + skill cho quy trình + brain cho kiến thức tra khi cần |
| Chat 60 lượt trong một session cho 5 việc khác nhau | `/clear` giữa các việc |
| Main agent ôm hết report + output verify của mọi task → phiên càng dài càng loãng ([[looptasks-vs-workflow]]) | Đẩy kết quả trung gian ra file hoặc biến script |
| Tin rằng model "nhớ" cái bạn nói 40 lượt trước | Nhắc lại một dòng, hoặc ghi vào `CLAUDE.md` nếu đó là ràng buộc lâu dài |

## Checklist

- [ ] Repo này có `CLAUDE.md` chưa? Có lệnh build/test/lint trong đó chưa?
- [ ] Tôi đã chỉ đường tới file liên quan, thay vì paste?
- [ ] Việc này là việc mới → đã `/clear` chưa?
- [ ] Có cần quét chỗ tương tự không — đã ghi vào prompt chưa?
- [ ] Việc sống lâu hơn 1 session → state đã ở trên đĩa chưa?
- [ ] Việc đọc nhiều mà cần ít → có nên giao subagent không?
- [ ] Statusline có hiện `ctx %` chưa? (không thấy số thì không quản được)
- [ ] ctx trên 60% mà tôi đang định mở việc mới → clear trước
- [ ] Trước khi `/clear`: đã bảo nó ghi state ra file chưa?

## Liên quan

- [[ai-eng-01-prompt]] · [[ai-eng-03-harness]] · [[ai-eng-guide]]
- [[graph-engineering]] — shared state chảy giữa các node
