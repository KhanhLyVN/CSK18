/* =========================================================
   SYSTEM LOG
   ADMIN
   Firebase collection: systemLogs

   HTML tương thích:
   - system-log.html
   - admin.css
   - system-log.css
========================================================= */

(() => {
  "use strict";

  /* =======================================================
     STATE
  ======================================================= */

  const state = {
    logs: [],
    filtered: [],
    selected: null,
    unsubscribe: null,
    loading: false
  };


  /* =======================================================
     DOM
  ======================================================= */

  const $ = (id) => document.getElementById(id);


  /* =======================================================
     FIREBASE
  ======================================================= */

  function getFirestore() {

    if (typeof db !== "undefined" && db) {
      return db;
    }

    if (
      typeof firebase !== "undefined" &&
      firebase.apps &&
      firebase.apps.length
    ) {
      return firebase.firestore();
    }

    return null;
  }


  function getAuth() {

    if (typeof auth !== "undefined" && auth) {
      return auth;
    }

    if (
      typeof firebase !== "undefined" &&
      firebase.apps &&
      firebase.apps.length
    ) {
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

    clearTimeout(window.__systemLogToast);

    window.__systemLogToast =
      setTimeout(() => {
        node.hidden = true;
      }, 2500);
  }


  /* =======================================================
     ESCAPE HTML
  ======================================================= */

  function escapeHtml(value) {

    const div =
      document.createElement("div");

    div.textContent =
      value === null ||
      value === undefined
        ? ""
        : String(value);

    return div.innerHTML;
  }


  /* =======================================================
     VALUE
  ======================================================= */

  function valueOf(object, ...keys) {

    if (!object) return "";

    for (const key of keys) {

      if (
        object[key] !== undefined &&
        object[key] !== null &&
        String(object[key]).trim() !== ""
      ) {
        return object[key];
      }
    }

    return "";
  }


  /* =======================================================
     DATE
  ======================================================= */

  function toDate(value) {

    if (!value) return null;

    try {

      if (
        value &&
        typeof value.toDate === "function"
      ) {
        return value.toDate();
      }

      if (
        value &&
        typeof value.toMillis === "function"
      ) {
        return new Date(value.toMillis());
      }

      if (value instanceof Date) {
        return value;
      }

      const date =
        new Date(value);

      if (
        Number.isNaN(date.getTime())
      ) {
        return null;
      }

      return date;

    } catch {
      return null;
    }
  }


  function formatDateTime(value) {

    const date = toDate(value);

    if (!date) return "—";

    return date.toLocaleString(
      "vi-VN",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      }
    );
  }


  function formatDate(value) {

    const date = toDate(value);

    if (!date) return "—";

    return date.toLocaleDateString(
      "vi-VN"
    );
  }


  /* =======================================================
     INITIALS
  ======================================================= */

  function initials(name) {

    const text =
      String(name || "AD")
        .trim();

    if (!text) return "AD";

    const parts =
      text
        .split(/\s+/)
        .filter(Boolean);

    if (parts.length === 1) {

      return parts[0]
        .substring(0, 2)
        .toUpperCase();
    }

    return parts
      .slice(-2)
      .map(
        part =>
          part.charAt(0)
      )
      .join("")
      .toUpperCase();
  }


  /* =======================================================
     NORMALIZE TYPE
  ======================================================= */

  function normalizeType(raw) {

    const type =
      String(
        valueOf(
          raw,
          "type",
          "actionType",
          "eventType",
          "action"
        ) || ""
      )
        .toLowerCase()
        .trim();

    if (
      type.includes("login") ||
      type.includes("sign_in") ||
      type.includes("signin")
    ) {
      return "login";
    }

    if (
      type.includes("logout") ||
      type.includes("sign_out") ||
      type.includes("signout")
    ) {
      return "logout";
    }

    if (
      type.includes("create") ||
      type.includes("add")
    ) {
      return "create";
    }

    if (
      type.includes("update") ||
      type.includes("edit")
    ) {
      return "update";
    }

    if (
      type.includes("delete") ||
      type.includes("remove")
    ) {
      return "delete";
    }

    if (
      type.includes("error") ||
      type.includes("exception")
    ) {
      return "error";
    }

    return type || "update";
  }


  /* =======================================================
     TYPE LABEL
  ======================================================= */

  function typeLabel(type) {

    const labels = {

      login: "Đăng nhập",

      logout: "Đăng xuất",

      create: "Tạo dữ liệu",

      update: "Cập nhật",

      delete: "Xóa dữ liệu",

      error: "Lỗi"
    };

    return labels[type] || type;
  }


  /* =======================================================
     SEVERITY
  ======================================================= */

  function normalizeSeverity(raw, type) {

    const severity =
      String(
        valueOf(
          raw,
          "severity",
          "level",
          "logLevel"
        ) || ""
      )
        .toLowerCase()
        .trim();

    if (
      ["error", "danger", "critical"]
        .includes(severity)
    ) {
      return "error";
    }

    if (
      ["warning", "warn"]
        .includes(severity)
    ) {
      return "warning";
    }

    if (type === "error") {
      return "error";
    }

    if (
      ["delete"]
        .includes(type)
    ) {
      return "warning";
    }

    return "info";
  }


  function severityLabel(severity) {

    const labels = {

      info: "Thông tin",

      warning: "Cảnh báo",

      error: "Lỗi"
    };

    return (
      labels[severity] ||
      "Thông tin"
    );
  }


  /* =======================================================
     NORMALIZE LOG
  ======================================================= */

  function normalizeLog(doc) {

    const raw = {
      id: doc.id,
      ...doc.data()
    };


    const type =
      normalizeType(raw);


    const severity =
      normalizeSeverity(
        raw,
        type
      );


    const userName =
      valueOf(
        raw,
        "userName",
        "displayName",
        "name",
        "adminName",
        "email"
      ) || "System";


    const userEmail =
      valueOf(
        raw,
        "userEmail",
        "email",
        "actorEmail"
      ) || "—";


    const timestamp =
      valueOf(
        raw,
        "createdAt",
        "timestamp",
        "time",
        "loggedAt",
        "date"
      );


    const object =
      valueOf(
        raw,
        "object",
        "target",
        "collection",
        "resource",
        "targetType"
      ) || "System";


    const objectId =
      valueOf(
        raw,
        "objectId",
        "targetId",
        "resourceId",
        "documentId"
      );


    const description =
      valueOf(
        raw,
        "description",
        "message",
        "details",
        "detail"
      ) || typeLabel(type);


    return {

      ...raw,

      id: doc.id,

      type,

      typeText:
        typeLabel(type),

      severity,

      severityText:
        severityLabel(severity),

      userName,

      userEmail,

      avatar:
        initials(userName),

      object,

      objectId,

      description,

      timestamp,

      date:
        toDate(timestamp),

      timeLabel:
        formatDateTime(timestamp)
    };
  }


  /* =======================================================
     SORT
  ======================================================= */

  function sortLogs(logs) {

    logs.sort(
      (a, b) => {

        const dateA =
          a.date
            ? a.date.getTime()
            : 0;

        const dateB =
          b.date
            ? b.date.getTime()
            : 0;

        return dateB - dateA;
      }
    );

    return logs;
  }


  /* =======================================================
     STATS
  ======================================================= */

  function renderStats() {

    const total =
      state.logs.length;


    const today =
      new Date();


    const todayLogs =
      state.logs.filter(
        item => {

          if (!item.date) {
            return false;
          }

          return (
            item.date.getDate() ===
              today.getDate() &&

            item.date.getMonth() ===
              today.getMonth() &&

            item.date.getFullYear() ===
              today.getFullYear()
          );
        }
      ).length;


    const adminLogs =
      state.logs.filter(
        item => {

          const text = `
            ${item.userName}
            ${item.userEmail}
          `.toLowerCase();

          return (
            text.includes("admin") ||
            text.includes("administrator")
          );
        }
      ).length;


    const errors =
      state.logs.filter(
        item =>
          item.severity === "error"
      ).length;


    if ($("totalLogs")) {
      $("totalLogs")
        .textContent = total;
    }


    if ($("todayLogs")) {
      $("todayLogs")
        .textContent = todayLogs;
    }


    if ($("adminLogs")) {
      $("adminLogs")
        .textContent = adminLogs;
    }


    if ($("errorLogs")) {
      $("errorLogs")
        .textContent = errors;
    }


    if ($("recordBadge")) {
      $("recordBadge")
        .textContent =
        `${total} log`;
    }
  }


  /* =======================================================
     RENDER TABLE
  ======================================================= */

  function renderTable() {

    const body =
      $("logBody");

    if (!body) return;


    if (!state.filtered.length) {

      body.innerHTML = `
        <tr>
          <td
            colspan="6"
            class="empty-cell"
          >
            Không tìm thấy nhật ký phù hợp.
          </td>
        </tr>
      `;

      if ($("entriesNote")) {
        $("entriesNote")
          .textContent =
          "Hiển thị 0 log";
      }

      return;
    }


    body.innerHTML =
      state.filtered
        .map(item => {

          return `
            <tr
              data-log-id="${escapeHtml(item.id)}"
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

                  <div class="log-user-avatar">
                    ${escapeHtml(item.avatar)}
                  </div>

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

                  <small>
                    ${escapeHtml(item.description)}
                  </small>

                </div>

              </td>


              <!-- OBJECT -->
              <td>

                <div class="log-object">

                  <code>
                    ${escapeHtml(item.object)}
                  </code>

                  ${
                    item.objectId
                      ? `
                        <small>
                          ${escapeHtml(item.objectId)}
                        </small>
                      `
                      : ""
                  }

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
                  data-log-detail="${escapeHtml(item.id)}"
                  title="Xem chi tiết"
                >
                  ›
                </button>

              </td>

            </tr>
          `;
        })
        .join("");


    body
      .querySelectorAll(
        "tr[data-log-id]"
      )
      .forEach(row => {

        row.addEventListener(
          "click",
          () => {

            const item =
              state.logs.find(
                log =>
                  log.id ===
                  row.dataset.logId
              );

            openDrawer(item);
          }
        );
      });


    body
      .querySelectorAll(
        "[data-log-detail]"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          event => {

            event.stopPropagation();

            const item =
              state.logs.find(
                log =>
                  log.id ===
                  button.dataset.logDetail
              );

            openDrawer(item);
          }
        );
      });


    if ($("entriesNote")) {

      $("entriesNote")
        .textContent =
        `Hiển thị ${state.filtered.length} / ${state.logs.length} log`;
    }
  }


  /* =======================================================
     FILTER
  ======================================================= */

  function applyFilters() {

    const query =
      $("searchInput")
        ? $("searchInput")
            .value
            .trim()
            .toLowerCase()
        : "";


    const type =
      $("typeFilter")
        ? $("typeFilter").value
        : "all";


    const severity =
      $("severityFilter")
        ? $("severityFilter").value
        : "all";


    state.filtered =
      state.logs.filter(item => {

        const searchable = `

          ${item.id}

          ${item.userName}

          ${item.userEmail}

          ${item.type}

          ${item.typeText}

          ${item.object}

          ${item.objectId}

          ${item.description}

          ${item.severity}

          ${item.severityText}

        `.toLowerCase();


        const matchesSearch =
          !query ||
          searchable.includes(query);


        const matchesType =
          type === "all" ||
          item.type === type;


        const matchesSeverity =
          severity === "all" ||
          item.severity === severity;


        return (
          matchesSearch &&
          matchesType &&
          matchesSeverity
        );
      });


    renderTable();
  }


  /* =======================================================
     DRAWER
  ======================================================= */

  function openDrawer(item) {

    if (!item) return;

    state.selected = item;


    const content =
      $("drawerContent");


    if (!content) return;


    content.innerHTML = `

      <div class="log-detail-header">

        <div class="log-detail-icon">
          ${escapeHtml(item.avatar)}
        </div>

        <div>

          <h3>
            ${escapeHtml(item.typeText)}
          </h3>

          <p>
            ${escapeHtml(item.timeLabel)}
          </p>

        </div>

      </div>


      <div class="log-detail-grid">


        <div class="log-detail-box">

          <small>
            Người thực hiện
          </small>

          <strong>
            ${escapeHtml(item.userName)}
          </strong>

        </div>


        <div class="log-detail-box">

          <small>
            Email
          </small>

          <strong>
            ${escapeHtml(item.userEmail)}
          </strong>

        </div>


        <div class="log-detail-box">

          <small>
            Hoạt động
          </small>

          <strong>
            ${escapeHtml(item.typeText)}
          </strong>

        </div>


        <div class="log-detail-box">

          <small>
            Mức độ
          </small>

          <strong>
            ${escapeHtml(item.severityText)}
          </strong>

        </div>


        <div class="log-detail-box">

          <small>
            Đối tượng
          </small>

          <strong>
            ${escapeHtml(item.object)}
          </strong>

        </div>


        <div class="log-detail-box">

          <small>
            ID đối tượng
          </small>

          <strong>
            <code>
              ${escapeHtml(item.objectId || "—")}
            </code>
          </strong>

        </div>


        <div class="log-detail-box full">

          <small>
            Thời gian
          </small>

          <strong>
            ${escapeHtml(item.timeLabel)}
          </strong>

        </div>


        <div class="log-detail-box full">

          <small>
            Nội dung
          </small>

          <strong>
            ${escapeHtml(item.description)}
          </strong>

        </div>

      </div>


      <div class="log-raw">

        <div class="log-raw-title">
          Raw Firebase Data
        </div>

        <pre>${escapeHtml(
          JSON.stringify(
            item,
            firebaseReplacer,
            2
          )
        )}</pre>

      </div>

    `;


    const drawer =
      $("logDrawer");


    const backdrop =
      $("drawerBackdrop");


    if (drawer) {

      drawer.classList.add(
        "open"
      );

      drawer.setAttribute(
        "aria-hidden",
        "false"
      );
    }


    if (backdrop) {
      backdrop.hidden = false;
    }
  }


  /* =======================================================
     FIREBASE JSON REPLACER
  ======================================================= */

  function firebaseReplacer(
    key,
    value
  ) {

    if (
      value &&
      typeof value.toDate ===
        "function"
    ) {
      return formatDateTime(value);
    }

    return value;
  }


  /* =======================================================
     CLOSE DRAWER
  ======================================================= */

  function closeDrawer() {

    const drawer =
      $("logDrawer");


    const backdrop =
      $("drawerBackdrop");


    if (drawer) {

      drawer.classList.remove(
        "open"
      );

      drawer.setAttribute(
        "aria-hidden",
        "true"
      );
    }


    if (backdrop) {
      backdrop.hidden = true;
    }


    state.selected = null;
  }


  /* =======================================================
     FIRESTORE
  ======================================================= */

  function setupFirebase() {

    const database =
      getFirestore();


    if (!database) {

      if ($("connectionLabel")) {

        $("connectionLabel")
          .textContent =
          "Chưa tìm thấy Firebase";
      }


      if ($("connectionDot")) {

        $("connectionDot")
          .classList
          .remove("live");
      }


      showFirebaseError(
        "Không tìm thấy kết nối Firebase."
      );

      return;
    }


    if ($("connectionDot")) {

      $("connectionDot")
        .classList
        .add("live");
    }


    if ($("connectionLabel")) {

      $("connectionLabel")
        .textContent =
        "Firebase đã kết nối";
    }


    /*
     * Collection:
     *
     * systemLogs
     *
     * Nếu bé đang dùng collection khác,
     * đổi duy nhất tên ở đây.
     */

    state.unsubscribe =
      database
        .collection("systemLogs")
        .onSnapshot(

          snapshot => {

            state.logs =
              snapshot.docs
                .map(normalizeLog);


            sortLogs(
              state.logs
            );


            renderStats();

            applyFilters();

          },


          error => {

            console.error(
              "System Logs Firestore error:",
              error
            );


            if ($("connectionDot")) {

              $("connectionDot")
                .classList
                .remove("live");
            }


            if ($("connectionLabel")) {

              $("connectionLabel")
                .textContent =
                "Không thể tải log";
            }


            showFirebaseError(
              "Không thể tải nhật ký hệ thống."
            );


            toast(
              "Không thể tải System Log"
            );
          }
        );
  }


  /* =======================================================
     FIREBASE ERROR UI
  ======================================================= */

  function showFirebaseError(
    message
  ) {

    const body =
      $("logBody");

    if (!body) return;


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
  }


  /* =======================================================
     REFRESH
  ======================================================= */

  function refreshLogs() {

    const button =
      $("refreshBtn");


    if (!button) return;


    if (state.loading) {
      return;
    }


    state.loading = true;


    button.classList.add(
      "loading"
    );


    button.textContent =
      "↻ Đang tải...";


    setTimeout(() => {

      state.loading = false;

      button.classList.remove(
        "loading"
      );

      button.textContent =
        "↻ Làm mới";


      toast(
        "Đã làm mới nhật ký"
      );

    }, 600);
  }


  /* =======================================================
     ADMIN USER
  ======================================================= */

  async function loadCurrentAdmin() {

    const firebaseAuth =
      getAuth();


    if (!firebaseAuth) {
      return;
    }


    const currentUser =
      firebaseAuth.currentUser;


    if (!currentUser) {
      return;
    }


    let name =
      currentUser.displayName ||
      currentUser.email ||
      "Administrator";


    let role =
      "System Admin";


    try {

      const database =
        getFirestore();


      if (database) {

        const doc =
          await database
            .collection("users")
            .doc(currentUser.uid)
            .get();


        if (doc.exists) {

          const data =
            doc.data();


          name =
            valueOf(
              data,
              "name",
              "displayName",
              "fullName"
            ) || name;


          role =
            valueOf(
              data,
              "role",
              "position",
              "roleLabel"
            ) || role;
        }
      }

    } catch (error) {

      console.warn(
        "Không thể lấy thông tin Admin:",
        error
      );
    }


    if ($("topAdminName")) {

      $("topAdminName")
        .textContent = name;
    }


    if ($("sidebarUserName")) {

      $("sidebarUserName")
        .textContent = name;
    }


    if ($("sidebarUserRole")) {

      $("sidebarUserRole")
        .textContent = role;
    }


    if ($("sidebarAvatar")) {

      $("sidebarAvatar")
        .textContent =
        initials(name);
    }
  }


  /* =======================================================
     LOGOUT
  ======================================================= */

  async function logout() {

    const firebaseAuth =
      getAuth();


    if (!firebaseAuth) {

      toast(
        "Firebase Auth chưa sẵn sàng"
      );

      return;
    }


    try {

      await firebaseAuth.signOut();


      toast(
        "Đã đăng xuất"
      );


      setTimeout(() => {

        window.location.href =
          "/login.html";

      }, 500);


    } catch (error) {

      console.error(
        "Logout error:",
        error
      );


      toast(
        "Đăng xuất thất bại"
      );
    }
  }


  /* =======================================================
     MOBILE SIDEBAR
  ======================================================= */

  function setupMobileMenu() {

    const menuBtn =
      $("menuBtn");


    const sidebar =
      $("adminSidebar");


    const backdrop =
      $("adminSidebarBackdrop");


    if (
      !menuBtn ||
      !sidebar
    ) {
      return;
    }


    menuBtn.addEventListener(
      "click",
      () => {

        sidebar.classList.toggle(
          "open"
        );


        if (backdrop) {

          backdrop.hidden =
            !sidebar.classList.contains(
              "open"
            );
        }
      }
    );


    if (backdrop) {

      backdrop.addEventListener(
        "click",
        () => {

          sidebar.classList.remove(
            "open"
          );

          backdrop.hidden = true;
        }
      );
    }
  }


  /* =======================================================
     SIDEBAR ACTIVE
  ======================================================= */

  function setupSidebar() {

    const currentPath =
      window.location.pathname
        .toLowerCase();


    document
      .querySelectorAll(
        ".admin-nav-item[data-page]"
      )
      .forEach(item => {

        const page =
          item.dataset.page;


        let active = false;


        if (
          page === "overview" &&
          currentPath.includes(
            "homepage-ad"
          )
        ) {
          active = true;
        }


        if (
          page === "reports" &&
          currentPath.includes(
            "activity-report"
          )
        ) {
          active = true;
        }


        if (
          page === "settings" &&
          currentPath.includes(
            "settings"
          )
        ) {
          active = true;
        }


        if (
          page === "logs" &&
          currentPath.includes(
            "system-log"
          )
        ) {
          active = true;
        }


        item.classList.toggle(
          "active",
          active
        );
      });


    /*
     * Tài khoản CS
     *
     * Link về homepage#accounts
     * nên không cần xử lý riêng.
     */
  }


  /* =======================================================
     EVENTS
  ======================================================= */

  function setupEvents() {

    /*
     * Search
     */

    const search =
      $("searchInput");


    if (search) {

      search.addEventListener(
        "input",
        applyFilters
      );
    }


    /*
     * Type filter
     */

    const typeFilter =
      $("typeFilter");


    if (typeFilter) {

      typeFilter.addEventListener(
        "change",
        applyFilters
      );
    }


    /*
     * Severity filter
     */

    const severityFilter =
      $("severityFilter");


    if (severityFilter) {

      severityFilter.addEventListener(
        "change",
        applyFilters
      );
    }


    /*
     * Clear filters
     */

    const clear =
      $("clearFilters");


    if (clear) {

      clear.addEventListener(
        "click",
        () => {

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
        }
      );
    }


    /*
     * Refresh
     */

    const refresh =
      $("refreshBtn");


    if (refresh) {

      refresh.addEventListener(
        "click",
        refreshLogs
      );
    }


    /*
     * Drawer close
     */

    const close =
      $("closeDrawer");


    if (close) {

      close.addEventListener(
        "click",
        closeDrawer
      );
    }


    /*
     * Drawer backdrop
     */

    const backdrop =
      $("drawerBackdrop");


    if (backdrop) {

      backdrop.addEventListener(
        "click",
        closeDrawer
      );
    }


    /*
     * Notification
     */

    const notice =
      $("noticeBtn");


    if (notice) {

      notice.addEventListener(
        "click",
        () => {

          toast(
            "Không có thông báo mới"
          );
        }
      );
    }


    /*
     * Logout
     */

    const logoutButton =
      $("sidebarLogoutBtn");


    if (logoutButton) {

      logoutButton.addEventListener(
        "click",
        logout
      );
    }


    /*
     * Mobile menu
     */

    setupMobileMenu();


    /*
     * Sidebar
     */

    setupSidebar();
  }


  /* =======================================================
     CLEANUP
  ======================================================= */

  window.addEventListener(
    "beforeunload",
    () => {

      if (
        typeof state.unsubscribe ===
          "function"
      ) {

        state.unsubscribe();

        state.unsubscribe = null;
      }
    }
  );


  /* =======================================================
     INIT
  ======================================================= */

  function init() {

    setupEvents();

    loadCurrentAdmin();

    setupFirebase();
  }


  /*
   * DOM đã load thì chạy.
   */

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      init
    );

  } else {

    init();
  }

})();