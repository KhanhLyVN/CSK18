/* =========================================================
   SYSTEM LOG - ADMIN
   =========================================================
   Firebase collection:
   systemLogs
   Compatible:
   - system-log.html
   - admin.css
   - system-log.css
   - firebase-config.js
   Features:
   - Realtime Firestore
   - Search
   - Type filter
   - Severity filter
   - Statistics
   - Detail drawer
   - Raw Firebase data
   - Admin information
   - Logout
   - Mobile sidebar
========================================================= */
(() => {
  "use strict";
  /* =======================================================
     CONFIG
  ======================================================= */
  const CONFIG = {
    COLLECTION: "systemLogs",
    LOGIN_PATH: "/login.html",
    MAX_LOGS: 1000,
    TOAST_TIME: 2500,
    REFRESH_DELAY: 500,
  };
  /* =======================================================
     STATE
  ======================================================= */
  const state = {
    logs: [],
    filtered: [],
    selected: null,
    unsubscribe: null,
    loading: false,
    initialized: false,
    firebaseReady: false,
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
    /*
     * Ưu tiên biến db từ firebase-config.js
     */
    try {
      if (typeof db !== "undefined" && db) {
        return db;
      }
    } catch (_) {}
    /*
     * Fallback Firebase Compat
     */
    try {
      if (
        typeof firebase !== "undefined" &&
        firebase.apps &&
        firebase.apps.length > 0
      ) {
        return firebase.firestore();
      }
    } catch (error) {
      console.error("Không thể khởi tạo Firestore:", error);
    }
    return null;
  }
  function getAuth() {
    /*
     * Ưu tiên biến auth từ firebase-config.js
     */
    try {
      if (typeof auth !== "undefined" && auth) {
        return auth;
      }
    } catch (_) {}
    /*
     * Fallback Firebase Auth
     */
    try {
      if (
        typeof firebase !== "undefined" &&
        firebase.apps &&
        firebase.apps.length > 0
      ) {
        return firebase.auth();
      }
    } catch (error) {
      console.error("Không thể khởi tạo Firebase Auth:", error);
    }
    return null;
  }
  /* =======================================================
     TOAST
  ======================================================= */
  function toast(message) {
    const node = $("toast");
    if (!node) return;
    node.textContent = String(message || "");
    node.hidden = false;
    clearTimeout(window.__systemLogToast);
    window.__systemLogToast = setTimeout(() => {
      node.hidden = true;
    }, CONFIG.TOAST_TIME);
  }
  /* =======================================================
     HTML ESCAPE
  ======================================================= */
  function escapeHtml(value) {
    if (value === null || value === undefined) {
      return "";
    }
    const div = document.createElement("div");
    div.textContent = String(value);
    return div.innerHTML;
  }
  /* =======================================================
     SAFE STRING
  ======================================================= */
  function safeString(value) {
    if (value === null || value === undefined) {
      return "";
    }
    if (typeof value === "string") {
      return value.trim();
    }
    if (typeof value === "number" || typeof value === "boolean") {
      return String(value);
    }
    try {
      return JSON.stringify(value);
    } catch (_) {
      return String(value);
    }
  }
  /* =======================================================
     GET FIRST VALID VALUE
  ======================================================= */
  function valueOf(object, ...keys) {
    if (!object) {
      return "";
    }
    for (const key of keys) {
      const value = object[key];
      if (value !== undefined && value !== null && safeString(value) !== "") {
        return value;
      }
    }
    return "";
  }
  /* =======================================================
     DATE
  ======================================================= */
  function toDate(value) {
    if (!value) {
      return null;
    }
    try {
      /*
       * Firestore Timestamp
       */
      if (typeof value.toDate === "function") {
        const date = value.toDate();
        if (date instanceof Date && !Number.isNaN(date.getTime())) {
          return date;
        }
      }
      /*
       * Firestore Timestamp millis
       */
      if (typeof value.toMillis === "function") {
        const millis = value.toMillis();
        const date = new Date(millis);
        if (!Number.isNaN(date.getTime())) {
          return date;
        }
      }
      /*
       * Firestore serialized timestamp
       */
      if (typeof value === "object") {
        if (typeof value.seconds === "number") {
          return new Date(
            value.seconds * 1000 +
              Math.floor((value.nanoseconds || 0) / 1000000),
          );
        }
        if (typeof value._seconds === "number") {
          return new Date(
            value._seconds * 1000 +
              Math.floor((value._nanoseconds || 0) / 1000000),
          );
        }
      }
      /*
       * Date
       */
      if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : value;
      }
      /*
       * Number
       */
      if (typeof value === "number") {
        const millis = value < 10000000000 ? value * 1000 : value;
        const date = new Date(millis);
        return Number.isNaN(date.getTime()) ? null : date;
      }
      /*
       * String
       */
      if (typeof value === "string") {
        const text = value.trim();
        if (!text) {
          return null;
        }
        /*
         * Numeric string
         */
        if (/^\d+$/.test(text)) {
          const number = Number(text);
          const millis = number < 10000000000 ? number * 1000 : number;
          const date = new Date(millis);
          return Number.isNaN(date.getTime()) ? null : date;
        }
        /*
         * ISO / normal date
         */
        const date = new Date(text);
        if (!Number.isNaN(date.getTime())) {
          return date;
        }
      }
    } catch (error) {
      console.warn("Không thể parse thời gian:", value, error);
    }
    return null;
  }
  function formatDateTime(value) {
    const date = toDate(value);
    if (!date) {
      return "—";
    }
    return date.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }
  function formatDate(value) {
    const date = toDate(value);
    if (!date) {
      return "—";
    }
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }
  /* =======================================================
     INITIALS
  ======================================================= */
  function initials(name) {
    const text = safeString(name) || "AD";
    const parts = text.split(/\s+/).filter(Boolean);
    if (!parts.length) {
      return "AD";
    }
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return parts
      .slice(-2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");
  }
  /* =======================================================
     NORMALIZE TYPE
  ======================================================= */
  function normalizeType(raw) {
    let type = valueOf(
      raw,
      "type",
      "actionType",
      "eventType",
      "action",
      "operation",
      "event",
    );
    type = safeString(type).toLowerCase().trim();
    /*
     * Login
     */
    if (
      type.includes("login") ||
      type.includes("sign_in") ||
      type.includes("signin") ||
      type.includes("sign-in") ||
      type === "auth_login"
    ) {
      return "login";
    }
    /*
     * Logout
     */
    if (
      type.includes("logout") ||
      type.includes("sign_out") ||
      type.includes("signout") ||
      type.includes("sign-out") ||
      type === "auth_logout"
    ) {
      return "logout";
    }
    /*
     * Create
     */
    if (
      type.includes("create") ||
      type.includes("add") ||
      type.includes("insert") ||
      type.includes("register")
    ) {
      return "create";
    }
    /*
     * Update
     */
    if (
      type.includes("update") ||
      type.includes("edit") ||
      type.includes("modify") ||
      type.includes("change")
    ) {
      return "update";
    }
    /*
     * Delete
     */
    if (
      type.includes("delete") ||
      type.includes("remove") ||
      type.includes("destroy")
    ) {
      return "delete";
    }
    /*
     * Error
     */
    if (
      type.includes("error") ||
      type.includes("exception") ||
      type.includes("failed") ||
      type.includes("failure")
    ) {
      return "error";
    }
    return type || "update";
  }
  /* =======================================================
     TYPE LABEL
  ======================================================= */
  const CS_LOG_LABELS = {
    message: "CS phản hồi ticket",
    claim_ticket: "CS nhận ticket",
    complete_ticket: "CS hoàn thành ticket",
    update_status: "CS cập nhật trạng thái",
  };
  function typeLabel(type) {
    const labels = {
      login: "Đăng nhập",
      logout: "Đăng xuất",
      create: "Tạo dữ liệu",
      update: "Cập nhật",
      delete: "Xóa dữ liệu",
      error: "Lỗi",
    };
    return labels[type] || type || "Cập nhật";
  }
  /* =======================================================
     SEVERITY
  ======================================================= */
  function normalizeSeverity(raw, type) {
    let severity = valueOf(raw, "severity", "level", "logLevel", "priority");
    severity = safeString(severity).toLowerCase().trim();
    /*
     * Error
     */
    if (["error", "danger", "critical", "fatal", "failed"].includes(severity)) {
      return "error";
    }
    /*
     * Warning
     */
    if (["warning", "warn", "caution"].includes(severity)) {
      return "warning";
    }
    /*
     * Type error => error
     */
    if (type === "error") {
      return "error";
    }
    /*
     * Delete => warning
     */
    if (type === "delete") {
      return "warning";
    }
    return "info";
  }
  function severityLabel(severity) {
    const labels = {
      info: "Thông tin",
      warning: "Cảnh báo",
      error: "Lỗi",
    };
    return labels[severity] || "Thông tin";
  }
  /* =======================================================
     OBJECT NAME
  ======================================================= */
  function normalizeObject(raw) {
    const object = valueOf(
      raw,
      "object",
      "target",
      "collection",
      "resource",
      "targetType",
      "entity",
      "module",
    );
    if (!object) {
      return "System";
    }
    /*
     * Nếu object là object Firebase
     */
    if (typeof object === "object") {
      return (
        valueOf(object, "name", "type", "collection", "resource") || "System"
      );
    }
    return safeString(object);
  }
  /* =======================================================
     OBJECT ID
  ======================================================= */
  function normalizeObjectId(raw) {
    const objectId = valueOf(
      raw,
      "objectId",
      "targetId",
      "resourceId",
      "documentId",
      "docId",
      "entityId",
    );
    if (typeof objectId === "object") {
      return valueOf(objectId, "id", "value") || "";
    }
    return safeString(objectId);
  }
  /* =======================================================
     DESCRIPTION
  ======================================================= */
  function normalizeDescription(raw, type) {
    const description = valueOf(
      raw,
      "description",
      "message",
      "details",
      "detail",
      "reason",
      "summary",
    );
    if (!description) {
      return typeLabel(type);
    }
    return safeString(description);
  }
  /* =======================================================
     NORMALIZE LOG
  ======================================================= */
  function normalizeLog(doc) {
    const data = typeof doc.data === "function" ? doc.data() || {} : {};
    const raw = {
      ...data,
      id: doc.id,
    };
    const type = normalizeType(raw);
    const severity = normalizeSeverity(raw, type);
    /*
     * User
     */
    const userName =
      safeString(
        valueOf(
          raw,
          "userName",
          "displayName",
          "name",
          "adminName",
          "actorName",
          "fullName",
          "email",
        ),
      ) || "System";
    const userEmail =
      safeString(valueOf(raw, "userEmail", "email", "actorEmail")) || "—";
    /*
     * Timestamp
     */
    const timestamp = valueOf(
      raw,
      "createdAt",
      "timestamp",
      "time",
      "loggedAt",
      "date",
      "updatedAt",
      "created_at",
    );
    const date = toDate(timestamp);
    /*
     * Object
     */
    const object = normalizeObject(raw);
    const objectId = normalizeObjectId(raw);
    /*
     * Description
     */
    const description = normalizeDescription(raw, type);
    return {
      ...raw,
      id: doc.id,
      type,
      typeText: typeLabel(type),
      severity,
      severityText: severityLabel(severity),
      userName,
      userEmail,
      avatar: initials(userName),
      object,
      objectId,
      description,
      timestamp,
      date,
      timeLabel: formatDateTime(timestamp),
    };
  }
  /* =======================================================
     SORT
  ======================================================= */
  function sortLogs(logs) {
    return logs.sort((a, b) => {
      const timeA = a.date ? a.date.getTime() : 0;
      const timeB = b.date ? b.date.getTime() : 0;
      /*
       * Mới nhất trước
       */
      return timeB - timeA;
    });
  }
  /* =======================================================
     STATISTICS
  ======================================================= */
  function renderStats() {
    const total = state.logs.length;
    const today = new Date();
    /*
     * Today's logs
     */
    const todayCount = state.logs.filter((item) => {
      if (!item.date) {
        return false;
      }
      return (
        item.date.getDate() === today.getDate() &&
        item.date.getMonth() === today.getMonth() &&
        item.date.getFullYear() === today.getFullYear()
      );
    }).length;
    /*
     * Admin logs
     *
     * Ưu tiên role nếu tồn tại.
     */
    const adminCount = state.logs.filter((item) => {
      const role = safeString(
        valueOf(item, "role", "userRole", "actorRole"),
      ).toLowerCase();
      if (role.includes("admin")) {
        return true;
      }
      const text = [item.userName, item.userEmail].join(" ").toLowerCase();
      return text.includes("admin") || text.includes("administrator");
    }).length;
    /*
     * Error logs
     */
    const errorCount = state.logs.filter(
      (item) => item.severity === "error",
    ).length;
    /*
     * Render
     */
    if ($("totalLogs")) {
      $("totalLogs").textContent = total;
    }
    if ($("todayLogs")) {
      $("todayLogs").textContent = todayCount;
    }
    if ($("adminLogs")) {
      $("adminLogs").textContent = adminCount;
    }
    if ($("errorLogs")) {
      $("errorLogs").textContent = errorCount;
    }
    if ($("recordBadge")) {
      $("recordBadge").textContent = `${total} log`;
    }
  }
  /* =======================================================
     RENDER EMPTY
  ======================================================= */
  function renderEmpty(message = "Không có nhật ký.") {
    const body = $("logBody");
    if (!body) {
      return;
    }
    body.innerHTML = `
      <tr>
        <td
          colspan="6"
          class="empty-cell"
        >
          ${escapeHtml(message)}
        </td>
      </tr>
    `;
    if ($("entriesNote")) {
      $("entriesNote").textContent = "Hiển thị 0 log";
    }
  }
  /* =======================================================
     RENDER LOADING
  ======================================================= */
  function renderLoading() {
    const body = $("logBody");
    if (!body) {
      return;
    }
    body.innerHTML = `
      <tr>
        <td
          colspan="6"
          class="loading-cell"
        >
          Đang tải nhật ký hệ thống...
        </td>
      </tr>
    `;
  }
  /* =======================================================
     RENDER TABLE
  ======================================================= */
  function renderTable() {
    const body = $("logBody");
    if (!body) {
      return;
    }
    if (!state.filtered.length) {
      renderEmpty(
        state.logs.length
          ? "Không tìm thấy nhật ký phù hợp."
          : "Chưa có nhật ký hệ thống.",
      );
      return;
    }
    body.innerHTML = state.filtered
      .map((item) => {
        const id = escapeHtml(item.id);
        const objectId = item.objectId
          ? `
                <small>
                  ${escapeHtml(item.objectId)}
                </small>
              `
          : "";
        return `
            <tr
              data-log-id="${id}"
              tabindex="0"
              role="button"
              aria-label="Xem chi tiết log"
            >
              <!-- TIME -->
              <td>
                <div class="log-time">
                  ${escapeHtml(item.timeLabel)}
                </div>
              </td>
              <!-- USER -->
              <td>
                <div class="log-user">
                  <div class="log-user-info">
                    <strong>
                      ${escapeHtml(item.userName)}
                    </strong>
                    <small>
                      ${escapeHtml(item.userEmail)}
                    </small>
                  </div>
                </div>
              </td>
              <!-- ACTION -->
              <td>
                <div class="log-action">
                  <strong>
                    ${escapeHtml(item.typeText)}
                  </strong>
                </div>
              </td>
              <!-- OBJECT -->
              <td>
                <div class="log-object">
                  <code>
                    ${escapeHtml(item.object)}
                  </code>
                  ${objectId}
                </div>
              </td>
              <!-- SEVERITY -->
              <td>
                <span
                  class="
                    log-severity
                    log-severity-${escapeHtml(item.severity)}
                  "
                >
                  ${escapeHtml(item.severityText)}
                </span>
              </td>
              <!-- DETAIL -->
              <td>
                <button
                  type="button"
                  class="log-detail-btn"
                  data-log-detail="${id}"
                  title="Xem chi tiết"
                  aria-label="Xem chi tiết"
                >
                  ›
                </button>
              </td>
            </tr>
          `;
      })
      .join("");
    /*
     * Row click
     */
    body.querySelectorAll("tr[data-log-id]").forEach((row) => {
      row.addEventListener("click", () => {
        const item = findLog(row.dataset.logId);
        openDrawer(item);
      });
      /*
       * Keyboard
       */
      row.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          const item = findLog(row.dataset.logId);
          openDrawer(item);
        }
      });
    });
    /*
     * Detail buttons
     */
    body.querySelectorAll("[data-log-detail]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        const item = findLog(button.dataset.logDetail);
        openDrawer(item);
      });
    });
    /*
     * Footer
     */
    if ($("entriesNote")) {
      $("entriesNote").textContent =
        `Hiển thị ${state.filtered.length} / ${state.logs.length} log`;
    }
  }
  /* =======================================================
     FIND LOG
  ======================================================= */
  function findLog(id) {
    if (!id) {
      return null;
    }
    return state.logs.find((item) => String(item.id) === String(id)) || null;
  }
  /* =======================================================
     SEARCH TEXT
  ======================================================= */
  function normalizeSearchText(value) {
    return safeString(value)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }
  /* =======================================================
     FILTER
  ======================================================= */
  function applyFilters() {
    const searchNode = $("searchInput");
    const typeNode = $("typeFilter");
    const severityNode = $("severityFilter");
    const query = normalizeSearchText(searchNode ? searchNode.value : "");
    const type = typeNode ? typeNode.value : "all";
    const severity = severityNode ? severityNode.value : "all";
    state.filtered = state.logs.filter((item) => {
      const searchable = normalizeSearchText(
        [
          item.id,
          item.userName,
          item.userEmail,
          item.type,
          item.typeText,
          item.object,
          item.objectId,
          item.description,
          item.severity,
          item.severityText,
          item.role,
          item.userRole,
          item.actorRole,
        ].join(" "),
      );
      const matchesSearch = !query || searchable.includes(query);
      const matchesType = type === "all" || item.type === type;
      const matchesSeverity = severity === "all" || item.severity === severity;
      return matchesSearch && matchesType && matchesSeverity;
    });
    renderTable();
  }
  /* =======================================================
     DRAWER
  ======================================================= */
  function openDrawer(item) {
    if (!item) {
      return;
    }
    state.selected = item;
    const content = $("drawerContent");
    if (!content) {
      return;
    }
    const ticketNumber = item.ticketNum || item.objectId || "—";
    const ticketTitle = item.ticketTitle || item.title || "—";
    const studentName = item.studentName || "—";
    const actorRole =
      item.actorRole === "cs"
        ? "Customer Success"
        : item.actorRole || item.userRole || "Admin";
    const department = item.departmentCode || "—";
    const campus = item.campus || "—";
    const actionMessage =
      item.detail || item.message || item.description || "—";
    content.innerHTML = `
      <div class="log-detail-hero">
        <div class="log-detail-icon">${escapeHtml(item.avatar)}</div>
        <div class="log-detail-hero-copy">
          <span class="log-detail-eyebrow">HOẠT ĐỘNG HỆ THỐNG</span>
          <h3>${escapeHtml(item.typeText)}</h3>
          <p>${escapeHtml(item.timeLabel)}</p>
        </div>
        <span class="log-detail-severity log-detail-severity-${escapeHtml(item.severity)}">${escapeHtml(item.severityText)}</span>
      </div>
      <div class="log-detail-summary">
        <div class="log-detail-summary-label">NỘI DUNG HOẠT ĐỘNG</div>
        <p>${escapeHtml(actionMessage)}</p>
      </div>
      <div class="log-detail-section-title">THÔNG TIN TICKET</div>
      <div class="log-detail-grid">
        <div class="log-detail-box highlight">
          <small>Mã ticket</small>
          <strong><code>${escapeHtml(ticketNumber)}</code></strong>
        </div>
        <div class="log-detail-box highlight">
          <small>Học viên</small>
          <strong>${escapeHtml(studentName)}</strong>
        </div>
        <div class="log-detail-box full">
          <small>Tiêu đề ticket</small>
          <strong>${escapeHtml(ticketTitle)}</strong>
        </div>
        <div class="log-detail-box">
          <small>Phòng ban</small>
          <strong>${escapeHtml(department)}</strong>
        </div>
        <div class="log-detail-box">
          <small>Cơ sở</small>
          <strong>${escapeHtml(campus)}</strong>
        </div>
      </div>
      <div class="log-detail-section-title">NGƯỜI THỰC HIỆN</div>
      <div class="log-detail-grid">
        <div class="log-detail-box">
          <small>Họ tên</small>
          <strong>${escapeHtml(item.userName || item.actorName || "—")}</strong>
        </div>
        <div class="log-detail-box">
          <small>Vai trò</small>
          <strong>${escapeHtml(actorRole)}</strong>
        </div>
        <div class="log-detail-box full">
          <small>Email</small>
          <strong>${escapeHtml(item.userEmail || item.actorEmail || "—")}</strong>
        </div>
        <div class="log-detail-box full">
          <small>Thời gian</small>
          <strong>${escapeHtml(item.timeLabel)}</strong>
        </div>
      </div>
      <details class="log-raw log-raw-collapsible">
        <summary class="log-raw-title">Xem dữ liệu Firebase</summary>
        <pre>${escapeHtml(safeJsonStringify(item))}</pre>
      </details>
    `;
    const drawer = $("logDrawer");
    const backdrop = $("drawerBackdrop");
    if (drawer) {
      drawer.classList.add("open");
      drawer.setAttribute("aria-hidden", "false");
    }
    if (backdrop) {
      backdrop.hidden = false;
    }
    /*
     * Prevent body scroll
     */
    document.body.classList.add("drawer-open");
  }
  /* =======================================================
     SAFE JSON
  ======================================================= */
  function safeJsonStringify(object) {
    try {
      return JSON.stringify(object, firebaseReplacer, 2);
    } catch (error) {
      console.warn("Không thể stringify log:", error);
      try {
        return JSON.stringify(object, null, 2);
      } catch (_) {
        return String(object);
      }
    }
  }
  /* =======================================================
     FIREBASE JSON REPLACER
  ======================================================= */
  function firebaseReplacer(key, value) {
    /*
     * Firestore Timestamp
     */
    if (value && typeof value.toDate === "function") {
      return formatDateTime(value);
    }
    /*
     * Date
     */
    if (value instanceof Date) {
      return formatDateTime(value);
    }
    /*
     * Timestamp serialized
     */
    if (
      value &&
      typeof value === "object" &&
      typeof value.seconds === "number"
    ) {
      return formatDateTime(value);
    }
    return value;
  }
  /* =======================================================
     CLOSE DRAWER
  ======================================================= */
  function closeDrawer() {
    const drawer = $("logDrawer");
    const backdrop = $("drawerBackdrop");
    if (drawer) {
      drawer.classList.remove("open");
      drawer.setAttribute("aria-hidden", "true");
    }
    if (backdrop) {
      backdrop.hidden = true;
    }
    state.selected = null;
    document.body.classList.remove("drawer-open");
  }
  /* =======================================================
     FIREBASE ERROR
  ======================================================= */
  function showFirebaseError(message) {
    setConnection(false, "Không thể tải log");
    renderEmpty(message || "Không thể tải nhật ký hệ thống.");
  }
  /* =======================================================
     CONNECTION UI
  ======================================================= */
  function setConnection(connected, label) {
    const dot = $("connectionDot");
    const labelNode = $("connectionLabel");
    if (dot) {
      dot.classList.toggle("live", Boolean(connected));
    }
    if (labelNode) {
      labelNode.textContent =
        label || (connected ? "Firebase đã kết nối" : "Mất kết nối");
    }
  }
  /* =======================================================
     FIRESTORE SNAPSHOT
  ======================================================= */
  function handleSnapshot(snapshot) {
    try {
      let logs = snapshot.docs.map(normalizeLog);
      /*
       * Sort
       */
      sortLogs(logs);
      /*
       * Giới hạn số log trên client
       */
      if (CONFIG.MAX_LOGS && logs.length > CONFIG.MAX_LOGS) {
        logs = logs.slice(0, CONFIG.MAX_LOGS);
      }
      state.logs = logs;
      /*
       * Nếu drawer đang mở,
       * cập nhật lại selected item
       */
      if (state.selected) {
        const updated = findLog(state.selected.id);
        if (updated) {
          state.selected = updated;
        }
      }
      renderStats();
      applyFilters();
      setConnection(true, "Firebase đã kết nối");
      state.firebaseReady = true;
    } catch (error) {
      console.error("Lỗi xử lý System Logs:", error);
      showFirebaseError("Có lỗi khi xử lý dữ liệu nhật ký.");
    }
  }
  /* =======================================================
     FIRESTORE
  ======================================================= */
  function setupFirebase() {
    /*
     * Nếu đã subscribe thì hủy trước
     */
    if (typeof state.unsubscribe === "function") {
      try {
        state.unsubscribe();
      } catch (_) {}
      state.unsubscribe = null;
    }
    const database = getFirestore();
    if (!database) {
      state.firebaseReady = false;
      setConnection(false, "Chưa tìm thấy Firebase");
      showFirebaseError("Không tìm thấy kết nối Firebase.");
      return;
    }
    renderLoading();
    /*
     * Realtime listener
     */
    try {
      state.unsubscribe = database
        .collection(CONFIG.COLLECTION)
        .onSnapshot(handleSnapshot, (error) => {
          console.error("System Logs Firestore error:", error);
          state.firebaseReady = false;
          setConnection(false, "Không thể tải log");
          /*
           * Permission denied
           */
          if (
            error &&
            (error.code === "permission-denied" ||
              error.code === "unauthenticated")
          ) {
            showFirebaseError("Không có quyền đọc System Log trong Firebase.");
          } else {
            showFirebaseError("Không thể tải nhật ký hệ thống.");
          }
          toast("Không thể tải System Log");
        });
    } catch (error) {
      console.error("Không thể đăng ký listener:", error);
      state.firebaseReady = false;
      showFirebaseError("Không thể kết nối tới System Log.");
    }
  }
  /* =======================================================
     MANUAL REFRESH
  ======================================================= */
  async function refreshLogs() {
    const button = $("refreshBtn");
    if (!button) {
      return;
    }
    if (state.loading) {
      return;
    }
    state.loading = true;
    const originalText = button.textContent;
    button.classList.add("loading");
    button.disabled = true;
    button.textContent = "↻ Đang tải...";
    try {
      /*
       * Nếu Firebase chưa sẵn sàng
       */
      if (!state.firebaseReady) {
        setupFirebase();
      } else {
        /*
         * Đọc snapshot mới ngay lập tức.
         *
         * Listener realtime vẫn giữ nguyên.
         */
        const database = getFirestore();
        if (database) {
          const snapshot = await database.collection(CONFIG.COLLECTION).get();
          handleSnapshot(snapshot);
        }
      }
      await new Promise((resolve) => setTimeout(resolve, CONFIG.REFRESH_DELAY));
      toast("Đã làm mới nhật ký");
    } catch (error) {
      console.error("Refresh System Logs error:", error);
      toast("Không thể làm mới nhật ký");
    } finally {
      state.loading = false;
      button.classList.remove("loading");
      button.disabled = false;
      button.textContent = originalText || "↻ Làm mới";
    }
  }
  /* =======================================================
     CURRENT ADMIN
  ======================================================= */
  async function loadCurrentAdmin() {
    const firebaseAuth = getAuth();
    if (!firebaseAuth) {
      console.warn("Firebase Auth chưa sẵn sàng.");
      return;
    }
    /*
     * Nếu currentUser chưa có,
     * chờ Auth state.
     */
    const loadUser = async (currentUser) => {
      if (!currentUser) {
        return;
      }
      let name =
        currentUser.displayName || currentUser.email || "Administrator";
      let role = "System Admin";
      const database = getFirestore();
      if (database) {
        try {
          /*
           * users/{uid}
           */
          const userDoc = await database
            .collection("users")
            .doc(currentUser.uid)
            .get();
          if (userDoc.exists) {
            const data = userDoc.data() || {};
            name =
              safeString(
                valueOf(data, "name", "displayName", "fullName", "userName"),
              ) || name;
            role =
              safeString(valueOf(data, "role", "position", "roleLabel")) ||
              role;
          }
        } catch (error) {
          console.warn("Không thể lấy thông tin Admin:", error);
        }
      }
      /*
       * Topbar
       */
      if ($("topAdminName")) {
        $("topAdminName").textContent = name;
      }
      /*
       * Shared sidebar
       */
      if ($("sidebarUserName")) {
        $("sidebarUserName").textContent = name;
      }
      if ($("sidebarUserRole")) {
        $("sidebarUserRole").textContent = role;
      }
      if ($("sidebarAvatar")) {
        $("sidebarAvatar").textContent = initials(name);
      }
    };
    /*
     * Nếu user đã login
     */
    if (firebaseAuth.currentUser) {
      await loadUser(firebaseAuth.currentUser);
      return;
    }
    /*
     * Chờ Firebase Auth
     */
    try {
      await new Promise((resolve) => {
        let finished = false;
        const unsubscribe = firebaseAuth.onAuthStateChanged(async (user) => {
          if (finished) {
            return;
          }
          finished = true;
          try {
            await loadUser(user);
          } finally {
            unsubscribe();
            resolve();
          }
        });
      });
    } catch (error) {
      console.warn("Auth state error:", error);
    }
  }
  /* =======================================================
     LOGOUT
  ======================================================= */
  async function logout() {
    const firebaseAuth = getAuth();
    if (!firebaseAuth) {
      toast("Firebase Auth chưa sẵn sàng");
      return;
    }
    try {
      await firebaseAuth.signOut();
      toast("Đã đăng xuất");
      setTimeout(() => {
        window.location.href = CONFIG.LOGIN_PATH;
      }, 500);
    } catch (error) {
      console.error("Logout error:", error);
      toast("Đăng xuất thất bại");
    }
  }
  /* =======================================================
     MOBILE SIDEBAR
  ======================================================= */
  function setupMobileMenu() {
    const menuBtn = $("menuBtn");
    const sidebar = $("adminSidebar");
    const backdrop = $("adminSidebarBackdrop");
    if (!menuBtn || !sidebar) {
      return;
    }
    /*
     * Tránh duplicate listener
     */
    if (menuBtn.dataset.systemLogBound === "true") {
      return;
    }
    menuBtn.dataset.systemLogBound = "true";
    menuBtn.addEventListener("click", () => {
      const open = sidebar.classList.toggle("open");
      if (backdrop) {
        backdrop.hidden = !open;
      }
    });
    if (backdrop) {
      backdrop.addEventListener("click", () => {
        sidebar.classList.remove("open");
        backdrop.hidden = true;
      });
    }
  }
  /* =======================================================
     SIDEBAR ACTIVE
  ======================================================= */
  function setupSidebar() {
    const currentPath = window.location.pathname.toLowerCase();
    document.querySelectorAll(".admin-nav-item[data-page]").forEach((item) => {
      const page = String(item.dataset.page || "").toLowerCase();
      let active = false;
      /*
       * Overview
       */
      if (
        page === "overview" &&
        (currentPath.includes("homepage-ad") || currentPath.endsWith("/admin/"))
      ) {
        active = true;
      }
      /*
       * Reports
       */
      if (
        page === "reports" &&
        (currentPath.includes("activity-report") ||
          currentPath.includes("report"))
      ) {
        active = true;
      }
      /*
       * Settings
       */
      if (page === "settings" && currentPath.includes("settings")) {
        active = true;
      }
      /*
       * Logs
       */
      if (
        page === "logs" &&
        (currentPath.includes("system-log") ||
          currentPath.includes("systemlog"))
      ) {
        active = true;
      }
      item.classList.toggle("active", active);
    });
  }
  /* =======================================================
     EVENTS
  ======================================================= */
  function setupEvents() {
    /*
     * Search
     */
    const search = $("searchInput");
    if (search && search.dataset.systemLogBound !== "true") {
      search.dataset.systemLogBound = "true";
      search.addEventListener("input", applyFilters);
    }
    /*
     * Type
     */
    const typeFilter = $("typeFilter");
    if (typeFilter && typeFilter.dataset.systemLogBound !== "true") {
      typeFilter.dataset.systemLogBound = "true";
      typeFilter.addEventListener("change", applyFilters);
    }
    /*
     * Severity
     */
    const severityFilter = $("severityFilter");
    if (severityFilter && severityFilter.dataset.systemLogBound !== "true") {
      severityFilter.dataset.systemLogBound = "true";
      severityFilter.addEventListener("change", applyFilters);
    }
    /*
     * Clear filters
     */
    const clear = $("clearFilters");
    if (clear && clear.dataset.systemLogBound !== "true") {
      clear.dataset.systemLogBound = "true";
      clear.addEventListener("click", () => {
        if (search) {
          search.value = "";
        }
        if (typeFilter) {
          typeFilter.value = "all";
        }
        if (severityFilter) {
          severityFilter.value = "all";
        }
        applyFilters();
      });
    }
    /*
     * Refresh
     */
    const refresh = $("refreshBtn");
    if (refresh && refresh.dataset.systemLogBound !== "true") {
      refresh.dataset.systemLogBound = "true";
      refresh.addEventListener("click", refreshLogs);
    }
    /*
     * Close drawer
     */
    const close = $("closeDrawer");
    if (close && close.dataset.systemLogBound !== "true") {
      close.dataset.systemLogBound = "true";
      close.addEventListener("click", closeDrawer);
    }
    /*
     * Backdrop
     */
    const backdrop = $("drawerBackdrop");
    if (backdrop && backdrop.dataset.systemLogBound !== "true") {
      backdrop.dataset.systemLogBound = "true";
      backdrop.addEventListener("click", closeDrawer);
    }
    /*
     * Notification
     */
    const notice = $("noticeBtn");
    if (notice && notice.dataset.systemLogBound !== "true") {
      notice.dataset.systemLogBound = "true";
      notice.addEventListener("click", () => {
        toast("Không có thông báo mới");
      });
    }
    /*
     * Logout
     */
    const logoutButton = $("sidebarLogoutBtn");
    if (logoutButton && logoutButton.dataset.systemLogBound !== "true") {
      logoutButton.dataset.systemLogBound = "true";
      logoutButton.addEventListener("click", logout);
    }
    /*
     * Mobile
     */
    setupMobileMenu();
    /*
     * Sidebar
     */
    setupSidebar();
  }
  /* =======================================================
     KEYBOARD
  ======================================================= */
  function setupKeyboard() {
    if (document.body.dataset.systemLogKeyboard === "true") {
      return;
    }
    document.body.dataset.systemLogKeyboard = "true";
    document.addEventListener("keydown", (event) => {
      /*
       * ESC đóng drawer
       */
      if (event.key === "Escape") {
        const drawer = $("logDrawer");
        if (drawer && drawer.classList.contains("open")) {
          closeDrawer();
        }
      }
    });
  }
  /* =======================================================
     CLEANUP
  ======================================================= */
  function cleanup() {
    if (typeof state.unsubscribe === "function") {
      try {
        state.unsubscribe();
      } catch (_) {}
    }
    state.unsubscribe = null;
  }
  window.addEventListener("beforeunload", cleanup);
  /* =======================================================
     INIT
  ======================================================= */
  async function init() {
    /*
     * Không init nhiều lần
     */
    if (state.initialized) {
      return;
    }
    state.initialized = true;
    /*
     * Events
     */
    setupEvents();
    /*
     * Keyboard
     */
    setupKeyboard();
    /*
     * Admin
     */
    loadCurrentAdmin();
    /*
     * Firebase
     */
    setupFirebase();
  }
  /* =======================================================
     START
  ======================================================= */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, {
      once: true,
    });
  } else {
    init();
  }
})();
