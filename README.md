# CSK18 – Hệ thống hỗ trợ Học viên / CS

## Mục tiêu

Dự án là một ứng dụng web tĩnh cho hệ thống hỗ trợ học viên, gồm các module:
- Đăng nhập / phân quyền người dùng
- Form tạo phiếu hỗ trợ cho học viên
- Quản lý ticket cho Customer Success (CS)
- Dashboard thống kê
- FAQ và tài khoản người dùng

Dự án đang sử dụng:
- HTML + CSS + JavaScript thuần
- Firebase Authentication
- Firestore Database
- Firebase Storage
- EmailJS cho gửi email

---

## Cấu trúc thư mục chính

```text
CSK18/
├── firebase-config.js
├── ADMIN/
│   ├── addAccount.html
│   ├── homepage-ad.html
│   └── homepage-ad.js
├── CS/
│   ├── account-CS.html
│   ├── navbar.css
│   ├── navbar.js
│   ├── Login/
│   │   ├── login.html
│   │   ├── login.css
│   │   └── login.js
│   ├── homepageCS/
│   │   ├── trangchu-cs.html
│   │   ├── trangchu-cs.js
│   │   └── trangchu-cs.css
│   ├── PhieuHoTroCS/
│   │   ├── phieuhotro-cs.html
│   │   ├── phieuhotro-cs.css
│   │   └── phieuhotro-cs.js
│   ├── TicketManagement/
│   │   ├── cs-ticket.html
│   │   ├── cs.css
│   │   └── cs.js
│   └── Dashboard/
│       ├── cs-dashboard.html
│       └── cs-dashboard.js
├── HV/
│   ├── account-HV.html
│   ├── sidebar.js
│   ├── chat-hv/
│   │   ├── trao-doi-ticket.html
│   │   ├── traodoiticket.css
│   │   └── traodoiticket.js
│   ├── homepage-hv/
│   │   ├── homepage.html
│   │   ├── homepage.js
│   │   └── homepage.css
│   └── tickets/
│       ├── phieuhotro.html
│       ├── phieuhotro.css
│       └── phieuhotro.js
├── FAQs/
│   ├── CS-FAQ.html
│   └── faq.html
└── phong_ban.html
```

---

## Luồng chức năng chính

### 1) Đăng nhập
- Người dùng đăng nhập qua trang `CS/Login/login.html`
- Logic đăng nhập nằm trong `CS/Login/login.js`
- Sau khi xác thực Firebase, hệ thống đọc role trong collection `users`
- Chuyển hướng theo vai trò:
  - admin
  - cs
  - student

### 2) Học viên tạo ticket
- Trang: `CS/PhieuHoTroCS/phieuhotro-cs.html`
- Script: `CS/PhieuHoTroCS/phieuhotro-cs.js`
- Học viên điền:
  - họ tên
  - email
  - số điện thoại
  - cơ sở
  - khóa học (nếu là học viên)
  - loại yêu cầu
  - tiêu đề và mô tả
  - file đính kèm
- Ticket được lưu vào Firestore collection `tickets`
- Một message đầu tiên cũng được tạo trong subcollection `tickets/{ticketId}/messages`

### 3) CS quản lý ticket
- Trang: `CS/TicketManagement/cs-ticket.html`
- Script: `CS/TicketManagement/cs.js`
- CS có thể:
  - xem danh sách ticket
  - lọc theo trạng thái / ưu tiên / loại yêu cầu
  - tìm kiếm theo mã ticket, tên, email, tiêu đề
  - mở drawer chi tiết ticket
  - cập nhật trạng thái ticket
  - nhắn tin trực tiếp với học viên

### 4) Dashboard
- Trang: `CS/Dashboard/cs-dashboard.html`
- Dùng để thống kê và xem báo cáo tổng quan về ticket

### 5) Tài khoản
- Trang: `CS/account-CS.html`
- Quản lý thông tin tài khoản, đổi mật khẩu, đăng xuất

---

## Firestore / Firebase dữ liệu dự kiến

### Collection `users`
Lưu thông tin người dùng, ví dụ:
```json
{
  "uid": "abc123",
  "name": "Nguyễn Văn A",
  "email": "nguyenvana@gmail.com",
  "role": "cs",
  "phone": "0909...",
  "campus": "Hà Nội",
  "createdAt": "timestamp"
}
```

### Collection `tickets`
Mỗi ticket có dạng:
```json
{
  "ticketNum": "HV-123456",
  "name": "Nguyễn Văn A",
  "email": "nguyenvana@gmail.com",
  "phone": "0909...",
  "campus": "Hà Nội",
  "title": "Không vào được khóa học",
  "description": "Mô tả chi tiết...",
  "ticketCategory": "Hệ thống",
  "ticketIssue": "Đăng nhập / xác thực",
  "status": "open",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

### Subcollection `tickets/{ticketId}/messages`
Dùng cho chat giữa học viên và CS.

---

## Cách chạy local

Vì project đang là web tĩnh, cần chạy bằng một local web server để đường dẫn tuyệt đối như `/CS/...` hoạt động đúng.

### Cách nhanh nhất
1. Mở thư mục gốc project trong VS Code
2. Dùng Live Server hoặc chạy:

```bash
python -m http.server 8000
```

3. Mở browser tại:

```text
http://localhost:8000/CS/Login/login.html
```

> Nếu chạy ở folder gốc project, các đường dẫn tuyệt đối như `/CS/...` sẽ hoạt động đúng.

---

## Cấu hình Firebase

File `firebase-config.js` chứa cấu hình Firebase.

Nếu dự án đổi project Firebase mới thì cần cập nhật:
- apiKey
- authDomain
- projectId
- storageBucket
- messagingSenderId
- appId
- measurementId

Ngoài ra cần đảm bảo các dịch vụ sau đã bật:
- Firebase Authentication
- Firestore
- Firebase Storage

---

## Lưu ý quan trọng

- Dự án đang dùng đường dẫn tuyệt đối (`/CS/...`, `/HV/...`) nên cần chạy từ thư mục gốc của project.
- Tất cả giao diện đều là front-end static, logic nghiệp vụ chủ yếu nằm trong JS và Firebase.
- Nếu đổi tên hoặc cấu trúc thư mục, các đường dẫn trong HTML/JS phải được cập nhật lại.

---

## Tóm tắt ngắn

Project này là hệ thống hỗ trợ học viên với 3 vai trò chính:
- Học viên: gửi ticket, theo dõi yêu cầu
- CS: quản lý ticket, thao tác trạng thái, chat
- Admin: quản lý tài khoản và phân quyền

Mọi hoạt động dữ liệu đều dựa trên Firebase, và giao diện là các file HTML/CSS/JS tĩnh.
