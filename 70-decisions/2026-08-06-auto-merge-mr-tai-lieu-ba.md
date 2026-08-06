---
type: decision
title: Auto-merge MR tài liệu của BA bằng job CI có allowlist path + author
summary: subscriptions và pdf tự merge MR khi toàn bộ diff nằm trong `product-team/` và author nằm trong whitelist (`longlv3`), chạy bằng job trong pipeline MR với PAT scope `api` — bỏ phương án scheduled pipeline poll 15 phút vì tốn runner và không realtime.
tags: [avada, tooling, patterns]
created: 2026-08-06
updated: 2026-08-06
status: active
review: 2026-11-06
source: project "subscriptions" — session history 2026-08-06 (session 8517a979)
---

# Auto-merge MR tài liệu của BA

**Bối cảnh:** BA (Philip) mở MR liên tục nhưng scope nằm gọn trong `product-team/` —
PRD `.md`, `mockup-app/` `.jsx`, ảnh. 199/300 commit gần đây của repo `subscriptions`
chạm thư mục này, và **không có gì trong đó vào production**. Merge tay từng cái là công
lặp lại thuần tuý. Repo `pdf` cùng hình dạng (334 commit chạm `product-team/`, author cũng
chủ yếu Philip).

**Quyết định:** thêm `.gitlab/ci/auto-merge.yml` (include từ `.gitlab-ci.yml`) cho **cả hai
repo**, tự merge MR khi **đủ 6 điều kiện** — lệch một cái là rơi về merge tay. Hai tầng lọc,
và chỗ dễ nhầm nằm ở khác biệt giữa chúng:

- **Tầng 1 — `rules.changes` trong YAML**: lọc thô, ngữ nghĩa là **"có ít nhất một"** file
  khớp `product-team/**`. Đây chỉ để quyết định job có chạy hay không.
- **Tầng 2 — script**: lọc chặt, ngữ nghĩa là **"toàn bộ"** — lấy danh sách file của MR,
  `outside.length > 0` là skip ngay.

Điều kiện author: whitelist ghi thẳng trong `auto-merge.yml`
(`AUTO_MERGE_AUTHORS: 'longlv3'`) chứ không đặt thành biến CI thứ hai — để ai xem MR cũng
đọc được luật. Đã thử đổi sang lọc theo **email** (`longlv@avadagroup.com`) rồi quay lại
username: **GitLab API không trả email trong `author` của MR** (chỉ admin mới thấy), muốn
theo email thì phải đọc từ git commit author — vòng vo hơn mà không chắc hơn.

Token: **Personal Access Token scope `api`**, đặt trong CI variable **Protected**.

## Why

- **`api` là scope nhỏ nhất tồn tại cho việc merge MR.** GitLab chỉ có `api`, `read_api`,
  `read_user`, `read_repository`, `write_repository`, `read_registry`… và merge MR nằm
  trong `api`. Không có scope hẹp hơn để chọn — least-privilege ở đây là *chấp nhận `api`
  và bù bằng điều kiện của job*, không phải chọn scope khác.
- **Phải tick Protected vì `.gitlab-ci.yml` được đọc từ chính nhánh đang chạy.** Ai push
  được một nhánh thì sửa được job và đọc được biến CI mà job đó dùng. Biến Protected chỉ
  lộ ra trên nhánh/tag protected — đây là hàng rào duy nhất ngăn token `api` bị rút ra qua
  một nhánh bất kỳ.
- Cũng vì lý do đó, `Expand variable reference` để **trống**: token là chuỗi literal, bật
  expand thì GitLab diễn giải ký tự `$` trong giá trị thành tham chiếu biến khác → token hỏng.
- Không dùng project access token: group đang tắt việc tạo (`Project access token creation
  is disabled in this group`) — và đó là **giới hạn gói Free**, không phải giới hạn user.

## Tradeoff / đánh đổi

- **Mất:** một PAT scope `api` (quyền rộng) sống trong CI variable. Rủi ro thật, chỉ được
  giảm chứ không bị loại, bằng Protected variable + 6 điều kiện của job. Nếu ai đó push
  được lên nhánh protected thì hàng rào này rỗng.
- **Mất:** luật gắn cứng vào một username. `longlv3` đổi username là auto-merge im lặng
  ngừng chạy — không báo lỗi, chỉ rơi về merge tay. (Chính đây là lý do đã cân nhắc lọc
  theo email; xem trên.)
- **Được:** bỏ hẳn một loại công lặp lại chiếm ~2/3 số commit gần đây của repo, mà không
  nới lỏng gì cho code production — path allowlist là hàng rào cứng.

## Phương án khác đã cân nhắc

- **A″ — scheduled pipeline poll mỗi 15 phút** rồi merge các MR đủ điều kiện. Bỏ vì user
  chỉ ra đúng hai điểm: **tốn runner** (job nhẹ ~20-30s nhưng ~96 run/ngày ≈ 45 phút
  runner/ngày) và **không realtime** (BA phải chờ tới nhịp poll kế tiếp).
- **Lọc theo email tác giả** thay vì username — đã implement rồi revert (GitLab API không
  trả email).
- **Biến CI thứ hai cho danh sách author** — bỏ, whitelist trong file để luật hiển hiện.

## Gotcha khi triển khai

**MR không có pipeline nào chạy = nhánh nguồn chưa có file.** MR !500 của repo `pdf` không
chạy job vì nhánh nguồn `update/product-20260806-1608` chưa có `.gitlab/ci/auto-merge.yml`
và `.gitlab-ci.yml` của nó chưa có dòng `include`. GitLab đọc cấu hình CI **từ nhánh
nguồn**, nên mọi MR mở từ nhánh tạo *trước* khi merge cấu hình sẽ không bao giờ auto-merge —
phải rebase/tạo lại nhánh.

*Chưa xác minh:* nhãn nội bộ của các phương án trong session là A / A′ / A″; A′ (bản đã
chốt) khác A ở chỗ dùng Protected variable. Ranh giới chính xác giữa A và A′ không đọc lại
được từ transcript đã rút gọn — phần **nội dung** ở trên thì đọc trực tiếp từ những gì đã
implement.

## Liên quan
- [[digest-subscriptions-2026-08-06]] — session gốc.
- [[subscriptions]] · [[pdf]] · [[feedback-git-branch-discipline]]
