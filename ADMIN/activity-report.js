/* =========================================================
   ADMIN - ACTIVITY REPORT
   CUSTOMER SUCCESS
   Firestore:
   collection: users
   CS:
   accountType: "customer_success"
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
    unsubscribe: null,
    period: 30
  };
  /* =======================================================
     DOM
  ======================================================= */
  const $ = id =>
    document.getElementById(id);
  /* =======================================================
     FIREBASE
  ======================================================= */
  function getFirestore() {
    if (
      typeof db !== "undefined" &&
      db
    ) {
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
    if (
      typeof auth !== "undefined" &&
      auth
    ) {
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
    const node =
      $("toast");
    if (!node) return;
    node.textContent =
      message;
    node.hidden = false;
    clearTimeout(
      window.__activityToast
    );
    window.__activityToast =
      setTimeout(() => {
        node.hidden = true;
      }, 2500);
  }
  /* =======================================================
     ESCAPE
  ======================================================= */
  function escapeHtml(value) {
    const div =
      document.createElement("div");
    div.textContent =
      value === undefined ||
      value === null
        ? ""
        : String(value);
    return div.innerHTML;
  }
  /* =======================================================
     VALUE
  ======================================================= */
  function valueOf(item, ...keys) {
    for (const key of keys) {
      if (
        item &&
        item[key] !== undefined &&
        item[key] !== null &&
        String(item[key]).trim() !== ""
      ) {
        return item[key];
      }
    }
    return "";
  }
  /* =======================================================
     INITIALS
  ======================================================= */
  function initials(name) {
    const text =
      String(name || "CS").trim();
    if (!text) {
      return "CS";
    }
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
      .map(part =>
        part.charAt(0)
      )
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
      if (
        value &&
        typeof value.toDate === "function"
      ) {
        return value.toDate();
      }
      const date =
        new Date(value);
      if (
        Number.isNaN(
          date.getTime()
        )
      ) {
        return null;
      }
      return date;
    } catch {
      return null;
    }
  }
  function formatDate(value) {
    const date =
      toDate(value);
    if (!date) {
      return "—";
    }
    return date.toLocaleDateString(
      "vi-VN"
    );
  }
  function formatDateTime(value) {
    const date =
      toDate(value);
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
  function getStatus(item) {
    const raw =
      String(
        valueOf(
          item,
          "status",
          "accountStatus",
          "state"
        )
      )
        .toLowerCase()
        .trim();
    if (
      [
        "active",
        "activated",
        "online",
        "đang hoạt động"
      ].includes(raw)
    ) {
      return "active";
    }
    if (
      [
        "away",
        "offline",
        "tạm vắng"
      ].includes(raw)
    ) {
      return "away";
    }
    if (
      [
        "pending",
        "inactive",
        "disabled",
        "chưa kích hoạt"
      ].includes(raw)
    ) {
      return "pending";
    }
    if (
      item.passwordCreated === true
    ) {
      return "active";
    }
    return "pending";
  }
  function statusLabel(status) {
    const labels = {
      active:
        "Đang hoạt động",
      away:
        "Tạm vắng",
      pending:
        "Chưa kích hoạt"
    };
    return (
      labels[status] ||
      "Chưa kích hoạt"
    );
  }
  /* =======================================================
     NORMALIZE ACCOUNT
  ======================================================= */
  function normalizeAccount(doc) {
    const raw = {
      id: doc.id,
      ...doc.data()
    };
    const name =
      valueOf(
        raw,
        "name",
        "displayName",
        "fullName"
      ) ||
      "Chưa cập nhật";
    const username =
      valueOf(
        raw,
        "username"
      ) ||
      "—";
    const email =
      valueOf(
        raw,
        "email"
      ) ||
      "Chưa cập nhật";
    const campus =
      valueOf(
        raw,
        "campus",
        "campusId"
      ) ||
      "Chưa phân bổ";
    const department =
      valueOf(
        raw,
        "department",
        "departmentId"
      ) ||
      "Chưa phân bổ";
    const status =
      getStatus(raw);
    const createdAt =
      raw.createdAt ||
      raw.joinedAt ||
      raw.dateCreated ||
      null;
    const lastLogin =
      valueOf(
        raw,
        "lastActive",
        "lastLogin",
        "lastActiveAt"
      );
    return {
      ...raw,
      id: doc.id,
      name,
      username,
      email,
      campus,
      department,
      status,
      statusText:
        statusLabel(status),
      createdAt,
      joined:
        formatDate(createdAt),
      createdAtLabel:
        formatDateTime(createdAt),
      lastLogin,
      lastLoginLabel:
        lastLogin
          ? formatDateTime(lastLogin)
          : "Chưa đăng nhập",
      avatar:
        initials(name)
    };
  }
  /* =======================================================
     GET CURRENT ADMIN
  ======================================================= */
  async function loadAdmin() {
    const firebaseAuth =
      getAuth();
    if (!firebaseAuth) {
      return;
    }
    try {
      const currentUser =
        firebaseAuth.currentUser;
      if (!currentUser) {
        return;
      }
      const database =
        getFirestore();
      if (!database) {
        return;
      }
      const snap =
        await database
          .collection("users")
          .doc(currentUser.uid)
          .get();
      if (!snap.exists) {
        return;
      }
      const data =
        snap.data();
      const name =
        valueOf(
          data,
          "name",
          "displayName",
          "fullName"
        );
      if (name) {
        $("sidebarAdminName")
          .textContent = name;
      }
    } catch (error) {
      console.warn(
        "Không thể tải admin:",
        error
      );
    }
  }
  /* =======================================================
     STATS
  ======================================================= */
  function renderStats() {
    const accounts =
      state.filtered;
    const total =
      accounts.length;
    const active =
      accounts.filter(
        item =>
          item.status === "active"
      ).length;
    const pending =
      accounts.filter(
        item =>
          item.status === "pending"
      ).length;
    const newCount =
      accounts.filter(
        item =>
          isWithinPeriod(
            item.createdAt,
            state.period
          )
      ).length;
    $("totalCount")
      .textContent = total;
    $("activeCount")
      .textContent = active;
    $("pendingCount")
      .textContent = pending;
    $("newCount")
      .textContent = newCount;
    const percent =
      total
        ? Math.round(
            active / total * 100
          )
        : 0;
    $("activePercent")
      .textContent =
      `${percent}% tổng đội ngũ`;
    $("recordBadge")
      .textContent =
      `${total} hồ sơ`;
    $("entriesNote")
      .textContent =
      `Hiển thị ${total} tài khoản`;
  }
  /* =======================================================
     PERIOD
  ======================================================= */
  function isWithinPeriod(
    value,
    days
  ) {
    if (days === "all") {
      return true;
    }
    const date =
      toDate(value);
    if (!date) {
      return false;
    }
    const now =
      new Date();
    const start =
      new Date();
    start.setDate(
      now.getDate() -
      Number(days)
    );
    return date >= start;
  }
  /* =======================================================
     POPULATE FILTERS
  ======================================================= */
  function populateFilters() {
    const campuses =
      [
        ...new Set(
          state.accounts
            .map(
              item => item.campus
            )
            .filter(
              value =>
                value &&
                value !==
                  "Chưa phân bổ"
            )
        )
      ]
      .sort();
    const departments =
      [
        ...new Set(
          state.accounts
            .map(
              item =>
                item.department
            )
            .filter(
              value =>
                value &&
                value !==
                  "Chưa phân bổ"
            )
        )
      ]
      .sort();
    const campusSelect =
      $("campusFilter");
    const departmentSelect =
      $("departmentFilter");
    const currentCampus =
      campusSelect.value;
    const currentDepartment =
      departmentSelect.value;
    campusSelect.innerHTML = `
      <option value="all">
        Tất cả campus
      </option>
    `;
    campuses.forEach(
      campus => {
        campusSelect.insertAdjacentHTML(
          "beforeend",
          `
            <option value="${escapeHtml(campus)}">
              ${escapeHtml(campus)}
            </option>
          `
        );
      }
    );
    departmentSelect.innerHTML = `
      <option value="all">
        Tất cả phòng ban
      </option>
    `;
    departments.forEach(
      department => {
        departmentSelect.insertAdjacentHTML(
          "beforeend",
          `
            <option value="${escapeHtml(department)}">
              ${escapeHtml(department)}
            </option>
          `
        );
      }
    );
    if (
      campuses.includes(
        currentCampus
      )
    ) {
      campusSelect.value =
        currentCampus;
    }
    if (
      departments.includes(
        currentDepartment
      )
    ) {
      departmentSelect.value =
        currentDepartment;
    }
  }
  /* =======================================================
     FILTER
  ======================================================= */
  function applyFilters() {
    const search =
      $("searchInput")
        .value
        .trim()
        .toLowerCase();
    const campus =
      $("campusFilter").value;
    const department =
      $("departmentFilter").value;
    state.period =
      $("periodFilter").value;
    state.filtered =
      state.accounts.filter(
        item => {
          const searchable = `
            ${item.name}
            ${item.username}
            ${item.email}
            ${item.uid}
            ${item.campus}
            ${item.department}
            ${item.phone || ""}
          `
            .toLowerCase();
          const matchSearch =
            !search ||
            searchable.includes(
              search
            );
          const matchCampus =
            campus === "all" ||
            item.campus === campus;
          const matchDepartment =
            department === "all" ||
            item.department ===
              department;
          return (
            matchSearch &&
            matchCampus &&
            matchDepartment
          );
        }
      );
    renderStats();
    renderDistribution();
    renderTable();
  }
  /* =======================================================
     TABLE
  ======================================================= */
  function renderTable() {
    const body =
      $("activityBody");
    if (!body) {
      return;
    }
    if (!state.filtered.length) {
      body.innerHTML = `
        <tr>
          <td
            colspan="6"
            class="empty-cell"
          >
            Không tìm thấy dữ liệu hoạt động.
          </td>
        </tr>
      `;
      return;
    }
    body.innerHTML =
      state.filtered
        .map(
          item => {
            const avatarBg =
              item.status === "pending"
                ? "#efebe5"
                : "#eedcc8";
            return `
              <tr>
                <td>
                  <div class="account-cell">
                    <div
                      class="avatar"
                      style="
                        background:${avatarBg}
                      "
                    >
                      ${escapeHtml(
                        item.avatar
                      )}
                    </div>
                    <div>
                      <strong>
                        ${escapeHtml(
                          item.name
                        )}
                      </strong>
                      <small>
                        <code>
                          ${escapeHtml(
                            item.username
                          )}
                        </code>
                        ·
                        ${escapeHtml(
                          item.email
                        )}
                      </small>
                    </div>
                  </div>
                </td>
                <td class="campus-text">
                  ${escapeHtml(
                    item.campus
                  )}
                </td>
                <td class="department-text">
                  ${escapeHtml(
                    item.department
                  )}
                </td>
                <td>
                  <span
                    class="status status-${item.status}"
                  >
                    <i></i>
                    ${escapeHtml(
                      item.statusText
                    )}
                  </span>
                </td>
                <td class="last-active">
                  ${escapeHtml(
                    item.lastLoginLabel
                  )}
                </td>
                <td class="joined">
                  ${escapeHtml(
                    item.joined
                  )}
                </td>
              </tr>
            `;
          }
        )
        .join("");
  }
  /* =======================================================
     DISTRIBUTION
  ======================================================= */
  function createDistribution(
    items
  ) {
    const map =
      new Map();
    items.forEach(
      item => {
        const key =
          item || "Chưa phân bổ";
        map.set(
          key,
          (map.get(key) || 0) + 1
        );
      }
    );
    return [
      ...map.entries()
    ]
      .sort(
        (a, b) =>
          b[1] - a[1]
      );
  }
  function renderDistribution() {
    const campusData =
      createDistribution(
        state.filtered.map(
          item => item.campus
        )
      );
    const departmentData =
      createDistribution(
        state.filtered.map(
          item => item.department
        )
      );
    renderDistributionList(
      $("campusReport"),
      campusData
    );
    renderDistributionList(
      $("departmentReport"),
      departmentData
    );
  }
  function renderDistributionList(
    container,
    data
  ) {
    if (!container) {
      return;
    }
    if (!data.length) {
      container.innerHTML = `
        <div class="loading">
          Chưa có dữ liệu
        </div>
      `;
      return;
    }
    const total =
      data.reduce(
        (sum, item) =>
          sum + item[1],
        0
      );
    container.innerHTML =
      data
        .map(
          ([name, count]) => {
            const percent =
              total
                ? Math.round(
                    count /
                    total *
                    100
                  )
                : 0;
            return `
              <div class="distribution-row">
                <div class="distribution-head">
                  <span>
                    ${escapeHtml(
                      name
                    )}
                  </span>
                  <strong>
                    ${count}
                    <small>
                      (${percent}%)
                    </small>
                  </strong>
                </div>
                <div class="progress">
                  <i
                    style="
                      width:${percent}%
                    "
                  ></i>
                </div>
              </div>
            `;
          }
        )
        .join("");
  }
  /* =======================================================
     FIREBASE
  ======================================================= */
  function setupFirebase() {
    const database =
      getFirestore();
    if (!database) {
      setConnection(
        false,
        "Chưa tìm thấy Firebase config"
      );
      $("activityBody")
        .innerHTML = `
          <tr>
            <td
              colspan="6"
              class="empty-cell"
            >
              Không tìm thấy kết nối Firebase.
            </td>
          </tr>
        `;
      return;
    }
    setConnection(
      true,
      "Firebase đã kết nối"
    );
    state.unsubscribe =
      database
        .collection("users")
        .where(
          "accountType",
          "==",
          "customer_success"
        )
        .onSnapshot(
          snapshot => {
            state.accounts =
              snapshot.docs
                .map(
                  normalizeAccount
                );
            state.accounts.sort(
              (a, b) => {
                const dateA =
                  toDate(
                    a.createdAt
                  ) ||
                  new Date(0);
                const dateB =
                  toDate(
                    b.createdAt
                  ) ||
                  new Date(0);
                return (
                  dateB - dateA
                );
              }
            );
            populateFilters();
            applyFilters();
          },
          error => {
            console.error(
              "Activity Firestore error:",
              error
            );
            setConnection(
              false,
              "Không thể tải Firestore"
            );
            $("activityBody")
              .innerHTML = `
                <tr>
                  <td
                    colspan="6"
                    class="empty-cell"
                  >
                    Không thể tải dữ liệu.
                    Kiểm tra Firestore Rules.
                  </td>
                </tr>
              `;
            toast(
              "Không thể tải báo cáo hoạt động"
            );
          }
        );
  }
  /* =======================================================
     CONNECTION
  ======================================================= */
  function setConnection(
    live,
    text
  ) {
    const dot =
      $("connectionDot");
    const label =
      $("connectionLabel");
    if (dot) {
      dot.classList.toggle(
        "live",
        live
      );
    }
    if (label) {
      label.textContent =
        text;
    }
  }
  /* =======================================================
     EXPORT CSV
  ======================================================= */
  function exportCSV() {
    if (!state.filtered.length) {
      toast(
        "Không có dữ liệu để xuất"
      );
      return;
    }
    const headers = [
      "Tên",
      "Username",
      "Email",
      "Campus",
      "Department",
      "Trạng thái",
      "Đăng nhập gần nhất",
      "Ngày tạo",
      "UID"
    ];
    const rows =
      state.filtered.map(
        item => [
          item.name,
          item.username,
          item.email,
          item.campus,
          item.department,
          item.statusText,
          item.lastLoginLabel,
          item.joined,
          item.uid || ""
        ]
      );
    const csv = [
      headers,
      ...rows
    ]
      .map(
        row =>
          row
            .map(
              value =>
                `"${String(value)
                  .replace(
                    /"/g,
                    '""'
                  )}"`
            )
            .join(",")
      )
      .join("\n");
    /*
     * BOM để Excel đọc tiếng Việt
     */
    const blob =
      new Blob(
        [
          "\ufeff" + csv
        ],
        {
          type:
            "text/csv;charset=utf-8;"
        }
      );
    const url =
      URL.createObjectURL(
        blob
      );
    const link =
      document.createElement("a");
    link.href = url;
    link.download =
      `activity-report-${new Date()
        .toISOString()
        .slice(0,10)}.csv`;
    document.body.appendChild(
      link
    );
    link.click();
    link.remove();
    URL.revokeObjectURL(
      url
    );
    toast(
      "Đã xuất báo cáo CSV"
    );
  }
  /* =======================================================
     SIDEBAR
  ======================================================= */
  function setupSidebar() {
    const sidebar =
      $("sidebar");
    const menuBtn =
      $("menuBtn");
    const backdrop =
      $("mobileBackdrop");
    menuBtn?.addEventListener(
      "click",
      () => {
        sidebar.classList.toggle(
          "open"
        );
        if (
          window.innerWidth <= 780
        ) {
          backdrop.hidden =
            !sidebar.classList.contains(
              "open"
            );
        }
      }
    );
    backdrop?.addEventListener(
      "click",
      closeMobileSidebar
    );
    document
      .querySelectorAll(
        ".nav-item[data-page]"
      )
      .forEach(
        item => {
          item.addEventListener(
            "click",
            event => {
              const page =
                item.dataset.page;
              /*
               * Tài khoản CS:
               * homepage #accounts
               */
              if (
                page === "accounts"
              ) {
                event.preventDefault();
                window.location.href =
                  "homepage-ad.html#accounts";
                return;
              }
              /*
               * Báo cáo
               */
              if (
                page === "reports"
              ) {
                event.preventDefault();
                setActiveSidebar(
                  "reports"
                );
                closeMobileSidebar();
                return;
              }
              /*
               * Các trang khác
               */
              setActiveSidebar(
                page
              );
              closeMobileSidebar();
            }
          );
        }
      );
  }
  function setActiveSidebar(
    page
  ) {
    document
      .querySelectorAll(
        ".nav-item[data-page]"
      )
      .forEach(
        item => {
          item.classList.toggle(
            "active",
            item.dataset.page === page
          );
        }
      );
    try {
      localStorage.setItem(
        "adminActivePage",
        page
      );
    } catch {}
  }
  function closeMobileSidebar() {
    const sidebar =
      $("sidebar");
    const backdrop =
      $("mobileBackdrop");
    sidebar?.classList.remove(
      "open"
    );
    if (backdrop) {
      backdrop.hidden = true;
    }
  }
  /* =======================================================
     EVENTS
  ======================================================= */
  function setupEvents() {
    $("todayLabel")
      .textContent =
      new Date()
        .toLocaleDateString(
          "vi-VN",
          {
            weekday: "long",
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
          }
        );
    /*
     * Search
     */
    $("searchInput")
      .addEventListener(
        "input",
        applyFilters
      );
    /*
     * Period
     */
    $("periodFilter")
      .addEventListener(
        "change",
        () => {
          state.period =
            $("periodFilter").value;
          const selected =
            $("periodFilter")
              .selectedOptions[0]
              .textContent
              .trim();
          $("periodLabel")
            .textContent =
            selected;
          applyFilters();
        }
      );
    /*
     * Campus
     */
    $("campusFilter")
      .addEventListener(
        "change",
        applyFilters
      );
    /*
     * Department
     */
    $("departmentFilter")
      .addEventListener(
        "change",
        applyFilters
      );
    /*
     * Clear
     */
    $("clearFilters")
      .addEventListener(
        "click",
        () => {
          $("periodFilter")
            .value = "30";
          $("campusFilter")
            .value = "all";
          $("departmentFilter")
            .value = "all";
          $("searchInput")
            .value = "";
          state.period = 30;
          $("periodLabel")
            .textContent =
            "30 ngày gần nhất";
          applyFilters();
          toast(
            "Đã xóa bộ lọc"
          );
        }
      );
    /*
     * Export
     */
    $("exportBtn")
      .addEventListener(
        "click",
        exportCSV
      );
    /*
     * Notification
     */
    $("noticeBtn")
      .addEventListener(
        "click",
        () => {
          toast(
            "Không có thông báo mới"
          );
        }
      );
    /*
     * Logout
     */
    $("logoutBtn")
      .addEventListener(
        "click",
        async () => {
          const firebaseAuth =
            getAuth();
          if (!firebaseAuth) {
            toast(
              "Firebase Auth chưa sẵn sàng"
            );
            return;
          }
          try {
            await firebaseAuth
              .signOut();
            toast(
              "Đã đăng xuất"
            );
            setTimeout(
              () => {
                window.location.href =
                  "/login.html";
              },
              500
            );
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
      );
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
      }
    }
  );
  /* =======================================================
     INIT
  ======================================================= */
  function init() {
    setupEvents();
    loadAdmin();
    setupFirebase();
  }
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