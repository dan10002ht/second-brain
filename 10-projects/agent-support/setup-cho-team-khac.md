---
type: project
title: Agent support 24/7 — hướng dẫn dựng cho team khác
summary: Hướng dẫn 5 team còn lại dựng lại Agent support 24/7 trên VM của mình, kèm 6 cái bẫy team Solar đã vấp và số đo chi phí thật.
tags: [project, avada, agent, support, automation, runbook]
created: 2026-08-25
updated: 2026-08-25
status: active
---

# Dựng Agent support 24/7 cho team của bạn

Viết cho 5 team còn lại theo yêu cầu chốt trong `C08MH3MP341` (deadline 7/9).
Team Solar đã dựng xong bản chạy được; tài liệu này để bạn **lắp app của mình vào**
thay vì mò lại từ đầu.

Bản gốc: VM `dantt-solar`, code ở `~/agent`, kho tri thức ở `~/agent/knowledge`.

---

## 1. Nó làm gì

```
helpdesk ──webhook──> [1] ingest        xác minh HMAC, dedupe, xếp hàng đợi
                      [3] gate          9 cổng an toàn
                      [4] triage        Claude đọc code, ra báo cáo root cause
                      [5] implement     Codex viết test đỏ→xanh trong worktree
                      [6] verify        Claude khác chấm chéo, không thấy lập luận của [4]
                                        ↓
                              MR **Draft** + báo Slack
```

Ba điều nó **không** làm, và đó là chủ ý:

- Không merge. MR luôn là `Draft:`, người review.
- Không ghi ngược helpdesk (webhook doc cảnh báo vòng lặp).
- Không đụng case chạm tiền khách / sửa dữ liệu prod / đổi schema — dừng, báo người.

## 2. Cần có trước

| Thứ | Xin ai | Không có thì |
|---|---|---|
| VM Linux (Ubuntu 24.04, ≥4 GB RAM, ≥48 GB đĩa) | anh Sam | — |
| Tailscale trên VM, bật `funnel` trong ACL `nodeAttrs` | tự làm | webhook không vào được |
| **Project Access Token** GitLab, role **Developer**, scope `api` + `write_repository` | Tech Lead | không clone / không mở MR được. **Deploy token KHÔNG đủ** — nó không gọi được API |
| Webhook trên `helpdesk.avada.net/admin/webhooks` | anh Quảng (TS Lead) | — |
| Service account GCP **chỉ quyền view** (Firestore + BigQuery + Logging) | người giữ GCP project | agent đoán theo code, tỉ lệ đúng thấp hẳn |
| Slack bot token `xoxb-` | admin workspace | agent báo cáo dưới tên cá nhân bạn |

**Chốt với TS trước một quy ước: case thế nào thì agent được đụng.** Team Solar dùng
"ticket có `slackLink` trỏ vào kênh support của team". Cách chặt hơn là thêm điều kiện
"đã có người được assign" (cờ `REQUIRE_ASSIGNEE=true`). Không có quy ước này thì câu
"agent chỉ làm case risk thấp" không kiểm chứng được.

## 3. Dựng máy

```bash
# swap — thiếu là bị OOM-kill lúc 2h sáng, log không nói gì rõ ràng
sudo fallocate -l 8G /swapfile && sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# service --user phải sống sau khi logout, nếu không thì "24/7" là nói dối
sudo loginctl enable-linger $USER

# Node 20 (khớp CI image node-20-19-5) + công cụ
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs build-essential ripgrep jq
sudo corepack enable
sudo npm i -g @anthropic-ai/claude-code @openai/codex firebase-tools

# Codex tự sandbox bằng bubblewrap; Ubuntu 24.04 chặn user namespace mặc định
echo 'kernel.apparmor_restrict_unprivileged_userns=0' | sudo tee /etc/sysctl.d/99-agent-userns.conf
sudo sysctl -p /etc/sysctl.d/99-agent-userns.conf
```

### Tách user — đừng bỏ qua bước này

Agent chạy bằng user riêng **không có sudo**. Secret nguy hiểm (khoá giải mã token
merchant) nằm ở user khác, agent không đọc được. Agent hỏi Shopify qua `shopify-proxy`
chỉ cho `GET`.

```bash
sudo useradd -m -s /bin/bash agent && sudo passwd -l agent
sudo gpasswd -d agent sudo 2>/dev/null || true
sudo chmod 750 /home/$USER /home/agent
sudo loginctl enable-linger agent

# hàng đợi dùng chung giữa 2 user
sudo groupadd -f agentq
sudo usermod -aG agentq $USER && sudo usermod -aG agentq agent
sudo install -d -m 2770 -o $USER -g agentq /srv/agent

# BẮT BUỘC: tiến trình đang sống giữ nguyên danh sách nhóm cũ
sudo systemctl restart user@$(id -u $USER).service
sudo systemctl restart user@$(id -u agent).service
```

Rồi đăng nhập **cho user `agent`** (credential của bạn không dùng lại được — đó chính
là điểm của việc tách user):

```bash
sudo -u agent -H bash -lc 'cd ~ && claude'          # gõ /login
sudo -u agent -H bash -lc 'cd ~ && codex login --device-auth'
```

## 4. Lắp app của team vào

Sửa đúng 4 chỗ:

| Chỗ | Trong file | Sửa gì |
|---|---|---|
| `AGENT_APPS` | `~/.config/avada/agent.env` | `appName` trong payload ticket |
| `REPO_OF` | `triage.js`, `implement.js`, `verify.js` | `appName` → tên thư mục repo |
| `BASE_OF` / `BASE_BRANCH` | `implement.js`, `verify.js` | nhánh gốc của repo (`master`? `develop`?) |
| `PROJECT_PATH` | `verify.js` | đường dẫn project trên GitLab |
| `GATE_SLACK_CHANNEL` | `~/.config/avada/agent.env` | ID kênh support của team |

Rồi **viết runbook cho app của bạn** — `knowledge/apps/<appName>.md`.

**Đây là việc quan trọng nhất, và là việc duy nhất không copy được từ team khác.**
Hạ tầng dựng xong trong một buổi; runbook mới là thứ quyết định agent giỏi hay dốt.

Runbook phải đi từ **triệu chứng khách kêu → chỗ phải nhìn → bẫy đã gặp**, không phải
mô tả kiến trúc chung chung. Xem `knowledge/apps/subscriptions.md` làm mẫu. Nguồn liệu
tốt nhất là chính lịch sử debug của team bạn.

Quy tắc: **mọi khẳng định trong runbook phải kiểm được trên repo.** Runbook sai còn tệ
hơn không có runbook — agent sẽ tin và đi sai hướng. Ghi "chưa xác minh" nếu chưa chắc.

## 5. Sáu cái bẫy team Solar đã vấp

Đọc mục này trước, đỡ mất một ngày.

| Triệu chứng | Nguyên nhân | Sửa |
|---|---|---|
| Codex sống hàng phút với **0% CPU**, không ghi gì | `execFile` của Node mở ống stdin và không đóng; `codex exec` chờ EOF mãi | `spawn` với `stdio: ['ignore', …]` |
| `git commit` báo **read-only file system** | git dir thật của worktree ở `<repo>/.git/worktrees/` — **ngoài** vùng ghi của sandbox | `codex exec --add-dir <git-common-dir>` |
| Mọi lệnh shell của Codex bị chặn: `bwrap: No permissions to create a new namespace` | Ubuntu 24.04 chặn user namespace không đặc quyền | sysctl ở mục 3. **Phải restart service** mới nhận |
| symlink `node_modules` hiện `??` trong `git status` | `.gitignore` ghi `node_modules/` chỉ khớp **thư mục**, symlink bị coi là file | ghi vào `$GIT_COMMON_DIR/info/exclude` — git **không** đọc `info/exclude` riêng của worktree |
| Worker không thấy case nào dù hàng đợi có file | file mode `600`, hoặc tiến trình **thiếu nhóm** vì `systemd --user` khởi động trước `usermod -aG` | mode `660` + `UMask=0002` trong unit; và `systemctl restart user@<uid>.service` |
| Claude Code báo `EACCES ~/.claude/settings.json` của user khác | cwd rơi vào home của user kia → nó tưởng đó là thư mục dự án | `WorkingDirectory=%h` trong unit |

## 6. Vận hành

```bash
# tắt khẩn cấp — worker dừng nhận case mới, case đang chạy chạy nốt
touch /srv/agent/PAUSE

# xem log
journalctl --user -u agent-ingest -f
sudo -u agent XDG_RUNTIME_DIR=/run/user/$(id -u agent) journalctl --user -u agent-triage -f

# hàng đợi đang ở đâu
curl -s localhost:8787/healthz | jq .queue

# chi phí và kết quả từng case
cat /srv/agent/stats.jsonl | jq -r '[.ticket,.ketThuc,.usdClaude,.verifier] | @tsv'
```

Bản tổng kết 08:30 mỗi sáng canh: **token GitLab sắp hết hạn** (agent chết im lặng
đúng ngày đó), service nào chết, case kẹt quá 60 phút.

## 7. Chi phí — đo, đừng đoán

Số đo thật ngày 2026-08-25 trên repo `subscriptions` (~245 MB, monorepo):

| Bước | Thời gian | Tiền |
|---|---|---|
| triage (Opus, 60 lượt) | 170–380 s | **~$2.1/case** |
| implement (Codex) | 60–190 s | tính theo token Codex |
| verify (Claude) | 130–200 s | thấp hơn triage |

30 case/đêm ≈ **$63/đêm**.

**Đừng vội đổi sang model rẻ hơn — đã đo, nó không phải đòn bẩy.** Cùng một ticket:

| | Opus | Sonnet |
|---|---|---|
| Chi phí | $2.112 | $1.810 (**chỉ rẻ hơn 14%**) |
| Thời gian | 377 s | 273 s |
| Độ tin cậy báo cáo | medium | medium |

Lý do: `cache_read_input_tokens` = **3.121.444**, trong khi token đầu ra chỉ 19.769.
Tiền nằm ở **khối lượng context agent đọc**, không nằm ở bậc model — nó grep qua một
monorepo 245 MB và mỗi lượt lại kéo lại context.

Đòn bẩy thật là **làm agent đọc ít hơn**:

- **Runbook chỉ đúng chỗ hơn** — bảng "triệu chứng → nhìn đâu" tốt sẽ cắt hẳn giai
  đoạn mò. Đây lại là lý do nữa để đầu tư vào runbook.
- **Giảm `--max-turns`** — đang để 60, Sonnet chỉ dùng 35. 60 là quá rộng.
- **Thu hẹp phạm vi grep** cho agent (chỉ `packages/functions/src` chẳng hạn).

Nếu đổi model xong rồi yên tâm là đã tối ưu, bạn sẽ tối ưu nhầm chỗ.

## 8. Đừng bật MR ngay

Giữ `ENABLE_MR=false` cho tới khi bạn đọc vài chục báo cáo và thấy tỉ lệ đúng chấp
nhận được. Ở chế độ đó, PASS chỉ ghi nội dung MR ra `/srv/agent/mr-draft/`.

Số liệu team Solar ngày đầu: **4 ticket → 0 MR**. Hai case qua được kiểm máy
(test đỏ trước xanh sau) nhưng bị verifier độc lập chặn:

- một case: test đỏ trước fix vì **thiếu file import**, không phải vì tái hiện được bug
- một case: bản sửa đọc `shop.ianaTimezone` trong khi luồng thật giữ ở `shopInfo` →
  production vẫn lỗi, test chỉ xanh vì **tự chế input shape**

**Bằng chứng đỏ→xanh một mình là không đủ.** Nếu bỏ lớp verifier độc lập, cả hai đã
thành MR và trông hoàn hảo trên giấy: có test, diff nhỏ, không chạm file cấm.
