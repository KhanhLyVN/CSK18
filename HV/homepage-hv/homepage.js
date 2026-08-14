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

  const STATUS_META = {
    open: { label: "Đang mở", className: "status-open" },
    in_progress: { label: "Đang xử lý", className: "status-in_progress" },
    resolved: { label: "Đã giải quyết", className: "status-resolved" },
    closed: { label: "Đã đóng", className: "status-closed" }
  };

  function getDatabase() { return typeof db !== "undefined" ? db : (window.db || null); }
  function firstValue(ticket, ...keys) {
    for (const key of keys) {
      if (ticket[key] !== undefined && ticket[key] !== null && String(ticket[key]).trim()) return ticket[key];
    }
    return "";
  }
  function normalizeStatus(status) { return status === "pending" || !STATUS_META[status] ? "open" : status; }
  function getMillis(value) {
    if (!value) return 0;
    if (typeof value.toMillis === "function") return value.toMillis();
    if (typeof value.toDate === "function") return value.toDate().getTime();
    if (typeof value.seconds === "number") return value.seconds * 1000;
    const valueMillis = new Date(value).getTime();
    return Number.isNaN(valueMillis) ? 0 : valueMillis;
  }
  function formatDate(value) {
    const millis = getMillis(value);
    return millis ? new Date(millis).toLocaleDateString("vi-VN") : (value || "—");
  }
  function escapeHTML(value) {
    const element = document.createElement("div");
    element.textContent = value == null ? "" : String(value);
    return element.innerHTML;
  }
  function setText(element, value) { if (element) element.textContent = value; }

  setText(todayLabelEl, new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" }));

  function updateWelcomeName(name) {
    if (!welcomeNameEl) return;
    const displayName = (name || "Học viên").trim();
    welcomeNameEl.textContent = displayName || "Học viên";
  }

  const authInstance = typeof auth !== "undefined" ? auth : null;
  if (authInstance && typeof authInstance.onAuthStateChanged === "function") {
    authInstance.onAuthStateChanged(async user => {
      if (!user) {
        updateWelcomeName("Học viên");
        return;
      }

      try {
        const doc = await db.collection("users").doc(user.uid).get();
        const data = doc.exists ? doc.data() : {};
        const name = data.name || user.displayName || "Học viên";
        updateWelcomeName(name);
      } catch (error) {
        console.error("Không thể lấy tên người dùng:", error);
        updateWelcomeName("Học viên");
      }
    });
  } else {
    updateWelcomeName("Học viên");
  }

  function renderRecentTickets(tickets) {
    if (!recentListEl) return;
    if (!tickets.length) {
      recentListEl.innerHTML = `<div class="empty-state">Bạn chưa có ticket nào. Hãy tạo yêu cầu đầu tiên.</div>`;
      return;
    }
    recentListEl.innerHTML = tickets.slice(0, 5).map(ticket => {
      const status = normalizeStatus(ticket.status);
      const meta = STATUS_META[status];
      const number = firstValue(ticket, "ticketNum", "ticket_num", "id");
      const title = firstValue(ticket, "title", "subject") || "Không có tiêu đề";
      const category = firstValue(ticket, "ticketCategory", "ticketCategoryId", "category");
      const issue = firstValue(ticket, "ticketIssue", "ticketIssueId", "ticketType", "ticket_type");
      const type = category && issue && category !== issue ? `${category} · ${issue}` : issue || category || "Khác";
      const query = encodeURIComponent(number);
      return `<a class="recent-item" href="/HV/chat-hv/trao-doi-ticket.html?ticket=${query}"><span class="recent-code">${escapeHTML(number)}</span><span class="recent-title-wrap"><span class="recent-title" title="${escapeHTML(title)}">${escapeHTML(title)}</span><span class="recent-type">${escapeHTML(type)}</span></span><span class="status-badge ${meta.className}">${meta.label}</span><span class="recent-date">${escapeHTML(firstValue(ticket, "date") || formatDate(ticket.createdAt))}</span></a>`;
    }).join("");
  }

  const database = getDatabase();
  if (!database) {
    setText(connectionLabelEl, "Chưa kết nối");
    if (recentListEl) recentListEl.innerHTML = `<div class="empty-state">Chưa cấu hình kết nối dữ liệu.</div>`;
    return;
  }

  database.collection("tickets").onSnapshot(snapshot => {
    connectionDotEl?.classList.add("live");
    setText(connectionLabelEl, "Realtime");
    const tickets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a, b) => getMillis(b.createdAt) - getMillis(a.createdAt));
    const counts = { open: 0, in_progress: 0, resolved: 0, closed: 0 };
    tickets.forEach(ticket => counts[normalizeStatus(ticket.status)]++);
    setText(openTicketsEl, counts.open + counts.in_progress + counts.resolved);
    setText(progressTicketsEl, counts.in_progress);
    setText(resolvedTicketsEl, counts.resolved);
    setText(totalTicketsEl, tickets.length);
    // Tương thích với giao diện cũ nếu còn phần tử này.
    setText(document.getElementById("completedTicketsCount"), counts.closed + counts.resolved);
    renderRecentTickets(tickets);
  }, error => {
    console.error("Không thể tải thống kê ticket:", error);
    connectionDotEl?.classList.remove("live");
    setText(connectionLabelEl, "Mất kết nối");
    if (recentListEl) recentListEl.innerHTML = `<div class="empty-state">Không thể tải ticket. Vui lòng thử tải lại trang.</div>`;
  });
});
