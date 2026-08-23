/*
 * Firebase Compat SDK 10.8.0.
 * Tệp này chỉ hiển thị những ticket có studentId trùng với tài khoản đang đăng nhập.
 */
(function () {
  "use strict";

  if (!window.firebase) {
    console.error("Firebase Compat SDK chưa được tải.");
    return;
  }

  if (!firebase.apps.length) {
    console.error("Firebase chưa được khởi tạo. Hãy kiểm tra đường dẫn firebase-config.js.");
    return;
  }

  const auth = firebase.auth();
  const db = firebase.firestore();
  const storage = typeof firebase.storage === "function" ? firebase.storage() : null;
  const $ = (selector) => document.querySelector(selector);

  const nodes = {
    loading: $("#sentLoading") || $("#stLoading"),
    empty: $("#sentEmpty") || $("#stEmpty"),
    error: $("#sentError") || $("#stStatus"),
    grid: $("#sentTicketGrid") || $("#stTicketGrid") || $("#recentTicketList"),
    count: $("#sentTicketCount") || $("#stTicketCount"),
    profile: $("#sentProfileLink") || $("#stProfileLink"),
  };

  const isRecentList = nodes.grid && nodes.grid.id === "recentTicketList";

  const STATUS_LABELS = {
    open: "Đang mở",
    in_progress: "Đang xử lý",
    resolved: "Đã giải quyết",
    closed: "Đã đóng",
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

    if (nodes.grid) {
      if (isRecentList) {
        nodes.grid.hidden = false;
        nodes.grid.innerHTML = `<div class="loading-state">${escapeHtml(message)}</div>`;
      } else {
        nodes.grid.innerHTML = "";
        nodes.grid.hidden = true;
      }
    }

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
    const dot = useStClasses ? '<i class="st-status-dot" aria-hidden="true"></i>' : "";
    return `<span class="${className} ${normalized}">${dot}${STATUS_LABELS[normalized]}</span>`;
  }

  function renderSatisfaction(ticket, status) {
    if (status !== "closed" || readValue(ticket, "satisfactionStatus") !== "awaiting") {
      return "";
    }

    const ticketId = escapeHtml(ticket.id);
    const round = Number(ticket.satisfactionRound) || 1;

    return `
      <div class="sent-satisfaction" aria-label="Đánh giá phản hồi Customer Success">
        <p>Customer Success đã đóng ticket. Bạn có hài lòng với kết quả hỗ trợ không?</p>
        <div class="sent-satisfaction-actions">
          <button type="button" class="sent-satisfaction-button is-positive"
            data-satisfaction="satisfied" data-ticket-id="${ticketId}" data-satisfaction-round="${round}">
            Hài lòng
          </button>
          <button type="button" class="sent-satisfaction-button is-negative"
            data-satisfaction="unsatisfied" data-ticket-id="${ticketId}" data-satisfaction-round="${round}">
            Không hài lòng
          </button>
        </div>
      </div>`;
  }

  function renderTickets(tickets) {
    if (!nodes.grid) {
      setError("Không tìm thấy phần tử hiển thị danh sách ticket.");
      return;
    }

    const useStClasses = nodes.grid.id === "stTicketGrid";
    const classes = useStClasses
      ? {
          card: "st-ticket-card",
          head: "st-card-head",
          body: "st-card-body",
          field: "st-card-field",
          type: "st-card-type",
          response: "st-response",
          responseTitle: "st-response-heading",
          foot: "st-card-foot",
        }
      : {
          card: "sent-ticket-card",
          head: "sent-card-head",
          body: "sent-card-body",
          field: "sent-card-field",
          type: "sent-card-type",
          response: "sent-response",
          responseTitle: "sent-response-title",
          foot: "sent-card-foot",
        };

    if (nodes.count) nodes.count.textContent = String(tickets.length);
    setHidden(nodes.loading, true);
    setHidden(nodes.error, true);
    setHidden(nodes.empty, tickets.length !== 0);

    if (isRecentList) {
      nodes.grid.hidden = false;
    } else {
      setHidden(nodes.grid, tickets.length === 0);
    }

    if (!tickets.length) {
      nodes.grid.innerHTML = isRecentList
        ? `<div class="empty-state">Bạn chưa có ticket nào. Hãy tạo yêu cầu đầu tiên.</div>`
        : "";
      return;
    }

    nodes.grid.innerHTML = tickets.map((ticket) => {
      const ticketId = encodeURIComponent(ticket.id);
      const status = normalizedStatus(ticket.status);
      const category = readValue(ticket, "ticketCategory", "categoryLabel") || "Hỗ trợ";
      const issue = readValue(ticket, "issueLabel", "ticketIssue") || "Chưa chọn vấn đề";
      const title = readValue(ticket, "title") || "Không có tiêu đề";
      const response = readValue(ticket, "lastCSReply") ||
        "Phản hồi của CS sẽ hiển thị tại đây sau khi yêu cầu được tiếp nhận.";

      return `
        <article class="${classes.card}">
          <div class="${classes.head}">
            <span>MÃ YÊU CẦU</span>
            <strong>${escapeHtml(readValue(ticket, "ticketNum", "ticket_num") || "BL-——")}</strong>
            <div class="${classes.type}">◌ ${escapeHtml(category)} · ${escapeHtml(issue)}</div>
          </div>
          <div class="${classes.body}">
            <div class="${classes.field}"><span>Người gửi</span><strong>${escapeHtml(readValue(ticket, "name") || "Học viên")}</strong></div>
            <div class="${classes.field}"><span>Cơ sở</span><strong>${escapeHtml(readValue(ticket, "campus") || "Chưa cập nhật")}</strong></div>
            <div class="${classes.field}"><span>Lớp</span><strong>${escapeHtml(readValue(ticket, "className", "class") || "Chưa cập nhật")}</strong></div>
            <div class="${classes.field}"><span>Tiêu đề</span><strong>${escapeHtml(title)}</strong></div>
            <div class="${classes.field}"><span>Ngày gửi</span><strong>${escapeHtml(formatDate(ticket.createdAt))}</strong></div>
            <div class="${classes.field}"><span>Trạng thái</span><strong>${renderStatus(status, useStClasses)}</strong></div>
            <div class="${classes.response}">
              <div class="${classes.responseTitle}"><span>Phản hồi của CS</span></div>
              <p>${escapeHtml(response)}</p>
              ${renderSatisfaction(ticket, status)}
            </div>
          </div>
          <div class="${classes.foot}">
            <span>Giữ lại mã yêu cầu để tra cứu</span>
            <a href="/HV/chat-hv/trao-doi-ticket.html?ticket=${ticketId}"
              data-open-exchange data-ticket-id="${escapeHtml(ticket.id)}">Mở trao đổi →</a>
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
        if (latestTicket.satisfactionStatus !== "awaiting" ||
            (Number(latestTicket.satisfactionRound) || 1) !== satisfactionRound) {
          throw new Error("Yêu cầu đánh giá này không còn hiệu lực. Vui lòng tải lại.");
        }

        const update = {
          satisfactionStatus: choice,
          satisfactionRespondedAt: firebase.firestore.FieldValue.serverTimestamp(),
          satisfactionRespondedRound: satisfactionRound,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        };

        if (choice === "satisfied") {
          update.status = "closed";
          update.closedConfirmedAt = firebase.firestore.FieldValue.serverTimestamp();
        } else {
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

        transaction.update(ticketRef, update);
      });

      if (choice === "unsatisfied") {
        window.location.assign(`/HV/chat-hv/trao-doi-ticket.html?ticket=${encodeURIComponent(ticketId)}`);
      }
    } catch (error) {
      console.error("Không thể lưu đánh giá phản hồi:", error);
      setError(error && error.message ? error.message : "Không thể lưu đánh giá. Vui lòng thử lại.");
      buttons.forEach((item) => { item.disabled = false; });
    }
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
      setError(error && error.message ? error.message : "Không thể mở đoạn chat. Vui lòng thử lại.");
      link.textContent = originalText;
    } finally {
      link.removeAttribute("aria-busy");
      link.classList.remove("is-opening-chat");
    }
  }

  nodes.grid?.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;

    const button = target.closest("[data-satisfaction]");
    if (button) {
      event.preventDefault();
      submitSatisfaction(button);
      return;
    }

    const chatLink = target.closest("[data-open-exchange]");
    if (chatLink) {
      event.preventDefault();
      openOrCreateStudentChat(chatLink);
    }
  });

  function watchMyTickets(user) {
    if (unsubscribeTickets) unsubscribeTickets();

    unsubscribeTickets = db.collection("tickets")
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
        },
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
          const profile = profileSnapshot.data();
          nodes.profile.textContent = profile.name || user.email || "Tài khoản";
        }
      })
      .catch((error) => console.warn("Không đọc được profile:", error));

    watchMyTickets(user);
  });

  window.studentTicketsFirebase = { auth, db, storage, watchMyTickets };
})();
