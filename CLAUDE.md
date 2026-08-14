# my-brain — Schema & Operating Manual (Layer 3)

Bạn (Claude / LLM agent) là **người bảo trì wiki này**. Con người capture thô;
bạn làm phần bookkeeping: phân loại, liên kết, giữ nhất quán, cập nhật index.
Mô hình: "compile once, keep current" (Karpathy LLM-wiki) — KHÔNG re-derive mỗi lần hỏi.

## 3 Layers (không được phá vỡ)

1. **`sources/` — IMMUTABLE.** Nguồn thô (PDF, transcript, bài lưu). KHÔNG BAO GIỜ sửa file ở đây. Chỉ đọc + trích dẫn.
2. **Wiki (mọi thư mục khác) — bạn SỞ HỮU.** Tự do tạo/sửa/link/gộp note. Đây là nơi kiến thức "chín".
3. **`CLAUDE.md` + `index.md` — điều hướng.** Đọc `index.md` ĐẦU TIÊN để biết brain có gì, rồi mới drill vào file cụ thể.

## Cấu trúc (PARA + Zettelkasten hybrid)

| Thư mục | Ý nghĩa (PARA) | Khi nào dùng |
|---------|----------------|--------------|
| `00-inbox/` | Capture | Note thô chưa phân loại. Bạn xử lý → chuyển đi. |
| `10-daily/` | — | Nhật ký ngày `YYYY-MM-DD.md` (ephemeral). Nguyên liệu cho review. Skill `/today`. |
| `10-projects/` | **P**rojects | Có mục tiêu + deadline. Xong → `40-archive/`. |
| `20-areas/` | **A**reas | Trách nhiệm duy trì lâu dài (health, career, finance). Không có "xong". |
| `30-resources/` | **R**esources | Chủ đề quan tâm, tài liệu học. `learns/` sống ở đây. |
| `40-archive/` | **A**rchive | Đã xong / không active. |
| `notes/` | Zettelkasten | Note atomic (1 ý / 1 file), liên kết bằng `[[...]]`. Tầng insight. |
| `70-decisions/` | — | Nhật ký quyết định. Mỗi file BẮT BUỘC có **Why** + **Tradeoff**. Skill `/decision`. |
| `feedback/` | — | Feedback nhận được. Kèm **Why** + **How to apply**. |
| `sources/` | Layer 1 | Nguồn thô immutable. |

## Quy tắc bảo trì

1. **Xử lý inbox:** với mỗi file trong `00-inbox/`, quyết định type → thêm frontmatter → move vào layer đúng → gợi ý `[[links]]` tới note liên quan → cập nhật `index.md`.
2. **Atomic:** mỗi note trong `notes/` chỉ 1 ý. Note dài → tách nhỏ + link.
3. **Link liberally:** dùng `[[slug]]` (không đuôi .md). Link tới note chưa tồn tại cũng OK — nó đánh dấu việc cần viết sau.
4. **Provenance:** kiến thức tổng hợp phải trỏ nguồn qua field `source:` để tránh bịa đặt bị đóng băng thành "sự thật". Nếu không chắc → ghi "chưa xác minh".
5. **Tránh folder lồng sâu** (cái bẫy của dev). Ưu tiên note phẳng + link hơn là nested folders.
   Ngoại lệ: `10-projects/<project>/` **một tầng** khi project đã có ≥2-3 file riêng (note + brief +
   PRD…). Project nhỏ giữ note phẳng. Sâu hơn một tầng thì không — `brain-gitlog`/`brain-weekly`
   chỉ glob 2 mức, và slug wiki-link là tên file nên lồng sâu chỉ thêm đường dẫn chứ không thêm gì.
6. **Đừng over-engineer frontmatter.** Giữ nhẹ (xem schema dưới). Không thêm field nếu không dùng.
7. **Cập nhật `index.md`** mỗi khi thêm/di chuyển note đáng kể — đây là bản đồ, phải luôn đúng.
8. **Mỗi note PHẢI có `summary:`** (1 câu TLDR trong frontmatter). LLM đọc summary để quyết định có mở full note không — rẻ vài giây, tiết kiệm việc đọc file không liên quan. Dòng trong `index.md` nên khớp với `summary:` của note (nguồn để auto-generate index sau này). Daily notes ephemeral — không bắt buộc summary.
9. **Tag phải nằm trong `tags.md`** (taxonomy). Cần tag mới → khai báo ở `tags.md` TRƯỚC rồi mới dùng. Chống tag sprawl.
10. **Chạy `bin/brain-lint` trước khi commit** — báo link hỏng, note thiếu summary, note orphan, tag ngoài taxonomy. Sạch rồi mới commit.
11. **Decision BẮT BUỘC có `review:` (YYYY-MM-DD).** `bin/brain-review` đọc field này mỗi thứ Hai và bắt quyết định quá hạn phải chứng minh mình còn đúng. Quyết định không có ngày review là quyết định không bao giờ bị thách thức — đó là cách giả định cũ đóng băng thành "sự thật".
12. **`notes/moc-<chủ-đề>.md` là bản đồ theo chủ đề.** `index.md` là bản đồ toàn cục và không được phép phình mãi; khi một chủ đề đủ lớn (xem `bin/brain-graph`), tách nó ra MOC và để index trỏ tới MOC. MOC là danh sách CÓ CHỌN LỌC kèm một dòng "khi nào mở note này", không phải bãi đổ link.
13. **Wiki-link không được nằm trong code block.** `[[...]]` trong ví dụ code là cú pháp ngôn ngữ khác, không phải link — `brain-lint` bỏ qua code block, nhưng đặt link thật vào đó thì graph mất cạnh.

## Bộ máy tự động (2 nhóm, đừng lẫn)

| Nhóm | Job | Nhịp | Việc |
|------|-----|------|------|
| **Sinh** | `brain-gitlog` | 06:00 hằng ngày | git log các repo → proposal `shipped-*` |
| | `brain-digest` | 19:00 hằng ngày | session transcript của Claude Code → proposal `digest-*` |
| | `brain-weekly` | 18:00 Chủ nhật | tổng hợp tuần → resource / area / stale project / **knowledge gap** |
| | `brain-review` | 09:00 thứ Hai | decision quá hạn `review:` → HOLDS / AMEND / REVERSED / MOOT |
| | `brain-compact` | 10:00 ngày 1 hằng tháng | gộp, nâng cấp lên resource, archive note chết, tách MOC |
| **Giữ** | `brain-learn` | trong brain-sync | inbox → phân loại + frontmatter + link + index |
| | `brain-sync` | 20:00 hằng ngày | learn → lint → doctor → index → commit → push |

**Luật bất di bất dịch của nhóm Sinh:** chỉ được ghi vào `00-inbox/`. Không mature,
không sửa `index.md`, không đụng `sources/`, không commit, không xoá. Thao tác mạnh
nhất mà `brain-compact` được phép đề xuất là *move sang `40-archive/`* — có thể lùi lại.

**Không có gì đáng ghi thì KHÔNG tạo file.** Digest rỗng là thành công, không phải
thất bại. Job nào cũng phải chịu được một ngày/tuần/tháng im lặng.

### Prompt sống trong `prompts/`, không nhúng trong bash

Xem `prompts/README.md`. Lý do: heredoc không quote từng làm shell chạy backtick
trong prompt và gửi đi bản khuyết chữ suốt nhiều tuần mà không ai biết.

### Hai lệnh kiểm tra, hai phạm vi khác nhau

| Lệnh | Kiểm cái gì |
|------|-------------|
| `bin/brain-lint` | **tri thức** — link hỏng, thiếu summary, orphan, tag ngoài taxonomy |
| `bin/brain-doctor` | **bộ máy** — job có chạy không, có lỗi mới không, doc có nói dối không, inbox có kẹt không, decision có quá hạn không, **BRIEF có mục ruỗng không** (lock ⏳ treo, task [P0]/[P1] nằm lì, tỉ lệ FAIL của verifier) |

`bin/brain-graph` không kiểm gì cả — nó ĐẾM (cụm chủ đề, note lạnh, cặp trùng, hub)
để `brain-compact` có dữ liệu thật thay vì để LLM đoán.

## Frontmatter schema (giữ nhẹ)

```yaml
---
type: project | area | resource | note | feedback | source | daily | decision
title: <ngắn gọn>
summary: <1 câu TLDR — LLM đọc dòng này để quyết định có mở full note không>
tags: [tag1, tag2]
created: YYYY-MM-DD
updated: YYYY-MM-DD
source: [[slug-nguon]]   # optional — chỉ khi là kiến thức tổng hợp
status: active | done    # optional — cho projects
---
```

## Khi nào thêm RAG / vector DB

**Hiện tại: KHÔNG dùng.** `index.md` + MOC + ripgrep là đủ. Graph tự sinh từ
`[[wiki-links]]` — không cần graph DB.

`bin/brain-index` + `bin/brain-search` (sqlite-vec + embeddings chạy local) vẫn
nằm trong repo nhưng **chưa build index** và `brain-sync` chỉ chạy chúng khi
`.index/brain.db` đã tồn tại. Đây là lựa chọn, không phải bỏ quên —
`brain-doctor` báo trạng thái này ở mức INFO mỗi tối.

Ngưỡng cũ ghi "~100 nguồn" đã trôi qua (đang 130 note) mà tra cứu vẫn tốt, nên
nó là ngưỡng sai. Điều kiện đúng là **đo được**, không phải đếm file:

> Build index khi một truy vấn thường gặp bằng `rg` trả về **>30 file**, hoặc khi
> `bin/brain-ask-log --stats` cho thấy tỉ lệ MISS **>30%** mà nguyên nhân là
> *không tìm ra* chứ không phải *chưa có note*.

Trước đó, thêm vector DB chỉ là thêm một daemon nền phải giữ sống.
