document.addEventListener("DOMContentLoaded", () => {
  const openTicketsEl = document.getElementById("openTicketsCount");
  const progressTicketsEl = document.getElementById("progressTicketsCount");
  const resolvedTicketsEl = document.getElementById("resolvedTicketsCount");
  const totalTicketsEl = document.getElementById("totalTicketsCount");
  const recentListEl = document.getElementById("recentTicketList");
  const connectionDotEl = document.getElementById("connectionDot");
  const connectionLabelEl = document.getElementById("connectionLabel");
  const todayLabelEl = document.getElementById("todayLabel");
  const welcomeNameEl = document.getElementById("welcomeName");
  const notificationButton = document.getElementById("notificationButton");
  const notificationCountEl = document.getElementById("notificationCount");
  const notificationPanel = document.getElementById("notificationPanel");
  const notificationClose = document.getElementById("notificationClose");
  const notificationBackdrop = document.getElementById("notificationBackdrop");
  const notificationList = document.getElementById("notificationList");
  const notificationEmpty = document.getElementById("notificationEmpty");
  const notificationUnreadLabel = document.getElementById("notificationUnreadLabel");
  let currentStudentUid = "";
  let notificationRecords = [];
  function renderNotifications() {
    if (!notificationList) return;
    const unreadCount = notificationRecords.length;
    if (notificationCountEl) {
      notificationCountEl.hidden = unreadCount === 0;
      notificationCountEl.textContent = unreadCount > 99 ? "99+" : String(unreadCount);
    }
    if (notificationUnreadLabel) {
      notificationUnreadLabel.textContent = unreadCount
        ? `${unreadCount} thông báo mới nhất`
        : "Chưa có thông báo";
    }
    if (notificationEmpty) notificationEmpty.classList.toggle("show", notificationRecords.length === 0);
    notificationList.innerHTML = notificationRecords.map(item => `
      <a class="notification-item" href="/HV/chat-hv/trao-doi-ticket.html?ticket=${encodeURIComponent(item.ticketId)}">
        <div class="notification-item-head"><span class="notification-item-code">${escapeHTML(item.ticketNum)}</span><span class="notification-item-time">${escapeHTML(formatDate(item.createdAt || item.updatedAt))}</span></div>
        <div class="notification-item-title">${escapeHTML(item.title || "Ticket hỗ trợ")}</div>
        <div class="notification-item-message">${escapeHTML(item.preview || (item.type === "message" ? "Customer Success đã gửi tin nhắn mới." : "Customer Success đã cập nhật trạng thái ticket."))}</div>
        <span class="notification-item-status">${escapeHTML(item.type === "message" ? "Tin nhắn mới" : (item.statusLabel || "Cập nhật trạng thái"))}</span>
      </a>
    `).join("");
  }
  function readTicketNotificationHistory(tickets) {
    notificationRecords = tickets
      .flatMap(ticket => {
        const history = Array.isArray(ticket.notificationHistory) ? ticket.notificationHistory : [];
        return history.map(item => ({
          ...item,
          ticketId: item.ticketId || ticket.id,
          ticketNum: item.ticketNum || firstValue(ticket, "ticketNum", "ticket_num", "id") || "Ticket",
          title: item.title || firstValue(ticket, "title", "subject") || "Ticket hỗ trợ"
        }));
      })
      .sort((a, b) => getMillis(b.createdAt) - getMillis(a.createdAt))
      .slice(0, 50);
    renderNotifications();
  }
  function openNotifications() {
    if (!notificationPanel) return;
    notificationPanel.classList.add("open");
    notificationPanel.setAttribute("aria-hidden", "false");
    notificationButton?.setAttribute("aria-expanded", "true");
    if (notificationBackdrop) {
      notificationBackdrop.hidden = false;
      requestAnimationFrame(() => notificationBackdrop.classList.add("show"));
    }
  }
  function closeNotifications() {
    if (!notificationPanel) return;
    notificationPanel.classList.remove("open");
    notificationPanel.setAttribute("aria-hidden", "true");
    notificationButton?.setAttribute("aria-expanded", "false");
    notificationBackdrop?.classList.remove("show");
    window.setTimeout(() => {
      if (notificationBackdrop) notificationBackdrop.hidden = true;
    }, 200);
  }
  notificationButton?.addEventListener("click", () => {
    notificationPanel?.classList.contains("open") ? closeNotifications() : openNotifications();
  });
  notificationClose?.addEventListener("click", closeNotifications);
  notificationBackdrop?.addEventListener("click", closeNotifications);
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeNotifications();
  });
  renderNotifications();
  // ======================================================
  // STATUS
  // ======================================================
  const STATUS_META = {
    open: {
      label: "Đang mở",
      className: "status-open"
    },
    pending: {
      label: "Đang chờ",
      className: "status-open"
    },
    in_progress: {
      label: "Đang xử lý",
      className: "status-in_progress"
    },
    resolved: {
      label: "Đã giải quyết",
      className: "status-resolved"
    },
    closed: {
      label: "Đã đóng",
      className: "status-closed"
    }
  };
  // ======================================================
  // FIREBASE
  // ======================================================
  function getDatabase() {
    if (typeof db !== "undefined" && db) {
      return db;
    }
    return window.db || null;
  }
  function getAuth() {
    if (typeof auth !== "undefined" && auth) {
      return auth;
    }
    return window.auth || null;
  }
  // ======================================================
  // HELPER
  // ======================================================
  function firstValue(ticket, ...keys) {
    for (const key of keys) {
      if (
        ticket[key] !== undefined &&
        ticket[key] !== null &&
        String(ticket[key]).trim()
      ) {
        return ticket[key];
      }
    }
    return "";
  }
  function normalizeStatus(status) {
    if (!STATUS_META[status]) {
      return "open";
    }
    return status;
  }
  function getMillis(value) {
    if (!value) {
      return 0;
    }
    if (typeof value.toMillis === "function") {
      return value.toMillis();
    }
    if (typeof value.toDate === "function") {
      return value.toDate().getTime();
    }
    if (typeof value.seconds === "number") {
      return value.seconds * 1000;
    }
    const valueMillis =
      new Date(value).getTime();
    return Number.isNaN(valueMillis)
      ? 0
      : valueMillis;
  }
  function formatDate(value) {
    const millis = getMillis(value);
    return millis
      ? new Date(millis).toLocaleDateString("vi-VN")
      : (value || "—");
  }
  function escapeHTML(value) {
    const element =
      document.createElement("div");
    element.textContent =
      value == null
        ? ""
        : String(value);
    return element.innerHTML;
  }
  function setText(element, value) {
    if (element) {
      element.textContent = value;
    }
  }
  // ======================================================
  // NGÀY HIỆN TẠI
  // ======================================================
  setText(
    todayLabelEl,
    new Date().toLocaleDateString(
      "vi-VN",
      {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      }
    )
  );
  // ======================================================
  // TÊN HỌC VIÊN
  // ======================================================
  function updateWelcomeName(name) {
    if (!welcomeNameEl) {
      return;
    }
    const displayName =
      (name || "Học viên").trim();
    welcomeNameEl.textContent =
      displayName || "Học viên";
  }
  // ======================================================
  // RENDER TICKET
  // ======================================================
  function renderHomepageSatisfaction(ticket, status) {
    if (status !== "closed" || ticket.satisfactionStatus !== "awaiting") return "";
    const round = Number(ticket.satisfactionRound) || 1;
    return `
      <div class="homepage-satisfaction" aria-label="Đánh giá phản hồi Customer Success">
        <p>Customer Success đã phản hồi. Bạn có hài lòng với kết quả hỗ trợ không?</p>
        <div class="homepage-satisfaction-actions">
          <button type="button" class="homepage-satisfaction-button is-positive" data-home-satisfaction="satisfied" data-ticket-id="${escapeHTML(ticket.id)}" data-satisfaction-round="${round}">Hài lòng</button>
          <button type="button" class="homepage-satisfaction-button is-negative" data-home-satisfaction="unsatisfied" data-ticket-id="${escapeHTML(ticket.id)}" data-satisfaction-round="${round}">Không hài lòng</button>
        </div>
      </div>
    `;
  }
  async function submitHomepageSatisfaction(button) {
    const ticketId = button.dataset.ticketId;
    const choice = button.dataset.homeSatisfaction;
    const satisfactionRound = Number(button.dataset.satisfactionRound) || 1;
    const database = getDatabase();
    const user = getAuth()?.currentUser;
    if (!ticketId || !choice || !database || !user) return;
    const card = button.closest(".homepage-ticket-card, .recent-item-wrap");
    card?.querySelectorAll("[data-home-satisfaction]").forEach(item => { item.disabled = true; });
    try {
      await database.runTransaction(async transaction => {
        const ticketRef = database.collection("tickets").doc(ticketId);
        const snapshot = await transaction.get(ticketRef);
        if (!snapshot.exists) throw new Error("Không tìm thấy ticket.");
        const latestTicket = snapshot.data();
        if (latestTicket.studentId !== user.uid || normalizeStatus(latestTicket.status) !== "closed") {
          throw new Error("Ticket đã thay đổi trạng thái. Vui lòng tải lại.");
        }
        if (latestTicket.satisfactionStatus !== "awaiting" || (Number(latestTicket.satisfactionRound) || 1) !== satisfactionRound) {
          throw new Error("Yêu cầu đánh giá không còn hiệu lực. Vui lòng tải lại.");
        }
        const update = {
          satisfactionStatus: choice,
          satisfactionRespondedAt: firebase.firestore.FieldValue.serverTimestamp(),
          satisfactionRespondedRound: satisfactionRound,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
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
      console.error("Không thể lưu đánh giá trang chủ:", error);
      card?.querySelectorAll("[data-home-satisfaction]").forEach(item => { item.disabled = false; });
      window.alert(error?.message || "Không thể lưu đánh giá. Vui lòng thử lại.");
    }
  }
  function renderRecentTickets(tickets) {
    if (!recentListEl) {
      return;
    }
    if (!tickets.length) {
      recentListEl.innerHTML = `
        <div class="empty-state">
          Bạn chưa có ticket nào.
          Hãy tạo yêu cầu đầu tiên.
        </div>
      `;
      return;
    }
    recentListEl.innerHTML =
      tickets
        .slice(0, 5)
        .map(ticket => {
          const status =
            normalizeStatus(ticket.status);
          const meta =
            STATUS_META[status];
          const number =
            firstValue(
              ticket,
              "ticketNum",
              "ticket_num",
              "id"
            );
          const title =
            firstValue(
              ticket,
              "title",
              "subject"
            ) ||
            "Không có tiêu đề";
          const category =
            firstValue(
              ticket,
              "ticketCategory",
              "ticketCategoryId",
              "category"
            );
          const issue =
            firstValue(
              ticket,
              "ticketIssue",
              "ticketIssueId",
              "ticketType",
              "ticket_type"
            );
          const type =
            category &&
            issue &&
            category !== issue
              ? `${category} · ${issue}`
              : issue ||
                category ||
                "Khác";
          const query =
            encodeURIComponent(number);
          return `
            <div class="recent-item-wrap">
              <a
                class="recent-item"
                href="/HV/chat-hv/trao-doi-ticket.html?ticket=${query}"
              >
              <span class="recent-code">
                ${escapeHTML(number)}
              </span>
              <span class="recent-title-wrap">
                <span
                  class="recent-title"
                  title="${escapeHTML(title)}"
                >
                  ${escapeHTML(title)}
                </span>
                <span class="recent-type">
                  ${escapeHTML(type)}
                </span>
              </span>
              <span
                class="status-badge ${meta.className}"
              >
                ${meta.label}
              </span>
                <span class="recent-date">
                  ${escapeHTML(
                    firstValue(ticket, "date") ||
                    formatDate(ticket.createdAt)
                  )}
                </span>
              </a>
              ${renderHomepageSatisfaction(ticket, status)}
            </div>
          `;
        })
        .join("");
  }
    recentListEl?.addEventListener("click", event => {
    const button = event.target.closest("[data-home-satisfaction]");
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    submitHomepageSatisfaction(button);
  });
  // ======================================================
  // FIREBASE
  // ======================================================
  const database =
    getDatabase();
  const authInstance =
    getAuth();
  if (!database) {
    setText(
      connectionLabelEl,
      "Chưa kết nối"
    );
    if (recentListEl) {
      recentListEl.innerHTML = `
        <div class="empty-state">
          Chưa cấu hình kết nối dữ liệu.
        </div>
      `;
    }
    return;
  }
  if (!authInstance) {
    setText(
      connectionLabelEl,
      "Chưa đăng nhập"
    );
    if (recentListEl) {
      recentListEl.innerHTML = `
        <div class="empty-state">
          Vui lòng đăng nhập để xem ticket.
        </div>
      `;
    }
    return;
  }
  // ======================================================
  // ĐỢI FIREBASE AUTH
  // ======================================================
  authInstance.onAuthStateChanged(async user => {
    // ----------------------------------------------------
    // CHƯA ĐĂNG NHẬP
    // ----------------------------------------------------
    if (!user) {
      currentStudentUid = "";
      notificationRecords = [];
      renderNotifications();
      updateWelcomeName("Học viên");
      setText(
        connectionLabelEl,
        "Chưa đăng nhập"
      );
      connectionDotEl?.classList.remove("live");
      setText(openTicketsEl, "0");
      setText(progressTicketsEl, "0");
      setText(resolvedTicketsEl, "0");
      setText(totalTicketsEl, "0");
      if (recentListEl) {
        recentListEl.innerHTML = `
          <div class="empty-state">
            Vui lòng đăng nhập để xem ticket của bạn.
          </div>
        `;
      }
      return;
    }
    // ----------------------------------------------------
    // ĐÃ ĐĂNG NHẬP
    // ----------------------------------------------------
    const currentUid =
      user.uid;
    currentStudentUid = currentUid;
    console.log(
      "Học viên hiện tại:",
      currentUid
    );
    // ====================================================
    // LẤY PROFILE
    // ====================================================
    try {
      const userDoc =
        await database
          .collection("users")
          .doc(currentUid)
          .get();
      const userData =
        userDoc.exists
          ? userDoc.data()
          : {};
      const displayName =
        userData.name ||
        user.displayName ||
        "Học viên";
      updateWelcomeName(displayName);
    } catch (error) {
      console.error(
        "Không thể lấy thông tin học viên:",
        error
      );
      updateWelcomeName(
        user.displayName ||
        "Học viên"
      );
    }
    // ====================================================
    // CHỈ LẤY TICKET CỦA USER ĐANG ĐĂNG NHẬP
    // ====================================================
    let ticketQuery;
    try {
      ticketQuery =
        database
          .collection("tickets")
          .where(
            "studentId",
            "==",
            currentUid
          );
    } catch (error) {
      console.error(
        "Không thể tạo truy vấn ticket:",
        error
      );
      return;
    }
    // ====================================================
    // REALTIME TICKET
    // ====================================================
    ticketQuery.onSnapshot(
      snapshot => {
        connectionDotEl?.classList.add("live");
        setText(
          connectionLabelEl,
          "Realtime"
        );
        // ----------------------------------------------
        // CHỈ CÁC TICKET CỦA USER HIỆN TẠI
        // ----------------------------------------------
        const tickets =
          snapshot.docs
            .map(doc => ({
              id: doc.id,
              ...doc.data()
            }))
            .sort(
              (a, b) =>
                getMillis(b.createdAt) -
                getMillis(a.createdAt)
            );
        // ----------------------------------------------
        // ĐẾM STATUS
        // ----------------------------------------------
        const counts = {
          open: 0,
          pending: 0,
          in_progress: 0,
          resolved: 0,
          closed: 0
        };
        tickets.forEach(ticket => {
          const status =
            normalizeStatus(
              ticket.status
            );
          counts[status]++;
        });
        // ----------------------------------------------
        // HIỂN THỊ THỐNG KÊ
        // ----------------------------------------------
        setText(
          openTicketsEl,
          counts.open +
          counts.pending +
          counts.in_progress +
          counts.resolved
        );
        setText(
          progressTicketsEl,
          counts.in_progress
        );
        setText(
          resolvedTicketsEl,
          counts.resolved
        );
        setText(
          totalTicketsEl,
          tickets.length
        );
        // Tương thích giao diện cũ
        setText(
          document.getElementById(
            "completedTicketsCount"
          ),
          counts.closed +
          counts.resolved
        );
        // ----------------------------------------------
        // RENDER
        // ----------------------------------------------
        renderRecentTickets(
          tickets
        );
        if (notificationPanel) {
          readTicketNotificationHistory(tickets);
        }
        console.log(
          `Đã tải ${tickets.length} ticket của user ${currentUid}`
        );
      },
      error => {
        console.error(
          "Không thể tải ticket của học viên:",
          error
        );
        connectionDotEl?.classList.remove(
          "live"
        );
        setText(
          connectionLabelEl,
          "Mất kết nối"
        );
        if (recentListEl) {
          recentListEl.innerHTML = `
            <div class="empty-state">
              Không thể tải ticket.
              Vui lòng kiểm tra kết nối và thử lại.
            </div>
          `;
        }
      }
    );
  });
});
