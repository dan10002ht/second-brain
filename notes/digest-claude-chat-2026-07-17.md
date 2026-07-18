---
type: note
title: Digest cleanup disk 2026-07-17 — thủ phạm thật thường là Docker/Colima VM
summary: Khi disk macOS phình real-time, thủ phạm thường là Docker/Colima VM (qcow2) + build cache, không phải project files hay macOS update; cách dọn an toàn.
tags: [tooling, debug]
created: 2026-07-17
source: claude-chat (session history)
---

# Digest cleanup disk — 2026-07-17

## Bug / root cause (gotcha tái dùng)

- **Disk còn 1G, tụt đều real-time** — nghi macOS update (`os.update` local snapshots của `tmutil`) nhưng **thủ phạm thật = Docker/Colima VM đang phình**: `.colima` (~14G thực) + build cache balloon liên tục. Các file này **sparse** → `du` thường phải đo dung lượng thực (qcow2). Colima (qcow2 hỗ trợ discard) **trả chỗ về host** sau khi prune, khác Docker Desktop.
- Bài học: gặp disk tụt liên tục lúc đang chạy container → soi Docker/Colima trước, không đoán macOS update.

## Techniques

- **Dọn an toàn (tự tái tạo)**: `docker builder prune` (build cache), gỡ image mồ côi/trùng lặp (postgres 15/18-alpine variants thừa...), editor cache `CachedData`/`Cache`/`GPUCache` (biên dịch, tự tạo lại). Cursor `workspaceStorage` xoá được (~880M).
- **Giữ lại**: model AI (TabNine) — xoá phải tải lại; `node_modules` của project **active**; project data thật trong volume.
- Kết quả session: 1G → ~9.6G free bằng cache; phần lớn thu hồi bền vững đến từ Docker (3.0G → 1.1G ở dự án khác).

## Liên quan
- [[dev-skills]] · [[digest-moonie-2026-07-17]] (cũng gặp Docker/Colima bloat) · [[colima-docker-disk-bloat]]
