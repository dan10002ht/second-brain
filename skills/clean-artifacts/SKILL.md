---
name: clean-artifacts
description: Dọn artifact React cũ trong repo artifacts của Avada (joy-subscription-artifacts, và các repo artifacts app khác) khi repo phình to / không push được nữa. Dùng khi user nói "repo artifacts đầy rồi", "clean artifacts", "dọn build cũ", "git push bị reject vì repo quá lớn", hoặc trước khi CI không đẩy được bản build mới lên artifacts.
---

# clean-artifacts — dọn build React cũ trong repo artifacts Avada

## Bối cảnh (vì sao repo này tồn tại)

Pipeline Avada tách deploy làm 3 bước: build React → `firebase deploy --only functions,firestore,storage`
→ push file build sang **repo artifacts** dùng chung → pull repo đó rồi deploy lên Firebase Hosting.

Lý do: mỗi page dùng `React.lazy`, tên chunk có content hash nên **đổi mỗi lần build**. Nếu deploy
Hosting trực tiếp, file của bản cũ bị xoá → khách đang mở tab sẽ 404 / trắng trang giữa chừng.
Đẩy qua repo artifacts giữ được **cả bản cũ lẫn bản mới** cùng lúc trên Hosting.

Hệ quả: repo chỉ phình lên, không bao giờ tự co lại. Đến lúc push fail thì phải dọn tay — đó là skill này.

## Nguyên tắc cốt lõi

**File còn được build gần đây = còn khách đang dùng. Chỉ xoá file KHÔNG xuất hiện trong
commit nào của N ngày gần nhất.** Retention window là thứ duy nhất bảo vệ khách khỏi 404.

## Quy trình

Chạy script — nó đã bọc sẵn toàn bộ guardrail bên dưới:

```bash
~/projects/my-brain/skills/clean-artifacts/clean-artifacts.sh <repo-path> [--since "2 weeks ago"] [--apply]
```

- Không có `--apply` → **dry-run**: sinh 3 file danh sách + in báo cáo, không đụng gì.
- Có `--apply` → xoá file + `git commit`. **KHÔNG BAO GIỜ tự push** — để người review diff rồi push.

Mặc định `<repo-path>` = `~/projects/joy-subscription-artifacts`.

Luôn chạy dry-run trước, đọc báo cáo, rồi mới `--apply`.

### Ba lệnh gốc (script làm đúng việc này, cộng thêm guard)

```bash
git log --name-only --pretty="format:" --since="2 weeks ago" -- static/assets static/scripttag | sort | uniq > changed_files.txt
git ls-tree -r HEAD --name-only static/assets static/scripttag | sort > all_files.txt
comm -23 all_files.txt changed_files.txt > files_to_remove.txt
xargs -I {} sh -c 'test -f "{}" && rm -f "{}"' < files_to_remove.txt
```

3 file `.txt` này **được team track trong git** — giữ nguyên convention, commit kèm.

## Guardrails — không được bỏ qua cái nào

Script abort nếu vi phạm. Nếu bạn chạy tay, tự kiểm đủ 5 cái này:

| # | Check | Vì sao |
|---|-------|--------|
| 1 | `git fetch` + HEAD phải bằng `origin/<branch>` | **Failure mode đã gặp thật.** HEAD local cũ 4 tháng → `--since "2 weeks ago"` không match commit nào → `changed_files.txt` rỗng → `files_to_remove.txt` = TOÀN BỘ 27k file. Xoá sạch CDN. |
| 2 | `changed_files.txt` không được rỗng | Rỗng nghĩa là window không phủ commit nào — dữ liệu vô nghĩa, không phải "không có gì đổi". |
| 3 | Commit gần nhất chạm `static/` phải mới hơn window | Cùng gốc với #1: repo không có build mới trong window thì **không có gì an toàn để xoá**. |
| 4 | Tỉ lệ xoá < 90% tổng file | Xoá gần hết luôn là bug của bước sinh danh sách, không phải retention thật. |
| 5 | Entrypoint không hash bị **loại khỏi danh sách xoá** (không abort, có in cảnh báo) | 6 file `*-main.min.js` + `*.html` có **URL cố định không hash**, storefront theme trỏ thẳng vào. App nào không build trong window thì entrypoint của nó rơi vào diện xoá → merchant chết widget ngay, không cần reload. **Đã xảy ra thật** (2026-08-04: cod-form + 3 biến thể subscription-box). Chúng bị ghi đè mỗi build nên không tích luỹ — xoá không bao giờ đúng. |

## Lưu ý quan trọng

- **Xoá file + commit KHÔNG làm nhỏ `.git`.** History vẫn giữ blob (`.git` hiện ~1.9GB vs `static/` ~1.0GB).
  Việc dọn làm nhẹ checkout/clone và giải phóng chỗ cho build mới, chứ không giảm repo size trên GitLab.
  Muốn giảm thật phải rewrite history (`git filter-repo`) — team **cố ý không làm** để khỏi phá cache CDN đang phục vụ khách.
- **Doc gốc mâu thuẫn**: tiêu đề ghi "last 3 days" nhưng lệnh dùng `--since="2 weeks ago"`.
  Lấy **2 tuần** làm mặc định (an toàn hơn). Chỉ rút ngắn khi thật sự cần chỗ gấp.
- Cần **quyền write repo artifacts** trên GitLab (`gitlab.com/avada/artifacts/...`) mới push được.
- Repo này là **output do CI ghi đè** — ngoài việc dọn, đừng sửa file trong đó bằng tay.

## Common mistakes

| Sai | Đúng |
|-----|------|
| Chạy 3 lệnh gốc trên repo local đã lâu không pull | `git fetch && git pull` trước, hoặc để script check giùm |
| Thấy `files_to_remove.txt` to là mừng vì "dọn được nhiều" | To bất thường (>90%) = danh sách sai, dừng lại kiểm tra |
| `--apply` luôn không dry-run trước | Luôn đọc báo cáo dry-run trước |
| Tự push sau khi commit | Để người review `git show --stat` rồi push |
| Rút window xuống vài ngày cho xoá được nhiều | Window ngắn = khách đang mở tab bị 404 |

## Lần chạy thật gần nhất

**2026-08-04**, `joy-subscription-artifacts`, window 2 tuần: xoá **9.869/18.195 file (54%)**,
`static/` 608M → 316M, `assets/` 17.823 → 7.984, `scripttag/` 372 → 342. 4 entrypoint được guard 5 giữ lại.
Commit `fc1f6e4704`, chưa push.

## Liên quan

- Note brain: `10-projects/joy-subscription-artifacts.md` — bản đồ repo (Vite `static/assets` vs Webpack `static/scripttag`).
