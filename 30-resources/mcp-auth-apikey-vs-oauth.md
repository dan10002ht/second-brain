---
type: resource
title: Auth cho MCP server — API key hay OAuth, và vì sao không phải build riêng cho từng client
summary: MCP có Authorization spec chuẩn (OAuth 2.1 + RFC 9728) nên implement một lần là mọi client tuân spec dùng được — không có nhánh `if (client === 'claude')`; còn dùng nội bộ một người một máy thì API key qua header là đủ, dựng authorization server chỉ để tự login vào server của mình là thừa.
tags: [ai, auth, http, backend, sdk, saas]
created: 2026-08-12
updated: 2026-08-12
source: project "claude-chat" — session history 2026-08-12 (bàn về `https://mcp.joy.so` và MCP server cho Joy Subscription)
---

# Auth cho MCP server — chọn gì, và cái gì là chuẩn chung

## Kết nối một MCP server HTTP vào Claude Code

```bash
claude mcp add --transport http --scope user joy https://mcp.joy.so/mcp
```

Lưu ý: endpoint là `/mcp`, không phải domain trần.

## Một implement, mọi client — không build riêng theo client

MCP có **Authorization spec** chính thức dựa trên **OAuth 2.1** + RFC (trong đó có **RFC 9728**
Protected Resource Metadata). Hệ quả:

> Không có "OAuth cho Claude" và "OAuth cho Cursor". Cùng một server, cùng bộ endpoint, cùng một
> code path. **Không có nhánh `if (client === 'claude')` ở đâu cả.**

Lý do: client không tự chọn cách xác thực — nó **đọc metadata** của server rồi đi theo. Server khai
mình cần gì, client tuân spec sẽ làm đúng. Cái phải làm đúng là **spec**, không phải từng client.

⚠️ "Mọi AI assistant" thì hơi lạc quan — đúng hơn là *mọi client tuân spec*. Client không implement
phần authorization của MCP thì vẫn không dùng được, và đó là vấn đề của client.

## API key hay OAuth — quyết theo ai là người dùng

| Tình huống | Chọn |
|---|---|
| **Bạn, một người, một máy**, gọi server của chính mình (ví dụ Claude Code ở terminal) | **API key** qua header. Dựng cả authorization server chỉ để tự login vào server của mình là thừa |
| Nhiều merchant / user ngoài, mỗi người một danh tính và một tập quyền | **OAuth** theo MCP spec |

**Hai luồng sống chung trên một server được, và gần như mọi MCP server có auth đang làm vậy** —
chúng chỉ khác nhau ở **bước resolve identity**, phần sau đó (authorize + thực thi tool) dùng chung.

## Áp vào app Avada

Joy Subscription đã có sẵn hai lớp auth tái dùng được — ví dụ `middleware/tsToolAuthMiddleware.js`
(master API key qua header `X-DevZone-Key`). Tức là luồng API key **không phải viết mới**, chỉ là
mở đúng seam; còn luồng OAuth mới là phần phải dựng nếu muốn phục vụ merchant ngoài.

→ [[subscriptions]] · [[2026-08-12-mcp-settings-allowlist]] ·
[[shopify-token-exchange-migrate-offline-token]] · [[app-development]] ·
[[chan-agent-bang-cau-hinh]] · [[2026-08-11-sidekick-gate-message-khong-mang-chi-thi]]
