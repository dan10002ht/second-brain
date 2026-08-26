# Joy Subscription — BRIEF

<!--
  `[ ]` chưa làm · `[⏳ HH:MM]` đang chạy · `[⏸️]` chờ người, đừng nhận · `[✅ YYYY-MM-DD]` xong
  Task xong quá 3 ngày → /looptasks tự dọn sang BRIEF-done.md
  Chạy (cwd = repo subscriptions, không phải brain):
  /loop 5m /looptasks ~/projects/my-brain/10-projects/subscriptions/BRIEF.md

  Gate của repo này (JS thuần — KHÔNG có tsc):
    ⚠️ CHẠY THẲNG BINARY, ĐỪNG QUA `rtk` — `rtk` NUỐT EXIT CODE.
       Đã vấp thật (task #18): agent báo "jest exit 0" trong khi 9 suite đang fail.
       Verifier phải tự `echo $?` và đọc số suite/test trong output, không tin dòng tóm tắt.
    yarn check                                  # node .claude/scripts/check.mjs — locale-parity + ...
       Đây là gate CHẶN COMMIT. Phải exit 0.
       Đã vấp: `check` từng chặn bằng 5 violation vốn có SẴN của repo, không phải lỗi mình.
    yarn workspace @avada/functions test        # jest --config jest.config.js
       ⚠️ FAIL SẴN — exit 1 là bình thường. Baseline gần đây: ~9 suite fail / ~5 test fail.
       Cách chấm đúng: **không suite nào MỚI đỏ**, số passed tăng đúng bằng test mình thêm.
    yarn workspace @avada/assets test           # jest — thường exit 0, ~6 suite / ~86 test
    yarn workspace @avada/functions run production   # babel src → lib/
    yarn workspace @avada/assets   run production    # vite build × 2 (embed + standalone)

  ⚠️ BASELINE THAY ĐỔI THEO NHÁNH — ĐỪNG CHÉP SỐ Ở TRÊN VÀO BRIEF, HÃY ĐO LẠI.
     Số trên chỉ để nhận ra "đỏ sẵn ≠ mình làm đỏ". Cách đo đúng: `git archive <HEAD trước
     thay đổi>` ra thư mục tạm rồi chạy tách biệt — KHÔNG đụng worktree đang review.

  ⚠️ Thí nghiệm đỏ-trước: subagent BỊ CẤM chạy git, và repo đang có ~233 stash của user.
     Muốn dựng lại bug cũ thì copy file ra scratchpad rồi sửa bản copy — đừng `git stash`.
     (Đã vấp task #22: agent tự stash/pop, rủi ro thật với đống stash đó.)
-->


## Tasks

_(trống — task kookut ở `BRIEF-kookut.md`, task đã xong ở `BRIEF-done.md`,
task bỏ giữa chừng ở `BRIEF-dropped.md`)_
