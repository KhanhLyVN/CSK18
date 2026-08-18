/* =========================================================
   ADMIN HOMEPAGE
   QUẢN LÝ TÀI KHOẢN CUSTOMER SUCCESS
   Firebase collection:
   users
   Schema:
   {
      accountType: "customer_success",
      campus: "HCM",
      createdAt: Timestamp,
      department: "IT",
      email: "...",
      name: "...",
      passwordCreated: true,
      phone: "...",
      provider: "e-mail",
      uid: "...",
      username: "van.b"
   }
========================================================= */
(() => {
  "use strict";
  /* =======================================================
     STATE
  ======================================================= */
  const state = {
    accounts: [],
    filtered: [],
    selected: null,
    unsubscribe: null
  };
  /* =======================================================
     DOM HELPER
  ======================================================= */
  const $ = (id) => {
    return document.getElementById(id);
  };
  /* =======================================================
     FIREBASE
  ======================================================= */
  function getFirestore() {
    if (typeof db !== "undefined" && db) {
      return db;
    }
    if (typeof firebase !== "undefined" && firebase.apps && firebase.apps.length > 0) {
      return firebase.firestore();
    }
    return null;
  }
  function getAuth() {
    if (typeof auth !== "undefined" && auth) {
      return auth;
    }
    if (typeof firebase !== "undefined" && firebase.apps && firebase.apps.length > 0) {
      return firebase.auth();
    }
    return null;
  }
  /* =======================================================
     TOAST
  ======================================================= */
  function toast(message) {
    const node = $("toast");
    if (!node) return;
    node.textContent = message;
    node.hidden = false;
    clearTimeout(window.__toastTimer);
    window.__toastTimer = setTimeout(() => {
      node.hidden = true;
    }, 2300);
  }
  /* =======================================================
     HTML ESCAPE
  ======================================================= */
  function escapeHtml(value) {
    const div =
      document.createElement("div");
    div.textContent = value === null || value === undefined ? "" : String(value);
    return div.innerHTML;
  }
  /* =======================================================
     VALUE HELPER
  ======================================================= */
  function valueOf(item, ...keys) {
    for (const key of keys) {
      if (item && item[key] !== undefined && item[key] !== null && String(item[key]).trim() !== "") {
        return item[key];
      }
    }
    return "";
  }
  /* =======================================================
     INITIALS
  ======================================================= */
  function initials(name) {
    const text = String(name || "CS").trim();
    if (!text) {
      return "CS";
    }
    const parts = text
      .split(/\s+/)
      .filter(Boolean);
    if (parts.length === 1) {
      return parts[0]
        .substring(0, 2)
        .toUpperCase();
    }
    return parts
      .slice(-2)
      .map(part => part.charAt(0))
      .join("")
      .toUpperCase();
  }
  /* =======================================================
     DATE
  ======================================================= */
  function toDate(value) {
    if (!value) {
      return null;
    }
    try {
      if (value && typeof value.toDate === "function") {
        return value.toDate();
      }
      const date = new Date(value);
      if (
        Number.isNaN(date.getTime()
        )
      ) {
        return null;
      }
      return date;
    } catch (error) {
      return null;
    }
  }
  function formatDate(value) {
    const date = toDate(value);
    if (!date) {
      return "—";
    }
    return date.toLocaleDateString(
      "vi-VN"
    );
  }
  function formatDateTime(value) {
    const date = toDate(value);
    if (!date) {
      return "—";
    }
    return date.toLocaleString(
      "vi-VN"
    );
  }
  /* =======================================================
     STATUS
  ======================================================= */
  function normalizeStatus(item) {
    const rawStatus = String(valueOf(item, "status", "accountStatus", "state") || "").toLowerCase().trim();
    if (
      [
        "active",
        "activated",
        "đang hoạt động",
        "online"
      ].includes(rawStatus)
    ) {
      return "active";
    }
    if (
      [
        "away",
        "tạm vắng",
        "offline"
      ].includes(rawStatus)
    ) {
      return "away";
    }
    if (
      [
        "pending",
        "inactive",
        "chưa kích hoạt",
        "disabled"
      ].includes(rawStatus)
    ) {
      return "pending";
    }
    /*
     * Nếu Firebase chưa có status:
     *
     * passwordCreated = true
     * => active
     */
    if (item.passwordCreated === true) {
      return "active";
    }
    return "pending";
  }
  function statusLabel(status) {
    const labels = {
      active: "Đang hoạt động",
      away: "Tạm vắng",
      pending: "Chưa kích hoạt"
    };
    return (
      labels[status] || "Chưa kích hoạt"
    );
  }
  /* =======================================================
     ROLE
  ======================================================= */
  function accountRole(item) {
    const role = valueOf(item, "roleLabel", "role", "position");
    if (role) {
      return role;
    }
    const accountType = String(item.accountType || "").toLowerCase().trim();
    if (
      accountType == "customer_success"
    ) {
      return "Customer Success";
    }
    return "CS cấp 1";
  }
  /* =======================================================
     CHECK CS ACCOUNT
  ======================================================= */
  function isCsAccount(item) {
    return (String(item.accountType || "").toLowerCase().trim() === "customer_success");
  }
  /* =======================================================
     NORMALIZE FIRESTORE DOCUMENT
  ======================================================= */
  function normalizeAccount(doc) {
    const raw = {
      id: doc.id, ...doc.data()
    };
    const name = valueOf(raw, "name", "displayName", "fullName") || "Chưa cập nhật";
    const username = valueOf(raw, "username") || "—";
    const email = valueOf(raw, "email") || "Chưa cập nhật";
    const uid = valueOf(raw, "uid") || doc.id;
    const status = normalizeStatus(raw);
    return {
      ...raw, id: doc.id, username, uid, name, email, campus:
        valueOf(raw, "campus") || "—", department:
        valueOf(raw, "department") || "—", phone:
        valueOf(raw, "phone") || "—", accountType:
        valueOf(raw, "accountType") || "customer_success", provider:
        valueOf(raw, "provider") || "—", role:
        accountRole(raw), status, statusText:
        statusLabel(status), joined:
        formatDate(valueOf(raw, "createdAt", "joinedAt", "dateCreated")), createdAtLabel:
        formatDateTime(raw.createdAt), lastActive:
        valueOf(raw, "lastActiveLabel", "lastActive", "lastLogin")
          ? formatDate(valueOf(raw, "lastActiveLabel", "lastActive", "lastLogin")) : "Chưa đăng nhập", avatar:
        initials(name)
    };
  }
  /* =======================================================
     STATS
  ======================================================= */
  function renderStats() {
    const total = state.accounts.length;
    const active = state.accounts.filter(item => item.status === "active").length;
    const pending = state.accounts.filter(item => item.status === "pending").length;
    const managers = state.accounts.filter(item => /trưởng|cấp 2|manager|lead/i.test(String(item.role || ""))).length;
    const totalCount = $("totalCount");
    const activeCount = $("activeCount");
    const managerCount = $("managerCount");
    const pendingCount = $("pendingCount");
    const activeMeta = $("activeMeta");
    const recordBadge = $("recordBadge");
    const navCount = $("navCount");
    if (totalCount) {
      totalCount.textContent = total;
    }
    if (activeCount) {
      activeCount.textContent = active;
    }
    if (managerCount) {
      managerCount.textContent = managers;
    }
    if (pendingCount) {
      pendingCount.textContent = pending;
    }
    if (activeMeta) {
      activeMeta.textContent = total ? `${Math.round((active / total) * 100)}% trên tổng đội ngũ` : "Chưa có dữ liệu";
    }
    if (recordBadge) {
      recordBadge.textContent = `${total} hồ sơ`;
    }
    if (navCount) {
      navCount.textContent = total;
    }
  }
  /* =======================================================
     TABLE
  ======================================================= */
  function renderTable() {
    const body = $("accountBody");
    if (!body) return;
    if (!state.filtered.length) {
      body.innerHTML = `
        <tr>
          <td
            colspan="6"
            class="empty-cell"
          >
            Không tìm thấy
            tài khoản CS phù hợp.
          </td>
        </tr>
      `;
      const entries = $("entriesNote");
      if (entries) {
        entries.textContent =
          "Hiển thị 0 tài khoản";
      }
      return;
    }
    body.innerHTML = state.filtered.map(item => {
      const avatarBackground = item.status === "pending" ? "#efebe5" : "#eedcc8";
      return `
            <tr
              data-id="${escapeHtml(item.id)}"
            >
              <td>
                <div
                  class="account-cell"
                >
                  <div
                    class="avatar"
                    style="background:${avatarBackground};"
                  >
                    ${escapeHtml(item.avatar)}
                  </div>
                  <div>
                    <strong>
                      ${escapeHtml(item.name)}
                    </strong>
                    <small>
                      <code>
                        ${escapeHtml(item.username)}
                      </code>
                      ·
                      ${escapeHtml(item.email)}
                    </small>
                  </div>
                </div>
              </td>
              <td class="role">
                ${escapeHtml(item.role)}
              </td>
              <td>
                <span
                  class="statusstatus-${item.status}"
                >
                  <i></i>
                  ${escapeHtml(item.statusText)}
                </span>
              </td>
              <td
                class="last-active"
              >
                ${escapeHtml(item.lastActive)}
              </td>
              <td
                class="joined"
              >
                ${escapeHtml(item.joined)}
              </td>
              <td>
                <button
                  type="button"
                  class="row-action"
                  data-open-id="${escapeHtml(item.id)}"
                  aria-label="Xem chi tiết"
                >
                  ›
                </button>
              </td>
            </tr>
          `;
    })
      .join("");
    /* Row click */
    body
      .querySelectorAll("tr[data-id]")
      .forEach(row => {
        row.addEventListener("click", () => {
          const item = state.accounts.find(account => account.id === row.dataset.id);
          openDrawer(item);
        }
        );
      });
    /* Button click */
    body.querySelectorAll("[data-open-id]").forEach(button => {
      button.addEventListener("click", event => {
        event.stopPropagation();
        const item = state.accounts.find(account => account.id === button.dataset.openId);
        openDrawer(item);
      }
      );
    });
    const entries = $("entriesNote");
    if (entries) {
      entries.textContent = `Hiển thị ${state.filtered.length} / ${state.accounts.length} tài khoản`;
    }
  }
  /* =======================================================
     FILTER
  ======================================================= */
  function applyFilters() {
    const searchInput = $("searchInput");
    const statusFilter = $("statusFilter");
    const query = searchInput ? searchInput.value.trim().toLowerCase() : "";
    const status = statusFilter
      ? statusFilter.value
      : "all";
    state.filtered =
      state.accounts.filter(
        item => {
          const searchable = `
            ${item.name}
            ${item.email}
            ${item.username}
            ${item.uid}
            ${item.id}
            ${item.role}
            ${item.campus}
            ${item.department}
            ${item.phone}
          `.toLowerCase();
          const matchesQuery = searchable.includes(query);
          const matchesStatus = status === "all" || item.status === status;
          return (matchesQuery && matchesStatus
          );
        }
      );
    renderTable();
  }
  /* =======================================================
     DRAWER
  ======================================================= */
  function openDrawer(item) {
    if (!item) return;
    state.selected =
      item;
    const drawer =
      $("accountDrawer");
    const drawerContent =
      $("drawerContent");
    if (
      !drawer ||
      !drawerContent
    ) {
      return;
    }
    drawerContent.innerHTML = `
      <div class="drawer-content">
        <!-- PROFILE -->
        <div
          class="drawer-profile"
        >
          <div
            class="avatar"
            style="
              background:#eedcc8;
            "
          >
            ${escapeHtml(
      item.avatar
    )}
          </div>
          <div>
            <h3>
              ${escapeHtml(
      item.name
    )}
            </h3>
            <p>
              ${escapeHtml(
      item.email
    )}
            </p>
            <p>
              <span
                class="
                  status
                  status-${item.status}
                "
              >
                <i></i>
                ${escapeHtml(
      item.statusText
    )}
              </span>
            </p>
          </div>
        </div>
        <!-- INFORMATION -->
        <div class="detail-grid">
          <div class="detail-box">
            <small>
              Tên đăng nhập
            </small>
            <strong>
              ${escapeHtml(item.username)}
            </strong>
          </div>
          <div class="detail-box">
            <small>
              Loại tài khoản
            </small>
            <strong>
              ${escapeHtml(item.accountType)}
            </strong>
          </div>
          <div class="detail-box">
            <small>
              Vai trò
            </small>
            <strong>
              ${escapeHtml(item.role)}
            </strong>
          </div>
          <div class="detail-box">
            <small>
              Cơ sở
            </small>
            <strong>
              ${escapeHtml(item.campus)}
            </strong>
          </div>
          <div class="detail-box">
            <small>
              Phòng ban
            </small>
            <strong>
              ${escapeHtml(item.department)}
            </strong>
          </div>
          <div class="detail-box">
            <small>
              Số điện thoại
            </small>
            <strong>
              ${escapeHtml(item.phone)}
            </strong>
          </div>
          <div class="detail-box">
            <small>
              Provider
            </small>
            <strong>
              ${escapeHtml(item.provider)}
            </strong>
          </div>
          <div class="detail-box">
            <small>
              Ngày tham gia
            </small>
            <strong>
              ${escapeHtml(item.joined)}
            </strong>
          </div>
        </div>
        <!-- ACCOUNT INFORMATION -->
        <p class="eyebrow">
Thông tin tài khoản
        </p>
        <div
          style="
            color:var(--soft);
            font-size:12px;
            line-height:1.8;
          "
        >
          <p>
            <strong>
              Username:
            </strong>
            ${escapeHtml(item.username)}
          </p>
          <p>
            <strong>
              Email:
            </strong>
            ${escapeHtml(item.email)}
          </p>
          <p>
            <strong>
              Campus:
            </strong>
            ${escapeHtml(item.campus)}
          </p>
          <p>
            <strong>
              Department:
            </strong>
            ${escapeHtml(item.department)}
          </p>
          <p>
            <strong>
              Created:
            </strong>
            ${escapeHtml(item.createdAtLabel)}
          </p>
        </div>
        <button
          type="button"
          class="primary-btn"
          style="
            width:100%;
            margin-top:18px
          "
          id="permissionBtn"
        >
          Kiểm tra quyền truy cập
        </button>
      </div>
    `;
    drawer.classList.add("open");
    drawer.setAttribute("aria-hidden","false");
    const backdrop =$("drawerBackdrop");
    if (backdrop) {
      backdrop.hidden =false;
    }
    const permissionBtn =$("permissionBtn");
    if (permissionBtn) {
      permissionBtn.addEventListener("click",() => {
          toast( `Tài khoản ${item.username} đang sử dụng Customer Success`);
        }
      );
    }
  }
  /* =======================================================
     CLOSE DRAWER
  ======================================================= */
  function closeDrawer() {
    const drawer =
      $("accountDrawer");
    if (drawer) {
      drawer.classList.remove("open");
      drawer.setAttribute("aria-hidden","true");
    }
    const backdrop =$("drawerBackdrop");if (backdrop) {backdrop.hidden =true;}
    state.selected =null;
  }
  /* =======================================================
     SIDEBAR NAVIGATION
  ======================================================= */
  function setupSidebarNavigation() {
    const sidebar =$("sidebar");
    if (!sidebar) return;
    const navItems =sidebar.querySelectorAll(".nav-item[data-page]");
    navItems.forEach(item => {
      item.addEventListener("click",() => {
          const page =item.dataset.page;
          if (!page) return;
          setActiveSidebar(page);
          closeMobileSidebar();
        }
      );
    });
  }
  /* =======================================================
     ACTIVE SIDEBAR
  ======================================================= */
  function setActiveSidebar(page) {
    document.querySelectorAll(".nav-item[data-page]").forEach(item => {
        item.classList.toggle("active", item.dataset.page ===page);
      });
    try {
      localStorage.setItem("adminActivePage",page
      );
    } catch (error) {
      console.warn("Không thể lưu sidebar state:", error);
    }
  }
  /* =======================================================
     RESTORE SIDEBAR
  ======================================================= */
  function restoreSidebar() {
    const path =window.location.pathname.toLowerCase();
    let page ="overview";
    /* Tổng quan */
    if ( path.includes("homepage-ad") ||path === "/" ||path.endsWith("/admin/")) {
      page = "overview";
    }/* Tài khoản CS */
    else if (
      path.includes("accounts-cs") ||
      path.includes("quanly-taikhoan") ||
      path.includes("customer-success") ) {
      page ="accounts";
    } /* Báo cáo */
    else if (path.includes("activity-report") ||path.includes("report") ||path.includes("bao-cao")) {
      page = "reports";
    }
    /* Nhật ký */
    else if (path.includes("system-log") ||path.includes("logs" ) ||path.includes("nhat-ky")) {
      page ="logs";
    }/* Cài đặt */
    else if (path.includes("settings") ||path.includes("cai-dat")) {
      page ="settings";
    }
    setActiveSidebar(page);
  }
  /* =======================================================
     MOBILE SIDEBAR
  ======================================================= */
  function closeMobileSidebar() {
    const sidebar =$("sidebar");
    if (!sidebar) return;
    if (window.innerWidth <= 780
    ) {
      sidebar.classList.remove(
        "open"
      );
    }
  }
  /* =======================================================
     SETUP EVENTS
  ======================================================= */
  function setupEvents() {
    /* =====================================================
       TODAY
    ===================================================== */
    const todayLabel =$("todayLabel");
    if (todayLabel) {
      todayLabel.textContent =new Date().toLocaleDateString("vi-VN",
          {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
          }
        );
    }
    /* =====================================================
       SEARCH
    ===================================================== */
    const searchInput =$("searchInput");
    if (searchInput) {
      searchInput.addEventListener("input",applyFilters);
    }
    /* =====================================================
       STATUS FILTER
    ===================================================== */
    const statusFilter =$("statusFilter");
    if (statusFilter) {
      statusFilter.addEventListener("change",applyFilters);
    }
    /* =====================================================
       CLEAR FILTER
    ===================================================== */
    const clearFilters =$("clearFilters");
    if (clearFilters) {
      clearFilters.addEventListener("click",() => {
          if (searchInput) {
            searchInput.value ="";
          }
          if (statusFilter) {
            statusFilter.value ="all";
          }
          applyFilters();
        }
      );
    }
    /* =====================================================
       DRAWER CLOSE
    ===================================================== */
    const closeDrawerBtn =$("closeDrawer");
    if (closeDrawerBtn) {
      closeDrawerBtn.addEventListener("click",closeDrawer);
    }
    const drawerBackdrop =$("drawerBackdrop");
    if (drawerBackdrop) {
      drawerBackdrop.addEventListener("click",closeDrawer);
    }
    /* =====================================================
       ESC CLOSE DRAWER
    ===================================================== */
    document.addEventListener("keydown",event => {
        if (event.key ==="Escape") {
          closeDrawer();
        }
      }
    );
    /* =====================================================
       MOBILE MENU
    ===================================================== */
    const menuBtn =$("menuBtn");
    const sidebar =$("sidebar");
    if (menuBtn &&sidebar) {
      menuBtn.addEventListener("click", () => {
          sidebar.classList.toggle("open");
        }
      );
    }
    /* =====================================================
       ADD ACCOUNT
    ===================================================== */
    const addAccountBtn =$("addAccountBtn");
    if (addAccountBtn) {
      addAccountBtn.addEventListener("click",() => {
          window.location.href ="/ADMIN/addAccount.html";
        }
      );
    }
    /* =====================================================
       NOTIFICATION
    ===================================================== */
    const noticeBtn =$("noticeBtn");
    if (noticeBtn) {
      noticeBtn.addEventListener("click",() => {toast("Không có thông báo mới");
        }
      );
    }
    /* =====================================================
       LOGOUT
    ===================================================== */
    const logoutBtn =$("logoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click",async () => {
          const firebaseAuth =getAuth();
          if (!firebaseAuth) {
            toast("Firebase Auth chưa sẵn sàng");
            return;
          }
          try {
            await firebaseAuth.signOut();
            toast("Đã đăng xuất");
            setTimeout(() => {window.location.href ="/login.html";},500);
          } catch (error) {
            console.error("Logout error:",error);
            toast("Đăng xuất thất bại");
          }
        }
      );
    }
    /* =====================================================
       SIDEBAR
    ===================================================== */
    setupSidebarNavigation();
    restoreSidebar();
    /* =====================================================
       PLACEHOLDER BUTTONS
    ===================================================== */
    document.querySelectorAll("[data-placeholder]").forEach(node => {
        node.addEventListener("click",event => {event.preventDefault();toast(`${node.dataset.placeholder} đang được chuẩn bị`);});
      });
  }
  /* =======================================================
     FIRESTORE REALTIME
  ======================================================= */
  function setupFirebase() {
    const database =getFirestore();
    const connectionLabel =$("connectionLabel");
    const connectionDot =$("connectionDot");
    const accountBody =$("accountBody");
    /* Không có Firebase */
    if (!database) {
      if (connectionLabel) {
        connectionLabel.textContent ="Chưa tìm thấy Firebase config";}
      if (connectionDot) {connectionDot.classList.remove("live");
      }
      if (accountBody) {
        accountBody.innerHTML = `
          <tr>
            <td
              colspan="6"
              class="empty-cell"
            >
              Không tìm thấy
              kết nối Firebase.
            </td>
          </tr>
        `;
      }
      return;
    }
    /* Firebase connected */
    if (connectionDot) {
      connectionDot.classList.add("live");
    }
    if (connectionLabel) {
      connectionLabel.textContent ="Firebase đã kết nối";
    }
    /* =====================================================
       REALTIME USERS
    ===================================================== */
    state.unsubscribe =database.collection("users").where("accountType","==","customer_success").onSnapshot(snapshot => {state.accounts =snapshot.docs.map(normalizeAccount);
      /* =================================================
         SORT CREATED DATE
      ================================================= */
      state.accounts.sort((a, b) => {
          const dateA =toDate(a.createdAt);
          const dateB =toDate(b.createdAt);
          return ((dateB?.getTime() || 0) -(dateA?.getTime() || 0));
        }
      );
      /* =================================================
         RENDER
      ================================================= */
      renderStats();
      applyFilters();
    },
      error => {
        console.error("Firestore error:",error);
        if (connectionDot) {
          connectionDot.classList.remove("live");
        }
        if (connectionLabel) {
          connectionLabel.textContent ="Không thể tải Firestore";
        }
        if (accountBody) {
          accountBody.innerHTML = `
                <tr>
                  <td
                    colspan="6"
                    class="empty-cell"
                  >
                    Không thể tải
                    danh sách tài khoản CS.
                    <br>
                    Kiểm tra Firestore Rules.
                  </td>
                </tr>
              `;
        }
        toast(
          "Không thể tải tài khoản CS"
        );
      }
    );
  }
  /* =======================================================
     CLEANUP
  ======================================================= */
  window.addEventListener(
    "beforeunload",
    () => {
      if (
        typeof state.unsubscribe ==="function"
      ) {
        state.unsubscribe();
      }
    }
  );
  /* =======================================================
     INIT
  ======================================================= */
  function init() {
    setupEvents();
    setupFirebase();
  }
  /* =======================================================
     DOM READY
  ======================================================= */
  if (
    document.readyState ==="loading"
  ) {
    document.addEventListener("DOMContentLoaded",init);
  } else {
    init();
  }
})();

/* =========================================================
   SHARED ACTIVITY HEADER
   Hiển thị: HCM Admin | HCM | HA
========================================================= */
(() => {
  "use strict";
  function applyActivityHeader() {
    const name = document.getElementById("topAdminName");
    const campus = document.getElementById("topAdminCampus");
    const avatar = document.getElementById("topAdminAvatar");
    if (!name || !campus || !avatar) return false;
    name.textContent = "HCM Admin";
    name.title = "HCM Admin";
    campus.textContent = "HCM";
    campus.title = "Campus HCM";
    avatar.textContent = "HA";
    avatar.setAttribute("aria-label", "Tài khoản HCM Admin");
    return true;
  }
  document.addEventListener("adminbar:ready", applyActivityHeader);
  window.addEventListener("load", applyActivityHeader);
  let attempts = 0;
  const timer = setInterval(() => {
    attempts += 1;
    if (applyActivityHeader() || attempts >= 50) clearInterval(timer);
  }, 100);
})();

