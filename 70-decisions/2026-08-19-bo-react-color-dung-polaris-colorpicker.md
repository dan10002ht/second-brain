---
type: decision
title: PDF Invoice bỏ react-color, tự dựng color picker trên Polaris ColorPicker
summary: Sau một vòng vá inline không đủ, `react-color` bị thay hẳn bằng Polaris `<ColorPicker>` + hex TextField + preset swatches, vì react-color walk lên `window.parent` (frame Shopify admin khác origin) trong web-component `ui-modal` và ném SecurityError.
tags: [avada, pdf, invoice, react, polaris, shopify]
created: 2026-08-19
updated: 2026-08-19
review: 2026-11-19
source: repo "pdf" — git log, commit `241b16b54` (vá inline) và `141928f3f` (thay hẳn), cùng ngày 2026-08-18, nhánh `feat/templates-redesign`
---

# Bỏ `react-color`, dựng color picker trên Polaris

**Trạng thái: ⚠️ CHƯA MERGE** — mới ở nhánh `feat/templates-redesign`
(xem [[shipped-pdf-2026-08-19]]).

## Đã quyết cái gì

SB-15706: click ra ngoài color picker trong max modal thì hiện "Not found".

- **Vòng 1 — `241b16b54`**: giữ `react-color`, bỏ Popover portal, render `SketchPicker`
  inline `position: fixed` neo theo swatch.
- **Vòng 2 — `141928f3f`**: **thay hẳn dependency**. `ColorPicker.js` (+112/−48) dựng trên
  Polaris `<ColorPicker>` thuần React, tự viết `hexToRgb` / `rgbToHsb` / `hsbToHex`, thêm hex
  `TextField` + preset swatches, giữ `Popover` chỉ để định vị.

## Why

- **Vá inline không đóng được nguyên nhân.** `react-color` vẫn gọi
  `getContainerRenderWindow` và **walk lên `window.parent`** khi
  `window.document.contains(container)` trả false — điều luôn xảy ra bên trong web-component
  `ui-modal`. `window.parent` ở đây là frame Shopify admin, **khác origin** ⇒ `SecurityError`.
  Bỏ portal chỉ làm hẹp đường tới nhánh đó chứ không xoá nó.
- **Đây là bất tương thích kiến trúc, không phải bug cấu hình.** `react-color` giả định nó
  sống trong một document mà nó với tới được `parent`; app embed trong Shopify admin thì
  không. Giả định đó không sửa được từ phía app.
- **Polaris đã có sẵn `ColorPicker`** — dùng chính design system của host thì không có lớp
  nào đi hỏi `window.parent`, và giao diện khớp phần còn lại của app.
- Cùng họ bài học "chọn thư viện tương thích iframe cross-origin" với việc gỡ App Bridge v3
  sang max modal ở repo subscriptions ([[2026-08-06-appbridge-v3-sang-max-modal]]): khi UI
  chuyển vào web-component/max modal, mọi thư viện chạm `window.parent` đều thành nợ.

## Tradeoff

- **Phải tự viết phần react-color cho không**: convert hex ↔ rgb ↔ hsb, ô nhập hex, preset
  swatches — code của mình, bug của mình. Polaris `ColorPicker` chỉ trả HSB.
- **Có thể mất tính năng nhỏ của SketchPicker** (alpha, eyedropper, bảng preset phong phú) —
  commit không liệt kê, nên đây là điểm phải kiểm khi QA.
- **Buộc chặt vào Polaris**: nâng version Polaris sau này có thể đổi API `ColorPicker`; đổi
  lại là không còn phụ thuộc một package cộng đồng đã không tương thích với hướng embed của
  Shopify.
- **Chi phí đã trả hai lần** cho cùng một issue trong một ngày (vá inline rồi thay hẳn). Bài
  học rẻ hơn cho lần sau: khi triệu chứng là `SecurityError` xuyên origin, hỏi ngay "thư viện
  này có chạm `window.parent` không" trước khi vá vị trí render.

## Cần theo dõi tới ngày review

- Đã merge chưa; QA có báo mất tính năng nào của picker cũ không.
- Còn chỗ nào khác trong repo import `react-color` không (nếu không còn thì gỡ khỏi
  `package.json` — commit này chỉ sửa `ColorPicker.js`).

Liên quan: [[pdf]] · [[shipped-pdf-2026-08-19]] · [[2026-08-06-appbridge-v3-sang-max-modal]]
