// ======================================================
// ELEMENT
// ======================================================
const ticketList = document.getElementById("ticketList");
const mainEl = document.getElementById("mainEl");
const searchInput = document.getElementById("searchInput");
const filterRow = document.getElementById("filterRow");
const backBtn = document.getElementById("backBtn");
// ======================================================
// VARIABLES
// ======================================================
let tickets = [];
let currentTicket = null;
let currentFilter = "all";
// ======================================================
// LOAD TICKETS REALTIME
// ======================================================
function loadTickets() {
  db.collection("tickets")
    .onSnapshot(
      (snapshot) => {
        tickets = [];
        snapshot.forEach((doc) => {
          tickets.push({
            id: doc.id,
            ...doc.data()
          });
        });
        // Sắp xếp ticket mới nhất lên đầu
        tickets.sort((a, b) => {
          const timeA =
            a.createdAt?.toMillis?.() || 0;
          const timeB =
            b.createdAt?.toMillis?.() || 0;
          return timeB - timeA;
        });
        renderTickets();
      },
      (error) => {
        console.error(
          "Firebase load tickets error:",
          error
        );
        ticketList.innerHTML = `
          <div class="ticket-error">
            Không thể tải danh sách ticket.
          </div>
        `;
      }
    );
}
// ======================================================
// RENDER SIDEBAR
// ======================================================
function renderTickets() {
  const keyword =
    searchInput.value
      .trim()
      .toLowerCase();
  const filteredTickets =
    tickets.filter((ticket) => {
      // -------------------------
      // SEARCH
      // -------------------------
      const ticketNum =
        (ticket.ticketNum || "")
          .toLowerCase();
      const title =
        (ticket.title || "")
          .toLowerCase();
      const matchesSearch =
        !keyword ||
        ticketNum.includes(keyword) ||
        title.includes(keyword);
      // -------------------------
      // FILTER STATUS
      // -------------------------
      const matchesFilter =
        currentFilter === "all" ||
        ticket.status === currentFilter;
      return (
        matchesSearch &&
        matchesFilter
      );
    });
  ticketList.innerHTML = "";
  // Không có ticket
  if (!filteredTickets.length) {
    ticketList.innerHTML = `
      <div class="empty-ticket">
        <div class="empty-icon">🎫</div>
        <div>Chưa có ticket nào</div>
      </div>
    `;
    return;
  }
  // Render từng ticket
  filteredTickets.forEach((ticket) => {
    const item =
      document.createElement("div");
    item.className = "ticket-item";
    if (
      currentTicket &&
      currentTicket.id === ticket.id
    ) {
      item.classList.add("active");
    }
    const statusText =
      ticket.status === "closed"
        ? "Đã đóng"
        : "Đang mở";
    const date =
      formatTicketDate(ticket.createdAt);
    item.innerHTML = `
      <div class="ticket-item-top">
        <strong>
          ${escapeHTML(
            ticket.ticketNum || ticket.id
          )}
        </strong>
        <span class="ticket-status ${ticket.status}">
          ${statusText}
        </span>
      </div>
      <div class="ticket-item-title">
        ${escapeHTML(
          ticket.title || "Không có tiêu đề"
        )}
      </div>
      <div class="ticket-item-info">
        <span>
          ${escapeHTML(
            ticket.ticketType || "Khác"
          )}
        </span>
        <span>
          ${date}
        </span>
      </div>
    `;
    item.addEventListener(
      "click",
      () => {
        openTicket(ticket);
      }
    );
    ticketList.appendChild(item);
  });
}
// ======================================================
// OPEN TICKET
// ======================================================
function openTicket(ticket) {
  currentTicket = ticket;
  renderTickets();
  mainEl.innerHTML = `
    <div class="conversation">
      <!-- HEADER -->
      <div class="conversation-header">
        <div>
          <div class="conversation-code">
            ${escapeHTML(
              ticket.ticketNum || ticket.id
            )}
          </div>
          <h2>
            ${escapeHTML(
              ticket.title || "Không có tiêu đề"
            )}
          </h2>
        </div>
        <div class="conversation-status
          ${ticket.status}">
          ${
            ticket.status === "closed"
              ? "Đã đóng"
              : "Đang mở"
          }
        </div>
      </div>
      <!-- THÔNG TIN TICKET -->
      <div class="ticket-information">
        <div class="info-item">
          <span>Người gửi</span>
          <strong>
            ${escapeHTML(
              ticket.name || "—"
            )}
          </strong>
        </div>
        <div class="info-item">
          <span>Email</span>
          <strong>
            ${escapeHTML(
              ticket.email || "—"
            )}
          </strong>
        </div>
        <div class="info-item">
          <span>Khóa học</span>
          <strong>
            ${escapeHTML(
              ticket.course || "Không có"
            )}
          </strong>
        </div>
        <div class="info-item">
          <span>Loại yêu cầu</span>
          <strong>
            ${escapeHTML(
              ticket.ticketType || "—"
            )}
          </strong>
        </div>
      </div>
      <!-- NỘI DUNG BAN ĐẦU -->
      <div class="original-ticket">
        <div class="message-name">
          ${escapeHTML(
            ticket.name || "Học viên"
          )}
        </div>
        <div class="message-content">
          ${escapeHTML(
            ticket.description || ""
          )}
        </div>
      </div>
      <!-- MESSAGES -->
      <div
        class="messages"
        id="messages">
        <div class="loading-message">
          Đang tải trao đổi...
        </div>
      </div>
      <!-- INPUT -->
      ${
        ticket.status !== "closed"
          ? `
            <div class="message-input">
              <textarea
                id="messageInput"
                placeholder="Nhập nội dung trao đổi..."
              ></textarea>
              <button
                id="sendMessageBtn">
                Gửi
              </button>
            </div>
          `
          : `
            <div class="closed-message">
              Ticket này đã được đóng.
            </div>
          `
      }
    </div>
  `;
  // Load messages realtime
  loadMessages(ticket.id);
  // Gửi message
  const sendBtn =
    document.getElementById(
      "sendMessageBtn"
    );
  if (sendBtn) {
    sendBtn.addEventListener(
      "click",
      () => {
        sendMessage(ticket);
      }
    );
  }
  // Ctrl + Enter để gửi
  const input =
    document.getElementById(
      "messageInput"
    );
  if (input) {
    input.addEventListener(
      "keydown",
      (event) => {
        if (
          event.ctrlKey &&
          event.key === "Enter"
        ) {
          event.preventDefault();
          sendMessage(ticket);
        }
      }
    );
  }
}
// ======================================================
// LOAD MESSAGES REALTIME
// ======================================================
function loadMessages(ticketId) {
  const messagesEl =
    document.getElementById("messages");
  if (!messagesEl) {
    return;
  }
  db.collection("tickets")
    .doc(ticketId)
    .collection("messages")
    .orderBy("createdAt", "asc")
    .onSnapshot(
      (snapshot) => {
        messagesEl.innerHTML = "";
        if (snapshot.empty) {
          messagesEl.innerHTML = `
            <div class="empty-message">
              Chưa có trao đổi nào.
            </div>
          `;
          return;
        }
        snapshot.forEach((doc) => {
          const message =
            doc.data();
          const messageEl =
            document.createElement("div");
          messageEl.className =
            `message ${
              message.sender === "admin"
                ? "admin"
                : "student"
            }`;
          const senderName =
            message.senderName ||
            (
              message.sender === "admin"
                ? "Customer Success"
                : "Học viên"
            );
          messageEl.innerHTML = `
            <div class="message-name">
              ${escapeHTML(
                senderName
              )}
            </div>
            <div class="message-content">
              ${escapeHTML(
                message.message || ""
              )}
            </div>
            <div class="message-time">
              ${formatTicketDate(
                message.createdAt
              )}
            </div>
          `;
          messagesEl.appendChild(
            messageEl
          );
        });
        // Cuộn xuống cuối
        messagesEl.scrollTop =
          messagesEl.scrollHeight;
      },
      (error) => {
        console.error(
          "Load messages error:",
          error
        );
        messagesEl.innerHTML = `
          <div class="empty-message">
            Không thể tải nội dung trao đổi.
          </div>
        `;
      }
    );
}
// ======================================================
// SEND MESSAGE
// ======================================================
async function sendMessage(ticket) {
  const input =
    document.getElementById(
      "messageInput"
    );
  if (!input) {
    return;
  }
  const message =
    input.value.trim();
  if (!message) {
    return;
  }
  const sendBtn =
    document.getElementById(
      "sendMessageBtn"
    );
  try {
    sendBtn.disabled = true;
    sendBtn.textContent =
      "Đang gửi...";
    // -------------------------
    // THÊM MESSAGE
    // -------------------------
    await db
      .collection("tickets")
      .doc(ticket.id)
      .collection("messages")
      .add({
        sender: "student",
        senderName:
          ticket.name || "Học viên",
        message: message,
        createdAt:
          firebase.firestore
            .FieldValue
            .serverTimestamp()
      });
    // -------------------------
    // UPDATE TICKET
    // -------------------------
    await db
      .collection("tickets")
      .doc(ticket.id)
      .update({
        updatedAt:
          firebase.firestore
            .FieldValue
            .serverTimestamp()
      });
    input.value = "";
  } catch (error) {
    console.error(
      "Send message error:",
      error
    );
    alert(
      "Không thể gửi tin nhắn. Vui lòng thử lại."
    );
  } finally {
    sendBtn.disabled = false;
    sendBtn.textContent = "Gửi";
  }
}
// ======================================================
// SEARCH
// ======================================================
searchInput.addEventListener(
  "input",
  () => {
    renderTickets();
  }
);
// ======================================================
// FILTER
// ======================================================
document
  .querySelectorAll(".filter-chip")
  .forEach((chip) => {
    chip.addEventListener(
      "click",
      () => {
        document
          .querySelectorAll(".filter-chip")
          .forEach((item) => {
            item.classList.remove(
              "active"
            );
          });
        chip.classList.add("active");
        currentFilter =
          chip.dataset.filter;
        renderTickets();
      }
    );
  });
// ======================================================
// BACK BUTTON
// ======================================================
if (backBtn) {
  backBtn.addEventListener(
    "click",
    () => {
      history.back();
    }
  );
}
// ======================================================
// FORMAT DATE
// ======================================================
function formatTicketDate(timestamp) {
  if (!timestamp) {
    return "";
  }
  let date;
  if (
    typeof timestamp.toDate === "function"
  ) {
    date =
      timestamp.toDate();
  } else {
    date =
      new Date(timestamp);
  }
  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }
  return date.toLocaleString(
    "vi-VN",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }
  );
}
// ======================================================
// ESCAPE HTML
// ======================================================
function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
// ======================================================
// START
// ======================================================
loadTickets();