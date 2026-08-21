---
type: resource
title: Đo bề ngang trong headless Chrome — ba cách cái thước tự nói dối
summary: Chrome headless có sàn viewport 500px nên `--window-size=375` vẫn cho `innerWidth=500`; `scrollWidth` trong iframe bị kẹp về bề ngang iframe nên không bao giờ báo tràn; và `documentElement.scrollWidth` đo cửa sổ chứ không đo nội dung — nên trước khi kết luận code tràn hay không, phải assert chính cái thước.
tags: [debug, method, performance, tooling]
created: 2026-08-21
updated: 2026-08-21
source: project "pdf" — session history 2026-08-20/21 (SB-15857, đo email ở 277/320/375px)
---

# Đo bề ngang trong headless Chrome

Anh em với [[do-layout-shift-bang-browser-automation]]: ở đó phần lớn "0 shift" là harness
hỏng; ở đây phần lớn "tràn / không tràn" cũng là harness hỏng. Một phiên duy nhất vấp **ba
lần**, và một lần trong đó đẻ ra bug thật trên production branch.

## Ba cái bẫy

| Bẫy | Triệu chứng | Cách assert |
|---|---|---|
| **Sàn viewport 500px** | `--window-size=320`, `=375`, `=414` đều cho `innerWidth = 500` | in `window.innerWidth` ra và **so với con số mình đặt**, trước mọi phép đo khác |
| **`scrollWidth` trong iframe** | luôn bằng đúng bề ngang iframe ⇒ không bao giờ phát hiện tràn | đo `getBoundingClientRect().right` của phần tử ngoài cùng, hoặc đặt iframe rộng đúng khổ rồi **chụp ảnh nhìn** |
| **`documentElement.scrollWidth`** | lấy theo cửa sổ (900px) chứ không theo nội dung | đo `offsetWidth` của **bảng/khối ngoài cùng** của nội dung |

Cái thứ tư không thuộc về Chrome mà thuộc về dữ liệu: **HTML render ra còn nguyên merge tag
chưa thay**. `{{order.total_outstanding}}` là một token 27 ký tự **không có dấu cách** — nó
giữ sàn bề ngang cao hơn hẳn số tiền thật, nên mọi con số đo được đều phồng. Trước khi đo,
đếm merge tag còn sót phải bằng 0.

## Vì sao đáng ghi

Con số "sàn = 500px" của tôi là **giả**, sinh ra từ bẫy thứ nhất. Tôi đưa nó vào brief vòng 2
cho lane, lane bám theo và chuyển line item sang `inline-block` stacking — chính cách làm đó
đẻ ra bug **số tiền bị ngắt giữa chữ số** trong mail đòi nợ
([[digest-pdf-2026-08-21]]). Tức là: harness sai không dừng ở "kết luận sai", nó **ship ra
code sai** khi kết luận đó trở thành yêu cầu cho người/agent khác.

Cùng phiên, tôi hai lần khẳng định số của mình đúng và của lane sai, rồi cả hai lần phải
đính chính công khai — lần thứ hai chỉ vì lane đo bằng Playwright trong Docker (không dính
sàn viewport) còn tôi đo bằng Chrome headless trên máy.

## Luật rút ra

1. **Assert cái thước trước khi tin số.** Với viewport: `innerWidth` phải bằng con số đặt vào.
   Với nội dung: phải có một *control* biết trước kết quả (khổ 600px thì bảng phải ra 600).
2. **Số lệch giữa hai người đo ⇒ đi tìm harness khác nhau trước, đừng đi tìm ai nói dối.**
3. **Khi thước rối hơn giá trị nó mang lại thì chụp ảnh và nhìn.** Với layout, mắt là ground
   truth rẻ nhất — đúng tinh thần [[bang-chung-phan-biet-duoc]].
4. **Thí nghiệm cô lập thắng số học khớp mẫu.** "156×2 + padding = 376 ≈ 373" nghe rất thuyết
   phục và đã sai; gỡ từng khối rồi đo lại mới ra thủ phạm thật.

## Liên quan

[[do-layout-shift-bang-browser-automation]] · [[bang-chung-phan-biet-duoc]] ·
[[digest-pdf-2026-08-21]] · [[2026-08-21-line-item-email-kieu-joy]]
