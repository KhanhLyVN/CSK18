# CSK18 - Hệ thống hỗ trợ Học viên / Customer Success / Admin

Dự án này là một ứng dụng web tĩnh đa vai trò, được xây dựng để hỗ trợ luồng xử lý yêu cầu của học viên và đội ngũ Customer Success (CS). Mọi giao diện đều chạy ở phía client, dữ liệu được lưu trữ và đồng bộ qua Firebase Authentication + Firestore + Storage. Mục tiêu của hệ thống là giúp:

- Học viên gửi yêu cầu hỗ trợ, theo dõi trạng thái ticket và trao đổi trực tiếp với CS
- CS quản lý ticket, cập nhật trạng thái, chat và theo dõi tiến độ xử lý
- Admin quản lý tài khoản CS, xem báo cáo hoạt động, nhật ký hệ thống và cấu hình trang quản trị
- Khách truy cập xem FAQ và các tài liệu hỗ trợ nhanh

Project hiện đang viết bằng HTML + CSS + JavaScript thuần, không dùng framework frontend. Phần dữ liệu và xác thực chạy trên Firebase.

---

## Tính năng tổng quan

### 1. Đăng nhập và phân quyền
- Đăng nhập bằng email/password hoặc Google Sign-In
- Tự động xác định role từ Firestore collection users
- Chuyển hướng theo role:
  - student -> trang học viên
  - cs -> trang Customer Success
  - admin -> trang Admin
- Tự động kiểm tra Firebase ready state và hiển thị thông báo rõ ràng khi thiếu cấu hình
- Có giao diện password toggle và trạng thái loading khi đăng nhập

### 2. Học viên (HV)
- Tạo phiếu hỗ trợ với các trường: họ tên, email, số điện thoại, campus, khóa học, loại yêu cầu, tiêu đề, mô tả, tệp đính kèm
- Chọn nhóm vấn đề theo category và issue
- Cấu hình ưu tiên tự động theo mức độ nghiêm trọng của câu hỏi và từ khóa nội dung
- Gợi ý tiêu đề AI (khi người dùng nhập tiêu đề, có thể gọi AI để đề xuất cách viết rõ và hiệu quả hơn)
- Lưu ticket vào Firestore collection tickets
- Tạo message đầu tiên trong subcollection tickets/{ticketId}/messages
- Gửi email thông báo qua EmailJS sau khi tạo ticket
- Theo dõi những ticket mình đã gửi từ trang homepage và Ticket đã gửi
- Xem trạng thái ticket: Đang mở, Đang xử lý, Đã giải quyết, Đã đóng
- NHắn tin trao đổi với CS trên cùng ticket
- Nhận thông báo khi CS cập nhật trạng thái hoặc phản hồi
- Tra cứu FAQ nhanh
- Quản lý thông tin tài khoản cá nhân

### 3. Customer Success (CS)
- Dashboard tổng quan về các ticket đang có trong hệ thống
- Tổng hợp số liệu theo trạng thái: toàn bộ, đang mở, đang xử lý, đã giải quyết, đã đóng
- Phân loại yêu cầu theo category và issue
- Tìm kiếm và lọc theo nhiều tiêu chí: trạng thái, ưu tiên, category, từ khóa
- Phân công / nhận ticket, xem chi tiết trong drawer side panel
- Cập nhật trạng thái ticket theo quy trình xử lý
- Chat realtime trong từng ticket với học viên
- Có khả năng upload ảnh đính kèm trong chat
- Có gợi ý phản hồi AI dựa trên context ticket / chat
- Có hệ thống thông báo nội bộ và các thống kê báo cáo nhanh

### 4. Admin
- Quản lý danh sách tài khoản CS
- Thêm tài khoản CS
- Xem trạng thái hoạt động của từng tài khoản
- Tìm kiếm, lọc danh sách CS theo trạng thái và tên/email
- Mở chi tiết hồ sơ CS trong drawer
- Theo dõi báo cáo hoạt động theo campus, phòng ban, khoảng thời gian
- Xuất CSV báo cáo
- Xem nhật ký hệ thống (system log) theo loại hoạt động, mức độ cảnh báo
- Cài đặt thông tin quản trị viên và tùy chọn thông báo
- Quản lý navbar sử dụng chung cho các trang admin

### 5. FAQ / hỗ trợ nhanh
- Có trang FAQ cho học viên và FAQ riêng cho CS
- Người dùng có thể cộng đồng tìm kiếm câu hỏi / hướng dẫn nhanh
- Các layout FAQ có design riêng, gọn và thân thiện

### 6. Tính năng phụ trợ liên quan
- Tự động phân loại ưu tiên ticket bằng logic JS: automaticTicketPriority
- Tìm mã ticket nhanh qua ô tra cứu trên màn hình home CS
- Navbar dùng chung cho từng nhóm vai trò
- Live dashboard và realtime dữ liệu từ Firestore
- Giao diện responsive, có sidebar collapse trên desktop và mobile menu trên thiết bị nhỏ

---

## Công nghệ sử dụng

- HTML5
- CSS3
- JavaScript ES6+
- Firebase App / Auth / Firestore / Storage (compat SDK)
- EmailJS để gửi email thông báo
- Chart.js để vẽ biểu đồ trong dashboard
- SheetJS (xlsx) để xuất CSV/Excel từ báo cáo admin
- Font chữ từ Google Fonts
- Material Symbols từ Google Fonts

---

## Cấu trúc thư mục

```text
CSK18/
├── .git/                                # Git metadata
├── .vscode/                             # Thiết lập VS Code
├── ADMIN/                               # Trang quản trị dành cho Admin
│   ├── accounts.css                     # Style màn hình quản lý tài khoản CS
│   ├── accounts.html                    # Danh sách tài khoản CS
│   ├── accounts.js                      # Logic quản lý tài khoản CS
│   ├── activity-report.css              # Style báo cáo hoạt động
│   ├── activity-report.html             # Màn hình báo cáo hoạt động
│   ├── activity-report.js               # Logic báo cáo, filter, export CSV
│   ├── addAccount.html                  # Form thêm tài khoản CS
│   ├── admin-bar.css                    # Style thanh điều hướng admin
│   ├── admin-bar.html                   # HTML thanh điều hướng admin dùng chung
│   ├── admin-bar.js                     # Logic sidebar, user identity, logout
│   ├── header/                          # Phần header bổ sung admin
│   │   ├── header.css
│   │   ├── header.html
│   │   └── header.js
│   ├── homepage-ad.css                  # Style trang tổng quan admin
│   ├── homepage-ad.html                 # Trang dashboard/admin overview
│   ├── homepage-ad.js                   # Logic tổng quan admin
│   ├── phong_ban.html                   # Trang / màn hình phòng ban (nếu có dùng trong admin)
│   ├── settings.css                     # Style cài đặt hệ thống admin
│   ├── settings.html                    # Màn hình cài đặt quản trị
│   ├── settings.js                      # Logic settings
│   ├── system-log.css                   # Style system log
│   ├── system-log.html                  # Màn hình nhật ký hệ thống
│   └── system-log.js                    # Logic system log, filter, thống kê log
├── CS/                                  # Trang dành cho Customer Success
│   ├── Dashboard/
│   │   ├── cs-dashboard.html            # Dashboard thống kê CS
│   │   └── cs-dashboard.js              # Logic biểu đồ, thống kê
│   ├── Login/
│   │   ├── login.css                    # Style login
│   │   ├── login.html                   # Trang đăng nhập chính
│   │   ├── login.js                     # Xử lý login, logout, redirect, Google Auth
│   │   ├── quenmatkhau.css              # Style quên mật khẩu
│   │   └── quenmatkhau.html             # Trang khôi phục mật khẩu
│   ├── PhieuHoTroCS/
│   │   ├── phieuhotro-cs.css            # Style tạo phiếu CS (hoặc form CS)
│   │   ├── phieuhotro-cs.html           # Form tạo ticket từ góc nhìn CS
│   │   └── phieuhotro-cs.js             # Logic tạo ticket, AI, email, Firestore
│   ├── TicketManagement/
│   │   ├── cs-ticket.html               # Trang quản lý ticket của CS
│   │   ├── cs.css                       # Style quản lý ticket
│   │   └── cs.js                        # Logic lọc, tìm kiếm, cập nhật trạng thái, chat
│   ├── account-CS.html                  # Trang tài khoản CS
│   ├── homepageCS/
│   │   ├── trangchu-cs.css              # Style trang chủ CS
│   │   ├── trangchu-cs.html             # Trang chủ CS
│   │   └── trangchu-cs.js               # Logic dashboard nhanh, thống kê, quick find
│   ├── navbar.css                       # Style navbar chung cho CS
│   ├── navbar.html                      # Hình thức navbar dùng chung
│   ├── navbar.js                        # Logic sidebar, active nav, collapse
│   └── tao_email_HV.html                # Form tạo email / cấp tài khoản HV
├── FAQs/                                # Trang FAQ
│   ├── CS-FAQ.html                      # FAQ dành cho customer success
│   └── faq.html                         # FAQ dành cho học viên
├── HV/                                  # Trang dành cho học viên
│   ├── account-HV.html                  # Quản lý tài khoản học viên
│   ├── chat-hv/
│   │   ├── trao-doi-ticket.html         # Trang trao đổi ticket của học viên
│   │   ├── traodoiticket.css            # Style chat ticket
│   │   └── traodoiticket.js             # Logic chat HS - CS
│   ├── homepage-hv/
│   │   ├── homepage.css                 # Style trang chủ học viên
│   │   ├── homepage.html                # Trang chủ học viên
│   │   └── homepage.js                  # Logic homepage, thông báo, thống kê
│   ├── navbar.css                       # Navbar chung học viên
│   ├── navbar.html                      # HTML navbar học viên
│   ├── navbar.js                        # Logic navbar học viên
│   ├── tickets/
│   │   ├── phieuhotro.css               # Style form tạo ticket HV
│   │   ├── phieuhotro.html              # Form gửi ticket cho học viên
│   │   └── phieuhotro.js                # Logic ticket form, AI, email, attachment
│   ├── ticketssent/
│   │   ├── ticketssent.css              # Style trang ticket đã gửi
│   │   ├── ticketssent.html             # Trang tổng quan ticket đã gửi
│   │   ├── ticketssent.js               # Logic hiển thị danh sách ticket đã gửi
│   │   ├── useticket.js                 # Logic tính toán / xem ticket
│   │   └── ...
│   └── ...
├── firebase-config.js                   # Khởi tạo Firebase project
├── priority.js                          # Logic xác định mức độ ưu tiên tự động
├── cs.css                               # CSS dùng chung cho layout CS
├── index.html                           # Redirect mặc định về /CS/login/login.html
├── README.md                            # Tài liệu dự án
└── ...                                  # Các file phụ trợ có thể được thêm trong quá trình phát triển
```

---

## Cấu hình Firebase cần chuẩn bị

File root `firebase-config.js` chứa cấu hình Firebase. Bạn cần đảm bảo project Firebase đã được tạo và bật các dịch vụ sau:

- Firebase Authentication
- Firestore Database
- Firebase Storage
- Google Sign-In (nếu dùng login Google)

Cấu hình cần có các giá trị:

- apiKey
- authDomain
- projectId
- storageBucket
- messagingSenderId
- appId
- measurementId

Nếu bạn đổi project Firebase, cập nhật file này trước khi chạy ứng dụng. Nhiều trang trong hệ thống giả định project là `faq-csk18`, do đó nếu project mới khác, cần đảm bảo dữ liệu và collection/role đồng bộ theo đúng cấu trúc.

---

## Luồng dữ liệu chính trong hệ thống

### 1. Users
Collection `users` lưu thông tin tài khoản người dùng, gồm ít nhất:

- uid
- email
- displayName / name
- role (student / cs / admin)
- campus
- phone
- createdAt
- status

### 2. Tickets
Collection `tickets` lưu toàn bộ phiếu hỗ trợ, ví dụ:

- ticketNum
- userId
- name
- email
- phone
- campus
- title
- description
- category
- issue
- status
- priority
- createdAt
- updatedAt
- attachmentUrls / file metadata

### 3. Messages
Subcollection `tickets/{ticketId}/messages` lưu lịch sử trao đổi giữa học viên và CS.

Mỗi message thường có:

- senderId
- senderRole
- senderName
- text
- createdAt
- attachmentUrl (nếu có)

### 4. Logs
Admin có màn hình system-log để theo dõi các hoạt động chính như:

- login
- logout
- create
- update
- delete
- message
- claim_ticket
- complete_ticket
- update_status
- error

---

## Quy trình sử dụng thực tế

### Quy trình học viên
1. Mở trang login: `/CS/Login/login.html`
2. Đăng nhập bằng tài khoản hệ thống hoặc Google
3. Xem trang tổng quan học viên trên `/HV/homepage-hv/homepage.html`
4. Nhấn "Tạo phiếu hỗ trợ" hoặc vào `/HV/tickets/phieuhotro.html`
5. Chọn loại yêu cầu, mô tả vấn đề và đính kèm file nếu cần
6. Gửi ticket
7. Theo dõi trạng thái ở mục "Ticket đã gửi" hoặc "Trao đổi ticket"
8. Nhắn tin với CS khi cần cập nhật thêm thông tin

### Quy trình Customer Success
1. Đăng nhập bằng role `cs`
2. Vào trang chủ CS `/CS/homepageCS/trangchu-cs.html`
3. Xem thống kê nhanh và danh sách ticket gần đây
4. Vào `/CS/TicketManagement/cs-ticket.html` để quản lý danh sách ticket
5. Tìm kiếm, filter, mở chi tiết ticket
6. Cập nhật trạng thái ticket (đang mở, đang chờ, đang xử lý, đã giải quyết, đã đóng)
7. Gửi phản hồi trong chat
8. Nếu cần, gửi email hoặc thông báo cho học viên tùy theo quy trình

### Quy trình Admin
1. Đăng nhập bằng role `admin`
2. Vào dashboard admin `/ADMIN/homepage-ad.html`
3. Quản lý tài khoản CS ở `/ADMIN/accounts.html`
4. Xem báo cáo ở `/ADMIN/activity-report.html`
5. Xem nhật ký hoạt động ở `/ADMIN/system-log.html`
6. Cài đặt tùy chọn hệ thống ở `/ADMIN/settings.html`
7. Đăng xuất hoặc đóng thao tác quản trị

---

## Hướng dẫn chạy local

Vì đây là project static, nên cần chạy dưới một local web server để các đường dẫn tuyệt đối như `/CS/...`, `/HV/...`, `/ADMIN/...` hoạt động đúng.

### Cách 1: Dùng Python

```bash
cd C:\Users\LEGION\Documents\GitHub\CSK18.worktrees\detailed-readme-generation
python -m http.server 8000
```

Sau đó mở:

```text
http://localhost:8000/CS/Login/login.html
```

### Cách 2: Dùng Live Server trong VS Code
- Mở thư mục project trong VS Code
- Mở `index.html` hoặc `CS/Login/login.html`
- Chạy với Live Server

### Lưu ý quan trọng
- Không mở trực tiếp file html bằng browser file:// nếu không có cấu hình đặc biệt, vì điều hướng /CS/... có thể không hoạt động đúng
- Dự án các link và file script đều dùng đường dẫn tuyệt đối, do đó cần chạy từ thư mục gốc project

---

## Một số điểm tích cực và nâng cao của dự án

### AI và tự động hóa
- Gợi ý tiêu đề AI trong form tạo ticket của học viên
- Phân loại ưu tiên tự động thông qua `priority.js`
- AI gợi ý phản hồi trong chat CS

### Realtime và thông báo
- Lọc danh sách và cập nhật dữ liệu theo thời gian thực từ Firestore
- Có notification panel cho học viên và admin
- Có các badge trạng thái và thống kê nhanh ở nhiều màn hình

### Quản lý hồ sơ người dùng
- Người dùng có profile page riêng cho học viên và admin
- Admin có trung tâm quản lý tài khoản CS, trạng thái, phòng ban, campus

### Tài liệu và FAQ
- FAQ được tách riêng cho học viên và CS
- Giao diện chuyên nghiệp với phong cách maroon + cream + paper

### Chất lượng UX
- Sidebar điều hướng, navbar dùng chung, active state rõ ràng
- Responsive design cho màn hình desktop và mobile
- Mô hình navigation chuẩn và ngắn gọn

---

## Ghi chú kỹ thuật quan trọng

- Các file HTML hầu hết đều nhúng Firebase compatibility SDK:
  - firebase-app-compat.js
  - firebase-auth-compat.js
  - firebase-firestore-compat.js
  - firebase-storage-compat.js
- `firebase-config.js` được load trước các file JS chính để đảm bảo Firebase đã khởi tạo đúng
- Một số trang dùng `type="module"` cho file JS riêng
- Một số file JS, như `cs.js`, `phieuhotro-cs.js`, `phieuhotro.js`, rất dài và chứa nhiều chức năng nghiệp vụ, nên khi chỉnh sửa cần lưu ý không phá vỡ các DOM ID và cấu trúc HTML có sẵn
- Tài liệu này mô tả tổng quan, nếu cần làm thêm tính năng hay tái cấu trúc dự án, cần đồng bộ lại cấu trúc Firestore và route

---

## Mục tiêu của dự án

Dự án này là một hệ thống hỗ trợ học viên hoàn chỉnh theo mô hình:

- Học viên -> gửi yêu cầu -> nhận phản hồi
- CS -> quản lý, xử lý, trò chuyện, cập nhật status
- Admin -> giám sát và quản trị toàn bộ hệ thống

Với mô hình hiện tại, dự án phù hợp để làm demo, prototype hoặc nền tảng hỗ trợ nghiệp vụ hỗ trợ học viên trong một trung tâm đào tạo / học trực tuyến / e-learning.

---

## Tóm tắt nhanh

Nếu bạn cần mở ứng dụng, hãy chạy local server và vào:

```text
http://localhost:8000/CS/Login/login.html
```

Nếu cần truy cập các module chính, các địa chỉ thường dùng là:

- Trang login: `/CS/Login/login.html`
- Trang học viên: `/HV/homepage-hv/homepage.html`
- Trang tạo ticket học viên: `/HV/tickets/phieuhotro.html`
- Trang chat học viên: `/HV/chat-hv/trao-doi-ticket.html`
- Trang CS home: `/CS/homepageCS/trangchu-cs.html`
- Trang quản lý ticket CS: `/CS/TicketManagement/cs-ticket.html`
- Trang dashboard CS: `/CS/Dashboard/cs-dashboard.html`
- Trang Admin overview: `/ADMIN/homepage-ad.html`
- Trang quản lý CS: `/ADMIN/accounts.html`
- Trang báo cáo hoạt động: `/ADMIN/activity-report.html`
- Trang system log: `/ADMIN/system-log.html`
- Trang FAQ học viên: `/FAQs/faq.html`
- Trang FAQ CS: `/FAQs/CS-FAQ.html`

---

## Lời nhắn

Dự án này đã có sự đầu tư kỹ lưỡng về layout, luồng xử lý, chức năng quản lý và tích hợp Firebase. README này được viết dựa trên các file thực tế trong repository để giúp người mới tiếp cận được toàn bộ hệ thống, nhiệm vụ từng module và cách chạy / cấu hình một cách rõ ràng nhất.
