/*ADMIN - CUSTOMER SUCCESS ACCOUNTS*/

(function () {
  "use strict";

  /*CONFIG*/
  const USERS_COLLECTION = "users";

  let accounts = [];
  let filteredAccounts = [];
  let unsubscribeAccounts = null;
  let selectedAccount = null;

  /*DOM*/
  const $ = (selector) => document.querySelector(selector);

  const elements = {
    todayLabel: $("#todayLabel"),
    totalCount: $("#totalCount"),
    activeCount: $("#activeCount"),
    managerCount: $("#managerCount"),
    pendingCount: $("#pendingCount"),
    activeMeta: $("#activeMeta"),
    recordBadge: $("#recordBadge"),
    entriesNote: $("#entriesNote"),
    searchInput: $("#searchInput"),
    statusFilter: $("#statusFilter"),
    clearFilters: $("#clearFilters"),
    accountBody: $("#accountBody"),
    drawerBackdrop: $("#drawerBackdrop"),
    accountDrawer: $("#accountDrawer"),
    closeDrawer: $("#closeDrawer"),
    drawerContent: $("#drawerContent"),
    addAccountBtn: $("#addAccountBtn")
  };

  /*INIT*/
  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    setToday();
    setupEvents();
    /*
     * Đợi Firebase config nếu firebase-config.js
     * khởi tạo bất đồng bộ.
     */
    await waitForFirebase();
    loadAccounts();
  }

  /*WAIT FIREBASE*/
  function waitForFirebase() {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const timer = setInterval(() => {
        attempts++;
        if (
          typeof firebase !== "undefined" &&
          firebase.apps &&
          firebase.apps.length
        ) {
          clearInterval(timer);
          resolve();
          return;
        }
        if (attempts >= 100) {
          clearInterval(timer);
          reject(new Error("Firebase chưa được khởi tạo."));
        }
      }, 50);
    }).catch(error => {
      console.error("Firebase initialization error:", error);
      showTableError("Không thể kết nối Firebase.");
    });
  }

  /*TODAY*/
  function setToday() {
    if (!elements.todayLabel) return;
    const now = new Date();
    elements.todayLabel.textContent = now.toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  }

  /*EVENTS*/
  function setupEvents() {
    /* Search */
    elements.searchInput?.addEventListener("input", applyFilters);
    /* Status */
    elements.statusFilter?.addEventListener("change", applyFilters);
    /* Clear */
    elements.clearFilters?.addEventListener("click", clearFilters);
    /* Close drawer */
    elements.closeDrawer?.addEventListener("click", closeDrawer);
    elements.drawerBackdrop?.addEventListener("click", closeDrawer);
    /* ESC */
    document.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        closeDrawer();
      }
    });
    /* Add account */
    elements.addAccountBtn?.addEventListener("click", () => {
      /*
       * Trang tạo tài khoản của bé có thể thay
       * bằng đường dẫn thật sau này.
       */
      window.location.href = "./tao_email_CSandHV.html";
    });
  }

  /*LOAD ACCOUNTS*/
  function loadAccounts() {
    try {
      const db =
        window.db ||
        (typeof firebase !== "undefined" ? firebase.firestore() : null);
      if (!db) {
        showTableError("Không tìm thấy Firestore.");
        return;
      }
      /*Nếu đã có listener thì hủy.*/
      if (unsubscribeAccounts) {
        unsubscribeAccounts();
      }
      /*
       * Không dùng where accountType để tránh
       * bỏ sót dữ liệu cũ.
       *
       * Lọc customer_success ở JavaScript.
       */
      unsubscribeAccounts = db.collection(USERS_COLLECTION).onSnapshot(
        snapshot => {
          accounts = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(isCSAccount);
          /*Sắp xếp tài khoản mới nhất trước.*/
          accounts.sort(
            (a, b) => getTimestamp(b.createdAt) - getTimestamp(a.createdAt)
          );
          updateStatistics();
          applyFilters();
        },
        error => {
          console.error("Lỗi tải tài khoản:", error);
          showTableError("Không thể tải tài khoản từ Firestore.");
        }
      );
    } catch (error) {
      console.error("loadAccounts:", error);
      showTableError("Có lỗi khi tải tài khoản.");
    }
  }

  /*CHECK CS ACCOUNT */
  function isCSAccount(account) {
    const accountType = String(account.accountType || "").toLowerCase();
    const role = String(account.role || "").toLowerCase();
    /*
     * Các kiểu dữ liệu có thể đang tồn tại
     * trong hệ thống của bé.
     */
    return (
      accountType === "customer_success" ||
      accountType === "cs" ||
      role === "customer_success" ||
      role === "cs" ||
      role === "customer success"
    );
  }

  /* STATISTICS*/
  function updateStatistics() {
    const total = accounts.length;
    const active = accounts.filter(
      account => normalizeStatus(account.status) === "active"
    ).length;
    const pending = accounts.filter(
      account => normalizeStatus(account.status) === "pending"
    ).length;
    const manager = accounts.filter(isManager).length;
    setText(elements.totalCount, total);
    setText(elements.activeCount, active);
    setText(elements.managerCount, manager);
    setText(elements.pendingCount, pending);
    setText(elements.activeMeta, `${active}/${total} tài khoản đang hoạt động`);
  }

  /*MANAGER*/
  function isManager(account) {
    const role = String(account.role || account.accountType || account.position || "").toLowerCase();
    const department = String(account.department || "").toLowerCase();
    return (role.includes("manager") || role.includes("manager") || role.includes("lead") || role.includes("trưởng") || role.includes("admin") || department.includes("manager"));
  }

  /*FILTER */
  function applyFilters() {
    const keyword = String(elements.searchInput?.value || "").trim().toLowerCase();
    const status = elements.statusFilter?.value || "all";

    filteredAccounts = accounts.filter(account => {
      /*SEARCH*/
      if (keyword) {
        const searchable = [
          account.name,
          account.email,
          account.uid,
          account.accountId,
          account.phone,
          account.campus,
          account.department
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!searchable.includes(keyword)) {
          return false;
        }
      }
      /*STATUS*/
      if (status !== "all") {
        const accountStatus = normalizeStatus(account.status);
        if (accountStatus !== status) {
          return false;
        }
      }
      return true;
    });
    renderAccounts();
    updateRecordInfo();
  }

  /*CLEAR FILTER*/
  function clearFilters() {
    if (elements.searchInput) {
      elements.searchInput.value = "";
    }
    if (elements.statusFilter) {
      elements.statusFilter.value = "all";
    }
    applyFilters();
  }

  /*RENDER TABLE*/
  function renderAccounts() {
    if (!elements.accountBody) return;

    if (!filteredAccounts.length) {
      elements.accountBody.innerHTML = `
        <tr>
          <td
            colspan="6"
            class="loading-cell"
            style="
              padding:45px 20px;
              text-align:center;
              color:#9a8d82;
            "
          >
            Không tìm thấy tài khoản phù hợp.
          </td>
        </tr>
      `;
      return;
    }

    elements.accountBody.innerHTML = filteredAccounts
      .map(account => createAccountRow(account))
      .join("");

    /*
     * Click từng dòng
     */
    elements.accountBody.querySelectorAll("[data-account-id]").forEach(row => {
      row.addEventListener("click", event => {
        /*
         * Nếu click button thì không mở drawer
         */
        if (event.target.closest("button")) {
          return;
        }
        const id = row.dataset.accountId;
        const account = accounts.find(item => item.id === id);
        if (account) {
          openDrawer(account);
        }
      });
    });

    /*
     * Action buttons
     */
    elements.accountBody.querySelectorAll("[data-action]").forEach(button => {
      button.addEventListener("click", async event => {
        event.stopPropagation();
        const id = button.dataset.id;
        const action = button.dataset.action;
        const account = accounts.find(item => item.id === id);
        if (!account) return;
        await handleAccountAction(action, account);
      });
    });
  }

  /* =======================================================
     ACCOUNT ROW
  ======================================================= */
  function createAccountRow(account) {
    const name = escapeHTML(account.name || "Chưa có tên");
    const email = escapeHTML(account.email || "Chưa có email");
    const id = escapeHTML(account.accountId || account.uid || account.id);
    const role = escapeHTML(getRoleLabel(account));
    const status = normalizeStatus(account.status);
    const statusHTML = createStatusHTML(status);
    const lastActive = formatDateTime(account.lastActive);
    const joined = formatDate(account.createdAt || account.joined);
    const initials = getInitials(account.name || account.email);

    return `
      <tr data-account-id="${escapeAttribute(account.id)}">
        <td>
          <div class="account-cell">
            <div class="avatar">
              ${escapeHTML(initials)}
            </div>
            <div>
              <strong>
                ${name}
              </strong>
              <small>
                ${email}
              </small>
            </div>
          </div>
        </td>
        <td>
          <span class="role">
            ${role}
          </span>
        </td>
        <td>
          ${statusHTML}
        </td>
        <td>
          <span class="last-active">
            ${lastActive}
          </span>
        </td>
        <td>
          <span class="joined">
            ${joined}
          </span>
        </td>
        <td>
          <button
            type="button"
            class="row-action-btn"
            data-action="view"
            data-id="${escapeAttribute(account.id)}"
            title="Xem hồ sơ"
          >
            Xem
          </button>
        </td>
      </tr>
    `;
  }

  /*STATUS */
  function normalizeStatus(status) {
    const value = String(status || "").trim().toLowerCase();

    if (["active", "activated", "enabled", "online", "đang hoạt động"].includes(value)) {
      return "active";
    }
    if (["away", "offline", "tạm vắng"].includes(value)) {
      return "away";
    }
    if (["pending", "inactive", "unactivated", "chưa kích hoạt", ""].includes(value)) {
      return "pending";
    }
    return "pending";
  }

  function createStatusHTML(status) {
    const config = {
      active: { text: "Đang hoạt động", className: "status-active" },
      away: { text: "Tạm vắng", className: "status-away" },
      pending: { text: "Chưa kích hoạt", className: "status-pending" }
    };
    const item = config[status] || config.pending;
    return `
      <span class="status ${item.className}">
        <i></i>
        ${item.text}
      </span>
    `;
  }

  /*ROLE*/

  function getRoleLabel(account) {
    if (isManager(account)) {
      return account.role || "Quản lý";
    }
    return account.role || "Customer Success";
  }

  /*DRAWER*/

  function openDrawer(account) {
    selectedAccount = account;
    if (!elements.accountDrawer) {
      return;
    }
    renderDrawer(account);
    elements.accountDrawer.classList.add("open");
    elements.accountDrawer.setAttribute("aria-hidden", "false");
    if (elements.drawerBackdrop) {
      elements.drawerBackdrop.hidden = false;
    }
    document.body.style.overflow = "hidden";
  }

  function closeDrawer() {
    selectedAccount = null;
    elements.accountDrawer?.classList.remove("open");
    elements.accountDrawer?.setAttribute("aria-hidden", "true");
    if (elements.drawerBackdrop) {
      elements.drawerBackdrop.hidden = true;
    }
    document.body.style.overflow = "";
  }

  /*DRAWER CONTENT*/

  function renderDrawer(account) {
    const name = escapeHTML(account.name || "Chưa có tên");
    const email = escapeHTML(account.email || "Chưa có email");
    const campus = escapeHTML(account.campus || account.campusId || "Chưa cập nhật");
    const department = escapeHTML(account.department || "Chưa phân công");
    const phone = escapeHTML(account.phone || "Chưa cập nhật");
    const role = escapeHTML(getRoleLabel(account));
    const uid = escapeHTML(account.uid || account.id || "—");
    const status = normalizeStatus(account.status);
    const initials = escapeHTML(getInitials(account.name || account.email));
    const joined = formatDateTime(account.createdAt || account.joined);
    const lastActive = formatDateTime(account.lastActive);

    elements.drawerContent.innerHTML = `
      <div class="detail-profile">
        <div class="detail-avatar">
          ${initials}
        </div>
        <div>
          <small>
            CUSTOMER SUCCESS
          </small>
          <strong>
            ${name}
          </strong>
          <span
            class="status ${getDrawerStatusClass(status)}"
            style="margin-top:7px;"
          >
            ${getStatusText(status)}
          </span>
        </div>
      </div>

      <h4>
        Thông tin tài khoản
      </h4>

      <div class="detail-grid">
        <div class="detail-field">
          <label>
            Email
          </label>
          <strong class="email">
            ${email}
          </strong>
        </div>
        <div class="detail-field">
          <label>
            Số điện thoại
          </label>
          <strong>
            ${phone}
          </strong>
        </div>
        <div class="detail-field">
          <label>
            Campus
          </label>
          <strong>
            ${campus}
          </strong>
        </div>
        <div class="detail-field">
          <label>
            Phòng ban
          </label>
          <strong>
            ${department}
          </strong>
        </div>
        <div class="detail-field">
          <label>
            Vai trò
          </label>
          <strong>
            ${role}
          </strong>
        </div>
        <div class="detail-field">
          <label>
            Ngày tham gia
          </label>
          <strong>
            ${joined}
          </strong>
        </div>
        <div class="detail-field full">
          <label>
            Hoạt động gần nhất
          </label>
          <strong>
            ${lastActive}
          </strong>
        </div>
      </div>

      <div class="drawer-actions">
        <button type="button" class="primary" data-drawer-action="toggle">
          ${status === "active" ? "Khóa tài khoản" : "Kích hoạt tài khoản"}
        </button>
        <button type="button" data-drawer-action="delete">
          Xóa tài khoản
        </button>
      </div>
    `;

    elements.drawerContent.querySelectorAll("[data-drawer-action]").forEach(button => {
      button.addEventListener("click", async () => {
        const action = button.dataset.drawerAction;
        if (action === "toggle") {
          await toggleAccount(account);
        }
        if (action === "delete") {
          await deleteAccount(account);
        }
      });
    });
  }

  /*ACCOUNT ACTION*/

  async function handleAccountAction(action, account) {
    if (action === "view") {
      openDrawer(account);
      return;
    }
  }

  /*TOGGLE ACCOUNT*/

  async function toggleAccount(account) {
    const current = normalizeStatus(account.status);
    const next = current === "active" ? "inactive" : "active";
    const confirmText =
      next === "active"
        ? `Kích hoạt tài khoản "${account.name || account.email}"?`
        : `Khóa tài khoản "${account.name || account.email}"?`;

    if (!window.confirm(confirmText)) {
      return;
    }

    try {
      const db = getFirestore();
      await db.collection(USERS_COLLECTION).doc(account.id).update({
        status: next,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      alert(next === "active" ? "Đã kích hoạt tài khoản." : "Đã khóa tài khoản.");
      closeDrawer();
    } catch (error) {
      console.error("toggleAccount:", error);
      alert("Không thể cập nhật tài khoản.");
    }
  }

  /*DELETE ACCOUNT*/

  async function deleteAccount(account) {
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa hồ sơ "${account.name || account.email}" khỏi Firestore?\n\nLưu ý: thao tác này chỉ xóa document users, không xóa tài khoản Firebase Authentication.`
    );

    if (!confirmed) {
      return;
    }

    try {
      const db = getFirestore();
      await db.collection(USERS_COLLECTION).doc(account.id).delete();
      alert("Đã xóa hồ sơ tài khoản.");
      closeDrawer();
    } catch (error) {
      console.error("deleteAccount:", error);
      alert("Không thể xóa tài khoản.");
    }
  }

  /*FIRESTORE*/

  function getFirestore() {
    if (window.db && typeof window.db.collection === "function") {
      return window.db;
    }
    if (typeof firebase !== "undefined" && firebase.firestore) {
      return firebase.firestore();
    }
    throw new Error("Firestore chưa được khởi tạo.");
  }

  /*RECORD INFO*/

  function updateRecordInfo() {
    const total = filteredAccounts.length;
    setText(elements.recordBadge, `${total} hồ sơ`);
    setText(elements.entriesNote, `Hiển thị ${total} / ${accounts.length} tài khoản`);
  }

  /* TABLE ERROR*/

  function showTableError(message) {
    if (!elements.accountBody) {
      return;
    }
    elements.accountBody.innerHTML = `
      <tr>
        <td
          colspan="6"
          class="loading-cell"
          style="
            padding:45px 20px;
            text-align:center;
            color:#b33c32;
          "
        >
          ${escapeHTML(message)}
        </td>
      </tr>
    `;
  }

  /*DATE*/

  function getTimestamp(value) {
    if (!value) {
      return 0;
    }
    if (typeof value.toMillis === "function") {
      return value.toMillis();
    }
    if (value instanceof Date) {
      return value.getTime();
    }
    if (typeof value === "number") {
      return value;
    }
    const date = new Date(value);
    return isNaN(date.getTime()) ? 0 : date.getTime();
  }

  function formatDate(value) {
    const timestamp = getTimestamp(value);
    if (!timestamp) {
      return "—";
    }
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }).format(new Date(timestamp));
  }

  function formatDateTime(value) {
    const timestamp = getTimestamp(value);
    if (!timestamp) {
      return "Chưa có dữ liệu";
    }
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date(timestamp));
  }

  /*INITIALS*/
  
  function getInitials(value) {
    if (!value) {
      return "CS";
    }
    const text = String(value).trim();
    if (!text) {
      return "CS";
    }
    const parts = text.split(/\s+/).filter(Boolean);
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  /*DRAWER STATUS*/

  function getStatusText(status) {
    const map = {
      active: "Đang hoạt động",
      away: "Tạm vắng",
      pending: "Chưa kích hoạt"
    };
    return map[status] || "Chưa kích hoạt";
  }

  function getDrawerStatusClass(status) {
    if (status === "active") {
      return "";
    }
    if (status === "away") {
      return "status-away";
    }
    return "pending";
  }

  /*SET TEXT*/

  function setText(element, value) {
    if (element) {
      element.textContent = value ?? "";
    }
  }

  /*ESCAPE HTML*/

  function escapeHTML(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function escapeAttribute(value) {
    return escapeHTML(value);
  }

  /*CLEANUP*/

  window.addEventListener("beforeunload", () => {
    if (unsubscribeAccounts) {
      unsubscribeAccounts();
    }
  });

})();