(function () {
    "use strict";
    const auth = firebase.auth();
    const db = firebase.firestore();
    const state = { user: null, groups: [], selected: null, users: [], tickets: [], timer: null };
    const $ = (id) => document.getElementById(id);
    const esc = (value) => { const node = document.createElement("div"); node.textContent = value == null ? "" : String(value); return node.innerHTML; };
    const initials = (name, email) => String(name || email || "?").trim().split(/\s+/).filter(Boolean).slice(-2).map((part) => part[0]).join("").toUpperCase() || "?";
    const toast = (message, error = false) => { const node = $("groupToast"); node.textContent = message; node.className = `toast show${error ? " error" : ""}`; clearTimeout(state.timer); state.timer = setTimeout(() => { node.className = "toast"; }, 3200); };
    const roleMatches = (value) => ["leader", "cs_leader", "team_leader", "group_leader", "manager", "cs_manager"].includes(String(value || "").trim().toLowerCase().replace(/[\s-]+/g, "_"));
  
    function groupMembers(group) {
      const byUid = new Map();
      (group.members || []).forEach((member) => { if (member && (member.uid || member.id)) byUid.set(member.uid || member.id, member); });
      (group.memberIds || []).forEach((uid) => { if (!byUid.has(uid)) { const found = state.users.find((item) => item.uid === uid); if (found) byUid.set(uid, found); } });
      if (group.leaderUid && !byUid.has(group.leaderUid)) byUid.set(group.leaderUid, { uid: group.leaderUid, name: group.leaderName, email: group.leaderEmail, isLeader: true });
      return [...byUid.values()];
    }
    function belongsToGroup(ticket, group) {
      return ticket.groupId === group.id || (group.code && (ticket.groupCode === group.code || ticket.departmentCode === group.code));
    }
    function openTickets(group) { return state.tickets.filter((ticket) => belongsToGroup(ticket, group) && !["closed", "resolved"].includes(String(ticket.status || "").toLowerCase())); }
    function memberLoad(member, group) { return openTickets(group).filter((ticket) => ticket.assigneeUid === member.uid).length; }
  
    function renderGroups() {
      $("groupCount").textContent = `${state.groups.length} nhóm`;
      $("groupList").innerHTML = state.groups.length ? state.groups.map((group) => `<button class="group-choice ${state.selected?.id === group.id ? "active" : ""}" type="button" data-group-id="${esc(group.id)}"><strong>${esc(group.name || "Nhóm chưa đặt tên")}</strong><small>${esc(group.description || "Chưa có mô tả")}</small>${group.code ? `<span>${esc(group.code)}</span>` : ""}</button>`).join("") : '<div class="group-empty">Bạn chưa được Admin giao làm Leader cho nhóm nào.</div>';
    }
    function renderWorkspace() {
      const group = state.selected;
      if (!group) { $("workspace").innerHTML = '<div class="group-empty">Chọn nhóm ở cột bên trái để bắt đầu điều phối công việc.</div>'; return; }
      const members = groupMembers(group);
      const tickets = openTickets(group);
      const unassigned = tickets.filter((ticket) => !ticket.assigneeUid).length;
      $("workspace").innerHTML = `<div class="workspace-top"><div><h2>${esc(group.name || "Nhóm chưa đặt tên")}</h2><p>${esc(group.description || "Leader điều phối thành viên và ticket của nhóm tại đây.")}</p></div>${group.code ? `<span class="group-code">${esc(group.code)}</span>` : ""}</div><div class="summary-grid"><article class="summary-card"><small>Thành viên</small><strong>${members.length}</strong><span>Người trong nhóm đang làm việc</span></article><article class="summary-card"><small>Ticket đang xử lý</small><strong>${tickets.length}</strong><span>Ticket đã thuộc nhóm này</span></article><article class="summary-card"><small>Chờ phân công</small><strong>${unassigned}</strong><span>Cần chọn người phụ trách</span></article></div><section class="section"><div class="section-head"><div><h3>Thành viên và tải công việc</h3><p>Thêm hoặc bớt CS trong nhóm. Số badge thể hiện ticket đang được giao.</p></div><button class="btn btn-soft" id="manageMembers"><span class="material-symbols-rounded">group_add</span>Quản lý thành viên</button></div><div class="member-grid">${members.length ? members.map((member) => `<article class="member-card"><span class="member-avatar">${esc(initials(member.name, member.email))}</span><div><strong>${esc(member.name || "Chưa có tên")}${member.uid === group.leaderUid ? " · Leader" : ""}</strong><small>${esc(member.email || "")}</small></div><span class="member-load">${memberLoad(member, group)} ticket</span></article>`).join("") : '<div class="notice">Nhóm chưa có thành viên. Hãy thêm CS để bắt đầu phân công ticket.</div>'}</div></section><section class="section" id="phan-cong"><div class="section-head"><div><h3>Phân công ticket</h3><p>Chọn CS phụ trách từng ticket. Hệ thống lưu người được giao và thời điểm phân công.</p></div><button class="btn btn-soft" id="reloadTickets"><span class="material-symbols-rounded">refresh</span>Làm mới</button></div><div id="assignmentList" class="assignment-list"><div class="notice">Đang tải ticket…</div></div></section>`;
      $("manageMembers").addEventListener("click", openMemberModal);
      $("reloadTickets").addEventListener("click", () => loadTickets(group));
      renderAssignments();
    }
    function renderAssignments() {
      const group = state.selected; const holder = $("assignmentList"); if (!group || !holder) return;
      const members = groupMembers(group); const tickets = openTickets(group);
      if (!members.length) { holder.innerHTML = '<div class="notice">Hãy thêm thành viên trước khi phân công ticket.</div>'; return; }
      if (!tickets.length) { holder.innerHTML = '<div class="notice">Chưa có ticket nào thuộc nhóm này. Khi bạn chuyển một ticket vào nhóm trong luồng quản lý ticket, ticket sẽ xuất hiện tại đây để phân công.</div>'; return; }
      holder.innerHTML = tickets.map((ticket) => `<article class="assignment-row"><div><strong>${esc(ticket.title || ticket.subject || ticket.ticketCode || "Ticket chưa có tiêu đề")}</strong><small>${esc(ticket.category || "Chưa phân loại")} · ${esc(ticket.status || "open")}</small></div><select data-ticket-id="${esc(ticket.id)}"><option value="">Chọn người phụ trách</option>${members.map((member) => `<option value="${esc(member.uid)}" ${ticket.assigneeUid === member.uid ? "selected" : ""}>${esc(member.name || member.email || "CS")}</option>`).join("")}</select><button class="btn btn-primary" data-save-ticket="${esc(ticket.id)}">Lưu phân công</button></article>`).join("");
      holder.querySelectorAll("[data-save-ticket]").forEach((button) => button.addEventListener("click", () => assignTicket(button.dataset.saveTicket)));
    }
    async function assignTicket(ticketId) {
      const group = state.selected; const select = document.querySelector(`select[data-ticket-id="${CSS.escape(ticketId)}"]`); const uid = select?.value; const member = groupMembers(group).find((item) => item.uid === uid); if (!member) { toast("Vui lòng chọn CS phụ trách.", true); return; }
      const button = document.querySelector(`[data-save-ticket="${CSS.escape(ticketId)}"]`); button.disabled = true;
      try { await db.collection("tickets").doc(ticketId).set({ groupId: group.id, groupName: group.name || "", groupCode: group.code || "", assigneeUid: member.uid, assigneeName: member.name || "", assigneeEmail: member.email || "", assignedByUid: state.user.uid, assignedByName: state.user.name || state.user.email || "", assignedAt: firebase.firestore.FieldValue.serverTimestamp(), updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true }); toast(`Đã phân công ticket cho ${member.name || member.email}.`); await loadTickets(group); } catch (error) { console.error(error); toast("Không thể lưu phân công. Kiểm tra quyền Firestore.", true); } finally { button.disabled = false; }
    }
    async function loadTickets(group) {
      const holder = $("assignmentList"); if (holder) holder.innerHTML = '<div class="notice">Đang tải ticket…</div>';
      try { const snapshot = await db.collection("tickets").limit(300).get(); state.tickets = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })).filter((ticket) => belongsToGroup(ticket, group)); renderWorkspace(); } catch (error) { console.error(error); if (holder) holder.innerHTML = '<div class="notice">Không thể tải ticket. Kiểm tra quyền Firestore.</div>'; }
    }
    function openMemberModal() {
      const group = state.selected; const members = new Set(groupMembers(group).map((item) => item.uid));
      $("memberPicker").innerHTML = state.users.length ? state.users.map((user) => `<label class="pick-row"><input type="checkbox" value="${esc(user.uid)}" ${members.has(user.uid) ? "checked" : ""} ${user.uid === group.leaderUid ? "disabled checked" : ""}><span class="member-avatar">${esc(initials(user.name, user.email))}</span><span>${esc(user.name || "Chưa có tên")}</span><small>${esc(user.email || "")}${user.uid === group.leaderUid ? " · Leader" : ""}</small></label>`).join("") : '<div class="group-empty">Không tải được danh sách CS.</div>';
      $("memberModal").classList.add("show"); $("memberModal").setAttribute("aria-hidden", "false");
    }
    function closeMemberModal() { $("memberModal").classList.remove("show"); $("memberModal").setAttribute("aria-hidden", "true"); }
    async function saveMembers() {
      const group = state.selected; const ids = [...document.querySelectorAll("#memberPicker input:checked")].map((input) => input.value); if (!ids.includes(group.leaderUid)) ids.push(group.leaderUid);
      const members = ids.map((uid) => state.users.find((user) => user.uid === uid) || (uid === group.leaderUid ? { uid, name: group.leaderName || "Leader", email: group.leaderEmail || "" } : null)).filter(Boolean).map((user) => ({ uid: user.uid, name: user.name || "", email: user.email || "" }));
      const button = $("saveMembers"); button.disabled = true;
      try { await db.collection("groups").doc(group.id).set({ memberIds: members.map((user) => user.uid), members, updatedAt: firebase.firestore.FieldValue.serverTimestamp(), lastActivityAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true }); group.memberIds = members.map((user) => user.uid); group.members = members; closeMemberModal(); renderWorkspace(); toast("Đã cập nhật thành viên nhóm."); } catch (error) { console.error(error); toast("Không thể cập nhật thành viên. Kiểm tra quyền Firestore.", true); } finally { button.disabled = false; }
    }
    async function loadCsUsers() { try { const snapshot = await db.collection("users").where("accountType", "==", "customer_success").get(); state.users = snapshot.docs.map((doc) => { const data = doc.data() || {}; return { uid: data.uid || doc.id, name: data.name || data.displayName || "", email: data.email || "" }; }).filter((user) => user.uid); } catch (error) { console.warn("Không thể tải danh sách CS:", error); } }
    async function loadGroups(user) { const snapshot = await db.collection("groups").where("leaderUid", "==", user.uid).get(); state.groups = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })).sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "vi")); if (!state.groups.length) { window.location.replace("/CS/homepageCS/trangchu-cs.html"); return; } state.selected = state.groups.find((group) => group.id === state.selected?.id) || state.groups[0]; renderGroups(); renderWorkspace(); loadTickets(state.selected); }
    function bindEvents() { $("groupList").addEventListener("click", (event) => { const button = event.target.closest("[data-group-id]"); if (!button) return; state.selected = state.groups.find((group) => group.id === button.dataset.groupId) || null; renderGroups(); renderWorkspace(); loadTickets(state.selected); }); $("closeMemberModal").addEventListener("click", closeMemberModal); $("memberModal").addEventListener("click", (event) => { if (event.target === $("memberModal")) closeMemberModal(); }); $("saveMembers").addEventListener("click", saveMembers); document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeMemberModal(); }); }
    auth.onAuthStateChanged(async (user) => { if (!user) { window.location.replace("/CS/login/login.html"); return; } const profile = window.csCurrentProfile || {}; const leaderByRole = roleMatches(profile.raw?.role) || roleMatches(profile.raw?.accountType) || Boolean(profile.raw?.isLeader); state.user = { uid: user.uid, name: profile.name || user.displayName || "", email: user.email || "", leaderByRole }; $("roleStatus").innerHTML = '<i></i>Đang tải quyền Leader…'; await loadCsUsers(); await loadGroups(state.user); $("roleStatus").innerHTML = '<i></i>CS Leader · Điều phối nhóm'; });
    document.addEventListener("cs:role-ready", (event) => { if (state.user) state.user.name = event.detail.name || state.user.name; });
    bindEvents();
  })();
  