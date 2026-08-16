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
  function hasChatThread(ticket) {
    return ticket?.chatThreadCreated === true;
  }
  async function openOrCreateStudentChat(link) {
    const ticketId = link.dataset.ticketId;
    const user = auth.currentUser;
    if (!ticketId || !user) {
      setError("Bạn cần đăng nhập để mở trao đổi.");
      return;
    }
    link.setAttribute("aria-busy", "true");
    link.classList.add("is-opening-chat");
    const originalText = link.textContent;
    link.textContent = "Đang mở...";
    try {
      const ticketRef = db.collection("tickets").doc(ticketId);
      await db.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(ticketRef);
        if (!snapshot.exists) throw new Error("Không tìm thấy ticket.");
        const ticket = snapshot.data();
        if (ticket.studentId !== user.uid) {
          throw new Error("Bạn không có quyền mở đoạn chat của ticket này.");
        }
        if (ticket.chatThreadCreated === true) return;
        transaction.update(ticketRef, {
          chatThreadCreated: true,
          chatThreadCreatedAt: firebase.firestore.FieldValue.serverTimestamp(),
          chatThreadCreatedBy: "student",
          chatThreadCreatedByUid: user.uid,
          studentMessageCount: Number.isInteger(ticket.studentMessageCount) ? ticket.studentMessageCount : 0,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
      });
      window.location.assign(link.href);
    } catch (error) {
      console.error("Không thể tạo đoạn chat:", error);
      setError(error?.message || "Không thể mở đoạn chat. Vui lòng thử lại.");
      link.textContent = originalText;
    } finally {
      link.removeAttribute("aria-busy");
      link.classList.remove("is-opening-chat");
    }
  }
  function renderSatisfaction(ticket, status) {
    const satisfactionStatus = readValue(ticket, "satisfactionStatus");
    if (status !== "closed") return "";
    if (satisfactionStatus === "awaiting") {
      return `
        <div class="sent-satisfaction" aria-label="Đánh giá phản hồi Customer Success">
          <p>Customer Success đã đóng ticket. Bạn có hài lòng với kết quả hỗ trợ không?</p>
          <div class="sent-satisfaction-actions">
            <button type="button" class="sent-satisfaction-button is-positive" data-satisfaction="satisfied" data-ticket-id="${escapeHtml(ticket.id)}" data-satisfaction-round="${Number(ticket.satisfactionRound) || 1}">Hài lòng</button>
            <button type="button" class="sent-satisfaction-button is-negative" data-satisfaction="unsatisfied" data-ticket-id="${escapeHtml(ticket.id)}" data-satisfaction-round="${Number(ticket.satisfactionRound) || 1}">Không hài lòng</button>
          </div>
        </div>`;
    }
    return "";
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
              ${renderSatisfaction(ticket, status)}
            </div>
          </div>
          <div class="${footClass}">
            <span>Giữ lại mã yêu cầu để tra cứu</span>
            <a href="/HV/chat-hv/trao-doi-ticket.html?ticket=${ticketId}" data-open-exchange data-ticket-id="${escapeHtml(ticket.id)}">${hasChatThread(ticket) ? "Mở trao đổi →" : "Mở trao đổi →"}</a>
          </div>
        </article>`;
    }).join("");
  }
  async function submitSatisfaction(button) {
    const ticketId = button.dataset.ticketId;
    const choice = button.dataset.satisfaction;
    const satisfactionRound = Number(button.dataset.satisfactionRound) || 1;
    if (!ticketId || !choice) return;
    const card = button.closest(".sent-ticket-card, .st-ticket-card");
    const buttons = card ? card.querySelectorAll("[data-satisfaction]") : [];
    buttons.forEach((item) => { item.disabled = true; });
        try {
      const user = auth.currentUser;
      if (!user) throw new Error("Bạn cần đăng nhập để xác nhận ticket.");
      const update = {
        satisfactionStatus: choice,
        satisfactionRespondedAt: firebase.firestore.FieldValue.serverTimestamp(),
        satisfactionRespondedRound: satisfactionRound,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      };
      if (choice === "satisfied") {
        update.status = "closed";
        update.closedConfirmedAt = firebase.firestore.FieldValue.serverTimestamp();
      } else if (choice === "unsatisfied") {
        update.status = "in_progress";
        update.closedAt = null;
        update.reopenedAt = firebase.firestore.FieldValue.serverTimestamp();
        update.reopenedBy = "student";
        update.reopenedToStatus = "in_progress";
        update.chatThreadCreated = true;
        update.chatThreadCreatedAt = firebase.firestore.FieldValue.serverTimestamp();
        update.chatThreadCreatedBy = "student";
        update.chatThreadCreatedByUid = user.uid;
      }
      await db.runTransaction(async (transaction) => {
        const ticketRef = db.collection("tickets").doc(ticketId);
        const snapshot = await transaction.get(ticketRef);
        if (!snapshot.exists) throw new Error("Không tìm thấy ticket.");
        const latestTicket = snapshot.data();
        if (latestTicket.studentId !== user.uid) {
          throw new Error("Bạn không có quyền xác nhận ticket này.");
        }
        if (normalizedStatus(latestTicket.status) !== "closed") {
          throw new Error("Ticket đã thay đổi trạng thái. Vui lòng tải lại.");
        }
        if (latestTicket.satisfactionStatus !== "awaiting" || (Number(latestTicket.satisfactionRound) || 1) !== satisfactionRound) {
          throw new Error("Yêu cầu đánh giá này không còn hiệu lực. Vui lòng tải lại.");
        }
                transaction.update(ticketRef, update);
      });
      if (choice === "unsatisfied") {
        window.location.assign(`/HV/chat-hv/trao-doi-ticket.html?ticket=${encodeURIComponent(ticketId)}`);
      }
    } catch (error) {
      console.error("Không thể lưu đánh giá phản hồi:", error);
      setError("Không thể lưu đánh giá. Vui lòng thử lại.");
      buttons.forEach((item) => { item.disabled = false; });
    }
  }
  nodes.grid?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-satisfaction]");
    if (button) {
      event.preventDefault();
      submitSatisfaction(button);
      return;
    }
    const chatLink = event.target.closest("[data-open-exchange]");
    if (!chatLink) return;
    event.preventDefault();
    openOrCreateStudentChat(chatLink);
  });
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
