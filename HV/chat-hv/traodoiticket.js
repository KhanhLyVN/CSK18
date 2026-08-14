const ticketListEl = document.getElementById("ticketListEl");
const mainPaneEl = document.getElementById("mainPaneEl");
const bodyLayoutEl = document.getElementById("bodyLayoutEl");
const searchInputEl = document.getElementById("searchInputEl");
const filterRowEl = document.getElementById("filterRowEl");
const backButtonEl = document.getElementById("backButtonEl");
const menuToggleEl = document.getElementById("menuToggle");
const navSidebarEl = document.getElementById("navSidebarEl");
const ticketTotalEl = document.getElementById("ticketTotalEl");

let ticketsDataList = [];
let activeTicketItem = null;
let currentStatusFilter = "all";
let activeChatSubscription = null;
let currentCSUser = null;
let firebaseCurrentUser = null;
const requestedTicketNumber = new URLSearchParams(window.location.search).get("ticket");
let requestedTicketOpened = false;

const STATUS_META = {
  open: { label: "Đang mở", className: "open" },
  in_progress: { label: "Đang xử lý", className: "in_progress" },
  resolved: { label: "Đã giải quyết", className: "resolved" },
  closed: { label: "Đã đóng", className: "closed" }
};

function getDatabase() {
  return typeof db !== "undefined" ? db : (window.db || null);
}

function escapeHTMLValue(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function firstValue(ticket, ...keys) {
  for (const key of keys) {
    const value = ticket && ticket[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") return value;
  }
  return "";
}

function normalizeStatus(status) {
  if (!status || status === "pending") return "open";
  return STATUS_META[status] ? status : "open";
}

function statusMeta(status) {
  return STATUS_META[normalizeStatus(status)] || STATUS_META.open;
}

function getTimestampMillis(value) {
  if (!value) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (typeof value.toDate === "function") return value.toDate().getTime();
  if (typeof value.seconds === "number") return value.seconds * 1000;
  const result = new Date(value).getTime();
  return Number.isNaN(result) ? 0 : result;
}

function formatTicketDateValue(value) {
  const millis = getTimestampMillis(value);
  if (!millis) return value ? String(value) : "—";
  return new Date(millis).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function ticketNumber(ticket) { return firstValue(ticket, "ticketNum", "ticket_num", "id") || "—"; }
function ticketType(ticket) {
  const category = firstValue(ticket, "ticketCategory");
  const issue = firstValue(ticket, "ticketIssue");
  if (category && issue && issue !== category) return `${category} · ${issue}`;
  return issue || category || firstValue(ticket, "ticketType", "ticket_type", "category") || "Khác";
}
function ticketTitle(ticket) { return firstValue(ticket, "title", "subject") || "Không có tiêu đề"; }
function ticketDescription(ticket) { return firstValue(ticket, "description", "message", "content") || "Không có mô tả chi tiết."; }

function renderTicketStatus(status) {
  const meta = statusMeta(status);
  return `<span class="ticket-status ${meta.className}"><span class="dot"></span>${meta.label}</span>`;
}

async function loadTicketsData() {
  const database = getDatabase();

  if (!database) {
    ticketListEl.innerHTML =
      `<div class="ticket-error">Chưa kết nối được với Firebase.</div>`;
    return;
  }

  if (typeof auth === "undefined" || !auth) {
    ticketListEl.innerHTML =
      `<div class="ticket-error">Không tìm thấy Firebase Authentication.</div>`;
    return;
  }

  // Lấy user Firebase hiện tại
  const user = firebaseCurrentUser || auth.currentUser;

  if (!user) {
    console.error("Không có Firebase user hiện tại.");
    return;
  }

  try {
    const userDoc = await database
      .collection("users")
      .doc(user.uid)
      .get();

    if (!userDoc.exists) {
      ticketListEl.innerHTML =
        `<div class="ticket-error">Không tìm thấy thông tin tài khoản.</div>`;
      return;
    }

    const userData = userDoc.data();

    const role = String(userData.role || "")
      .trim()
      .toLowerCase();

    const campus = String(userData.campus || "")
      .trim();

    currentCSUser = {
      uid: user.uid,
      name: userData.name || user.displayName || "Customer Success",
      email: userData.email || user.email || "",
      campus: campus
    };

    console.log("CS đăng nhập:", currentCSUser);

    database
      .collection("tickets")
      .onSnapshot(snapshotQuery => {

        ticketsDataList = snapshotQuery.docs
          .map(docSnap => ({
            id: docSnap.id,
            ...docSnap.data()
          }))
          .filter(ticket => {
            const ticketCampus =
              String(ticket.campus || "").trim();

            return ticketCampus === campus;
          });

        ticketsDataList.sort(
          (a, b) =>
            getTimestampMillis(b.createdAt) -
            getTimestampMillis(a.createdAt)
        );

        renderTicketsList();

        if (activeTicketItem) {
          const freshTicket = ticketsDataList.find(
            ticket => ticket.id === activeTicketItem.id
          );

          if (freshTicket) {
            openSelectedTicket(freshTicket);
          } else {
            activeTicketItem = null;
            bodyLayoutEl.classList.remove("show-chat");
          }

        } else if (
          requestedTicketNumber &&
          !requestedTicketOpened
        ) {
          const requestedTicket =
            ticketsDataList.find(
              ticket =>
                ticketNumber(ticket) === requestedTicketNumber ||
                ticket.id === requestedTicketNumber
            );

          if (requestedTicket) {
            requestedTicketOpened = true;
            openSelectedTicket(requestedTicket);
          }
        }

      }, error => {
        console.error(
          "Firebase load tickets error:",
          error
        );

        ticketListEl.innerHTML =
          `<div class="ticket-error">
            Không thể tải danh sách ticket.
          </div>`;
      });

  } catch (error) {
    console.error(
      "Không thể xác định tài khoản CS:",
      error
    );

    ticketListEl.innerHTML =
      `<div class="ticket-error">
        Không thể xác định thông tin tài khoản CS.
      </div>`;
  }
}

function matchesStatusFilter(ticket) {
  const status = normalizeStatus(ticket.status);
  if (currentStatusFilter === "all") return true;
  if (currentStatusFilter === "open") return status !== "closed";
  return status === currentStatusFilter;
}

function renderTicketsList() {
  const searchKeyword = searchInputEl.value.trim().toLocaleLowerCase("vi");
  const filteredTickets = ticketsDataList.filter(ticket => {
    const searchable = [ticketNumber(ticket), firstValue(ticket, "name"), firstValue(ticket, "email"), ticketTitle(ticket), ticketType(ticket)].join(" ").toLocaleLowerCase("vi");
    return (!searchKeyword || searchable.includes(searchKeyword)) && matchesStatusFilter(ticket);
  });

  ticketTotalEl.textContent = filteredTickets.length;
  ticketListEl.innerHTML = "";
  if (!filteredTickets.length) {
    ticketListEl.innerHTML = `<div class="empty-ticket"><div class="empty-icon">🎫</div><div>Chưa có ticket nào phù hợp.</div></div>`;
    return;
  }

  filteredTickets.forEach(ticket => {
    const ticketNode = document.createElement("div");
    ticketNode.className = "ticket-item";
    if (activeTicketItem && activeTicketItem.id === ticket.id) ticketNode.classList.add("active");
    ticketNode.innerHTML = `
      <div class="ticket-item-top"><strong>${escapeHTMLValue(ticketNumber(ticket))}</strong>${renderTicketStatus(ticket.status)}</div>
      <div class="ticket-item-title">${escapeHTMLValue(ticketTitle(ticket))}</div>
      <div class="ticket-item-info"><span>${escapeHTMLValue(ticketType(ticket))}</span><span>${escapeHTMLValue(firstValue(ticket, "date") || formatTicketDateValue(ticket.createdAt))}</span></div>`;
    ticketNode.addEventListener("click", () => openSelectedTicket(ticket));
    ticketListEl.appendChild(ticketNode);
  });
}

function openSelectedTicket(ticketRecord) {
  activeTicketItem = ticketRecord;
  renderTicketsList();
  bodyLayoutEl.classList.add("show-chat");

  const status = normalizeStatus(ticketRecord.status);
  const meta = statusMeta(status);
  const createdDate = firstValue(ticketRecord, "date") || formatTicketDateValue(ticketRecord.createdAt);
  const studentName = firstValue(ticketRecord, "name") || "—";
  const email = firstValue(ticketRecord, "email") || "—";
  const phone = firstValue(ticketRecord, "phone") || "—";
  const course = firstValue(ticketRecord, "course") || "Không có";

  mainPaneEl.innerHTML = `
    <div class="conversation">
      <div class="conversation-header">
        <div><div class="conversation-code">${escapeHTMLValue(ticketNumber(ticketRecord))}</div><h2>${escapeHTMLValue(ticketTitle(ticketRecord))}</h2></div>
        ${renderTicketStatus(ticketRecord.status).replace("ticket-status", "conversation-status")}
      </div>

      <div class="stub-card">
        <div class="stub-top">
          <div class="stub-top-left">
            <div class="stub-top-group"><span class="k1">Mã yêu cầu:</span><span class="num">${escapeHTMLValue(ticketNumber(ticketRecord))}</span></div>
            <div class="cat"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>${escapeHTMLValue(ticketType(ticketRecord))}</div>
          </div>
          <div class="stub-status-badge ${meta.className}"><span class="dot"></span>${meta.label}</div>
        </div>
        <div class="stub-body"><div class="stub-grid">
          <div class="stub-field"><div class="k">Người gửi</div><div class="v">${escapeHTMLValue(studentName)}</div></div>
          <div class="stub-field"><div class="k">Email</div><div class="v" title="${escapeHTMLValue(email)}">${escapeHTMLValue(email)}</div></div>
          <div class="stub-field"><div class="k">Điện thoại</div><div class="v">${escapeHTMLValue(phone)}</div></div>
          <div class="stub-field"><div class="k">Khóa học</div><div class="v">${escapeHTMLValue(course)}</div></div>
          <div class="stub-field"><div class="k">Ngày gửi</div><div class="v">${escapeHTMLValue(createdDate)}</div></div>
          <div class="stub-field stub-field-wide"><div class="k">Loại yêu cầu học viên cần hỗ trợ</div><div class="v">${escapeHTMLValue(ticketType(ticketRecord))}</div></div>
          <div class="stub-field stub-field-wide"><div class="k">Mô tả yêu cầu</div><div class="v">${escapeHTMLValue(ticketDescription(ticketRecord))}</div></div>
        </div></div>
      </div>

      <div class="messages" id="messagesContainerEl"><div class="loading-message">Đang tải trao đổi...</div></div>
      ${status !== "closed" ? `<div class="message-input"><textarea id="messageInputArea" placeholder="Nhập nội dung trao đổi với Customer Success..."></textarea><button id="sendMessageButton" type="button">Gửi</button></div>` : `<div class="closed-message">Ticket này đã được đóng. Bạn vẫn có thể xem lại lịch sử trao đổi.</div>`}
    </div>`;

  loadTicketMessagesRealtime(ticketRecord.id);
  const sendButton = document.getElementById("sendMessageButton");
  if (sendButton) sendButton.addEventListener("click", () => sendNewMessage(ticketRecord));
  const input = document.getElementById("messageInputArea");
  if (input) {
    input.addEventListener("keydown", event => {
      if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) { event.preventDefault(); sendNewMessage(ticketRecord); }
    });
  }
}

function loadTicketMessagesRealtime(ticketRecordId) {
  const messagesContainerEl = document.getElementById("messagesContainerEl");
  const database = getDatabase();
  if (!messagesContainerEl || !database) return;
  if (activeChatSubscription) { activeChatSubscription(); activeChatSubscription = null; }

  activeChatSubscription = database.collection("tickets").doc(ticketRecordId).collection("messages").onSnapshot(messagesSnapshot => {
    const messages = messagesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a, b) => getTimestampMillis(a.createdAt) - getTimestampMillis(b.createdAt));
    if (!messages.length) {
      messagesContainerEl.innerHTML = `<div class="empty-message">Chưa có trao đổi nào. Bạn có thể gửi tin nhắn đầu tiên.</div>`;
      return;
    }
    messagesContainerEl.innerHTML = messages.map(messageData => {
      const isCS = messageData.senderType === "cs" || messageData.sender === "admin";
      const senderName = firstValue(messageData, "senderName") || (isCS ? "Customer Success" : "Học viên");
      const messageText = firstValue(messageData, "message", "text");
      return `<div class="message ${isCS ? "admin" : "student"}"><div class="message-name">${escapeHTMLValue(senderName)}</div><div class="message-content">${escapeHTMLValue(messageText)}</div><div class="message-time">${escapeHTMLValue(formatTicketDateValue(messageData.createdAt))}</div></div>`;
    }).join("");
    messagesContainerEl.scrollTop = messagesContainerEl.scrollHeight;
  }, error => {
    console.error("Load messages error:", error);
    messagesContainerEl.innerHTML = `<div class="empty-message">Không thể tải nội dung trao đổi.</div>`;
  });
}

async function sendNewMessage(ticketRecord) {
  const input = document.getElementById("messageInputArea");
  const button = document.getElementById("sendMessageButton");
  const database = getDatabase();
  if (!input || !database) return;
  const messageText = input.value.trim();
  if (!messageText) return;

  try {
    if (button) { button.disabled = true; button.textContent = "Đang gửi..."; }
    await database.collection("tickets").doc(ticketRecord.id).collection("messages").add({
      sender: "student",
      senderType: "student",
      senderName: firstValue(ticketRecord, "name") || "Học viên",
      message: messageText,
      text: messageText,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    await database.collection("tickets").doc(ticketRecord.id).update({ updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
    input.value = "";
  } catch (error) {
    console.error("Send message error:", error);
    alert("Không thể gửi tin nhắn. Vui lòng thử lại.");
  } finally {
    if (button) { button.disabled = false; button.textContent = "Gửi"; }
  }
}

function setupNavigation() {
  menuToggleEl.addEventListener("click", () => navSidebarEl.classList.toggle("mobile-open"));
  backButtonEl.addEventListener("click", () => {
    bodyLayoutEl.classList.remove("show-chat");
    activeTicketItem = null;
    if (activeChatSubscription) { activeChatSubscription(); activeChatSubscription = null; }
    mainPaneEl.innerHTML = `<div class="empty-conversation"><div class="empty-conversation-icon">⌁</div><h2>Chọn một ticket để trao đổi</h2><p>Danh sách các phiếu hỗ trợ của bạn nằm ở bên trái.</p></div>`;
    renderTicketsList();
  });
  window.addEventListener("resize", () => {
    if (window.innerWidth > 860) navSidebarEl.classList.remove("mobile-open");
  });
}

searchInputEl.addEventListener("input", renderTicketsList);
filterRowEl.querySelectorAll(".filter-chip").forEach(chip => chip.addEventListener("click", () => {
  filterRowEl.querySelectorAll(".filter-chip").forEach(item => item.classList.remove("active"));
  chip.classList.add("active");
  currentStatusFilter = chip.dataset.filter;
  renderTicketsList();
}));

setupNavigation();

if (typeof auth !== "undefined" && auth) {

  auth.onAuthStateChanged(user => {

    if (!user) {
      console.log("Chưa có phiên đăng nhập Firebase.");
      return;
    }

    firebaseCurrentUser = user;

    console.log(
      "Đã xác nhận đăng nhập:",
      user.uid,
      user.email
    );

    loadTicketsData();
  });

} else {
  console.error("Firebase Auth chưa được khởi tạo.");
}
