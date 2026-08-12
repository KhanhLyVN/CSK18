// ======================================================
// ELEMENT REFERENCES
// ======================================================
const ticketListEl = document.getElementById("ticketListEl");
const mainPaneEl = document.getElementById("mainPaneEl");
const searchInputEl = document.getElementById("searchInputEl");
const filterRowEl = document.getElementById("filterRowEl");
const backButtonEl = document.getElementById("backButtonEl");

// ======================================================
// STATE VARIABLES
// ======================================================
let ticketsDataList = [];
let activeTicketItem = null;
let currentStatusFilter = "all";
let activeChatSubscription = null;

// ======================================================
// LOAD TICKETS REALTIME
// ======================================================
function loadTicketsData() {
  db.collection("tickets").onSnapshot(
    (snapshotQuery) => {
      ticketsDataList = [];
      snapshotQuery.forEach((docSnap) => {
        ticketsDataList.push({
          id: docSnap.id,
          ...docSnap.data()
        });
      });
      ticketsDataList.sort((ticketA, ticketB) => {
        const timeA = ticketA.createdAt?.toMillis?.() || 0;
        const timeB = ticketB.createdAt?.toMillis?.() || 0;
        return timeB - timeA;
      });
      renderTicketsList();
    },
    (error) => {
      console.error("Firebase load tickets error:", error);
      ticketListEl.innerHTML = `
        <div class="ticket-error">
          Không thể tải danh sách ticket.
        </div>
      `;
    }
  );
}

// ======================================================
// RENDER SIDEBAR LIST
// ======================================================
function renderTicketsList() {
  const searchKeyword = searchInputEl.value.trim().toLowerCase();
  const filteredTicketsCollection = ticketsDataList.filter((ticketRecord) => {
    const ticketNumberStr = (ticketRecord.ticketNum || "").toLowerCase();
    const ticketTitleStr = (ticketRecord.title || "").toLowerCase();
    const isMatchingSearch =
      !searchKeyword ||
      ticketNumberStr.includes(searchKeyword) ||
      ticketTitleStr.includes(searchKeyword);
    const isMatchingFilter =
      currentStatusFilter === "all" ||
      ticketRecord.status === currentStatusFilter;
    return isMatchingSearch && isMatchingFilter;
  });

  ticketListEl.innerHTML = "";
  if (!filteredTicketsCollection.length) {
    ticketListEl.innerHTML = `
      <div class="empty-ticket">
        <div class="empty-icon">🎫</div>
        <div>Chưa có ticket nào</div>
      </div>
    `;
    return;
  }

  filteredTicketsCollection.forEach((ticketRecord) => {
    const ticketNode = document.createElement("div");
    ticketNode.className = "ticket-item";
    if (activeTicketItem && activeTicketItem.id === ticketRecord.id) {
      ticketNode.classList.add("active");
    }
    const localizedStatusText =
      ticketRecord.status === "closed" ? "Đã đóng" : "Đang mở";
    const formattedDateString = formatTicketDateValue(ticketRecord.createdAt);

    ticketNode.innerHTML = `
      <div class="ticket-item-top">
        <strong>
          ${escapeHTMLValue(ticketRecord.ticketNum || ticketRecord.id)}
        </strong>
        <span class="ticket-status ${ticketRecord.status}">
          ${localizedStatusText}
        </span>
      </div>
      <div class="ticket-item-title">
        ${escapeHTMLValue(ticketRecord.title || "Không có tiêu đề")}
      </div>
      <div class="ticket-item-info">
        <span>
          ${escapeHTMLValue(ticketRecord.ticketType || "Khác")}
        </span>
        <span>
          ${formattedDateString}
        </span>
      </div>
    `;

    ticketNode.addEventListener("click", () => {
      openSelectedTicket(ticketRecord);
    });
    ticketListEl.appendChild(ticketNode);
  });
}

// ======================================================
// OPEN SELECTED TICKET
// ======================================================
function openSelectedTicket(ticketRecord) {
  activeTicketItem = ticketRecord;
  renderTicketsList();
  
  const localizedStatusText = ticketRecord.status === "closed" ? "Đã đóng" : "Đang mở";
  const formattedDateString = formatTicketDateValue(ticketRecord.createdAt);

  mainPaneEl.innerHTML = `
    <div class="conversation">
      <div class="conversation-header">
        <div>
          <div class="conversation-code">
            ${escapeHTMLValue(ticketRecord.ticketNum || ticketRecord.id)}
          </div>
          <h2>
            ${escapeHTMLValue(ticketRecord.title || "Không có tiêu đề")}
          </h2> 
        </div>
        <div class="conversation-status ${ticketRecord.status}">
          <span class="dot"></span>
          ${localizedStatusText}
        </div>
      </div>

      <div class="stub-card">
        <div class="stub-top">
          <div class="stub-top-left">
            <div class="stub-top-group">
              <span class="k1">Mã yêu cầu:</span>
              <span class="num">${escapeHTMLValue(ticketRecord.ticketNum || ticketRecord.id)}</span>
            </div>
            <div class="cat">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              ${escapeHTMLValue(ticketRecord.ticketType || "Báo lỗi hệ thống")}
            </div>
          </div>
          <div class="stub-status-badge ${ticketRecord.status}">
            <span class="dot"></span> ${localizedStatusText}
          </div>
        </div>
        <div class="stub-body">
          <div class="stub-grid">
            <div class="stub-field">
              <div class="k">Người gửi</div>
              <div class="v">${escapeHTMLValue(ticketRecord.name || "—")}</div>
            </div>
            <div class="stub-field">
              <div class="k">Khóa học</div>
              <div class="v">${escapeHTMLValue(ticketRecord.course || "Không có")}</div>
            </div>
            <div class="stub-field">
              <div class="k">Tiêu đề</div>
              <div class="v">${escapeHTMLValue(ticketRecord.title || "—")}</div>
            </div>
            <div class="stub-field">
              <div class="k">Ngày gửi</div>
              <div class="v">${formattedDateString || "—"}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="messages" id="messagesContainerEl">
        <div class="loading-message">Đang tải trao đổi...</div>
      </div>

      ${
        ticketRecord.status !== "closed"
          ? `
            <div class="message-input">
              <textarea id="messageInputArea" placeholder="Nhập nội dung trao đổi..."></textarea>
              <button id="sendMessageButton">Gửi</button>
            </div>
          `
          : `
            <div class="closed-message">Ticket này đã được đóng.</div>
          `
      }
    </div>
  `;

  loadTicketMessagesRealtime(ticketRecord.id);

  const sendMessageButtonEl = document.getElementById("sendMessageButton");
  if (sendMessageButtonEl) {
    sendMessageButtonEl.addEventListener("click", () => sendNewMessage(ticketRecord));
  }

  const messageInputAreaEl = document.getElementById("messageInputArea");
  if (messageInputAreaEl) {
    messageInputAreaEl.addEventListener("keydown", (event) => {
      if (event.ctrlKey && event.key === "Enter") {
        event.preventDefault();
        sendNewMessage(ticketRecord);
      }
    });
  }
}

// ======================================================
// LOAD MESSAGES REALTIME
// ======================================================
function loadTicketMessagesRealtime(ticketRecordId) {
  const messagesContainerEl = document.getElementById("messagesContainerEl");
  if (!messagesContainerEl) return;

  if (activeChatSubscription) {
    activeChatSubscription();
    activeChatSubscription = null;
  }

  activeChatSubscription = db.collection("tickets")
    .doc(ticketRecordId)
    .collection("messages")
    .orderBy("createdAt", "asc")
    .onSnapshot(
      (messagesSnapshot) => {
        messagesContainerEl.innerHTML = "";
        if (messagesSnapshot.empty) {
          messagesContainerEl.innerHTML = `
            <div class="empty-message">
              Chưa có trao đổi nào.
            </div>
          `;
          return;
        }
        messagesSnapshot.forEach((messageDoc) => {
          const messageData = messageDoc.data();
          const singleMessageNode = document.createElement("div");
          const isCustomerServiceSender = messageData.senderType === "cs" || messageData.sender === "admin";
          
          singleMessageNode.className = `message ${isCustomerServiceSender ? "admin" : "student"}`;
          const currentSenderName =
            messageData.senderName ||
            (isCustomerServiceSender ? "Customer Success" : "Học viên");

          singleMessageNode.innerHTML = `
            <div class="message-name">
              ${escapeHTMLValue(currentSenderName)}
            </div>
            <div class="message-content">
              ${escapeHTMLValue(messageData.message || messageData.text || "")}
            </div>
            <div class="message-time">
              ${formatTicketDateValue(messageData.createdAt)}
            </div>
          `;
          messagesContainerEl.appendChild(singleMessageNode);
        });
        messagesContainerEl.scrollTop = messagesContainerEl.scrollHeight;
      },
      (error) => {
        console.error("Load messages error:", error);
        messagesContainerEl.innerHTML = `
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
async function sendNewMessage(ticketRecord) {
  const messageInputAreaEl = document.getElementById("messageInputArea");
  if (!messageInputAreaEl) return;

  const messageTextContent = messageInputAreaEl.value.trim();
  if (!messageTextContent) return;

  const sendMessageButtonEl = document.getElementById("sendMessageButton");
  try {
    if (sendMessageButtonEl) {
      sendMessageButtonEl.disabled = true;
      sendMessageButtonEl.textContent = "Đang gửi...";
    }

    await db
      .collection("tickets")
      .doc(ticketRecord.id)
      .collection("messages")
      .add({
        sender: "student",
        senderType: "student",
        senderName: ticketRecord.name || "Học viên",
        message: messageTextContent,
        text: messageTextContent,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

    await db
      .collection("tickets")
      .doc(ticketRecord.id)
      .update({
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

    messageInputAreaEl.value = "";
  } catch (error) {
    console.error("Send message error:", error);
    alert("Không thể gửi tin nhắn. Vui lòng thử lại.");
  } finally {
    if (sendMessageButtonEl) {
      sendMessageButtonEl.disabled = false;
      sendMessageButtonEl.textContent = "Gửi";
    }
  }
}

// ======================================================
// SEARCH & FILTER EVENTS
// ======================================================
if (searchInputEl) {
  searchInputEl.addEventListener("input", () => {
    renderTicketsList();
  });
}

document.querySelectorAll(".filter-chip").forEach((chipElement) => {
  chipElement.addEventListener("click", () => {
    document.querySelectorAll(".filter-chip").forEach((itemElement) => {
      itemElement.classList.remove("active");
    });
    chipElement.classList.add("active");
    currentStatusFilter = chipElement.dataset.filter;
    renderTicketsList();
  });
});

if (backButtonEl) {
  backButtonEl.addEventListener("click", () => {
    history.back();
  });
}

// ======================================================
// UTILITY HELPERS
// ======================================================
function formatTicketDateValue(timestampValue) {
  if (!timestampValue) return "";
  let parsedDateObj;
  if (typeof timestampValue.toDate === "function") {
    parsedDateObj = timestampValue.toDate();
  } else {
    parsedDateObj = new Date(timestampValue);
  }
  if (Number.isNaN(parsedDateObj.getTime())) return "";
  return parsedDateObj.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function escapeHTMLValue(inputStringValue) {
  return String(inputStringValue ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ======================================================
// START APPLICATION
// ======================================================
loadTicketsData();