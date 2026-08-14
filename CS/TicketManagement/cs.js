const STAFF = ["CS Customer Success"];

const STATUS_META = {
  open: { label: "Đang mở", className: "badge-open" },
  in_progress: { label: "Đang xử lý", className: "badge-progress" },
  resolved: { label: "Đã giải quyết", className: "badge-resolved" },
  closed: { label: "Đã đóng", className: "badge-closed" }
};
const STATUS_FLOW = ["open", "in_progress", "resolved", "closed"];
const PAGE_SIZE = 10;

let allTickets = [];
let filteredTickets = [];
let currentPage = 1;
let selectedTicketId = null;
let currentChatTicketId = null;
let unsubChat = null;
let currentStaff = localStorage.getItem("cs_staff_name") || STAFF[0];

function getDatabase() {
  if (typeof db !== "undefined" && db) return db;
  if (window.db) return window.db;
  if (window.firebase && typeof window.firebase.firestore === "function") {
    try {
      return window.firebase.firestore();
    } catch (error) {
      console.warn("Firestore chưa được khởi tạo:", error);
    }
  }
  return null;
}

function getAuthClient() {
  if (typeof auth !== "undefined" && auth) return auth;
  if (window.auth) return window.auth;
  if (window.firebase && typeof window.firebase.auth === "function") {
    try {
      return window.firebase.auth();
    } catch (error) {
      console.warn("Firebase Auth chưa được khởi tạo:", error);
    }
  }
  return null;
}

function waitForFirebaseServices(timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now();
    const check = () => {
      const database = getDatabase();
      const authClient = getAuthClient();
      if (database && authClient) {
        resolve({ database, authClient });
        return;
      }
      if (Date.now() - startedAt >= timeoutMs) {
        reject(new Error("Firebase chưa sẵn sàng: kiểm tra firebase-config.js và thứ tự nạp SDK."));
        return;
      }
      window.setTimeout(check, 200);
    };
    check();
  });
}

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

function escapeHtml(value) {
  const element = document.createElement("div");
  element.textContent = value == null ? "" : String(value);
  return element.innerHTML;
}

function firstValue(ticket, ...keys) {
  for (const key of keys) {
    const value = ticket && ticket[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") return value;
  }
  return "";
}

function normalizeRole(role) {
  return String(role || "").trim().toLowerCase().replace(/[_\s-]+/g, " ").trim();
}

function isAuthorizedCsRole(role) {
  const normalized = normalizeRole(role);
  const allowed = new Set([
    "cs",
    "customer success",
    "customer_success",
    "staff",
    "support",
    "support staff",
    "admin",
    "cs_admin",
    "customer success admin"
  ]);
  return !normalized || allowed.has(normalized) || normalized.includes("customer success") || normalized.includes("support");
}

function normalizeStatus(status) {
  if (!status || status === "pending") return "open";
  return STATUS_META[status] ? status : "open";
}

function ticketNumber(ticket) {
  return firstValue(ticket, "ticketNum", "ticket_num", "id") || "—";
}

function ticketType(ticket) {
  // Prefer the human-readable `ticketCategory` and include `ticketIssue` when available
  const category = firstValue(ticket, "ticketCategory");
  const issue = firstValue(ticket, "ticketIssue");
  if (category && issue && issue !== category) return `${category} · ${issue}`;
  return issue || category || firstValue(ticket, "ticketType", "ticket_type", "category") || "Khác";
}

function ticketMainCategory(ticket) {
  // Return only the primary category label (used for filters)
  return firstValue(ticket, "ticketCategory", "ticketType", "ticket_type", "category") || "Khác";
}

function ticketDescription(ticket) {
  return firstValue(ticket, "description", "message", "content") || "Không có mô tả.";
}

function ticketTitle(ticket) {
  return firstValue(ticket, "title", "subject") || "Không có tiêu đề";
}

function ticketPriority(ticket) {
  const value = String(firstValue(ticket, "priority", "urgency") || "").toLowerCase();
  return ["high", "medium", "low"].includes(value) ? value : "na";
}

function timestampMillis(value) {
  if (!value) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (typeof value.toDate === "function") return value.toDate().getTime();
  if (typeof value.seconds === "number") return value.seconds * 1000;
  const millis = new Date(value).getTime();
  return Number.isNaN(millis) ? 0 : millis;
}

function formatDate(value) {
  const millis = timestampMillis(value);
  if (!millis) return value ? String(value) : "—";
  return new Date(millis).toLocaleDateString("vi-VN");
}

function formatDateTime(value) {
  const millis = timestampMillis(value);
  return millis ? new Date(millis).toLocaleString("vi-VN") : "Đang cập nhật";
}

function todayLabel() {
  return new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" });
}

function initials(name) {
  const parts = String(name || "?").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return parts.length === 1 ? parts[0][0].toUpperCase() : `${parts[0][0]}${parts.at(-1)[0]}`.toUpperCase();
}

function statusBadge(status) {
  const normalized = normalizeStatus(status);
  const meta = STATUS_META[normalized];
  return `<span class="badge ${meta.className}"><span class="dot"></span>${meta.label}</span>`;
}

function priorityBadge(priority) {
  const labels = { high: "Cao", medium: "Trung bình", low: "Thấp", na: "—" };
  return `<span class="priority priority-${priority}">${labels[priority] || "—"}</span>`;
}

function renderStats() {
  const counts = { open: 0, in_progress: 0, resolved: 0, closed: 0 };
  allTickets.forEach(ticket => counts[normalizeStatus(ticket.status)]++);
  $("#statTotal").textContent = allTickets.length;
  $("#statOpen").textContent = counts.open;
  $("#statProgress").textContent = counts.in_progress;
  $("#statResolved").textContent = counts.resolved;
  $("#statClosed").textContent = counts.closed;
}

function renderCategoryFilter() {
  const select = $("#filterCategory");
  const currentValue = select.value;
  // Build filter options from the main category label only (no sub-issues)
  const categories = [...new Set(allTickets.map(ticketMainCategory).filter(Boolean))].sort((a, b) => a.localeCompare(b, "vi"));
  select.innerHTML = `<option value="all">Tất cả</option>${categories.map(category => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join("")}`;
  select.value = categories.includes(currentValue) ? currentValue : "all";
}

function getFilteredTickets() {
  const status = $("#filterStatus").value;
  const priority = $("#filterPriority").value;
  const category = $("#filterCategory").value;
  const search = $("#searchInput").value.trim().toLocaleLowerCase("vi");

  return allTickets.filter(ticket => {
    const statusMatch = status === "all" || normalizeStatus(ticket.status) === status;
    const priorityMatch = priority === "all" || ticketPriority(ticket) === priority;
    // Compare against the main category label (not the combined "category · issue")
    const categoryMatch = category === "all" || ticketMainCategory(ticket) === category;
    const searchable = [ticketNumber(ticket), firstValue(ticket, "name"), firstValue(ticket, "email"), ticketTitle(ticket), ticketType(ticket)].join(" ").toLocaleLowerCase("vi");
    return statusMatch && priorityMatch && categoryMatch && (!search || searchable.includes(search));
  });
}

function renderTable() {
  filteredTickets = getFilteredTickets();
  const totalPages = Math.max(1, Math.ceil(filteredTickets.length / PAGE_SIZE));
  currentPage = Math.min(currentPage, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filteredTickets.slice(start, start + PAGE_SIZE);
  const body = $("#ticketBody");
  const emptyState = $("#emptyState");

  body.innerHTML = pageItems.map(ticket => {
    const id = escapeHtml(ticket.id);
    const name = firstValue(ticket, "name") || "Chưa cập nhật";
    const email = firstValue(ticket, "email");
    const selected = ticket.id === selectedTicketId ? "selected-row" : "";
    return `
      <tr class="${selected}" data-ticket-id="${id}">
        <td><span class="cell-id">${escapeHtml(ticketNumber(ticket))}</span></td>
        <td><div class="cell-name">${escapeHtml(name)}</div><div class="cell-email">${escapeHtml(email)}</div></td>
        <td><div class="cell-subject" title="${escapeHtml(ticketTitle(ticket))}">${escapeHtml(ticketTitle(ticket))}</div></td>
        <td><div class="cell-type" title="${escapeHtml(ticketType(ticket))}">${escapeHtml(ticketType(ticket))}</div></td>
        <td>${statusBadge(ticket.status)}</td>
        <td>${priorityBadge(ticketPriority(ticket))}</td>
        <td><span class="cell-date">${escapeHtml(firstValue(ticket, "date") || formatDate(ticket.createdAt))}</span></td>
        <td><button class="action-menu" type="button" data-action="details" data-ticket-id="${id}" aria-label="Xem thông tin ticket" title="Xem thông tin"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1.5"></circle><circle cx="12" cy="12" r="1.5"></circle><circle cx="19" cy="12" r="1.5"></circle></svg></button></td>
      </tr>`;
  }).join("");

  emptyState.hidden = pageItems.length !== 0;
  $("#entriesNote").textContent = `Hiển thị ${pageItems.length} / ${filteredTickets.length} ticket`;
  renderPagination(totalPages);

  $$("[data-action='details']").forEach(button => {
    button.addEventListener("click", event => {
      event.stopPropagation();
      openTicketDrawer(button.dataset.ticketId);
    });
  });
  $$("#ticketBody tr[data-ticket-id]").forEach(row => {
    row.addEventListener("click", () => openTicketDrawer(row.dataset.ticketId));
  });
}

function renderPagination(totalPages) {
  const pagination = $("#paginationEl");
  pagination.innerHTML = "";
  const previous = document.createElement("button");
  previous.className = "page-btn";
  previous.textContent = "‹";
  previous.disabled = currentPage === 1;
  previous.addEventListener("click", () => { currentPage--; renderTable(); });
  pagination.appendChild(previous);

  for (let page = 1; page <= totalPages; page++) {
    const button = document.createElement("button");
    button.className = `page-btn ${page === currentPage ? "active" : ""}`;
    button.textContent = page;
    button.addEventListener("click", () => { currentPage = page; renderTable(); });
    pagination.appendChild(button);
  }

  const next = document.createElement("button");
  next.className = "page-btn";
  next.textContent = "›";
  next.disabled = currentPage === totalPages;
  next.addEventListener("click", () => { currentPage++; renderTable(); });
  pagination.appendChild(next);
}

function openTicketDrawer(ticketId) {
  const ticket = allTickets.find(item => item.id === ticketId);
  if (!ticket) return;
  selectedTicketId = ticketId;
  renderTable();

  const status = normalizeStatus(ticket.status);
  const name = firstValue(ticket, "name") || "Chưa cập nhật";
  const email = firstValue(ticket, "email") || "—";
  const phone = firstValue(ticket, "phone") || "—";
  const course = firstValue(ticket, "course") || "Không có";

  $("#drawerBody").innerHTML = `
    <div class="drawer-ticket-head">
      <div class="drawer-ticket-number">${escapeHtml(ticketNumber(ticket))}</div>
      <div class="drawer-ticket-meta"><span>${escapeHtml(ticketType(ticket))}</span><span>${escapeHtml(firstValue(ticket, "date") || formatDate(ticket.createdAt))}</span></div>
    </div>
    <section class="drawer-section"><h3>${escapeHtml(ticketTitle(ticket))}</h3><p>${escapeHtml(ticketDescription(ticket))}</p></section>
    <section class="drawer-section"><h3>Thông tin học viên</h3><div class="info-grid">
      <div class="info-item"><div class="info-label">Họ tên</div><div class="info-value">${escapeHtml(name)}</div></div>
      <div class="info-item"><div class="info-label">Email</div><div class="info-value">${escapeHtml(email)}</div></div>
      <div class="info-item"><div class="info-label">Điện thoại</div><div class="info-value">${escapeHtml(phone)}</div></div>
      <div class="info-item"><div class="info-label">Khóa học</div><div class="info-value">${escapeHtml(course)}</div></div>
    </div></section>
    <section class="drawer-section"><h3>Xử lý ticket</h3>
      <div class="status-stepper" id="drawerStatusStepper" aria-label="Cập nhật trạng thái">
        ${STATUS_FLOW.map(key => `<button type="button" class="status-step ${key === status ? "current" : ""} status-${key}" data-status="${key}"><span class="status-step-dot"></span>${STATUS_META[key].label}</button>`).join("")}
      </div>
      <div class="drawer-actions"><button class="chat-trigger" id="openChatBtn" type="button">💬 Mở chat</button></div>
    </section>
    <section class="drawer-section"><h3>Thời gian</h3><div class="info-grid">
      <div class="info-item"><div class="info-label">Tạo lúc</div><div class="info-value">${escapeHtml(formatDateTime(ticket.createdAt))}</div></div>
      <div class="info-item"><div class="info-label">Cập nhật</div><div class="info-value">${escapeHtml(formatDateTime(ticket.updatedAt))}</div></div>
    </div></section>`;

  $$("#drawerStatusStepper .status-step").forEach(button => {
    button.addEventListener("click", () => updateTicketStatus(ticket.id, button.dataset.status));
  });
  $("#openChatBtn").addEventListener("click", () => openChatPanel(ticket));
  $("#ticketDrawer").classList.add("open");
  $("#ticketDrawer").setAttribute("aria-hidden", "false");
  updateBackdrop();
}

function closeTicketDrawer() {
  closeChatPanel();
  $("#ticketDrawer").classList.remove("open");
  $("#ticketDrawer").setAttribute("aria-hidden", "true");
  selectedTicketId = null;
  renderTable();
  updateBackdrop();
}

function openChatPanel(ticket) {
  currentChatTicketId = ticket.id;
  $("#chatTitle").textContent = `Chat với ${firstValue(ticket, "name") || "học viên"}`;
  $("#chatTicketContext").textContent = `${ticketNumber(ticket)} · ${ticketTitle(ticket)}`;
  $("#chatPanel").classList.add("open");
  $("#chatPanel").setAttribute("aria-hidden", "false");
  loadChatMessages(ticket.id);
  updateBackdrop();
  setTimeout(() => $("#chatInput").focus(), 180);
}

function closeChatPanel() {
  $("#chatPanel").classList.remove("open");
  $("#chatPanel").setAttribute("aria-hidden", "true");
  currentChatTicketId = null;
  if (unsubChat) { unsubChat(); unsubChat = null; }
  updateBackdrop();
}

function updateBackdrop() {
  const isOpen = $("#ticketDrawer").classList.contains("open");
  $("#drawerBackdrop").hidden = !isOpen;
}

function updateTicketStatus(ticketId, status) {
  const database = getDatabase();
  if (!database || !window.firebase?.firestore) return;
  database.collection("tickets").doc(ticketId).update({ status, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }).catch(error => console.error("Không thể cập nhật trạng thái:", error));
}

function loadChatMessages(ticketId) {
  const messageBox = $("#chatMessages");
  if (unsubChat) { unsubChat(); unsubChat = null; }
  const database = getDatabase();
  if (!database) { messageBox.innerHTML = `<div class="thread-empty">Chưa kết nối Firestore.</div>`; return; }

  unsubChat = database.collection("tickets").doc(ticketId).collection("messages").onSnapshot(snapshot => {
    const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a, b) => timestampMillis(a.createdAt) - timestampMillis(b.createdAt));
    if (!messages.length) {
      messageBox.innerHTML = `<div class="thread-empty">Chưa có tin nhắn. Hãy bắt đầu cuộc trao đổi với học viên.</div>`;
      return;
    }
    messageBox.innerHTML = messages.map(message => {
      const isCS = message.senderType === "cs" || message.sender === "admin";
      const content = firstValue(message, "message", "text") || "";
      return `<div class="chat-bubble ${isCS ? "cs" : "student"}"><div class="chat-sender">${escapeHtml(firstValue(message, "senderName") || (isCS ? "CS" : "Học viên"))}</div><div>${escapeHtml(content)}</div><div class="chat-meta">${escapeHtml(formatDateTime(message.createdAt))}</div></div>`;
    }).join("");
    messageBox.scrollTop = messageBox.scrollHeight;
  }, error => {
    console.error("Không thể tải tin nhắn:", error);
    messageBox.innerHTML = `<div class="thread-empty">Không thể tải khung chat.</div>`;
  });
}

function sendChatMessage() {
  const input = $("#chatInput");
  const text = input.value.trim();
  const database = getDatabase();
  if (!currentChatTicketId || !text || !database) return;
  const button = $("#sendChatBtn");
  button.disabled = true;
  database.collection("tickets").doc(currentChatTicketId).collection("messages").add({
    sender: "admin",
    senderType: "cs",
    senderName: currentStaff,
    message: text,
    text,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  }).then(() => {
    input.value = "";
  }).catch(error => console.error("Không thể gửi tin nhắn:", error)).finally(() => {
    button.disabled = false;
  });
}

function setupSidebar() {
  const toggle = $("#menuToggle");
  const sidebar = $("#sidebarEl");
  if (!toggle || !sidebar) return;
  toggle.addEventListener("click", () => {
    if (window.innerWidth <= 900) sidebar.classList.toggle("mobile-open");
    else sidebar.classList.toggle("collapsed");
  });
  window.addEventListener("resize", () => {
    if (window.innerWidth > 900) sidebar.classList.remove("mobile-open");
  });
}

function setupControls() {
  ["#filterStatus", "#filterPriority", "#filterCategory", "#searchInput"].forEach(selector => {
    $(selector).addEventListener("input", () => { currentPage = 1; renderTable(); });
    $(selector).addEventListener("change", () => { currentPage = 1; renderTable(); });
  });
  $("#closeDrawerBtn").addEventListener("click", closeTicketDrawer);
  $("#closeChatBtn").addEventListener("click", closeChatPanel);
  $("#drawerBackdrop").addEventListener("click", () => { closeChatPanel(); closeTicketDrawer(); });
  $("#sendChatBtn").addEventListener("click", sendChatMessage);
  $("#chatInput").addEventListener("keydown", event => {
    if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendChatMessage(); }
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") { closeChatPanel(); closeTicketDrawer(); }
  });
}

async function startRealtimeTickets(user) {
  $("#todayStr").textContent = todayLabel();

  const database = getDatabase();

  if (!database) {
    $("#connLabel").textContent = "Chưa kết nối Firebase";
    return;
  }

  try {
    // Tài khoản CS của hệ thống nằm trong users; accounts chỉ được dùng để tương thích dữ liệu cũ.
    let staffSnapshot = await database.collection("users").doc(user.uid).get();
    if (!staffSnapshot.exists) {
      staffSnapshot = await database.collection("accounts").doc(user.uid).get();
    }

    const staff = staffSnapshot.exists ? staffSnapshot.data() : {};
    const role = normalizeRole(staff.role);
    const campus = String(staff.campus || "").trim();
    const isAdmin = ["admin", "cs_admin", "customer success admin"].includes(role);

    if (!staffSnapshot.exists) {
      $("#connLabel").textContent = "Không tìm thấy hồ sơ CS";
      console.error("Không tìm thấy hồ sơ CS trong users hoặc accounts", user.uid);
      return;
    }

    if (!isAdmin && role && !isAuthorizedCsRole(role)) {
      $("#connLabel").textContent = "Không có quyền CS";
      console.error("Tài khoản không có quyền truy cập CS", role);
      return;
    }

    console.log("Nhân viên CS:", staff.name || user.displayName || user.email);
    console.log("Cơ sở:", campus || "Chưa thiết lập");

    // Không lọc bằng department/assignedTo vì ticket do học viên tạo chưa có hai trường này.
    // Lọc campus ở client để tránh yêu cầu composite index và vẫn nhận ticket chưa phân công.
    database.collection("tickets").onSnapshot(snapshot => {
      $("#connDot").classList.add("live");
      $("#connLabel").textContent = campus ? "Realtime · " + campus : "Realtime";

      allTickets = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(ticket => {
          const ticketCampus = String(ticket.campus || "").trim();
          const assignedTo = String(ticket.assignedTo || "").trim();
          const sameCampus = isAdmin || !campus || !ticketCampus || ticketCampus === campus;
          const assignedToThisStaff = isAdmin || !assignedTo || assignedTo === user.uid || assignedTo === user.email;
          return sameCampus && assignedToThisStaff;
        })
        .sort((a, b) => timestampMillis(b.createdAt) - timestampMillis(a.createdAt));

      renderStats();
      renderCategoryFilter();
      renderTable();
    }, error => {
      console.error("Firestore error khi đọc tickets:", error);
      $("#connDot").classList.remove("live");
      $("#connLabel").textContent = "Lỗi đọc dữ liệu";
    });
  } catch (error) {
    console.error("Không lấy được hồ sơ CS hoặc tickets:", error);
    $("#connDot").classList.remove("live");
    $("#connLabel").textContent = "Không kết nối được";
  }
}

setupSidebar();
setupControls();
renderStats();
renderCategoryFilter();
renderTable();

waitForFirebaseServices()
  .then(({ authClient }) => {
    authClient.onAuthStateChanged(user => {
      if (!user) {
        $("#connLabel").textContent = "Chưa đăng nhập";
        console.log("Chưa đăng nhập");
        return;
      }
      startRealtimeTickets(user);
    });
  })
  .catch(error => {
    console.error(error);
    $("#connDot").classList.remove("live");
    $("#connLabel").textContent = "Không thể kết nối Firebase";
  });

