# T2502E Assignment NodeJS Team02 - Task Management System (Project 3.1)

Welcome to the Task Management System (Project Board) developed by Team 02. Đây là dự án quản lý công việc và dự án áp dụng các công nghệ Node.js, Express, MongoDB và giao diện EJS trực quan theo mô hình Server-Side Rendering (SSR).

## Link video demo: https://drive.google.com/drive/folders/152Yh6Ghn7p1N5-706nfNFVcU7Uglancx?usp=sharing

##  Công nghệ sử dụng

Dự án 3.1 được xây dựng bằng những thư viện và công nghệ sau:

- **Backend / Core Engine**: 
  - `Node.js` môi trường chạy hệ thống
  - `Express` (v5.x): Web framework xây dựng server và API
- **Database**:
  - `MongoDB`: NoSQL Database lưu trữ dữ liệu
  - `Mongoose`: ODM thao tác trực tiếp với cơ sở dữ liệu
- **Giao diện (View Engine)**:
  - `EJS`: Template rendering engine
  - `express-ejs-layouts`: Hỗ trợ kiến trúc cơ bản (Header, Sidebar, Main Content) để tái sử dụng
- **Xác thực và Bảo mật (Auth & Security)**:
  - `jsonwebtoken` (JWT): Tạo và xác minh token (Access & Refresh tokens)
  - `bcrypt` / `bcryptjs`: Mã hóa mật khẩu người dùng lưu trữ an toàn
- **Tính năng mở rộng**:
  - `socket.io`: Giao tiếp Real-time, hỗ trợ cập nhật bình luận (comments) hoặc tiến độ nhanh chóng
  - `multer`: Xử lý upload file (đính kèm hình ảnh và tài liệu vào comment/task)
- **Middleware / Tiện ích khác**:
  - `cookie-parser`: Đọc và phân tích cookie chứa Tokens / Session
  - `express-session`: Quản lý phiên truy cập của user
  - `dotenv`: Quản lý biến môi trường an toàn
  - `cors`: Cấu hình chia sẻ tài nguyên nếu có yêu cầu từ client chéo
  - `method-override`: Hỗ trợ những HTTP verbs bổ sung ngoài GET/POST
  - `morgan`: Logging ghi nhận hoạt động mạng trong lúc phát triển

---

## ⚙️ Cài đặt & Chạy cục bộ (Local Development)

### Yêu cầu tiên quyết:
- [Node.js](https://nodejs.org/en/) (v16 trở lên khuyên dùng)
- [MongoDB](https://www.mongodb.com/try/download/community) chạy dưới localhost hoặc MongoDB Atlas URI

### Các bước cài đặt:
1. **Clone repository:**
   ```bash
   git clone <repo_url>
   cd T2502E-Assignment-NodeJS-Team02
   ```

2. **Cài đặt các gói phụ thuộc (Dependencies):**
   ```bash
   npm install
   ```

3. **Thiết lập biến môi trường:**
   Tạo mới một file `.env` tại thư mục gốc và sao chép nội dung cấu hình mẫu (tham khảo file hiện tại):
   ```env
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/T2502E-Assignment-NodeJS-Team02
   NODE_ENV=development
   ACCESS_TOKEN_SECRET=taskflow_super_secret_key_2026
   ACCESS_TOKEN_EXPIRY=1h
   REFRESH_TOKEN_SECRET=taskflow_refresh_secret_key_9999
   REFRESH_TOKEN_EXPIRY=7d
   ```

4. **Chạy ứng dụng:**
   ```bash
   # Chế độ Dev (sử dụng nodemon tự động reload lại server khi code thay đổi)
   npm run dev
   
   # Chế độ khởi chạy Production
   npm start
   ```

5. **Sử dụng:**
   Truy cập [http://localhost:3000](http://localhost:3000) (hoặc cổng mà bạn quy định) trên trình duyệt.

---

## 🌐 Hướng dẫn Deploy lên Render / Railway

Ứng dụng của chúng ta đã được chuẩn bị sẵn lệnh `"start": "node src/server.js"` tại `package.json` nên tương thích tốt với các nền tảng tự động build hỗ trợ nền Node.js như Render hoặc Railway. Trước khi triển khai lên online, hãy đảm bảo rằng bạn đã tạo 1 Project MongoDB trên **MongoDB Atlas** để sử dụng.

### Lựa chọn 1: Deploy lên Render (Miễn phí)

Render sẽ cung cấp dịch vụ web server tự động từ GitHub.
1. Truy cập [Render.com](https://render.com), đăng nhập bằng tài khoản Github để đồng bộ.
2. Chuyển đến trang **Dashboard** -> Nhấn **New** góc phải trên -> Chọn **Web Service**.
3. Kết nối repository trên GitHub hiện tại chứa dự án với hệ thống cấp quyền.
4. Setup các trường thông tin:
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Cuộn xuống phần **Environment Variables**, chọn biểu tượng *Add Environment Variable* để thiết lập các Key/Value hệt như bên trong `.env` của dự án. 
   *(Lưu ý: Đừng quên biến `MONGODB_URI` lấy từ MongoDB Atlas và thay đổi Secret hợp lý của bạn)*.
6. Nhấn **Create Web Service** -> Chờ quá trình hoàn tất (quá trình mất 2-4 phút). Website của bạn sẽ nhận được một đường link miễn phí như `https://your-app-name.onrender.com`.

### Lựa chọn 2: Deploy lên Railway (Mặt bằng giá/tốc độ ưu tiên)

Railway là nền tảng quản lý nhanh và tiện lợi, build dự án cực mượt.
1. Truy cập [Railway.app](https://railway.app), tạo tài khoản/ đăng nhập Github.
2. Trong **Dashboard** -> Chọn nút **New Project**.
3. Chọn tính năng **Deploy from GitHub repo** và chọn repository tên `T2502E-Assignment-NodeJS-Team02`.
4. Railway sẽ tự động phân tích và nhận diện đây là Node.js App. Nó sẽ tự lấy lệnh `npm start` để khởi chạy.
5. Khi dự án bắt đầu diễn ra build, vào tab **Variables** bằng tay và khái báo các khóa ở dạng raw y hệt file `.env` (copy paste vô thẳng không cần nhập từng cái).
6. Vào tab **Settings** -> mục **Networking**, nhấn chọn **Generate Domain** để website nhận lấy cái link public cho bạn (thường dạng `*-production.up.railway.app`).
7. Project sẽ tự restet sau khi Variables được nhận đày đủ, khi màn hình Output trả status Active/Green, bạn đã Deploy thành công. 

---
