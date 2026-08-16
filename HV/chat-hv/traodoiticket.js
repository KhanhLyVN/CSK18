const ticketListEl =
  document.getElementById("ticketListEl");
const mainPaneEl =
  document.getElementById("mainPaneEl");
const bodyLayoutEl =
  document.getElementById("bodyLayoutEl");
const searchInputEl =
  document.getElementById("searchInputEl");
const filterRowEl =
  document.getElementById("filterRowEl");
const backButtonEl =
  document.getElementById("backButtonEl");
const menuToggleEl =
  document.getElementById("menuToggle");
const navSidebarEl =
  document.getElementById("navSidebarEl");
const ticketTotalEl =
  document.getElementById("ticketTotalEl");
/* =====================================================
   BIẾN
===================================================== */
let ticketsDataList = [];
let activeTicketItem = null;
let currentStatusFilter = "all";
let activeChatSubscription = null;
let firebaseCurrentUser = null;
let unsubscribeTickets = null;
const requestedTicketNumber =
  new URLSearchParams(
    window.location.search
  ).get("ticket");
let requestedTicketOpened = false;
/* =====================================================
   FIREBASE
===================================================== */
const database =
  typeof db !== "undefined"
    ? db
    : window.db || null;
const authInstance =
  typeof auth !== "undefined"
    ? auth
    : window.auth || null;
/* =====================================================
   STATUS
===================================================== */
const STATUS_META = {
  open: {
    label: "Đang mở",
    className: "open"
  },
  in_progress: {
    label: "Đang xử lý",
    className: "in_progress"
  },
  resolved: {
    label: "Đã giải quyết",
    className: "resolved"
  },
  closed: {
    label: "Đã đóng",
    className: "closed"
  }
};
/* =====================================================
   HELPER
===================================================== */
function firstValue(
  object,
  ...keys
) {
  for (const key of keys) {
    if (
      object &&
      object[key] !== undefined &&
      object[key] !== null &&
      String(object[key]).trim()
    ) {
      return object[key];
    }
  }
  return "";
}
function escapeHTMLValue(value) {
  return String(value ?? "")
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );
}
function normalizeStatus(status) {
  if (
    !status ||
    status === "pending"
  ) {
    return "open";
  }
  return STATUS_META[status]
    ? status
    : "open";
}
function renderStudentChatSetup(ticketRecord) {
  return `
    <section class="thread-setup" aria-label="Tạo đoạn chat">
      <div class="thread-setup-mark">↔</div>
      <h3>Chưa có lịch sử trao đổi</h3>
      <p>Ticket này chưa có đoạn chat. Nhấn nút bên dưới để bắt đầu trao đổi trực tiếp với Customer Success.</p>
      <button type="button" id="createChatThreadButton">Tạo đoạn chat</button>
    </section>
  `;
}
async function createStudentChatThread(ticketRecord) {
  if (!database || !firebaseCurrentUser || !ticketRecord?.id) return;
  const button = document.getElementById("createChatThreadButton");
  if (button) {
    button.disabled = true;
    button.textContent = "Đang tạo...";
  }
  try {
    const ticketRef = database.collection("tickets").doc(ticketRecord.id);
    await database.runTransaction(async transaction => {
      const snapshot = await transaction.get(ticketRef);
      if (!snapshot.exists) throw new Error("Không tìm thấy ticket.");
      const latestTicket = snapshot.data();
      if (!isMyTicket({ id: ticketRecord.id, ...latestTicket })) {
        throw new Error("Bạn không có quyền mở đoạn chat này.");
      }
      if (latestTicket.chatThreadCreated === true) return;
      transaction.update(ticketRef, {
        chatThreadCreated: true,
        chatThreadCreatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        chatThreadCreatedBy: "student",
        chatThreadCreatedByUid: firebaseCurrentUser.uid,
        studentMessageCount: Number.isInteger(latestTicket.studentMessageCount) ? latestTicket.studentMessageCount : 0,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    });
    openSelectedTicket({ ...ticketRecord, chatThreadCreated: true });
  } catch (error) {
    console.error("Không thể tạo đoạn chat:", error);
    if (button) {
      button.disabled = false;
      button.textContent = "Tạo đoạn chat";
    }
    window.alert(error?.message || "Không thể tạo đoạn chat. Vui lòng thử lại.");
  }
}
function renderClosedTicketSatisfaction(ticketRecord, status) {
  if (status !== "closed" || ticketRecord.satisfactionStatus !== "awaiting") {
    return "";
  }
  return `
    <section class="conversation-satisfaction" aria-label="Xác nhận kết quả hỗ trợ">
      <p>Customer Success đã đóng ticket. Bạn có hài lòng với kết quả hỗ trợ không?</p>
      <div class="conversation-satisfaction-actions">
        <button type="button" class="conversation-satisfaction-button is-positive" data-closed-satisfaction="satisfied" data-satisfaction-round="${Number(ticketRecord.satisfactionRound) || 1}">Hài lòng</button>
        <button type="button" class="conversation-satisfaction-button is-negative" data-closed-satisfaction="unsatisfied" data-satisfaction-round="${Number(ticketRecord.satisfactionRound) || 1}">Không hài lòng</button>
      </div>
    </section>
  `;
}
async function submitClosedTicketSatisfaction(ticketRecord, choice, satisfactionRound) {
  if (!database || !firebaseCurrentUser || !ticketRecord?.id) return;
  const buttons = document.querySelectorAll("[data-closed-satisfaction]");
  buttons.forEach(item => { item.disabled = true; });
  try {
    const ticketRef = database.collection("tickets").doc(ticketRecord.id);
    await database.runTransaction(async transaction => {
      const snapshot = await transaction.get(ticketRef);
      if (!snapshot.exists) throw new Error("Không tìm thấy ticket.");
      const latestTicket = snapshot.data();
      if (!isMyTicket({ id: ticketRecord.id, ...latestTicket })) {
        throw new Error("Bạn không có quyền xác nhận ticket này.");
      }
      if (normalizeStatus(latestTicket.status) !== "closed") {
        throw new Error("Ticket đã thay đổi trạng thái. Vui lòng tải lại.");
      }
      if (latestTicket.satisfactionStatus !== "awaiting" || (Number(latestTicket.satisfactionRound) || 1) !== satisfactionRound) {
        throw new Error("Yêu cầu đánh giá này không còn hiệu lực. Vui lòng tải lại.");
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
      }
      transaction.update(ticketRef, update);
    });
  } catch (error) {
    console.error("Không thể lưu xác nhận đóng ticket:", error);
    buttons.forEach(item => { item.disabled = false; });
    window.alert(error?.message || "Không thể lưu xác nhận. Vui lòng thử lại.");
  }
}
function getTimestampMillis(value) {
  if (!value) {
    return 0;
  }
  if (
    typeof value.toMillis ===
    "function"
  ) {
    return value.toMillis();
  }
  if (
    typeof value.toDate ===
    "function"
  ) {
    return value.toDate().getTime();
  }
  if (
    typeof value.seconds ===
    "number"
  ) {
    return value.seconds * 1000;
  }
  const result =
    new Date(value).getTime();
  return Number.isNaN(result)
    ? 0
    : result;
}
function ticketNumber(ticket) {
  return (
    firstValue(
      ticket,
      "ticketNum",
      "ticket_num",
      "id"
    ) ||
    "—"
  );
}
function ticketTitle(ticket) {
  return (
    firstValue(
      ticket,
      "title",
      "subject"
    ) ||
    "Không có tiêu đề"
  );
}
function ticketType(ticket) {
  const category =
    firstValue(
      ticket,
      "ticketCategory"
    );
  const issue =
    firstValue(
      ticket,
      "ticketIssue"
    );
  if (
    category &&
    issue &&
    category !== issue
  ) {
    return `${category} · ${issue}`;
  }
  return (
    issue ||
    category ||
    firstValue(
      ticket,
      "ticketType",
      "ticket_type",
      "category"
    ) ||
    "Khác"
  );
}
function ticketDescription(ticket) {
  return (
    firstValue(
      ticket,
      "description",
      "message",
      "content"
    ) ||
    "Không có mô tả chi tiết."
  );
}
/* =====================================================
   KIỂM TRA TICKET THUỘC USER
===================================================== */
function isMyTicket(ticket) {
  if (
    !ticket ||
    !firebaseCurrentUser
  ) {
    return false;
  }
  /*
     ƯU TIÊN UID
  */
  const ticketUid =
    firstValue(
      ticket,
      "studentUid",
      "userId",
      "userUid",
      "uid"
    );
  if (ticketUid) {
    return (
      String(ticketUid) ===
      String(firebaseCurrentUser.uid)
    );
  }
  /*
     FALLBACK EMAIL
     cho ticket cũ.
  */
  const ticketEmail =
    String(
      firstValue(
        ticket,
        "studentEmail",
        "userEmail",
        "email"
      )
    )
    .trim()
    .toLowerCase();
  const currentEmail =
    String(
      firebaseCurrentUser.email || ""
    )
    .trim()
    .toLowerCase();
  if (
    ticketEmail &&
    currentEmail
  ) {
    return (
      ticketEmail ===
      currentEmail
    );
  }
  return false;
}
/* =====================================================
   STATUS HTML
===================================================== */
function renderTicketStatus(
  status
) {
  const meta =
    STATUS_META[
      normalizeStatus(status)
    ];
  return `
    <span
      class="ticket-status ${meta.className}"
    >
      <span class="dot"></span>
      ${meta.label}
    </span>
  `;
}
/* =====================================================
   LOAD TICKETS
===================================================== */
function loadTicketsData() {
  if (
    !database ||
    !firebaseCurrentUser
  ) {
    return;
  }
  if (unsubscribeTickets) {
    unsubscribeTickets();
    unsubscribeTickets = null;
  }
  unsubscribeTickets =
    database
      .collection("tickets")
      .onSnapshot(
        snapshot => {
          /*
             CHỈ LẤY TICKET CỦA
             USER ĐANG ĐĂNG NHẬP.
          */
          ticketsDataList =
            snapshot.docs
              .map(doc => ({
                id: doc.id,
                ...doc.data()
              }))
              .filter(ticket =>
                isMyTicket(ticket)
              )
              .sort(
                (a, b) =>
                  getTimestampMillis(
                    b.createdAt
                  ) -
                  getTimestampMillis(
                    a.createdAt
                  )
              );
          renderTicketsList();
          /*
             Nếu đang mở ticket
             thì cập nhật realtime.
          */
          if (activeTicketItem) {
            const freshTicket =
              ticketsDataList.find(
                ticket =>
                  ticket.id ===
                  activeTicketItem.id
              );
            if (freshTicket) {
              openSelectedTicket(
                freshTicket
              );
            } else {
              activeTicketItem = null;
              bodyLayoutEl
                .classList
                .remove(
                  "show-chat"
                );
            }
          }
          /*
             Mở ticket từ URL.
          */
          else if (
            requestedTicketNumber &&
            !requestedTicketOpened
          ) {
            const requestedTicket =
              ticketsDataList.find(
                ticket =>
                  ticketNumber(
                    ticket
                  ) ===
                  requestedTicketNumber ||
                  ticket.id ===
                  requestedTicketNumber
              );
            if (requestedTicket) {
              requestedTicketOpened =
                true;
              openSelectedTicket(
                requestedTicket
              );
            }
          }
        },
        error => {
          console.error(
            "Firebase load tickets error:",
            error
          );
          ticketListEl.innerHTML = `
            <div class="ticket-error">
              Không thể tải danh sách ticket.
            </div>
          `;
        }
      );
}
/* =====================================================
   FILTER
===================================================== */
function matchesStatusFilter(
  ticket
) {
  const status =
    normalizeStatus(
      ticket.status
    );
  if (
    currentStatusFilter ===
    "all"
  ) {
    return true;
  }
  if (
    currentStatusFilter ===
    "open"
  ) {
    return status !== "closed";
  }
  return (
    status ===
    currentStatusFilter
  );
}
/* =====================================================
   RENDER LIST
===================================================== */
function renderTicketsList() {
  const searchKeyword =
    (
      searchInputEl?.value ||
      ""
    )
    .trim()
    .toLocaleLowerCase("vi");
  const filteredTickets =
    ticketsDataList.filter(
      ticket => {
        const searchable = [
          ticketNumber(ticket),
          firstValue(
            ticket,
            "name"
          ),
          firstValue(
            ticket,
            "email"
          ),
          ticketTitle(ticket),
          ticketType(ticket)
        ]
        .join(" ")
        .toLocaleLowerCase("vi");
        return (
          (
            !searchKeyword ||
            searchable.includes(
              searchKeyword
            )
          )
          &&
          matchesStatusFilter(
            ticket
          )
        );
      }
    );
  ticketTotalEl.textContent =
    filteredTickets.length;
  ticketListEl.innerHTML = "";
  if (!filteredTickets.length) {
    ticketListEl.innerHTML = `
      <div class="empty-ticket">
        <div>
          Bạn chưa có ticket nào phù hợp.
        </div>
      </div>
    `;
    return;
  }
  filteredTickets.forEach(
    ticket => {
      const ticketNode =
        document.createElement(
          "div"
        );
      ticketNode.className =
        "ticket-item";
      if (
        activeTicketItem &&
        activeTicketItem.id ===
        ticket.id
      ) {
        ticketNode.classList.add(
          "active"
        );
      }
      const date =
        firstValue(
          ticket,
          "date"
        ) ||
        (
          getTimestampMillis(
            ticket.createdAt
          )
            ? new Date(
                getTimestampMillis(
                  ticket.createdAt
                )
              )
              .toLocaleString(
                "vi-VN"
              )
            : "—"
        );
      ticketNode.innerHTML = `
        <div class="ticket-item-top">
          <strong>
            ${escapeHTMLValue(
              ticketNumber(ticket)
            )}
          </strong>
          ${renderTicketStatus(
            ticket.status
          )}
        </div>
        <div class="ticket-item-title">
          ${escapeHTMLValue(
            ticketTitle(ticket)
          )}
        </div>
        <div class="ticket-item-info">
          <span>
            ${escapeHTMLValue(
              ticketType(ticket)
            )}
          </span>
          <span>
            ${escapeHTMLValue(
              date
            )}
          </span>
        </div>
      `;
      ticketNode.addEventListener(
        "click",
        () =>
          openSelectedTicket(
            ticket
          )
      );
      ticketListEl.appendChild(
        ticketNode
      );
    }
  );
}
/* =====================================================
   OPEN TICKET
===================================================== */
function openSelectedTicket(
  ticketRecord
) {
  /*
     CHẶN TRUY CẬP TRỰC TIẾP
     BẰNG URL.
  */
  if (
    !isMyTicket(
      ticketRecord
    )
  ) {
    alert(
      "Bạn không có quyền xem ticket này."
    );
    return;
  }
  activeTicketItem =
    ticketRecord;
  const hasChatThread = ticketRecord.chatThreadCreated === true;
  renderTicketsList();
  bodyLayoutEl
    .classList
    .add(
      "show-chat"
    );
  const status =
    normalizeStatus(
      ticketRecord.status
    );
  const meta =
    STATUS_META[status];
  const createdDate =
    firstValue(
      ticketRecord,
      "date"
    ) ||
    (
      getTimestampMillis(
        ticketRecord.createdAt
      )
        ? new Date(
            getTimestampMillis(
              ticketRecord.createdAt
            )
          )
          .toLocaleString(
            "vi-VN"
          )
        : "—"
    );
  const studentName =
    firstValue(
      ticketRecord,
      "name"
    ) ||
    "—";
  const email =
    firstValue(
      ticketRecord,
      "email"
    ) ||
    "—";
  const phone =
    firstValue(
      ticketRecord,
      "phone"
    ) ||
    "—";
  const course =
    firstValue(
      ticketRecord,
      "course"
    ) ||
    "Không có";
  mainPaneEl.innerHTML = `
    <div class="conversation">
      <div class="conversation-header">
        <div>
          <div class="conversation-code">
            ${escapeHTMLValue(
              ticketNumber(
                ticketRecord
              )
            )}
          </div>
          <h2>
            ${escapeHTMLValue(
              ticketTitle(
                ticketRecord
              )
            )}
          </h2>
        </div>
        ${renderTicketStatus(
          ticketRecord.status
        )
        .replace(
          "ticket-status",
          "conversation-status"
        )}
      </div>
      <div class="stub-card">
        <div class="stub-top">
          <div class="stub-top-left">
            <div class="stub-top-group">
              <span class="k1">
                Mã yêu cầu:
              </span>
              <span class="num">
                ${escapeHTMLValue(
                  ticketNumber(
                    ticketRecord
                  )
                )}
              </span>
            </div>
            <div class="cat">
              ${escapeHTMLValue(
                ticketType(
                  ticketRecord
                )
              )}
            </div>
          </div>
          <div
            class="stub-status-badge ${meta.className}"
          >
            <span class="dot"></span>
            ${meta.label}
          </div>
        </div>
        <div class="stub-body">
          <div class="stub-grid">
            <div class="stub-field">
              <div class="k">
                Người gửi
              </div>
              <div class="v">
                ${escapeHTMLValue(
                  studentName
                )}
              </div>
            </div>
            <div class="stub-field">
              <div class="k">
                Email
              </div>
              <div class="v">
                ${escapeHTMLValue(
                  email
                )}
              </div>
            </div>
            <div class="stub-field">
              <div class="k">
                Điện thoại
              </div>
              <div class="v">
                ${escapeHTMLValue(
                  phone
                )}
              </div>
            </div>
            <div class="stub-field">
              <div class="k">
                Khóa học
              </div>
              <div class="v">
                ${escapeHTMLValue(
                  course
                )}
              </div>
            </div>
            <div class="stub-field">
              <div class="k">
                Ngày gửi
              </div>
              <div class="v">
                ${escapeHTMLValue(
                  createdDate
                )}
              </div>
            </div>
            <div class="stub-field stub-field-wide">
              <div class="k">
                Loại yêu cầu học viên cần hỗ trợ
              </div>
              <div class="v">
                ${escapeHTMLValue(
                  ticketType(
                    ticketRecord
                  )
                )}
              </div>
            </div>
            <div class="stub-field stub-field-wide">
              <div class="k">
                Mô tả yêu cầu
              </div>
              <div class="v">
                ${escapeHTMLValue(
                  ticketDescription(
                    ticketRecord
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      ${hasChatThread ? `
        <div class="messages" id="messagesContainerEl">
          <div class="loading-message">Đang tải trao đổi...</div>
        </div>
      ` : renderStudentChatSetup(ticketRecord)}
      ${hasChatThread ? renderClosedTicketSatisfaction(ticketRecord, status) : ""}
      ${
        hasChatThread && status !== "closed"
          ? `
            <div class="message-input">
              <textarea
                id="messageInputArea"
                placeholder="Nhập nội dung trao đổi với Customer Success..."
              ></textarea>
              <button
                id="sendMessageButton"
                type="button"
              >
                Gửi
              </button>
            </div>
          `
          : `
            <div class="closed-message">
              Ticket này đã được đóng.
              Bạn vẫn có thể xem lại lịch sử trao đổi.
            </div>
          `
      }
    </div>
  `;
    if (hasChatThread) {
    loadTicketMessagesRealtime(ticketRecord.id);
  } else {
    const createChatButton = document.getElementById("createChatThreadButton");
    if (createChatButton) {
      createChatButton.addEventListener("click", () => createStudentChatThread(ticketRecord));
    }
  }
  const sendButton =
    document.getElementById(
      "sendMessageButton"
    );
  if (sendButton) {
    sendButton.addEventListener(
      "click",
      () =>
        sendNewMessage(
          ticketRecord
        )
    );
  }
  const input =
    document.getElementById(
      "messageInputArea"
    );
  if (input) {
    input.addEventListener(
      "keydown",
      event => {
        if (
          event.key === "Enter" &&
          (
            event.ctrlKey ||
            event.metaKey
          )
        ) {
          event.preventDefault();
          sendNewMessage(
            ticketRecord
          );
        }
      }
    );
  }
}
/* =====================================================
   LOAD MESSAGE
===================================================== */
function loadTicketMessagesRealtime(
  ticketRecordId
) {
  const messagesContainerEl =
    document.getElementById(
      "messagesContainerEl"
    );
  if (
    !messagesContainerEl ||
    !database
  ) {
    return;
  }
  /*
     TÌM TICKET TRONG DANH SÁCH
  */
  const ticket =
    ticketsDataList.find(
      t =>
        t.id ===
        ticketRecordId
    );
  /*
     KHÔNG TỒN TẠI
     HOẶC KHÔNG PHẢI CỦA USER
  */
  if (
    !ticket ||
    !isMyTicket(ticket)
  ) {
    messagesContainerEl.innerHTML = `
      <div class="empty-message">
        Bạn không có quyền xem ticket này.
      </div>
    `;
    return;
  }
  if (
    activeChatSubscription
  ) {
    activeChatSubscription();
    activeChatSubscription =
      null;
  }
  activeChatSubscription =
    database
      .collection("tickets")
      .doc(ticketRecordId)
      .collection("messages")
      .onSnapshot(
        messagesSnapshot => {
          const messages =
            messagesSnapshot.docs
              .map(doc => ({
                id: doc.id,
                ...doc.data()
              }))
              .sort(
                (a, b) =>
                  getTimestampMillis(
                    a.createdAt
                  ) -
                  getTimestampMillis(
                    b.createdAt
                  )
              );
          if (!messages.length) {
            messagesContainerEl.innerHTML = `
              <div class="empty-message">
                Chưa có trao đổi nào.
                Bạn có thể gửi tin nhắn đầu tiên.
              </div>
            `;
            return;
          }
          messagesContainerEl.innerHTML =
            messages
              .map(messageData => {
                const isCS =
                  messageData.senderType ===
                    "cs" ||
                  messageData.sender ===
                    "admin";
                const senderName =
                  firstValue(
                    messageData,
                    "senderName"
                  ) ||
                  (
                    isCS
                      ? "Customer Success"
                      : "Học viên"
                  );
                const messageText =
                  firstValue(
                    messageData,
                    "message",
                    "text"
                  );
                const messageTime =
                  getTimestampMillis(
                    messageData.createdAt
                  )
                    ? new Date(
                        getTimestampMillis(
                          messageData.createdAt
                        )
                      )
                      .toLocaleString(
                        "vi-VN"
                      )
                    : "—";
                return `
                  <div
                    class="message ${
                      isCS
                        ? "admin"
                        : "student"
                    }"
                  >
                    <div class="message-name">
                      ${escapeHTMLValue(
                        senderName
                      )}
                    </div>
                    <div class="message-content">
                      ${escapeHTMLValue(
                        messageText
                      )}
                    </div>
                    <div class="message-time">
                      ${escapeHTMLValue(
                        messageTime
                      )}
                    </div>
                  </div>
                `;
              })
              .join("");
          messagesContainerEl.scrollTop =
            messagesContainerEl.scrollHeight;
        },
        error => {
          console.error(
            "Load messages error:",
            error
          );
          messagesContainerEl.innerHTML = `
            <div class="empty-message">
              Không thể tải nội dung trao đổi.
            </div>
          `;
        }
      );
}
/* =====================================================
   GỬI MESSAGE
===================================================== */
async function sendNewMessage(
  ticketRecord
) {
  /*
     KIỂM TRA QUYỀN
  */
  if (
    !firebaseCurrentUser ||
    !isMyTicket(
      ticketRecord
    )
  ) {
    alert(
      "Bạn không có quyền gửi tin nhắn vào ticket này."
    );
    return;
  }
  const input =
    document.getElementById(
      "messageInputArea"
    );
  const button =
    document.getElementById(
      "sendMessageButton"
    );
  const messageText =
    input?.value.trim();
  if (
    !input ||
    !messageText ||
    !database
  ) {
    return;
  }
  try {
    if (button) {
      button.disabled =
        true;
      button.textContent =
        "Đang gửi...";
    }
    await database
      .collection("tickets")
      .doc(ticketRecord.id)
      .collection("messages")
      .add({
        sender:
          "student",
        senderType:
          "student",
        senderUid:
          firebaseCurrentUser.uid,
        senderEmail:
          firebaseCurrentUser.email || "",
        senderName:
          firstValue(
            ticketRecord,
            "name"
          ) ||
          firebaseCurrentUser.displayName ||
          "Học viên",
        message:
          messageText,
        text:
          messageText,
        createdAt:
          firebase.firestore
            .FieldValue
            .serverTimestamp()
      });
    await database
      .collection("tickets")
      .doc(ticketRecord.id)
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
    if (button) {
      button.disabled =
        false;
      button.textContent =
        "Gửi";
    }
  }
}
/* =====================================================
   NAVIGATION
===================================================== */
document.addEventListener(
  "click",
  event => {
    const button = event.target.closest("[data-closed-satisfaction]");
    if (!button || !activeTicketItem) return;
    event.preventDefault();
    submitClosedTicketSatisfaction(
      activeTicketItem,
      button.dataset.closedSatisfaction,
      Number(button.dataset.satisfactionRound) || 1
    );
  }
);
if (menuToggleEl) {
  menuToggleEl.addEventListener(
    "click",
    () => {
      navSidebarEl?.classList.toggle(
        "mobile-open"
      );
    }
  );
}
if (backButtonEl) {
  backButtonEl.addEventListener(
    "click",
    () => {
      bodyLayoutEl
        .classList
        .remove(
          "show-chat"
        );
      activeTicketItem =
        null;
      if (
        activeChatSubscription
      ) {
        activeChatSubscription();
        activeChatSubscription =
          null;
      }
      mainPaneEl.innerHTML = `
        <div class="empty-conversation">
          <div class="empty-conversation-icon">
            ⌁
          </div>
          <h2>
            Chọn một ticket để trao đổi
          </h2>
          <p>
            Danh sách các phiếu hỗ trợ của bạn nằm ở bên trái.
          </p>
        </div>
      `;
      renderTicketsList();
    }
  );
}
/* =====================================================
   SEARCH
===================================================== */
if (searchInputEl) {
  searchInputEl.addEventListener(
    "input",
    renderTicketsList
  );
}
/* =====================================================
   FILTER
===================================================== */
if (filterRowEl) {
  filterRowEl
    .querySelectorAll(
      ".filter-chip"
    )
    .forEach(chip => {
      chip.addEventListener(
        "click",
        () => {
          filterRowEl
            .querySelectorAll(
              ".filter-chip"
            )
            .forEach(item =>
              item.classList.remove(
                "active"
              )
            );
          chip.classList.add(
            "active"
          );
          currentStatusFilter =
            chip.dataset.filter;
          renderTicketsList();
        }
      );
    });
}
/* =====================================================
   FIREBASE AUTH
===================================================== */
if (authInstance) {
  authInstance.onAuthStateChanged(
    user => {
      /*
         HỦY LISTENER CŨ
      */
      if (unsubscribeTickets) {
        unsubscribeTickets();
        unsubscribeTickets =
          null;
      }
      /*
         CHƯA ĐĂNG NHẬP
      */
      if (!user) {
        firebaseCurrentUser =
          null;
        ticketsDataList =
          [];
        if (ticketTotalEl) {
          ticketTotalEl.textContent =
            "0";
        }
        if (ticketListEl) {
          ticketListEl.innerHTML = `
            <div class="ticket-error">
              Vui lòng đăng nhập để xem ticket của bạn.
            </div>
          `;
        }
        return;
      }
      /*
         USER HIỆN TẠI
      */
      firebaseCurrentUser =
        user;
      requestedTicketOpened =
        false;
      console.log(
        "Học viên đăng nhập:",
        user.uid,
        user.email
      );
      loadTicketsData();
    }
  );
} else {
  console.error(
    "Firebase Auth chưa được khởi tạo."
  );
  if (ticketListEl) {
    ticketListEl.innerHTML = `
      <div class="ticket-error">
        Firebase Authentication chưa được khởi tạo.
      </div>
    `;
  }
}
