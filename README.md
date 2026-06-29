# Serene Brews - Zalo Mini App & Express API Backend

**Serene Brews** là một dự án Mini App đặt đồ uống (Cà phê, Trà sữa) chạy trên nền tảng **Zalo** kết hợp với hệ thống **Express API Backend** và cơ sở dữ liệu **MySQL**. Dự án được xây dựng với phong cách thiết kế sang trọng, hiện đại, tối giản và tối ưu hóa tối đa trải nghiệm người dùng di động.

---

## 🌟 Các Tính Năng Nổi Bật

* 🛵 **Đặt Nước Nhóm (Group Ordering)**: Cho phép tạo nhóm đặt nước chung với đồng nghiệp, tự động chia sẻ liên kết để từng thành viên tự chọn món và gộp chung vào một đơn hàng thanh toán duy nhất.
* 🎡 **Minigame Vòng Quay May Mắn (Lucky Wheel)**: Tích hợp vòng quay đổi điểm thành viên (20 điểm/lượt) để trúng các Voucher giảm giá ngẫu nhiên (10k, 20k, 50k) lưu trực tiếp vào tài khoản.
* 🎫 **Hệ Thống Voucher Thông Minh**: Quản lý và áp dụng mã giảm giá trực tiếp từ database MySQL với điều kiện giá trị đơn hàng tối thiểu.
* 💎 **Tích Điểm & Hạng Thành Viên**: Thẻ thành viên thiết kế sang trọng, tích điểm sau mỗi đơn hàng thành công, hiển thị Avatar Zalo hoặc Avatar dự phòng chữ cái tự động.
* 🎨 **Giao Diện Premium (Rich Aesthetics)**: Sử dụng tone màu vàng cát (sand) và olive nhạt chủ đạo, hỗ trợ chuyển đổi giao diện Sáng/Tối, Favicon trong suốt thiết kế riêng biệt.
* ⚡ **Cầu Nối Next.js & Zalo Webview**: Giải quyết triệt để lỗi nạp tài nguyên tĩnh (404), lỗi khởi tạo mount DOM (`__next`) và lỗi thiếu thẻ meta (`next-head-count`) khi chạy Next.js trên trình duyệt nhúng di động của Zalo.

---

## 📁 Cấu Trúc Dự Án

```text
├── backend/               # Express API Backend (NodeJS + TypeScript + MySQL)
│   ├── src/
│   │   ├── db/            # Khởi tạo database & cấu hình di trú MySQL tự động
│   │   └── index.ts       # Định nghĩa API endpoints (Products, Vouchers, Orders...)
│   ├── .env.example       # File cấu hình môi trường mẫu cho backend
│   └── package.json
│
├── frontend/              # Zalo Mini App Frontend (Next.js SPA + ZMP SDK)
│   ├── components/        # CartContext, Layout, MemberCard...
│   ├── pages/             # Các trang: Home, Orders, Notification, Profile, Product
│   ├── public/            # Favicon, hình ảnh tĩnh
│   ├── app-config.json    # Cấu hình Zalo Mini App (listSyncJS, listCSS)
│   ├── build-zmp.js       # Script đóng gói tự động & Vá webpack public path động
│   ├── next.config.js     # Cấu hình xuất tĩnh Next.js
│   └── package.json
```

---

## 🛠️ Hướng Dẫn Cài Đặt & Chạy Dự Án

### 1. Chuẩn bị Cơ sở dữ liệu MySQL
* Cài đặt và khởi động MySQL Server (ví dụ qua XAMPP, Laragon hoặc Docker).
* Tạo một database trống tên là `serene_brews` (hoặc hệ thống sẽ tự động tạo nếu tài khoản MySQL của bạn có đủ quyền).

### 2. Cài đặt & Khởi chạy Backend
1. Di chuyển vào thư mục backend:
   ```bash
   cd backend
   ```
2. Cài đặt các thư viện:
   ```bash
   npm install
   ```
3. Tạo file cấu hình `.env` dựa trên `.env.example` và điền thông tin kết nối MySQL:
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_password
   DB_DATABASE=serene_brews
   ```
4. Khởi chạy server ở chế độ phát triển:
   ```bash
   npm run dev
   ```
   * *Server sẽ tự động tạo các bảng và chèn dữ liệu sản phẩm mẫu (seed data) vào MySQL trong lần chạy đầu tiên.*

### 3. Cài đặt & Khởi chạy Frontend
1. Di chuyển vào thư mục frontend:
   ```bash
   cd ../frontend
   ```
2. Cài đặt các thư viện:
   ```bash
   npm install
   ```
3. Đăng nhập vào tài khoản Zalo Developer của bạn thông qua ZMP CLI (chỉ cần làm một lần):
   ```bash
   npx zmp-cli login
   ```
4. Khởi chạy dự án ở chế độ phát triển (Xem trên trình duyệt web tại `http://localhost:3000`):
   ```bash
   npm run dev
   ```

---

## 🚀 Đóng Gói & Deploy Lên Zalo Developer Portal

Khi ứng dụng đã hoạt động ổn định trên Web và bạn muốn đóng gói để quét mã QR chạy trên điện thoại di động:

1. Chạy lệnh build để Next.js xuất ra thư mục tĩnh và script tự động đóng gói sang định dạng của Zalo (`www/`):
   ```bash
   npm run build
   ```
   * *Script `build-zmp.js` sẽ tự động thực hiện vá đường dẫn webpack tĩnh `i.p` thành đường dẫn động (`window.__ZMP_BASE_URL__`) để tránh lỗi nạp file tĩnh trên Webview điện thoại.*
2. Triển khai ứng dụng lên Zalo Portal bằng lệnh:
   ```bash
   npx zmp-cli deploy
   ```
3. Chọn các tùy chọn theo hướng dẫn trên Terminal:
   * **Do you want to continue?** -> Chọn `Deploy your existing project`
   * **Where is your dist folder?** -> Nhấn Enter để chọn `www` mặc định
   * **What version status are you deploying?** -> Chọn `Development` hoặc `Testing`
   * **Description** -> Nhập mô tả phiên bản và nhấn Enter.
4. **Quét mã QR** được hiển thị trên màn hình bằng ứng dụng Zalo trên điện thoại để trải nghiệm ứng dụng!

---

## 📝 Nhật Ký Vá Lỗi Tương Thích Webview
* **Lỗi nạp file CSS/JS động (404 Path Mismatch)**: Do Zalo Webview sử dụng giao thức tệp cục bộ (`file:///` trên iOS) và Next.js đổi URL khi routing. Đã sửa đổi webpack public path thành động, tự động nhận dạng base path thực tế lúc chạy.
* **Lỗi Hydration/DOM Mount**: Tạo file mồi `zmp-init.js` để tự động đổi tên thẻ `<div id="app">` của Zalo thành `<div id="__next">` trước khi Next.js khởi chạy.
* **Lỗi Client Exception `n.content`**: Tự động trích xuất và chèn thẻ `<meta name="next-head-count">` vào `<head>` của Zalo Webview để Next.js Head Manager không bị crash khi đọc thuộc tính `.content`.
