
   const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
  };
  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();

  /* ---------- Icon theo loại yêu cầu ---------- */
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
  
  /* ---------- Trạng thái xử lý ---------- */
  const STATUS_FLOW = ["open", "in_progress", "resolved", "closed"];
  const STATUS_META = {
    open:        { label:"Open",        color:"var(--st-open)",     soft:"var(--st-open-soft)" },
    in_progress: { label:"In Progress", color:"var(--st-progress)", soft:"var(--st-progress-soft)" },
    resolved:    { label:"Resolved",    color:"var(--st-resolved)", soft:"var(--st-resolved-soft)" },
    closed:      { label:"Closed",      color:"var(--st-closed)",   soft:"var(--st-closed-soft)" }
  };
  // Phiếu tạo từ form gửi ticket có status mặc định "pending" -> quy về "open"
  function normalizeStatus(s){
    if (!s || s === "pending") return "open";
    return STATUS_META[s] ? s : "open";
  }
  
  /* ---------- Ngày giờ trên masthead ---------- */
  function todayLabel(){
    const d = new Date();
    return d.toLocaleDateString('vi-VN', { weekday:'long', day:'2-digit', month:'2-digit', year:'numeric' });
  }
  document.getElementById('todayStr').textContent = todayLabel();
  
  /* ---------- State ---------- */
  let allTickets = [];
  let currentFilter = "all";
  let searchTerm = "";
  let selectedTicketId = null;
  let unsubNotes = null;
  let currentStaff = localStorage.getItem("cs_staff_name") || "";

  /* ---------- Overview stat bar ---------- */
  function renderOverview(){
    const bar = document.getElementById("overviewBar");
    const counts = { open:0, in_progress:0, resolved:0, closed:0 };
    allTickets.forEach(t => counts[normalizeStatus(t.status)]++);
    bar.innerHTML = STATUS_FLOW.map(key => {
      const meta = STATUS_META[key];
      const active = currentFilter === key ? "active" : "";
      return `
        <div class="stat ${active}" style="--s-color:${meta.color}" data-status="${key}">
          <span class="stat-name">${meta.label}</span>
          <span class="stat-count">${counts[key]}</span>
        </div>`;
    }).join("");
    bar.querySelectorAll(".stat").forEach(el => {
      el.addEventListener("click", () => {
        currentFilter = currentFilter === el.dataset.status ? "all" : el.dataset.status;
        renderOverview(); renderFilterTabs(); renderList();
      });
    });
  }
  
  /* ---------- Filter tabs ---------- */
  function renderFilterTabs(){
    const wrap = document.getElementById("filterTabs");
    const tabs = [{key:"all", label:"Tất cả"}, ...STATUS_FLOW.map(k => ({key:k, label:STATUS_META[k].label}))];
    wrap.innerHTML = tabs.map(t => `<button class="${currentFilter===t.key?'active':''}" data-status="${t.key}">${t.label}</button>`).join("");
    wrap.querySelectorAll("button").forEach(btn => {
      btn.addEventListener("click", () => {
        currentFilter = btn.dataset.status;
        renderOverview(); renderFilterTabs(); renderList();
      });
    });
  }
  
  /* ---------- Search ---------- */
  document.getElementById("searchInput").addEventListener("input", (e) => {
    searchTerm = e.target.value.trim().toLowerCase();
    renderList();
  });
  
  /* ---------- Thời gian ---------- */
  function relativeTime(ts){
    if (!ts || !ts.toDate) return "";
    const min = Math.floor((Date.now() - ts.toDate().getTime()) / 60000);
    if (min < 1) return "vừa xong";
    if (min < 60) return `${min} phút trước`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr} giờ trước`;
    const day = Math.floor(hr / 24);
    if (day < 7) return `${day} ngày trước`;
    return ts.toDate().toLocaleDateString('vi-VN');
  }
  function fullTime(ts){ return (ts && ts.toDate) ? ts.toDate().toLocaleString('vi-VN') : "—"; }
  function escapeHtml(str){ const d = document.createElement("div"); d.textContent = str || ""; return d.innerHTML; }
  
  /* ---------- Render ticket list ---------- */
  function renderList(){
    const listEl = document.getElementById("ticketList");
    let items = allTickets.filter(t => {
      const st = normalizeStatus(t.status);
      if (currentFilter !== "all" && st !== currentFilter) return false;
      if (searchTerm){
        const hay = `${t.ticket_num||''} ${t.name||''} ${t.email||''} ${t.title||''}`.toLowerCase();
        if (!hay.includes(searchTerm)) return false;
      }
      return true;
    });
  
    document.getElementById("listCount").textContent = `${items.length} phiếu`;
  
    if (items.length === 0){
      listEl.innerHTML = `<div class="empty-list">Không có ticket nào khớp với bộ lọc hiện tại.</div>`;
      return;
    }
  
    listEl.innerHTML = items.map(t => {
      const st = normalizeStatus(t.status);
      const meta = STATUS_META[st];
      const selected = t.id === selectedTicketId ? "selected" : "";
      const assignee = t.assignee
        ? `<span class="assignee-chip"><span class="a-dot">${initials(t.assignee)}</span>${escapeHtml(t.assignee)}</span>`
        : `<span class="assignee-chip">Chưa phân công</span>`;
      return `
        <div class="ticket-row ${selected}" data-id="${t.id}">
          <div class="ticon">${svgIcon(t.icon)}</div>
          <div class="tbody">
            <div class="trow-top">
              <span class="tnum">${escapeHtml(t.ticket_num || t.id)}</span>
              <span class="ttime">${relativeTime(t.createdAt)}</span>
            </div>
            <div class="ttitle">${escapeHtml(t.title || '(Không có tiêu đề)')}</div>
            <div class="tmeta">
              <span class="badge" style="--s-color:${meta.color}; --s-soft:${meta.soft}"><span class="d"></span>${meta.label}</span>
              ${assignee}
            </div>
          </div>
        </div>`;
    }).join("");
  
    listEl.querySelectorAll(".ticket-row").forEach(row => {
      row.addEventListener("click", () => selectTicket(row.dataset.id));
    });
  }
  
  /* ---------- Select & render detail ---------- */
  function selectTicket(id){
    selectedTicketId = id;
    renderList();
    const t = allTickets.find(x => x.id === id);
    if (!t) return;
  
    document.getElementById("detailEmpty").style.display = "none";
    const content = document.getElementById("detailContent");
    content.style.display = "flex";
    content.style.flexDirection = "column";
  
    const st = normalizeStatus(t.status);
  
    content.innerHTML = `
      <button class="back-btn" id="backBtn"><svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg> Danh sách</button>
  
      <div class="stub-top">
        <div class="k1">Mã yêu cầu</div>
        <div class="num">${escapeHtml(t.ticket_num || t.id)}</div>
        <div class="row2">
          <div class="cat">${svgIcon(t.icon)}<span>${escapeHtml(t.ticket_type || '')}</span></div>
          <div class="who">${escapeHtml(t.name || '')} · ${t.date || ''}</div>
        </div>
      </div>
      <div class="perf"></div>
  
      <div class="detail-scroll">
  
        <div class="section-title"><span class="idx">01</span> Trạng thái xử lý</div>
        <p class="section-desc">Cập nhật trạng thái ticket khi tiếp nhận và xử lý.</p>
        <div class="status-stepper" id="statusStepper">
          ${STATUS_FLOW.map(key => {
            const m = STATUS_META[key];
            const cur = key === st ? "current" : "";
            return `<button class="${cur}" data-status="${key}" style="--s-color:${m.color}; --s-soft:${m.soft}"><span class="d"></span>${m.label}</button>`;
          }).join("")}
        </div>
  
        <hr class="divider">
  
        <div class="section-title"><span class="idx">02</span> Nội dung yêu cầu</div>
        <p class="section-desc">Tiêu đề: <strong style="color:var(--maroon-deep)">${escapeHtml(t.title || '(Không có tiêu đề)')}</strong></p>
        <div class="desc-box">${escapeHtml(t.message || '(Không có mô tả)')}</div>
  
        <hr class="divider">
  
        <div class="section-title"><span class="idx">03</span> Phân công &amp; thông tin liên hệ</div>
        <p class="section-desc">Chọn người phụ trách xử lý ticket này.</p>
        <div class="assign-row" style="margin-bottom:16px;">
          <select id="assigneeSelect">
            <option value="">Chưa phân công</option>
            ${STAFF.map(n => `<option value="${n}" ${t.assignee===n?'selected':''}>${n}</option>`).join("")}
          </select>
          <button class="btn-outline" id="assignMeBtn" ${currentStaff ? '' : 'disabled'}>Nhận xử lý</button>
        </div>
        <div class="info-grid">
          <div class="info-row"><div class="k">Email</div><div class="v">${escapeHtml(t.email || '—')}</div></div>
          <div class="info-row"><div class="k">Điện thoại</div><div class="v">${escapeHtml(t.phone || '—')}</div></div>
          <div class="info-row"><div class="k">Khóa học</div><div class="v">${escapeHtml(t.course || 'Không có')}</div></div>
          <div class="info-row"><div class="k">Ngày gửi</div><div class="v">${escapeHtml(t.date || '—')}</div></div>
          <div class="info-row"><div class="k">Tạo lúc</div><div class="v">${fullTime(t.createdAt)}</div></div>
          <div class="info-row"><div class="k">Cập nhật lúc</div><div class="v">${t.updatedAt ? fullTime(t.updatedAt) : '—'}</div></div>
        </div>
  
        <hr class="divider">
  
        <div class="section-title"><span class="idx">04</span> Trao đổi &amp; ghi chú xử lý</div>
        <p class="section-desc">Ghi chú nội bộ và cập nhật gửi cho học viên đều lưu tại đây.</p>
        <div class="thread" id="threadEl"><div class="thread-empty">Đang tải...</div></div>
        <div class="note-form">
          <textarea id="noteInput" placeholder="${currentStaff ? 'Thêm ghi chú xử lý hoặc phản hồi cho học viên...' : 'Chọn tên nhân viên CS ở góc trên bên phải trước khi ghi chú...'}" ${currentStaff ? '' : 'disabled'}></textarea>
          <div class="note-form-actions">
            <button class="btn-submit" id="sendNoteBtn" ${currentStaff ? '' : 'disabled'}>Gửi ghi chú</button>
          </div>
        </div>
  
      </div>
    `;
  
    content.querySelectorAll("#statusStepper button").forEach(btn => {
      btn.addEventListener("click", () => updateTicketStatus(t.id, btn.dataset.status));
    });
    document.getElementById("assigneeSelect").addEventListener("change", (e) => updateTicketAssignee(t.id, e.target.value));
    document.getElementById("assignMeBtn").addEventListener("click", () => { if (currentStaff) updateTicketAssignee(t.id, currentStaff); });
  
    const backBtn = document.getElementById("backBtn");
    if (backBtn) backBtn.addEventListener("click", () => {
      document.getElementById("listPane").classList.remove("has-selection");
      document.getElementById("detailPane").classList.remove("show");
    });
    document.getElementById("listPane").classList.add("has-selection");
    document.getElementById("detailPane").classList.add("show");
  
    loadNotesThread(t.id);
    document.getElementById("sendNoteBtn").addEventListener("click", () => sendNote(t.id));
  }
  
  /* ---------- Status & assignment updates ---------- */
  function updateTicketStatus(id, newStatus){
    db.collection("tickets").doc(id).update({
      status: newStatus,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
      logSystemNote(id, `Trạng thái chuyển sang "${STATUS_META[newStatus].label}"${currentStaff ? ' bởi ' + currentStaff : ''}.`);
    }).catch(err => console.error("Không thể cập nhật trạng thái:", err));
  }
  function updateTicketAssignee(id, assignee){
    db.collection("tickets").doc(id).update({
      assignee: assignee || firebase.firestore.FieldValue.delete(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
      logSystemNote(id, assignee ? `Đã phân công cho ${assignee}.` : `Đã bỏ phân công.`);
    }).catch(err => console.error("Không thể cập nhật phân công:", err));
  }
  
  /* ---------- Notes thread (subcollection tickets/{id}/notes) ---------- */
  function loadNotesThread(id){
    if (unsubNotes) { unsubNotes(); unsubNotes = null; }
    const threadEl = document.getElementById("threadEl");
    unsubNotes = db.collection("tickets").doc(id).collection("notes").orderBy("createdAt", "asc")
      .onSnapshot(snap => {
        if (snap.empty){
          threadEl.innerHTML = `<div class="thread-empty">Chưa có trao đổi nào cho ticket này.</div>`;
          return;
        }
        threadEl.innerHTML = snap.docs.map(doc => {
          const n = doc.data();
          const isSystem = n.type === "system";
          return `
            <div class="note ${isSystem ? 'system' : ''}">
              <div class="a-dot">${isSystem ? '•' : initials(n.author)}</div>
              <div class="note-body">
                <div class="note-head"><span class="note-author">${escapeHtml(n.author || 'Hệ thống')}</span><span class="note-time">${fullTime(n.createdAt)}</span></div>
                <div class="note-text">${escapeHtml(n.text || '')}</div>
              </div>
            </div>`;
        }).join("");
        threadEl.scrollTop = threadEl.scrollHeight;
      }, err => {
        console.error("Không thể tải trao đổi:", err);
        threadEl.innerHTML = `<div class="thread-empty" style="color:var(--maroon-soft)">Không thể tải trao đổi. Kiểm tra cấu hình Firestore.</div>`;
      });
  }
  function sendNote(id){
    const input = document.getElementById("noteInput");
    const text = input.value.trim();
    if (!text || !currentStaff) return;
    const btn = document.getElementById("sendNoteBtn");
    btn.disabled = true;
    db.collection("tickets").doc(id).collection("notes").add({
      author: currentStaff, text: text, type: "note",
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => { input.value = ""; })
      .catch(err => console.error("Không thể gửi ghi chú:", err))
      .finally(() => { btn.disabled = false; });
  }
  function logSystemNote(id, text){
    db.collection("tickets").doc(id).collection("notes").add({
      author: "Hệ thống", text: text, type: "system",
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).catch(err => console.warn("Không thể ghi log hệ thống:", err));
  }
  
  /* ---------- Realtime ticket listener ---------- */
  const connDot = document.getElementById("connDot");
  const connLabel = document.getElementById("connLabel");
  
  db.collection("tickets").orderBy("createdAt", "desc").onSnapshot(snap => {
    connDot.classList.add("live");
    connLabel.textContent = "Realtime";
    allTickets = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderOverview();
    renderList();
    if (selectedTicketId && allTickets.find(t => t.id === selectedTicketId)) selectTicket(selectedTicketId);
  }, err => {
    connDot.classList.remove("live");
    connLabel.textContent = "Mất kết nối";
    console.error("Firestore error:", err);
    document.getElementById("ticketList").innerHTML = `<div class="empty-list">Không thể tải dữ liệu. Kiểm tra cấu hình Firebase ở đầu file.</div>`;
  });
  
  /* ---------- Initial render ---------- */
  renderOverview();
  renderFilterTabs();