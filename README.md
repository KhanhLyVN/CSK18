# CSK18 — Student Support Hub

> **Hệ thống hỗ trợ học viên đa vai trò** vận hành trên nền tảng web tĩnh với Firebase Authentication, Cloud Firestore và Firebase Storage. Dự án phục vụ ba nhóm người dùng: **Học viên**, **Customer Success** và **Quản trị viên**.

CSK18 được xây dựng bằng **HTML, CSS và JavaScript thuần**. Không có backend Node.js hoặc framework frontend trong mã nguồn hiện tại; toàn bộ xác thực, lưu trữ dữ liệu, đồng bộ thời gian thực và tệp đính kèm được thực hiện qua Firebase SDK bản Compat được nhúng trực tiếp theo từng trang.

## Mục lục

1. [Mục tiêu và phạm vi](#mục-tiêu-và-phạm-vi)
2. [Tính năng theo vai trò](#tính-năng-theo-vai-trò)
3. [Luồng nghiệp vụ chính](#luồng-nghiệp-vụ-chính)
4. [Kiến trúc kỹ thuật](#kiến-trúc-kỹ-thuật)
5. [Cấu trúc thư mục](#cấu-trúc-thư-mục)
6. [Cấu trúc dữ liệu Firebase](#cấu-trúc-dữ-liệu-firebase)
7. [Cài đặt và chạy local](#cài-đặt-và-chạy-local)
8. [Cấu hình Firebase](#cấu-hình-firebase)
9. [Các route quan trọng](#các-route-quan-trọng)
10. [Phân quyền và lưu ý bảo mật](#phân-quyền-và-lưu-ý-bảo-mật)
11. [Khắc phục sự cố](#khắc-phục-sự-cố)
12. [Giới hạn hiện tại và hướng phát triển](#giới-hạn-hiện-tại-và-hướng-phát-triển)

---

## Mục tiêu và phạm vi

CSK18 hỗ trợ quy trình tiếp nhận, phân loại, xử lý và theo dõi yêu cầu của học viên. Học viên tạo ticket, theo dõi trạng thái, trao đổi với Customer Success và nhận thông báo. Đội ngũ Customer Success quản lý ticket, phối hợp theo Group, cập nhật tiến độ và theo dõi số liệu. Quản trị viên quản lý tài khoản, xem nhật ký hệ thống và giám sát hoạt động tổng quan.

| Thành phần | Mục đích chính |
|---|---|
| **Học viên (HV)** | Gửi yêu cầu, đính kèm tệp, theo dõi ticket, trao đổi với CS, đọc thông báo và quản lý hồ sơ. |
| **Customer Success (CS)** | Theo dõi ticket, xử lý ticket được giao, trao đổi với học viên, phối hợp trong Group và xem Dashboard. |
| **CS Leader** | Quản lý Group/Lớp, phân công ticket cho CS con phù hợp, theo dõi báo cáo và xem thông tin ticket. |
| **Admin** | Quản lý tài khoản, thêm/import tài khoản, theo dõi hoạt động, nhật ký hệ thống và cài đặt quản trị. |
| **Khách truy cập** | Xem FAQ dành cho học viên hoặc đội ngũ CS. |

---

## Tính năng theo vai trò

### Học viên

Học viên có thể tạo phiếu hỗ trợ với nội dung, danh mục, mức độ ưu tiên và tệp đính kèm. Các ticket đã tạo hiển thị trong trang tổng quan và trang Ticket đã gửi. Khi ticket được xử lý, học viên có thể mở trao đổi để nhắn tin theo từng ticket với Customer Success.

Navbar học viên có khu vực thông báo. Lịch sử thông báo được tổng hợp từ dữ liệu ticket, trong khi trạng thái **đã đọc** và **đã xóa** được đồng bộ theo từng tài khoản tại Firestore. Khi mở một thông báo, badge chưa đọc giảm và trạng thái đã đọc được lưu cho tài khoản đang đăng nhập.

Các chức năng chính gồm:

| Chức năng | Tệp/nhóm tệp tiêu biểu |
|---|---|
| Trang chủ và thông báo | `HV/homepage-hv/homepage.*`, `HV/navbar.*` |
| Gửi ticket | `HV/tickets/phieuhotro.*` |
| Ticket đã gửi | `HV/ticketssent/ticketssent.*`, `useticket.js` |
| Trao đổi ticket | `HV/chat-hv/trao-doi-ticket.html`, `traodoiticket.*` |
| Hồ sơ cá nhân | `HV/account-HV.html` |

### Customer Success

Customer Success sử dụng trang chủ và màn hình quản lý ticket để tìm kiếm, lọc, xem chi tiết và xử lý yêu cầu. Ticket có thể được tổ chức theo trạng thái, ưu tiên, danh mục và thông tin người gửi. Phần trao đổi ticket dùng Firestore để đồng bộ tin nhắn gần thời gian thực.

Dashboard CS tổng hợp các chỉ số xử lý ticket, tỷ lệ hoàn thành, biểu đồ theo loại yêu cầu, đánh giá hài lòng và **thời gian giải quyết trung bình**. Thời gian trung bình được tính từ mốc tạo ticket đến mốc ticket hoàn tất/đóng khi dữ liệu timestamp hợp lệ.

| Chức năng | Tệp/nhóm tệp tiêu biểu |
|---|---|
| Trang chủ CS | `CS/homepageCS/trangchu-cs.*` |
| Quản lý ticket | `CS/TicketManagement/cs-ticket.html`, `cs.js`, `cs.css` |
| Dashboard và xuất báo cáo | `CS/Dashboard/cs-dashboard.*` |
| Tạo ticket từ phía CS | `CS/PhieuHoTroCS/phieuhotro-cs.*` |
| Tài khoản CS | `CS/account-CS.html` |
| Navbar CS và chat nội bộ | `CS/navbar.*` |

### Group, Leader và CS con

Module Group được tách thành trang quản lý cho Leader và trang trao đổi chung cho thành viên. Leader có thể quản lý Group, Lớp, học viên và thành viên CS; ticket được phân công theo dữ liệu Group/Lớp. CS con có luồng trao đổi Group để phối hợp nội bộ. Tin nhắn Group được lưu trong subcollection `memberMessages` của từng Group, vì vậy Leader và các CS con nhìn thấy cùng một lịch sử hội thoại.

Quyền thao tác ticket cần được hiểu theo nghiệp vụ hiện hành: CS con được giao ticket là đối tượng cập nhật trạng thái và trao đổi với học viên; Leader có thể theo dõi thông tin và phân công theo phạm vi Group/Lớp. Giao diện có thể tiếp tục thay đổi theo quy trình vận hành thực tế.

### Admin

Admin có các màn hình quản lý tài khoản Customer Success, tạo/import tài khoản, quản lý học viên, tổng quan hệ thống, báo cáo hoạt động, nhật ký và cài đặt. Các màn hình import sử dụng SheetJS để đọc/ghi dữ liệu `.xlsx`, `.xls` hoặc `.csv` ở phía trình duyệt.

| Chức năng | Tệp/nhóm tệp tiêu biểu |
|---|---|
| Dashboard Admin | `ADMIN/homepage-ad.*` |
| Danh sách tài khoản CS | `ADMIN/accounts.*` |
| Thêm/import tài khoản | `ADMIN/addAccount.html`, `ADMIN/addstudent.html` |
| Báo cáo hoạt động | `ADMIN/activity-report.*` |
| Nhật ký hệ thống | `ADMIN/system-log.*` |
| Cài đặt | `ADMIN/settings.*` |
| Navbar/Admin bar dùng chung | `ADMIN/admin-bar.*` |

---

## Luồng nghiệp vụ chính

### 1. Đăng nhập và định tuyến theo vai trò

Người dùng đăng nhập bằng Email/Password hoặc Google Sign-In. Sau khi Firebase Authentication trả về tài khoản, ứng dụng đọc hồ sơ từ collection `users`, ưu tiên document có ID bằng `uid`, sau đó mới tìm theo email. Hệ thống kiểm tra trạng thái hoạt động và xác định `accountType` hoặc `role` trước khi điều hướng.

| Giá trị được nhận diện | Trang đích mặc định |
|---|---|
| `student`, `hocvien`, `học viên` | `/HV/homepage-hv/homepage.html` |
| `customer_success`, `customer-success`, `cs`, `manager`, `cs_manager` | `/CS/homepageCS/trangchu-cs.html` |
| `admin`, `administrator` | `/ADMIN/accounts.html` |

### 2. Ticket hỗ trợ

1. Học viên hoặc CS tạo ticket.
2. Ticket được lưu tại `tickets/{ticketId}` với dữ liệu người gửi, nội dung, trạng thái, ưu tiên, thời gian và metadata tệp.
3. Lịch sử trao đổi được lưu trong `tickets/{ticketId}/messages`.
4. CS xử lý ticket, cập nhật trạng thái theo quyền nghiệp vụ và có thể phản hồi học viên.
5. Học viên theo dõi ticket, đọc thông báo và tiếp tục trao đổi khi cần.
6. Dashboard sử dụng ticket hoàn tất để tính thời lượng giải quyết trung bình.

### 3. Group và phân công

1. Leader tạo hoặc chọn Group.
2. Leader quản lý Lớp trong Group, danh sách học viên và CS con phù hợp.
3. Ticket được xác định Group/Lớp để hỗ trợ phân công đúng người xử lý.
4. CS con nhận ticket thực hiện cập nhật tiến độ và trao đổi với học viên.
5. Leader và CS con phối hợp qua kênh chat chung của Group.

---

## Kiến trúc kỹ thuật

```text
Browser
  ├─ HTML/CSS/JavaScript thuần
  ├─ Firebase Compat SDK được nhúng theo trang
  ├─ Navbar dùng chung theo vai trò
  └─ Chart/Excel UI theo các module có nhu cầu
        │
        ▼
Firebase
  ├─ Authentication     → Email/Password, Google Sign-In
  ├─ Cloud Firestore    → users, tickets, messages, groups, logs, notifications
  └─ Cloud Storage      → tệp đính kèm ticket/chat
```

| Thành phần | Vai trò |
|---|---|
| HTML5/CSS3/JavaScript ES6+ | Xây dựng giao diện và logic phía client. |
| Firebase Authentication | Đăng nhập Email/Password và Google, quản lý phiên. |
| Cloud Firestore | Lưu hồ sơ, ticket, message, Group, thông báo và log. |
| Firebase Storage | Lưu tệp đính kèm của ticket hoặc trao đổi. |
| Google Fonts / Material Symbols | Phông chữ và icon giao diện. |
| SheetJS | Import/export Excel/CSV tại các màn hình hỗ trợ. |

> **Lưu ý kiến trúc:** Đây là dự án static client-side. Những kiểm tra hiển thị trên giao diện không thể thay thế chính sách truy cập dữ liệu. Việc giới hạn đọc/ghi dữ liệu cần được cấu hình trên Firebase theo vai trò và quan hệ sở hữu dữ liệu.

---

## Cấu trúc thư mục

```text
CSK18/
├── ADMIN/                         # Module quản trị
│   ├── admin-bar.*                # Thanh điều hướng dùng chung Admin
│   ├── accounts.*                 # Quản lý tài khoản CS
│   ├── homepage-ad.*              # Tổng quan Admin
│   ├── activity-report.*          # Báo cáo hoạt động
│   ├── settings.*                 # Cài đặt
│   ├── system-log.*               # Nhật ký hệ thống
│   ├── addAccount.html            # Tạo/import tài khoản CS
│   └── addstudent.html            # Tạo/import tài khoản học viên
├── CS/                            # Module Customer Success
│   ├── Dashboard/                 # Dashboard và xuất Excel
│   ├── Groups/                    # Group Leader và chat Group thành viên
│   ├── PhieuHoTroCS/              # Tạo ticket từ CS
│   ├── TicketManagement/          # Quản lý ticket, trạng thái, chat HV
│   ├── homepageCS/                # Trang chủ CS
│   ├── login/                     # Đăng nhập và quên mật khẩu
│   ├── navbar.*                   # Navbar/chat/thông báo dùng chung CS
│   ├── account-CS.html            # Hồ sơ CS
│   └── tao_email_HV.html          # Hỗ trợ tạo/import học viên
├── HV/                            # Module học viên
│   ├── homepage-hv/               # Trang chủ và tổng quan ticket
│   ├── tickets/                   # Form tạo ticket
│   ├── ticketssent/               # Danh sách ticket đã gửi
│   ├── chat-hv/                   # Trao đổi theo ticket
│   ├── navbar.*                   # Navbar/thông báo dùng chung HV
│   └── account-HV.html            # Hồ sơ học viên
├── FAQs/                          # FAQ cho HV và CS
├── firebase-config.js             # Khởi tạo Firebase App/Auth/Firestore/Storage
├── priority.js                    # Hỗ trợ xác định ưu tiên ticket
├── index.html                     # Điểm vào/điều hướng mặc định
└── README.md                      # Tài liệu dự án
```

---

## Cấu trúc dữ liệu Firebase

Tên trường có thể thay đổi giữa các phiên bản legacy; bảng dưới đây là hợp đồng dữ liệu nên duy trì khi mở rộng dự án.

### `users/{uid}`

| Trường gợi ý | Ý nghĩa |
|---|---|
| `uid` | Firebase Authentication UID. |
| `email` | Email dùng để đối chiếu hồ sơ. |
| `name` hoặc `displayName` | Tên hiển thị. |
| `accountType` | `student`, `customer_success` hoặc `admin`. |
| `role` | Role legacy/fallback như `cs`, `admin`, `hocvien`. |
| `status` | Trạng thái tài khoản; thường là `active` để được đăng nhập. |
| `campus`, `phone`, `classId` | Thông tin nghiệp vụ tùy vai trò. |
| `createdAt`, `updatedAt` | Mốc thời gian phục vụ truy vết. |

### `tickets/{ticketId}`

| Nhóm dữ liệu | Trường thường dùng |
|---|---|
| Định danh | `ticketNum`, `studentId`/`userId`, `ticketId` (nếu có) |
| Nội dung | `title`, `description`, `category`, `issue`, `ticketType` |
| Người gửi | `name`, `email`, `phone`, `campus` |
| Vận hành | `status`, `priority`, `assigneeUid`, `assigneeName`, `groupId`, `classId` |
| Thời gian | `createdAt`, `updatedAt`, `closedAt`, `resolvedAt`, `completedAt` |
| Đánh giá | `satisfactionStatus`, `satisfactionAttemptCount` khi được dùng |
| Tệp | URL, Storage path hoặc metadata của tệp đính kèm |
| Thông báo | `notificationHistory` khi trang học viên tổng hợp lịch sử notification từ ticket |

### Subcollection trao đổi ticket

```text
tickets/{ticketId}/messages/{messageId}
```

Mỗi tin nhắn nên bao gồm `senderId`, `senderRole`, `senderName`, `text`, `createdAt`, `read` và metadata tệp đính kèm nếu có.

### Group, Lớp và chat nội bộ

```text
groups/{groupId}
├── classes/{classId}
└── memberMessages/{messageId}
```

Group thường chứa `leaderUid`, `memberIds` hoặc `members`. Lớp có thể liên kết `studentIds`, `csMemberIds`, danh sách học viên và danh sách CS phụ trách. `memberMessages` lưu hội thoại nội bộ Group giữa Leader và CS con.

### Thông báo và log

| Đường dẫn | Mục đích |
|---|---|
| `studentNotificationState/{uid}` | Trạng thái đã đọc/đã xóa notification của học viên. |
| `csNotifications/{uid}/items/{notificationId}` | Thông báo nội bộ dành cho CS/Leader. |
| `adminNotifications/...` | Thông báo phục vụ khu vực quản trị nếu module đang dùng. |
| `systemLogs/{logId}` | Sự kiện hoạt động để hiển thị trên System Log. |
| `faqs/{faqId}` | Nội dung FAQ nếu dữ liệu được quản lý trên Firestore. |

---

## Cài đặt và chạy local

Vì ứng dụng sử dụng các đường dẫn tuyệt đối như `/HV/...`, `/CS/...` và `/ADMIN/...`, hãy chạy qua web server thay vì mở file bằng `file://`.

### Yêu cầu

| Yêu cầu | Gợi ý |
|---|---|
| Trình duyệt hiện đại | Chrome, Edge, Firefox hoặc Safari phiên bản mới. |
| Python 3 hoặc web server tĩnh | Dùng để phục vụ thư mục project. |
| Firebase project | Đã bật Authentication, Firestore và Storage. |
| Kết nối Internet | Cần để tải Firebase SDK, Google Fonts và CDN SheetJS. |

### Cách chạy bằng Python

```bash
cd /duong-dan/den/CSK18
python3 -m http.server 8000
```

Sau đó mở:

```text
http://localhost:8000/CS/login/login.html
```

Trên Windows, có thể dùng:

```powershell
cd C:\duong-dan\den\CSK18
py -m http.server 8000
```

### Cách chạy bằng VS Code Live Server

1. Mở thư mục `CSK18` trong VS Code.
2. Cài extension **Live Server** nếu chưa có.
3. Mở `CS/login/login.html`.
4. Chọn **Open with Live Server**.
5. Bảo đảm URL được phục vụ từ thư mục gốc dự án để các route bắt đầu bằng `/` hoạt động chính xác.
6. Đăng nhập vào trang admin: hcm@admin.com, mật khẩu: admin123456
   Đăng nhập vào trang CS leader: a.bv@gmail.com, mật khẩu: buivan123
   Đăng nhập vào trang CS: khanh.bp@gmail.com, mật khẩu: buikhanh123
   Đăng nhập vào trang học viên: nguyenvanan@student.edu.vn, mật khẩu: nguyenan123

---

## Cấu hình Firebase

### 1. Chuẩn bị dịch vụ

Trong Firebase Console, cần bật các dịch vụ sau:

| Dịch vụ | Mục đích |
|---|---|
| Authentication | Đăng nhập Email/Password và Google Sign-In. |
| Cloud Firestore | Lưu users, tickets, message, Group, notification và log. |
| Cloud Storage | Lưu tệp đính kèm. |
| Google provider | Chỉ bắt buộc nếu sử dụng nút đăng nhập Google. |

### 2. Cập nhật `firebase-config.js`

Tệp `firebase-config.js` khởi tạo Firebase App và xuất các biến toàn cục `auth`, `db`, `storage`. Nếu triển khai sang Firebase project khác, thay cấu hình web app của **chính project đó** trong tệp này. Không đưa khóa dịch vụ quản trị, private key hoặc file service account vào mã nguồn client.

```js
const firebaseConfig = {
  apiKey: "<YOUR_WEB_API_KEY>",
  authDomain: "<YOUR_PROJECT>.firebaseapp.com",
  projectId: "<YOUR_PROJECT>",
  storageBucket: "<YOUR_BUCKET>",
  messagingSenderId: "<YOUR_SENDER_ID>",
  appId: "<YOUR_APP_ID>"
};
```

### 3. Thiết lập Authentication

1. Bật **Email/Password** nếu dùng đăng nhập bằng mật khẩu.
2. Bật **Google** nếu dùng đăng nhập Google.
3. Thêm `localhost` và tên miền triển khai vào danh sách **Authorized domains**.
4. Tạo document hồ sơ tương ứng trong `users` cho mỗi tài khoản được phép truy cập.

### 4. Khởi tạo hồ sơ người dùng

Document `users/{uid}` là cách ổn định nhất. Hệ thống có fallback tìm theo email, nhưng nên sử dụng UID làm document ID để truy vấn nhanh và tránh email trùng/đổi email.

```js
// Ví dụ minh họa hồ sơ học viên
{
  uid: "<FIREBASE_AUTH_UID>",
  email: "student@example.edu",
  name: "Nguyễn Văn A",
  accountType: "student",
  status: "active",
  createdAt: firebase.firestore.FieldValue.serverTimestamp()
}
```

### 5. Truy cập Firestore và Storage

Repository hiện không kèm theo tệp rule triển khai. Chính sách đọc/ghi phải được thiết kế và quản lý trong Firebase Console hoặc hạ tầng triển khai của bạn. Tối thiểu cần bảo đảm người dùng chỉ có thể đọc/ghi dữ liệu thuộc quyền của mình, còn quyền phân công và quản trị chỉ dành cho role phù hợp.

> Không dùng mã client để thay thế kiểm soát truy cập dữ liệu. Mọi điều kiện quyền quan trọng phải được thực thi ở chính sách dữ liệu hoặc một lớp backend đáng tin cậy.

---

## Các route quan trọng

| Vai trò | Route |
|---|---|
| Đăng nhập | `/CS/login/login.html` |
| Quên mật khẩu | `/CS/login/quenmatkhau.html` |
| Trang chủ học viên | `/HV/homepage-hv/homepage.html` |
| Tạo ticket học viên | `/HV/tickets/phieuhotro.html` |
| Ticket đã gửi | `/HV/ticketssent/ticketssent.html` |
| Trao đổi ticket | `/HV/chat-hv/trao-doi-ticket.html?ticket={ticketId}` |
| Trang chủ CS | `/CS/homepageCS/trangchu-cs.html` |
| Quản lý ticket CS | `/CS/TicketManagement/cs-ticket.html` |
| Dashboard CS | `/CS/Dashboard/cs-dashboard.html` |
| Group Leader | `/CS/Groups/group.html` |
| Chat Group | `/CS/Groups/group-member.html` |
| Dashboard Admin | `/ADMIN/homepage-ad.html` |
| Quản lý tài khoản | `/ADMIN/accounts.html` |
| Báo cáo hoạt động | `/ADMIN/activity-report.html` |
| System Log | `/ADMIN/system-log.html` |
| FAQ học viên | `/FAQs/faq.html` |
| FAQ CS | `/FAQs/CS-FAQ.html` |

---

## Phân quyền và lưu ý bảo mật

Phân quyền giao diện giúp người dùng nhìn thấy đúng công cụ, nhưng không đủ để bảo vệ dữ liệu. Mỗi lần mở rộng tính năng ghi dữ liệu, hãy kiểm tra đồng thời: điều kiện UI, điều kiện JavaScript và chính sách dữ liệu Firebase.

| Khu vực | Điều cần kiểm soát |
|---|---|
| `users` | Người dùng chỉ đọc/sửa hồ sơ của mình; Admin quản lý các hồ sơ được cấp quyền. |
| `tickets` | Học viên chỉ truy cập ticket của mình; CS chỉ xử lý phạm vi được giao; Leader/Admin theo phạm vi nghiệp vụ. |
| `messages` | Chỉ thành viên của hội thoại ticket được đọc/ghi. |
| `groups` và `memberMessages` | Chỉ Leader/Member được xác thực của Group truy cập. |
| `csNotifications`, `studentNotificationState` | Chỉ chủ sở hữu UID đọc/ghi trạng thái của mình. |
| `systemLogs` | Chỉ Admin được đọc; ghi log qua luồng tin cậy theo chính sách triển khai. |
| Storage | Xác thực người tải lên và hạn chế loại/kích thước tệp theo nhu cầu nghiệp vụ. |

Không commit các thông tin nhạy cảm như service account, private key, mật khẩu test hoặc token của bên thứ ba. Cấu hình web Firebase là cấu hình phía client, nhưng vẫn cần giới hạn API, domain được ủy quyền và rules phù hợp.

---

## Khắc phục sự cố

| Triệu chứng | Kiểm tra/khắc phục |
|---|---|
| `Firebase chưa được initialize` | Kiểm tra thứ tự nhúng SDK; `firebase-config.js` phải được tải trước controller của trang. |
| Đăng nhập thành công nhưng bị đăng xuất | Kiểm tra document `users/{uid}`, email, `accountType`/`role` và `status: "active"`. |
| Google Sign-In báo `unauthorized-domain` | Thêm domain đang chạy vào Firebase Authentication → Authorized domains. |
| Không thấy ticket hoặc chat | Kiểm tra UID người dùng, trường `studentId`/người nhận và quyền Firestore. |
| Không tải được tệp đính kèm | Kiểm tra Firebase Storage, URL/path metadata, quyền Storage và CORS nếu dùng URL ngoài. |
| Route `/HV/...` hoặc `/CS/...` lỗi | Không mở bằng `file://`; chạy project bằng HTTP server từ thư mục gốc. |
| Dashboard không có thời gian trung bình | Kiểm tra ticket hoàn tất có `createdAt` cùng một mốc `closedAt`, `resolvedAt`, `completedAt` hoặc `updatedAt` hợp lệ. |
| Badge thông báo không giảm | Kiểm tra kết nối Firestore và document `studentNotificationState/{uid}` của tài khoản đang đăng nhập. |

---

## Giới hạn hiện tại và hướng phát triển

Phiên bản hiện tại phù hợp làm hệ thống nội bộ, demo hoặc nền tảng nghiệp vụ quy mô nhỏ đến vừa. Khi triển khai thật, nên ưu tiên các hướng sau:

1. Tách logic dùng chung trong JavaScript thành module nhỏ hơn để giảm trùng lặp giữa các trang.
2. Chuẩn hóa một schema Firestore duy nhất thay vì duy trì nhiều tên trường legacy cho cùng một ý nghĩa.
3. Viết chính sách Firestore/Storage theo vai trò, ownership và membership của Group.
4. Bổ sung kiểm thử luồng quan trọng: login, tạo ticket, phân công, cập nhật trạng thái, chat và notification.
5. Dùng Cloud Functions hoặc backend tin cậy cho nghiệp vụ cần đặc quyền, gửi email, audit log và thông báo cross-user.
6. Cân nhắc chuyển dần sang kiến trúc component/module khi số trang và logic tiếp tục tăng.

---

## Tài liệu tham khảo

- [1] [Firebase Authentication — Web](https://firebase.google.com/docs/auth/web/start)
- [2] [Cloud Firestore — Web](https://firebase.google.com/docs/firestore/quickstart)
- [3] [Cloud Storage for Firebase — Web](https://firebase.google.com/docs/storage/web/start)
- [4] [SheetJS Documentation](https://docs.sheetjs.com/)

---

## Ghi nhận

README này được viết lại dựa trên **README gốc** và việc đối chiếu mã nguồn có trong gói dự án CSK18: cấu trúc thư mục, HTML pages, controller JavaScript, cấu hình Firebase và các contract Firestore được tham chiếu. Những trường dữ liệu mang tính legacy được mô tả theo hướng tương thích; trước khi đưa vào production, hãy chuẩn hóa schema và kiểm thử trên Firebase project riêng.
