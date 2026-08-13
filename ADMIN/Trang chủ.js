/* Maroon Command Desk: plain JavaScript data layer. Firebase configuration is provided by ../firebase-config.js. */
(() => {
  "use strict";

  // --- State Management ---
  const state = {
    accounts: [],
    filtered: [],
    selected: null,
    unsubscribe: null
  };

  // --- DOM Helpers ---
  const $ = (id) => document.getElementById(id);

  const dbRef = () => (typeof db !== "undefined" ? db : null);

  // --- Utility Functions ---
  function toast(message) {
    const node = $("toast");
    node.textContent = message;
    node.hidden = false;

    clearTimeout(window.__toastTimer);
    window.__toastTimer = setTimeout(() => {
      node.hidden = true;
    }, 2300);
  }

  function escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = value == null ? "" : String(value);
    return div.innerHTML;
  }

  function valueOf(item, ...keys) {
    for (const key of keys) {
      if (item && item[key] !== undefined && item[key] !== null && String(item[key]).trim()) {
        return item[key];
      }
    }
    return "";
  }

  function normalizeStatus(item) {
    const value = String(valueOf(item, "status", "accountStatus", "state") || "").toLowerCase();
    
    if (["active", "activated", "đang hoạt động", "online"].includes(value)) {
      return "active";
    }
    if (["away", "tạm vắng", "offline"].includes(value)) {
      return "away";
    }
    if (["pending", "inactive", "chưa kích hoạt", "disabled"].includes(value)) {
      return "pending";
    }
    
    return item && item.isActive === false ? "pending" : "active";
  }

  function statusLabel(status) {
    return {
      active: "Đang hoạt động",
      away: "Tạm vắng",
      pending: "Chưa kích hoạt"
    }[status] || "Chưa kích hoạt";
  }

  function accountRole(item) {
    return valueOf(item, "roleLabel", "role", "position", "accountType") || "CS cấp 1";
  }

  function isCsAccount(item) {
    const role = String(valueOf(item, "role", "roleLabel", "accountType", "department") || "").toLowerCase();
    return !role || role.includes("cs") || role.includes("customer success") || role.includes("support") || role.includes("chăm sóc");
  }

  function initials(name) {
    return String(name || "CS")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "CS";
  }

  function formatDate(value) {
    if (!value) return "—";
    if (typeof value.toDate === "function") value = value.toDate();
    
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString("vi-VN");
  }

  function formatLastActive(item) {
    const rawVal = valueOf(item, "lastActiveLabel", "lastActive", "lastLogin", "updatedAt");
    return rawVal ? formatDate(rawVal) : "Chưa đăng nhập";
  }

  function normalizeAccount(doc) {
    const item = { id: doc.id, ...doc.data() };
    const name = valueOf(item, "name", "displayName", "fullName") || "Chưa cập nhật";

    return {
      ...item,
      id: item.id,
      name,
      email: valueOf(item, "email", "mail") || "Chưa cập nhật",
      role: accountRole(item),
      status: normalizeStatus(item),
      statusText: statusLabel(normalizeStatus(item)),
      ticketLoad: Number(valueOf(item, "ticketLoad", "openTickets", "assignedTickets") || 0),
      joined: formatDate(valueOf(item, "joinedAt", "createdAt", "dateCreated")),
      lastActive: formatLastActive(item),
      avatar: initials(name)
    };
  }

  // --- Render Functions ---
  function renderStats() {
    const total = state.accounts.length;
    const active = state.accounts.filter((item) => item.status === "active").length;
    const managers = state.accounts.filter((item) => /trưởng|cấp 2|manager|lead/i.test(item.role)).length;
    const pending = state.accounts.filter((item) => item.status === "pending").length;

    $("totalCount").textContent = total;
    $("activeCount").textContent = active;
    $("managerCount").textContent = managers;
    $("pendingCount").textContent = pending;

    $("activeMeta").textContent = total ? `${Math.round((active / total) * 100)}% trên tổng đội ngũ` : "Chưa có dữ liệu";
    $("recordBadge").textContent = `${total} hồ sơ`;
    $("navCount").textContent = total;
  }

  function renderTable() {
    const body = $("accountBody");

    if (!state.filtered.length) {
      body.innerHTML = `<tr><td colspan="6" class="empty-cell">Không tìm thấy tài khoản CS phù hợp.</td></tr>`;
      $("entriesNote").textContent = "Hiển thị 0 tài khoản";
      return;
    }

    body.innerHTML = state.filtered
      .map((item) => `
        <tr data-id="${escapeHtml(item.id)}">
          <td>
            <div class="account-cell">
              <div class="avatar" style="background:${item.status === "pending" ? "#efebe5" : "#eedcc8"}">
                ${escapeHtml(item.avatar)}
              </div>
              <div>
                <strong>${escapeHtml(item.name)}</strong>
                <small><code>${escapeHtml(item.id)}</code> · ${escapeHtml(item.email)}</small>
              </div>
            </div>
          </td>
          <td class="role">${escapeHtml(item.role)}</td>
          <td>
            <span class="status status-${item.status}">
              <i></i>${escapeHtml(item.statusText)}
            </span>
          </td>
          <td class="last-active">${escapeHtml(item.lastActive)}</td>
          <td class="joined">${escapeHtml(item.joined)}</td>
          <td>
            <button class="row-action" data-open-id="${escapeHtml(item.id)}" aria-label="Xem chi tiết">›</button>
          </td>
        </tr>
      `)
      .join("");

    body.querySelectorAll("tr[data-id]").forEach((row) => {
      row.addEventListener("click", () => {
        openDrawer(state.accounts.find((item) => item.id === row.dataset.id));
      });
    });

    body.querySelectorAll("[data-open-id]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        openDrawer(state.accounts.find((item) => item.id === button.dataset.openId));
      });
    });

    $("entriesNote").textContent = `Hiển thị ${state.filtered.length} / ${state.accounts.length} tài khoản`;
  }

  // --- Filtering & Handlers ---
  function applyFilters() {
    const query = $("searchInput").value.trim().toLowerCase();
    const status = $("statusFilter").value;

    state.filtered = state.accounts.filter((item) => {
      const matchesQuery = `${item.name} ${item.email} ${item.id} ${item.role}`.toLowerCase().includes(query);
      return matchesQuery && (status === "all" || item.status === status);
    });

    renderTable();
  }

  function openDrawer(item) {
    if (!item) return;
    state.selected = item;

    $("drawerContent").innerHTML = `
      <div class="drawer-content">
        <div class="drawer-profile">
          <div class="avatar" style="background:#eedcc8">${escapeHtml(item.avatar)}</div>
          <div>
            <h3>${escapeHtml(item.name)}</h3>
            <p>${escapeHtml(item.email)}</p>
            <p>
              <span class="status status-${item.status}">
                <i></i>${escapeHtml(item.statusText)}
              </span>
            </p>
          </div>
        </div>
        <div class="detail-grid">
          <div class="detail-box">
            <small>Mã tài khoản</small>
            <strong>${escapeHtml(item.id)}</strong>
          </div>
          <div class="detail-box">
            <small>Vai trò</small>
            <strong>${escapeHtml(item.role)}</strong>
          </div>
          <div class="detail-box">
            <small>Hoạt động</small>
            <strong>${escapeHtml(item.lastActive)}</strong>
          </div>
          <div class="detail-box">
            <small>Ngày tham gia</small>
            <strong>${escapeHtml(item.joined)}</strong>
          </div>
        </div>
        <p class="eyebrow">Quyền và dữ liệu</p>
        <p style="color:var(--soft);font-size:12px;line-height:1.7">
          Hồ sơ này được đọc từ tài liệu Firestore của tài khoản CS. Các thao tác thay đổi quyền nên được kiểm soát bằng Firebase Security Rules.
        </p>
        <button class="primary-btn" style="width:100%;margin-top:18px" id="permissionBtn">Kiểm tra quyền truy cập</button>
      </div>
    `;

    $("accountDrawer").classList.add("open");
    $("accountDrawer").setAttribute("aria-hidden", "false");
    $("drawerBackdrop").hidden = false;

    $("permissionBtn").addEventListener("click", () => toast("Đã mở thông tin quyền truy cập"));
  }

  function closeDrawer() {
    $("accountDrawer").classList.remove("open");
    $("accountDrawer").setAttribute("aria-hidden", "true");
    $("drawerBackdrop").hidden = true;
    state.selected = null;
  }

  // --- Firebase Integration ---
  function setupFirebase() {
    const database = dbRef();
    if (!database) {
      $("connectionLabel").textContent = "Chưa tìm thấy Firebase config";
      return;
    }

    $("connectionDot").classList.add("live");
    $("connectionLabel").textContent = "Firebase đã kết nối";

    state.unsubscribe = database.collection("users").onSnapshot(
      (snapshot) => {
        state.accounts = snapshot.docs.map(normalizeAccount).filter(isCsAccount);
        renderStats();
        applyFilters();
      },
      (error) => {
        console.error(error);
        $("connectionDot").classList.remove("live");
        $("connectionLabel").textContent = "Không thể tải Firestore";
        $("accountBody").innerHTML = `<tr><td colspan="6" class="empty-cell">Không thể tải danh sách tài khoản. Kiểm tra quyền Firestore.</td></tr>`;
      }
    );
  }

  // --- Event Listeners Setup ---
  function setupEvents() {
    $("todayLabel").textContent = new Date().toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });

    $("searchInput").addEventListener("input", applyFilters);
    $("statusFilter").addEventListener("change", applyFilters);

    $("clearFilters").addEventListener("click", () => {
      $("searchInput").value = "";
      $("statusFilter").value = "all";
      applyFilters();
    });

    $("closeDrawer").addEventListener("click", closeDrawer);
    $("drawerBackdrop").addEventListener("click", closeDrawer);
    $("menuBtn").addEventListener("click", () => $("sidebar").classList.toggle("open"));

    $("addAccountBtn").addEventListener("click", () => {window.location.href = "add/HỌC VIÊN/account-HV.html";});
    $("noticeBtn").addEventListener("click", () => toast("Không có thông báo mới"));

    $("logoutBtn").addEventListener("click", () => {
      if (typeof auth !== "undefined") {
        auth.signOut().then(() => toast("Đã đăng xuất"));
      } else {
        toast("Firebase Auth chưa sẵn sàng");
      }
    });

    document.querySelectorAll("[data-placeholder]").forEach((node) => {
      node.addEventListener("click", (event) => {
        event.preventDefault();
        toast(`${node.dataset.placeholder} đang được chuẩn bị`);
      });
    });
  }

  // Init Application
  setupEvents();
  setupFirebase();
})();