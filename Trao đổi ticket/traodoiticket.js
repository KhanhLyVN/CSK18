import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import { getFirestore, collection, addDoc, Timestamp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyABb8e6NfOhMv--kMge0DlafPmGAJfOuCY",
  authDomain: "csk18-5417b.firebaseapp.com",
  projectId: "csk18-5417b",
  storageBucket: "csk18-5417b.firebasestorage.app",
  messagingSenderId: "630800680084",
  appId: "1:630800680084:web:96a5fb888393bf6a5fe081",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
/* ===== Icon set (đồng bộ với trang Phiếu Yêu Cầu Hỗ Trợ) ===== */
const ICONS = {
  bug: '<path d="M12 8v8M8 12h8"/><path d="M9 4h6l1 3H8l1-3z"/><rect x="6" y="7" width="12" height="12" rx="4"/><path d="M4 10l2 1M20 10l-2 1M4 17l2-1M20 17l-2-1"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
  wallet: '<path d="M3 7a2 2 0 0 1 2-2h13a1 1 0 0 1 1 1v3"/><path d="M3 7v11a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-6a1 1 0 0 0-1-1h-5a2 2 0 0 0 0 4h6"/>',
  cert: '<circle cx="12" cy="8" r="5"/><path d="M9 12.5L7 21l5-3 5 3-2-8.5"/>',
  swap: '<path d="M7 4v10M7 4L4 7M7 4l3 3"/><path d="M17 20V10M17 20l3-3M17 20l-3-3"/>',
  chat: '<path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5H4l1.6-3.8A8.5 8.5 0 1 1 21 11.5z"/><path d="M12 9v4M12 15.5h.01"/>',
  scale: '<path d="M12 3v18M5 8l-3 6a4 4 0 0 0 6 0zM19 8l-3 6a4 4 0 0 0 6 0zM5 8h14M9 3h6"/>',
  mentor: '<circle cx="9" cy="8" r="3"/><path d="M4 20c0-3.3 2.7-5.5 5-5.5s5 2.2 5 5.5"/><path d="M15 8h6M18 5v6"/>',
  book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15z"/><path d="M20 18H6.5A2.5 2.5 0 0 0 4 20.5"/>',
  other: '<circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/>'
};
const svgIcon = (key, cls="") => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[key] || ICONS.other}</svg>`;

const STATUS_META = {
  pending:     { label: "Đang chờ xác nhận", color: "#B08A4E" },
  in_progress: { label: "Đang xử lý",        color: "#5D0703" },
  resolved:    { label: "Đã giải quyết",      color: "#4C6B3C" },
  closed:      { label: "Đã đóng",            color: "#8A7A6D" }
};

/* =========================================================
   KẾT NỐI DATABASE (Firestore) — TRA CỨU THỜI GIAN THỰC
   Collection "tickets": mỗi document là 1 phiếu, ID = ticket_num.
   Các trường khớp với trang "Phiếu Yêu Cầu Hỗ Trợ" để liên kết
   thông tin: ticket_num, name, email, phone, course, date,
   ticket_type, icon, title, message, status, createdAt.
   Sub-collection "messages" bên trong mỗi ticket: lưu toàn bộ
   lịch sử trao đổi { from, who, text, createdAt }.
   ========================================================= */
let TICKETS = [];
let ticketsLoaded = false;
let activeId = null;
let activeFilter = "all";
let searchTerm = "";
let unsubMessages = null;
let activeMessages = [];

const ticketListEl = document.getElementById("ticketList");
const mainEl = document.getElementById("mainEl");
const bodyEl = document.getElementById("bodyEl");
const backBtn = document.getElementById("backBtn");

function getTicket(id){ return TICKETS.find(t => t.id === id); }

function lastSnippet(t){
  return t.lastMessage || t.message || "";
}

function statusPill(statusKey){
  const s = STATUS_META[statusKey] || STATUS_META.pending;
  return `<span class="status-tag" style="background:${s.color}22; color:${s.color};">
    <span class="dot" style="background:${s.color};"></span>${s.label}
  </span>`;
}

function formatTime(ts){
  if(!ts || !ts.toDate) return "Đang gửi...";
  const d = ts.toDate();
  const p = n => String(n).padStart(2,"0");
  return `${p(d.getDate())}/${p(d.getMonth()+1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/* ---------- Sidebar: lắng nghe collection "tickets" theo thời gian thực ---------- */
db.collection("tickets").orderBy("createdAt", "desc").onSnapshot((snapshot) => {
  ticketsLoaded = true;
  TICKETS = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  if(!activeId && TICKETS.length) activeId = TICKETS[0].id;
  if(activeId && !getTicket(activeId)) activeId = TICKETS.length ? TICKETS[0].id : null;
  renderList();
  renderMain();
  subscribeMessages();
}, (err) => {
  console.error("Lỗi kết nối Firestore (tickets):", err);
  ticketListEl.innerHTML = `<div class="empty-list">Không thể kết nối cơ sở dữ liệu. Vui lòng kiểm tra cấu hình Firebase trong mã nguồn.</div>`;
});

/* ---------- Chat: lắng nghe sub-collection "messages" của ticket đang chọn ---------- */
function subscribeMessages(){
  if(unsubMessages){ unsubMessages(); unsubMessages = null; }
  const t = getTicket(activeId);
  if(!t) return;
  unsubMessages = db.collection("tickets").doc(t.id).collection("messages")
    .orderBy("createdAt", "asc")
    .onSnapshot((snapshot) => {
      activeMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      renderThread(t);
    }, (err) => {
      console.error("Lỗi kết nối Firestore (messages):", err);
    });
}

function renderList(){
  let items = TICKETS.filter(t => {
    if(activeFilter === "open" && (t.status === "resolved" || t.status === "closed")) return false;
    if(activeFilter === "closed" && !(t.status === "resolved" || t.status === "closed")) return false;
    if(searchTerm){
      const hay = ((t.ticket_num||t.id) + " " + t.title).toLowerCase();
      if(!hay.includes(searchTerm.toLowerCase())) return false;
    }
    return true;
  });

  if(!ticketsLoaded){
    ticketListEl.innerHTML = `<div class="empty-list">Đang tải danh sách phiếu...</div>`;
    return;
  }
  if(TICKETS.length === 0){
    ticketListEl.innerHTML = `<div class="empty-list">Bạn chưa gửi phiếu yêu cầu nào.<br>Hãy gửi một phiếu ở trang "Phiếu Yêu Cầu Hỗ Trợ" để bắt đầu trao đổi với Customer Success.</div>`;
    return;
  }
  if(items.length === 0){
    ticketListEl.innerHTML = `<div class="empty-list">Không tìm thấy phiếu nào phù hợp.</div>`;
    return;
  }

  ticketListEl.innerHTML = items.map(t => `
    <div class="ticket-item ${t.id === activeId ? 'active' : ''}" data-id="${t.id}">
      <div class="ti-row1">
        <span class="ti-num">${t.ticket_num || t.id}</span>
        ${statusPill(t.status)}
      </div>
      <div class="ti-title">${t.title}</div>
      <div class="ti-row3">
        <span class="ti-type">${svgIcon(t.icon)}${t.ticket_type}</span>
        <span class="ti-date">${t.date}</span>
      </div>
      <div class="ti-snippet">${lastSnippet(t)}</div>
    </div>
  `).join("");

  ticketListEl.querySelectorAll(".ticket-item").forEach(el => {
    el.addEventListener("click", () => {
      activeId = el.dataset.id;
      renderList();
      renderMain();
      subscribeMessages();
      bodyEl.classList.add("show-chat");
    });
  });
}

function renderStubCard(t){
  return `
    <div class="stub-card">
      <div class="stub-top">
        <div class="row">
          <div>
            <div class="k1">Mã yêu cầu</div>
            <div class="num">${t.ticket_num || t.id}</div>
            <div class="cat">${svgIcon(t.icon)}<span>${t.ticket_type}</span></div>
          </div>
          <div class="course">Khóa học:<br>${t.course}</div>
        </div>
      </div>
      <div class="perf"></div>
      <div class="stub-body">
        <div class="stub-grid">
          <div class="stub-field"><div class="k">Học viên</div><div class="v">${t.name}</div></div>
          <div class="stub-field"><div class="k">Ngày gửi</div><div class="v">${t.date}</div></div>
          <div class="stub-field"><div class="k">Email</div><div class="v">${t.email}</div></div>
          <div class="stub-field"><div class="k">Số điện thoại</div><div class="v">${t.phone}</div></div>
        </div>
        <div class="stub-desc">
          <span class="lbl">${t.title}</span>
          ${t.message}
        </div>
      </div>
    </div>
  `;
}

function renderThreadItems(t){
  return activeMessages.map(h => {
    if(h.type === "status"){
      return `<div class="status-divider">${h.text} • ${formatTime(h.createdAt)}</div>`;
    }
    const isStudent = h.from === "student";
    const initials = isStudent ? (t.name.trim().split(" ").pop()[0] || "HV") : "CS";
    return `
      <div class="msg-row ${isStudent ? 'student' : 'cs'}">
        <div class="avatar">${initials}</div>
        <div class="bubble-wrap">
          <div class="bubble">${h.text}</div>
          <div class="msg-meta"><span class="who">${h.who}</span> • ${formatTime(h.createdAt)}</div>
        </div>
      </div>
    `;
  }).join("");
}

function renderThread(t){
  const threadEl = document.getElementById("threadEl");
  if(!threadEl) return;
  threadEl.innerHTML = renderStubCard(t) + `<div class="status-divider">Bắt đầu trao đổi</div>` +
    (activeMessages.length === 0
      ? `<div class="empty-list">Chưa có tin nhắn nào.<br>Hãy nhắn cho Customer Success để được hỗ trợ.</div>`
      : renderThreadItems(t));
  scrollThreadToBottom();
}

function renderMain(){
  const t = getTicket(activeId);
  if(!t){
    mainEl.innerHTML = `
      <div class="no-ticket">
        ${svgIcon('chat')}
        <p>${ticketsLoaded ? 'Chọn một phiếu ở danh sách bên trái để xem lịch sử trao đổi.' : 'Đang tải dữ liệu...'}</p>
      </div>`;
    return;
  }

  mainEl.innerHTML = `
    <div class="chat-header">
      <div class="ch-left">
        <h2>${t.title}</h2>
        <p>${t.name} · ${t.email}</p>
      </div>
      ${statusPill(t.status)}
    </div>
    <div class="thread" id="threadEl"></div>
    <div class="composer">
      <div class="composer-box">
        <button class="icon-btn" id="attachBtn" title="Đính kèm tệp">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21.44 11.05l-9.19 9.19a5 5 0 0 1-7.07-7.07l9.19-9.19a3.5 3.5 0 0 1 4.95 4.95l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
        </button>
        <input type="file" id="attachInput" style="display:none">
        <textarea id="msgInput" rows="1" placeholder="Nhập nội dung trao đổi..."></textarea>
        <button class="icon-btn send-btn" id="sendBtn" title="Gửi">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>
        </button>
      </div>
      <div class="attach-name" id="attachName"></div>
    </div>
  `;

  renderThread(t);

  const attachInput = document.getElementById("attachInput");
  const attachName = document.getElementById("attachName");
  document.getElementById("attachBtn").addEventListener("click", () => attachInput.click());
  attachInput.addEventListener("change", () => {
    attachName.textContent = attachInput.files[0] ? "📎 " + attachInput.files[0].name : "";
  });

  const msgInput = document.getElementById("msgInput");
  msgInput.addEventListener("input", () => {
    msgInput.style.height = "auto";
    msgInput.style.height = Math.min(msgInput.scrollHeight, 120) + "px";
  });
  msgInput.addEventListener("keydown", (e) => {
    if(e.key === "Enter" && !e.shiftKey){ e.preventDefault(); sendMessage(t); }
  });
  document.getElementById("sendBtn").addEventListener("click", () => sendMessage(t));
}

function sendMessage(t){
  const input = document.getElementById("msgInput");
  const attachInput = document.getElementById("attachInput");
  const attachName = document.getElementById("attachName");
  const sendBtn = document.getElementById("sendBtn");
  let text = input.value.trim();
  if(attachInput.files[0]) text = (text ? text + " " : "") + "📎 " + attachInput.files[0].name;
  if(!text) return;

  sendBtn.disabled = true;
  const ticketRef = db.collection("tickets").doc(t.id);

  ticketRef.collection("messages").add({
    type: "message",
    from: "student",
    who: t.name,
    text: text,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  }).then(() => {
    return ticketRef.set({
      lastMessage: text,
      lastMessageAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  }).then(() => {
    input.value = ""; input.style.height = "auto";
    attachInput.value = ""; attachName.textContent = "";
  }).catch((err) => {
    console.error("Không thể gửi tin nhắn:", err);
    alert("Gửi tin nhắn thất bại. Vui lòng kiểm tra kết nối và thử lại.");
  }).finally(() => {
    sendBtn.disabled = false;
  });
}

function scrollThreadToBottom(){
  const el = document.getElementById("threadEl");
  if(el) el.scrollTop = el.scrollHeight;
}

document.getElementById("searchInput").addEventListener("input", (e) => {
  searchTerm = e.target.value; renderList();
});
document.querySelectorAll(".filter-chip").forEach(c => {
  c.addEventListener("click", () => {
    document.querySelectorAll(".filter-chip").forEach(x => x.classList.remove("active"));
    c.classList.add("active");
    activeFilter = c.dataset.filter;
    renderList();
  });
});

backBtn.addEventListener("click", () => bodyEl.classList.remove("show-chat"));
function syncBackBtn(){
  if(window.innerWidth <= 860) backBtn.classList.add("visible");
  else backBtn.classList.remove("visible");
}
window.addEventListener("resize", syncBackBtn);
syncBackBtn();

renderList();
renderMain();