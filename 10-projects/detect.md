---
type: project
title: Detect - Pipe Counter (On-device AI)
tags: [ai, computer-vision, yolov8, flutter, mobile]
created: 2026-07-06
updated: 2026-07-06
status: active
repo: ~/projects/detect
---

# Detect - Pipe Counter (On-device AI)

## Mục đích
Ứng dụng đếm số lượng ống tròn/vuông trong một bó ống bằng AI, chạy trực tiếp
trên điện thoại (on-device, không cần internet).

## Tech stack
- **Training**: Python + YOLOv8 (Ultralytics). Scripts: `prepare_data.py`,
  `train.py`, `export_tflite.py`, `test_detect.py`. Dataset theo format YOLO
  (2 class: `round_pipe`, `square_pipe`), label qua Roboflow.
- **Mobile app**: Flutter (`flutter_app/`), chạy inference bằng model **TFLite**
  đặt trong `assets/models/`.
- Cấu trúc: `training/` (train + export) và `flutter_app/` (app di động).

## Trạng thái
Giai đoạn đầu, mới 3 commit. Đã có training script (nhiều model size, resume,
augmentation, light mode) và dataset khởi tạo. Pipeline: chuẩn bị data → train →
export TFLite → nhúng vào Flutter app.

## Điểm đáng nhớ
- Workflow 4 bước: chụp/label ~200-500 ảnh → train (~30-60 min) → export TFLite →
  `flutter run`.
- Điểm mấu chốt là on-device inference: model YOLOv8 được convert sang TFLite để
  chạy offline trên mobile.

## Liên quan
- [[10-projects/index]]
