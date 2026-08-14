/*
  Firebase Compat SDK 10.8.0
  Dùng sau các script:
  firebase-app-compat.js
  firebase-auth-compat.js
  firebase-firestore-compat.js
  firebase-storage-compat.js

  Trang này chỉ tải những ticket có studentId trùng với tài khoản đang đăng nhập.
*/

(function () {
    "use strict";
  
    const firebaseConfig = {
      apiKey: "AIzaSyB8Ex-7oQyKEn56NHynpYomwpc6-F1pxzA",
      authDomain: "csk18-cafee.firebaseapp.com",
      projectId: "csk18-cafee",
      storageBucket: "csk18-cafee.firebasestorage.app",
      messagingSenderId: "323107048224",
      appId: "1:323107048224:web:96a5fb888393bf6a5fe081"
    };
  
    if (!window.firebase) {
      console.error("Firebase Compat SDK chưa được tải.");
      return;
    }
  
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
  
    const auth = firebase.auth();
    const db = firebase.firestore();
  
    // Có thể dùng khi trang cần upload ảnh ở phần trao đổi.
    const storage = typeof firebase.storage === "function" ? firebase.storage() : null;
  
    const $ = (selector) => document.querySelector(selector);
  
    // Hỗ trợ cả ID trong bản tách riêng sent-* và bản đang chạy st-*.
    const nodes = {
      loading: $("#sentLoading") || $("#stLoading"),
      empty: $("#sentEmpty") || $("#stEmpty"),
      error: $("#sentError") || $("#stStatus"),
      grid: $("#sentTicketGrid") || $("#stTicketGrid"),
      count: $("#sentTicketCount") || $("#stTicketCount"),
      profile: $("#sentProfileLink") || $("#stProfileLink")
    };
  
    const STATUS_LABELS = {
      open: "Đang mở",
      in_progress: "Đang xử lý",
      resolved: "Đã giải quyết",
      closed: "Đã đóng"
    };
  
    let unsubscribeTickets = null;
  
    function escapeHtml(value) {
      const element = document.createElement("div");
      element.textContent = value == null ? "" : String(value);
      return element.innerHTML;
    }
  
    function toMillis(value) {
      if (!value) return 0;
      if (typeof value.toMillis === "function") return value.toMillis();
      if (typeof value.toDate === "function") return value.toDate().getTime();
      if (typeof value.seconds === "number") return value.seconds * 1000;
  
      const parsed = new Date(value).getTime();
      return Number.isNaN(parsed) ? 0 : parsed;
    }
  
    function formatDate(value) {
      const millis = toMillis(value);
      return millis ? new Date(millis).toLocaleDateString("vi-VN") : "—";
    }
  
    function readValue(ticket, ...keys) {
      for (const key of keys) {
        const value = ticket[key];
        if (value !== undefined && value !== null && String(value).trim() !== "") {
          return value;
        }
      }
      return "";
    }
  
    function setHidden(element, hidden) {
      if (element) element.hidden = hidden;
    }
  
    function setError(message) {
      setHidden(nodes.loading, true);
      setHidden(nodes.empty, true);
  
      if (nodes.error) {
        nodes.error.hidden = false;
        nodes.error.textContent = message;
      } else {
        console.error(message);
      }
    }
  
    function normalizedStatus(status) {
      return STATUS_LABELS[status] ? status : "open";
    }
  
    function renderStatus(status, useStClasses) {
      const normalized = normalizedStatus(status);
      const className = useStClasses ? "st-status-badge" : "sent-status";
      const dot = useStClasses ? '<i class="st-status-dot"></i>' : "";
      return `<span class="${className} ${normalized}">${dot}${STATUS_LABELS[normalized]}</span>`;
    }
  
    function renderTickets(tickets) {
      if (!nodes.grid) {
        console.error("Không tìm thấy #sentTicketGrid hoặc #stTicketGrid.");
        return;
      }
  
      const useStClasses = nodes.grid.id === "stTicketGrid";
      const cardClass = useStClasses ? "st-ticket-card" : "sent-ticket-card";
      const headClass = useStClasses ? "st-card-head" : "sent-card-head";
      const bodyClass = useStClasses ? "st-card-body" : "sent-card-body";
      const fieldClass = useStClasses ? "st-card-field" : "sent-card-field";
      const typeClass = useStClasses ? "st-card-type" : "sent-card-type";
      const responseClass = useStClasses ? "st-response" : "sent-response";
      const responseTitleClass = useStClasses ? "st-response-heading" : "sent-response-title";
      const footClass = useStClasses ? "st-card-foot" : "sent-card-foot";
  
      if (nodes.count) nodes.count.textContent = String(tickets.length);
      setHidden(nodes.loading, true);
      setHidden(nodes.empty, tickets.length !== 0);
      setHidden(nodes.grid, tickets.length === 0);
  
      if (!tickets.length) {
        nodes.grid.innerHTML = "";
        return;
      }
  
      nodes.grid.innerHTML = tickets.map((ticket) => {
        const ticketId = encodeURIComponent(ticket.id);
        const status = normalizedStatus(ticket.status);
        const category = readValue(ticket, "ticketCategory", "categoryLabel") || "Hỗ trợ";
        const issue = readValue(ticket, "issueLabel", "ticketIssue") || "Chưa chọn vấn đề";
        const title = readValue(ticket, "title") || "Không có tiêu đề";
        const response = readValue(ticket, "lastCSReply") ||
          "Phản hồi của CS sẽ hiển thị tại đây sau khi ban xử lý tiếp nhận yêu cầu.";
  
        return `
          <article class="${cardClass}">
            <div class="${headClass}">
              <span>MÃ YÊU CẦU</span>
              <strong>${escapeHtml(readValue(ticket, "ticketNum", "ticket_num") || "BL-——")}</strong>
              <div class="${typeClass}">◌ ${escapeHtml(category)} · ${escapeHtml(issue)}</div>
            </div>
            <div class="${bodyClass}">
              <div class="${fieldClass}"><span>Người gửi</span><strong>${escapeHtml(readValue(ticket, "name") || "Học viên")}</strong></div>
              <div class="${fieldClass}"><span>Cơ sở</span><strong>${escapeHtml(readValue(ticket, "campus") || "Chưa cập nhật")}</strong></div>
              <div class="${fieldClass}"><span>Lớp</span><strong>${escapeHtml(readValue(ticket, "className", "class") || "Chưa cập nhật")}</strong></div>
              <div class="${fieldClass}"><span>Tiêu đề</span><strong>${escapeHtml(title)}</strong></div>
              <div class="${fieldClass}"><span>Ngày gửi</span><strong>${escapeHtml(formatDate(ticket.createdAt))}</strong></div>
              <div class="${fieldClass}"><span>Trạng thái</span><strong>${renderStatus(status, useStClasses)}</strong></div>
              <div class="${responseClass}">
                <div class="${responseTitleClass}"><span>Phản hồi của CS</span></div>
                <p>${escapeHtml(response)}</p>
              </div>
            </div>
            <div class="${footClass}">
              <span>Giữ lại mã yêu cầu để tra cứu</span>
              <a href="/exchange?ticket=${ticketId}">Mở trao đổi →</a>
            </div>
          </article>`;
      }).join("");
    }
  
    function watchMyTickets(user) {
      if (unsubscribeTickets) unsubscribeTickets();
  
      // Khóa tách dữ liệu theo tài khoản học viên.
      unsubscribeTickets = db
        .collection("tickets")
        .where("studentId", "==", user.uid)
        .onSnapshot(
          (snapshot) => {
            const tickets = snapshot.docs
              .map((doc) => ({ id: doc.id, ...doc.data() }))
              .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
  
            renderTickets(tickets);
          },
          (error) => {
            console.error("Không thể tải tickets:", error);
            setError("Không thể tải danh sách ticket của tài khoản này.");
          }
        );
    }
  
    auth.onAuthStateChanged((user) => {
      if (unsubscribeTickets) {
        unsubscribeTickets();
        unsubscribeTickets = null;
      }
  
      if (!user) {
        setError("Bạn cần đăng nhập để xem các ticket của mình.");
        return;
      }
  
      if (nodes.profile) {
        nodes.profile.textContent = user.displayName || user.email || "Tài khoản";
      }
  
      db.collection("users").doc(user.uid).get()
        .then((profileSnapshot) => {
          if (nodes.profile && profileSnapshot.exists) {
            nodes.profile.textContent = profileSnapshot.data().name || user.email || "Tài khoản";
          }
        })
        .catch((error) => console.warn("Không đọc được profile:", error));
  
      watchMyTickets(user);
    });
  
    // Export để trang Exchange hoặc code khác có thể dùng cùng Firebase instance.
    window.studentTicketsFirebase = { auth, db, storage, watchMyTickets };
  })();
  