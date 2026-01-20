# Hướng dẫn chạy dự án BT01

## Yêu cầu

- Đã cài đặt Node.js.
- Điện thoại cài ứng dụng **Expo Go** (có trên Android/iOS) HOẶC máy ảo Android/iOS.

## Các bước thực hiện

1. Mở terminal tại thư mục dự án: `d:/SPKT/DDNC/BT01`.
2. Cài đặt các thư viện (nếu chưa):
   ```bash
   npm install
   ```
3. Khởi chạy dự án:
   ```bash
   npx expo start
   ```
4. Quét mã QR:
   - Khi lệnh trên chạy xong, một mã QR sẽ hiện ra trên terminal.
   - Mở ứng dụng **Expo Go** trên điện thoại.
   - Chọn **Scan QR Code** và quét mã trên màn hình máy tính.

## Lưu ý

- Đảm bảo điện thoại và máy tính kết nối cùng một mạng Wifi.
- Nếu gặp lỗi kết nối, thử chạy `npx expo start --tunnel`.
