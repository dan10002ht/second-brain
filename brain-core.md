# brain-core — thứ luôn đúng ở MỌI project

> File này được `~/.claude/CLAUDE.md` import, nên nó vào context ở **mọi repo**,
> không chỉ my-brain. Vì vậy: **giữ mỏng**. Chỉ thứ đúng bất kể đang ở repo nào.
> Chi tiết theo từng project sống trong wiki `~/projects/my-brain` — tra bằng skill `/brain`.

## Người dùng

dantt — dev tại **Avada Group**, chủ yếu **Shopify apps**. Sâu nhất: Joy Subscription
(Firebase Functions + Firestore + Redis + BigQuery). Ngoài ra: crm, backup, pdf, aws, joy loyalty.
**Giao tiếp bằng tiếng Việt.**

## Cách làm việc (đã lặp lại nhiều lần — không phải sở thích nhất thời)

- **Research trước khi code.** Đọc convention + cấu trúc sẵn có của app rồi mới viết. Đừng làm bừa.
- **Sửa lỗi là quét HẾT chỗ tương tự**, không chỉ chỗ được chỉ. Grep mọi nơi dùng cùng pattern.
- **Hỏi tăng dần.** Plan ngắn, mỗi lần 1–2 lựa chọn. Đừng dump kế hoạch dài phải cuộn.
- **Verify trước khi nói xong.** Chạy lệnh, đọc output, rồi mới kết luận.
- Text hiển thị cho khách/merchant nước ngoài → **tiếng Anh**. Mockup thì giữ nguyên để đối chiếu.

## Git — khác nhau theo loại repo

| Repo | Quy tắc |
|------|---------|
| **Project code** (subscriptions, pdf, crm, backup, aws, joy…) | KHÔNG push thẳng `master`/`main`. Tạo nhánh rồi commit. **Hỏi trước khi commit.** Message: `type - role - scope` |
| **my-brain** | Push thẳng `master` được (brain-sync tự commit master mỗi tối 20:00). Message mô tả, **không** trailer `Co-Authored-By` / `Claude-Session` |

"Implement thử" = làm nhưng **chưa commit**, trừ khi nói rõ.

## Second brain — có gì và tra thế nào

Wiki ở `~/projects/my-brain` (GitHub `dan10002ht/second-brain`), cấu trúc PARA + Zettelkasten.
Trong đó có thứ **repo không giữ được**: digest theo ngày của từng app (root cause + gotcha đã gặp),
`70-decisions/` (quyết định + Why + Tradeoff), `feedback/`, và note học tập.

**Trước khi debug một app Avada hay quyết định lại điều gì đó — tra brain trước.**
Rất có thể vấn đề đã gặp rồi và đã ghi. Dùng skill `/brain <câu hỏi>`, hoặc:

```bash
rg -i "<từ khoá>" ~/projects/my-brain --glob '!.git' -l
```

Bản đồ toàn bộ: `~/projects/my-brain/index.md`. Quy tắc bảo trì wiki: `~/projects/my-brain/CLAUDE.md`
(chỉ cần đọc khi đang **sửa** brain, không cần khi chỉ tra cứu).
