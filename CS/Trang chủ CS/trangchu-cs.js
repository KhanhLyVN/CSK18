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
const svgIcon = (key) => `<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[key] || ICONS.other}</svg>`;
const STATUS_META = {
  open:        { label: "Đang mở",        color: "#B08A4E" },
  in_progress: { label: "Đang xử lý",     color: "#5D0703" },
  resolved:    { label: "Đã giải quyết",   color: "#4C6B3C" },
  closed:      { label: "Đã đóng",         color: "#8A7A6D" }
};
function normalizeStatus(statusValue){
  if (!statusValue || statusValue === "pending") return "open";
  return STATUS_META[statusValue] ? statusValue : "open";
}
function statusPill(statusKey){
  const normalizedKey = normalizeStatus(statusKey);
  const s = STATUS_META[normalizedKey] || STATUS_META.open;
  return `<span class="status-tag" style="background:${s.color}22; color:${s.color};">
    <span class="dot" style="background:${s.color};"></span>${s.label}
  </span>`;
}
function todayLabel(){
  const d = new Date();
  return d.toLocaleDateString('vi-VN', { weekday:'long', day:'2-digit', month:'2-digit', year:'numeric' });
}
document.getElementById('todayStr').textContent = todayLabel();
function greetingByHour(){
  const h = new Date().getHours();
  if(h < 11) return "Chào buổi sáng";
  if(h < 13) return "Chào buổi trưa";
  if(h < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}
document.getElementById('greetingLine').textContent =
  `${greetingByHour()} — đây là tổng quan các yêu cầu hỗ trợ từ học viên hiện có trên hệ thống.`;
function getTicketNum(ticket) {
  return ticket.ticketNum || ticket.id;
}
const TICKET_CATEGORY_LABELS = {
  system: "Hệ thống",
  learning: "Khóa học",
  account: "Tài khoản",
  other: "Khác",
  "system-login": "Đăng nhập / xác thực",
  "system-course": "Khóa học / lịch học",
  "system-payment": "Thanh toán / học phí",
  "system-technical": "Lỗi kỹ thuật / trang web",
  "system-other": "Khác",
  "learning-schedule": "Lịch học / buổi học",
  "learning-material": "Tài liệu / bài học",
  "learning-assignment": "Bài tập / kiểm tra",
  "learning-mentor": "Mentor / giảng viên",
  "learning-other": "Khác",
  "account-profile": "Thông tin tài khoản",
  "account-password": "Mật khẩu / truy cập",
  "account-payment": "Học phí / thanh toán",
  "account-certificate": "Chứng chỉ / hồ sơ",
  "account-other": "Khác",
  "other-feedback": "Góp ý / phản hồi",
  "other-complaint": "Khiếu nại",
  "other-request": "Yêu cầu hỗ trợ khác"
};
function resolveTicketLabel(value) {
  if (!value) return "Khác";
  const normalized = String(value).trim();
  return TICKET_CATEGORY_LABELS[normalized] || normalized;
}
function getTicketType(ticket) {
  const category = resolveTicketLabel(ticket.ticketCategory || ticket.category || ticket.ticketType);
  const issue = resolveTicketLabel(ticket.ticketIssue || ticket.issue || ticket.detail || ticket.type);
  if (category && issue && issue !== category) return `${category} · ${issue}`;
  return issue || category || "Khác";
}
function getTicketTitle(ticket) {
  return ticket.title || "Không có tiêu đề";
}
function getStudentName(ticket) {
  return ticket.name || "Học viên";
}
function getTicketStatus(ticket) {
  return ticket.status || "open";
}
db.collection("tickets")
  .orderBy("createdAt", "desc")
  .onSnapshot((snapshot) => {
    const tickets = [];
    snapshot.forEach((docSnap) => {
      tickets.push({
        id: docSnap.id,
        ...docSnap.data()
      });
    });
    renderDashboard(tickets);
  }, (error) => {
    console.error("Lỗi khi đọc dữ liệu Firestore:", error);
    document.getElementById("recentList").innerHTML = `
      <div class="empty-note">
        Không thể kết nối cơ sở dữ liệu. Vui lòng kiểm tra lại cấu hình Firebase.
      </div>
    `;
  });
function renderDashboard(tickets){
  renderStats(tickets);
  renderUnanswered(tickets);
  renderTypeBreakdown(tickets);
  renderRecent(tickets);
}
function renderStats(tickets){
  const counts = { open:0, in_progress:0, resolved:0, closed:0 };
  tickets.forEach(t => {
    const st = normalizeStatus(t.status);
    if (counts[st] !== undefined) counts[st]++;
  });
  document.getElementById('statAll').textContent = tickets.length;
  document.getElementById('statOpen').textContent = counts.open;
  document.getElementById('statProgress').textContent = counts.in_progress;
  document.getElementById('statResolved').textContent = counts.resolved;
  document.getElementById('statClosed').textContent = counts.closed;
}
function renderUnanswered(tickets){
  // Lọc các ticket chưa đóng và có trạng thái open hoặc in_progress chưa có phản hồi từ CS
  const list = tickets.filter(t => normalizeStatus(t.status) === 'open' || normalizeStatus(t.status) === 'in_progress');
  document.getElementById('unansweredCount').textContent = list.length;
  const el = document.getElementById('unansweredList');
  if(list.length === 0){
    el.innerHTML = `<div class="empty-note">Tuyệt vời! Không có ticket nào đang chờ xử lý. 🎉</div>`;
    return;
  }
  el.innerHTML = list.slice(0, 10).map(t => {
    const tNum = getTicketNum(t);
    return `
      <a class="mini-item" href="trao-doi-ticket.html?ticket=${encodeURIComponent(tNum)}">
        <div class="mi-top">
          <span class="mi-num">${escapeHtml(tNum)}</span>
          <span class="mi-date">${t.date || 'Hôm nay'}</span>
        </div>
        <div class="mi-title">${escapeHtml(t.title || 'Không có tiêu đề')}</div>
        <div class="mi-name">${escapeHtml(t.name || 'Học viên')} · <strong style="color:var(--maroon)">${escapeHtml(getTicketType(t))}</strong></div>
      </a>
    `;
  }).join("");
}
function renderTypeBreakdown(tickets){
  const counts = {};
  tickets.forEach(t => {
    const key = getTicketType(t);
    counts[key] = (counts[key] || 0) + 1;
  });
  const entries = Object.entries(counts).sort((a,b) => b[1]-a[1]);
  const max = entries.length ? entries[0][1] : 1;
  const el = document.getElementById('typeBarList');
  if(entries.length === 0){
    el.innerHTML = `<div class="empty-note">Chưa có dữ liệu phân loại.</div>`;
    return;
  }
  el.innerHTML = entries.map(([label, count]) => `
    <div class="bar-row">
      <div class="br-top">
        <span class="br-label">${escapeHtml(label)}</span>
        <span class="br-count">${count} phiếu</span>
      </div>
      <div class="bar-track"><div class="bar-fill" style="width:${Math.round(count/max*100)}%"></div></div>
    </div>
  `).join("");
}
function renderRecent(tickets){
  document.getElementById('recentCount').textContent = tickets.length;
  const el = document.getElementById('recentList');
  const recent = tickets.slice(0, 10);
  const head = `
    <div class="recent-row head">
      <span>Mã ticket</span>
      <span>Tiêu đề &amp; Học viên</span>
      <span>Loại yêu cầu</span>
      <span>Ngày gửi</span>
      <span>Trạng thái</span>
    </div>
  `;
  if(recent.length === 0){
    el.innerHTML = head + `<div class="empty-note">Chưa có phiếu yêu cầu nào trên hệ thống.</div>`;
    return;
  }
  el.innerHTML = head + recent.map(t => {
    const tNum = getTicketNum(t);
    const tType = getTicketType(t);
    return `
      <a class="recent-row" href="trao-doi-ticket.html?ticket=${encodeURIComponent(tNum)}">
        <span class="rc-num">${escapeHtml(tNum)}</span>
        <span class="rc-title">${escapeHtml(t.title || 'Không tiêu đề')}<span class="rc-sub">${escapeHtml(t.name || 'Ẩn danh')}</span></span>
        <span class="rc-type">${svgIcon(t.icon)}${escapeHtml(tType)}</span>
        <span class="rc-date">${t.date || '—'}</span>
        ${statusPill(t.status)}
      </a>
    `;
  }).join("");
}
function escapeHtml(str){
  const d = document.createElement("div");
  d.textContent = str || "";
  return d.innerHTML;
}
// Tương tác click thẻ thống kê → lọc sang trang trao đổi
document.querySelectorAll('.stat-card').forEach(card => {
  card.addEventListener('click', () => {
    const filter = card.dataset.filter || 'all';
    const status = card.dataset.status;
    let url = `trao-doi-ticket.html?filter=${encodeURIComponent(filter)}`;
    if(status) url += `&status=${encodeURIComponent(status)}`;
    window.location.href = url;
  });
});
// Tìm nhanh theo mã ticket
const quickFindInput = document.getElementById('quickFindInput');
const quickFindBtn = document.getElementById('quickFindBtn');
const quickFindErr = document.getElementById('quickFindErr');
function goToTicket(){
  const val = quickFindInput.value.trim();
  if(!val){
    quickFindErr.textContent = 'Vui lòng nhập mã ticket cần tìm.';
    quickFindErr.classList.add('show');
    return;
  }
  quickFindErr.classList.remove('show');
  window.location.href = `trao-doi-ticket.html?ticket=${encodeURIComponent(val)}`;
}
quickFindBtn.addEventListener('click', goToTicket);
quickFindInput.addEventListener('keydown', (e) => {
  if(e.key === 'Enter'){ e.preventDefault(); goToTicket(); }
});
