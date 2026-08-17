/*ACTIVITY REPORT - ADMIN
   QUAN TRỌNG:
   Firebase đã được khởi tạo trong firebase-config.js:
   const auth = firebase.auth();
   const db = firebase.firestore();
   const storage = firebase.storage();
   FILE NÀY KHÔNG ĐƯỢC khai báo lại db / auth / storage.*/
"use strict";

/*CONFIG*/

const USER_COLLECTION = "users";
const DEFAULT_PERIOD = "30";

/*
 * Không dùng:
 *
 * const db = firebase.firestore();
 * const auth = firebase.auth();
 *
 * vì firebase-config.js đã tạo sẵn.
 */

/* STATE*/

let allUsers = [];
let filteredUsers = [];
let unsubscribeUsers = null;
let currentPeriod = DEFAULT_PERIOD;
let currentCampus = "all";
let currentDepartment = "all";
let currentSearch = "";

/*DOM*/

const $ = (id) => document.getElementById(id);
const elements = {
  connectionDot: $("connectionDot"),
  connectionLabel: $("connectionLabel"),
  topAdminName: $("topAdminName"),
  topAdminAvatar: $("topAdminAvatar"),
  totalCount: $("totalCount"),
  activeCount: $("activeCount"),
  pendingCount: $("pendingCount"),
  newCount: $("newCount"),
  activePercent: $("activePercent"),
  periodLabel: $("periodLabel"),
  periodFilter: $("periodFilter"),
  campusFilter: $("campusFilter"),
  departmentFilter: $("departmentFilter"),
  searchInput: $("searchInput"),
  clearFilters: $("clearFilters"),
  exportBtn: $("exportBtn"),
  campusReport: $("campusReport"),
  departmentReport: $("departmentReport"),
  activityBody: $("activityBody"),
  recordBadge: $("recordBadge"),
  entriesNote: $("entriesNote"),
  toast: $("toast"),
  noticeBtn: $("noticeBtn"),
  noticeBadge: $("noticeBadge"),
  notificationPanel: $("notificationPanel"),
  notificationList: $("notificationList"),
  notificationCount: $("notificationCount"),
  markAllReadBtn: $("markAllReadBtn"),
  menuBtn: $("menuBtn")
};
/* =========================================================
   INIT
========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  console.log("activity-report.js đã khởi tạo.");
  initFilters();
  initButtons();
  initNotifications();
  initMobileMenu();
  initFirebaseConnection();
  loadAdminAccount();
  loadUsers();
});

/*FIREBASE CONNECTION*/

function initFirebaseConnection() {
  try {
    if (typeof firebase === "undefined") {
      setConnection(false, "Firebase chưa được tải");
      return;
    }
    if (!firebase.apps || firebase.apps.length === 0) {
      setConnection(false, "Firebase chưa được khởi tạo");
      return;
    }
    setConnection(true, "Đã kết nối Firebase");
  } catch (error) {
    console.error("Lỗi kiểm tra Firebase:", error);
    setConnection(false, "Không thể kết nối Firebase");
  }
}
function setConnection(isOnline, message) {
  if (elements.connectionDot) {
    elements.connectionDot.classList.toggle("live", isOnline);
  }
  if (elements.connectionLabel) {
    elements.connectionLabel.textContent = message;
  }
}
/* =========================================================
   LOAD USERS
========================================================= */
function loadUsers() {
  try {
    /*
     * db được lấy trực tiếp từ firebase-config.js.
     */
    if (typeof db === "undefined") {
      console.error(
        "Không tìm thấy biến db. Kiểm tra firebase-config.js."
      );
      setConnection(false, "Không tìm thấy Firestore");
      showTableError("Không tìm thấy kết nối Firestore.");
      return;
    }
    /*
     * Realtime Firestore
     */
    unsubscribeUsers = db
      .collection(USER_COLLECTION)
      .onSnapshot(
        (snapshot) => {
          allUsers = [];
          snapshot.forEach((doc) => {
            const data = doc.data() || {};
            /*
             * Chỉ lấy Customer Success.
             *
             * Hỗ trợ nhiều kiểu dữ liệu hiện tại:
             *
             * accountType:
             * customer_success
             *
             * role:
             * cs / customer_success / Customer Success
             */
            if (!isCustomerSuccess(data)) {
              return;
            }
            allUsers.push({
              id: doc.id,
              ...data
            });
          });
          allUsers.sort((a, b) => {
            const timeA = getTimestampValue(a.createdAt || a.created || a.joined);
            const timeB = getTimestampValue(b.createdAt || b.created || b.joined);
            return timeB - timeA;
          });
          setConnection(
            true,
            "Đã kết nối Firebase"
          );
          populateFilters();
          applyFilters();
        },
        (error) => {
          console.error("Lỗi realtime users:",error);
          setConnection(false, "Lỗi kết nối Firestore");
          showTableError("Không thể tải dữ liệu tài khoản.");
        }
      );
  } catch (error) {
    console.error("Lỗi khởi tạo users:",error);
    showTableError("Có lỗi khi tải dữ liệu.");
  }
}

/*CUSTOMER SUCCESS CHECK*/

function isCustomerSuccess(data) {
  const accountType = normalize(data.accountType );
  const role = normalize(data.role);
  const type = normalize(data.type);
  /*
   * Nếu document có accountType thì ưu tiên.
   */
  if (accountType) {
    return (accountType === "customer_success" ||accountType === "customer success" ||accountType === "cs"
    );
  }
  /*
   * Hỗ trợ role.
   */
  if (role) {
    return (role === "cs" ||role === "customer_success" || role === "customer success" ||role === "customer-success");
  }
  /*
   * Hỗ trợ type.
   */
  if (type) {
    return (type === "cs" ||type === "customer_success" ||type === "customer success");
  }
  /*
   * Nếu hệ thống users hiện tại không có
   * accountType/role/type thì vẫn cho hiển thị.
   *
   * Điều này tránh việc bảng bị 0 hồ sơ.
   */
  return true;
}

/*FILTER INIT*/

function initFilters() {
  if (elements.periodFilter) {
    elements.periodFilter.addEventListener("change",
      () => {
        currentPeriod =elements.periodFilter.value || DEFAULT_PERIOD;
        updatePeriodLabel();
        applyFilters();
      }
    );
  }
  if (elements.campusFilter) {
    elements.campusFilter.addEventListener("change",() => {
        currentCampus =elements.campusFilter.value || "all";applyFilters();
      }
    );
  }
  if (elements.departmentFilter) {
    elements.departmentFilter.addEventListener("change",() => {
        currentDepartment =
          elements.departmentFilter.value || "all";applyFilters();
      }
    );
  }
  if (elements.searchInput) {
    elements.searchInput.addEventListener(
      "input",
      () => {
        currentSearch =elements.searchInput.value.trim().toLowerCase();
        applyFilters();
      }
    );
  }
  updatePeriodLabel();
}

/*BUTTONS*/

function initButtons() {
  if (elements.clearFilters) {
    elements.clearFilters.addEventListener("click",clearFilters);
  }
  if (elements.exportBtn) {
    elements.exportBtn.addEventListener("click",exportCSV);
  }
}

/*POPULATE FILTERS*/

function populateFilters() {
  if (elements.campusFilter) {
    const campuses = uniqueValues(
      allUsers.map((user) =>getCampus(user))
    );
    const currentValue =
      elements.campusFilter.value || "all";
    elements.campusFilter.innerHTML =
      `<option value="all">Tất cả campus</option>`;
    campuses.forEach((campus) => {
      if (!campus) return;
      const option =document.createElement("option");
      option.value = campus;
      option.textContent = campus;
      elements.campusFilter.appendChild(option);
    });
    if (
      campuses.includes(currentValue)
    ) {
      elements.campusFilter.value =
        currentValue;
    } else {
      elements.campusFilter.value = "all";
    }
  }
  if (elements.departmentFilter) {
    const departments = uniqueValues(
      allUsers.map((user) =>getDepartment(user))
    );
    const currentValue =elements.departmentFilter.value || "all";
    elements.departmentFilter.innerHTML =
      `<option value="all">Tất cả phòng ban</option>`;
    departments.forEach((department) => {
      if (!department) return;
      const option =document.createElement("option");
      option.value = department;
      option.textContent = department;
      elements.departmentFilter.appendChild(option);
    });
    if (
      departments.includes(currentValue)
    ) {
      elements.departmentFilter.value =currentValue;
    } else {
      elements.departmentFilter.value = "all";
    }
  }
}

/*APPLY FILTERS*/

function applyFilters() {
  filteredUsers = allUsers.filter((user) => {
      /*
       * Campus
       */
      if (
        currentCampus !== "all" &&
        getCampus(user) !== currentCampus
      ) {
        return false;
      }
      /*
       * Department
       */
      if (
        currentDepartment !== "all" &&
        getDepartment(user) !== currentDepartment) {
        return false;
      }
      /*
       * Search
       */
      if (currentSearch) {
        const searchable = [
          user.name,
          user.fullName,
          user.displayName,
          user.username,
          user.email,
          user.phone,
          user.id
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!searchable.includes(currentSearch)) {
          return false;
        }
      }
      return true;
    }
  );
  renderAll();
}

/*RENDER ALL*/

function renderAll() {
  renderStats();
  renderCampusReport();
  renderDepartmentReport();
  renderActivityTable();
}

/*STATS*/

function renderStats() {
  const total = filteredUsers.length;
  const active = filteredUsers.filter((user) =>getAccountStatus(user) === "active").length;
  const pending = filteredUsers.filter((user) =>getAccountStatus(user) === "pending").length;
  const newCount =getNewUsersCount(filteredUsers);
  const activePercent =total > 0? Math.round((active / total) * 100): 0;
  if (elements.totalCount) {
    elements.totalCount.textContent =total;
  }
  if (elements.activeCount) {
    elements.activeCount.textContent =active;
  }
  if (elements.pendingCount) {
    elements.pendingCount.textContent =pending;
  }
  if (elements.newCount) {
    elements.newCount.textContent =newCount;
  }
  if (elements.activePercent) {
    elements.activePercent.textContent =`${activePercent}% tổng đội ngũ`;
  }
  if (elements.periodLabel) {
    elements.periodLabel.textContent =getPeriodText(currentPeriod);
  }
}

/*NEW USERS*/

function getNewUsersCount(users) {
  if (currentPeriod === "all") {
    return users.length;
  }
  const days =Number(currentPeriod) || 30;
  const now = Date.now();
  const start =now -days *24 *60 *60 *1000;
  return users.filter((user) => {
    const created =getTimestampValue(user.createdAt ||user.created || user.joined || user.created_at);
    return (created >= start &&created <= now);
  }).length;
}

/*CAMPUS REPORT*/

function renderCampusReport() {
  if (!elements.campusReport) {
    return;
  }
  if (!filteredUsers.length) {
    elements.campusReport.innerHTML =
      `<div class="loading">
        Không có dữ liệu campus
      </div>`;
    return;
  }
  const counts = {};
  filteredUsers.forEach((user) => {
    const campus =getCampus(user) || "Chưa xác định";
    counts[campus] =(counts[campus] || 0) + 1;
  });
  const entries =Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const max =Math.max(...entries.map(([, count]) => count),1);
  elements.campusReport.innerHTML =entries.map(([campus, count]) => {
          const percent =Math.round((count / max) * 100);
          return `
            <div class="distribution-row">
              <div class="distribution-head">
                <span>${escapeHTML(campus)}</span>
                <strong>${count}</strong>
              </div>
              <div class="progress">
                <i style="width:${percent}%"></i>
              </div>
            </div>
          `;
        }
      )
      .join("");
}
/*DEPARTMENT REPORT*/
function renderDepartmentReport() {
  if (!elements.departmentReport) {
    return;
  }
  if (!filteredUsers.length) {
    elements.departmentReport.innerHTML =
      `<div class="loading">
        Không có dữ liệu phòng ban
      </div>`;
    return;
  }
  const counts = {};
  filteredUsers.forEach((user) => {
    const department =getDepartment(user) ||"Chưa xác định";
    counts[department] =(counts[department] || 0) + 1;
  });
  const entries =Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const max =Math.max(...entries.map(([, count]) => count),1);
  elements.departmentReport.innerHTML =
    entries
      .map(([department, count]) => {
          const percent =Math.round((count / max) * 100);
          return `
            <div class="distribution-row">
              <div class="distribution-head">
                <span>${escapeHTML(department)}</span>
                <strong>${count}</strong>
              </div>
              <div class="progress">
                <i style="width:${percent}%"></i>
              </div>
            </div>
          `;
        }
      )
      .join("");
}
/*ACTIVITY TABLE*/
function renderActivityTable() {
  if (!elements.activityBody) {
    return;
  }
  if (!filteredUsers.length) {
    elements.activityBody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-cell">
          Không tìm thấy tài khoản phù hợp.
        </td>
      </tr>
    `;
    updateRecordInfo(0);
    return;
  }
  elements.activityBody.innerHTML =
    filteredUsers
      .map((user) => {
        const name =getUserName(user);
        const email =user.email ||"Không có email";
        const username =user.username ||user.userName ||user.uid ||user.id ||"—";
        const campus =getCampus(user) ||"Chưa xác định";
        const department =getDepartment(user) ||"Chưa xác định";
        const status =getAccountStatus(user);
        const statusHTML =renderStatus(status);
        const lastLogin =getLastLogin(user);
        const createdAt =getCreatedAt(user);
        const initials =getInitials(name);
        return `
          <tr>
            <td>
              <div class="account-cell">
                <div class="avatar">
                  ${escapeHTML(initials)}
                </div>
                <div>
                  <strong>
                    ${escapeHTML(name)}
                  </strong>
                  <small>
                    ${escapeHTML(email)}
                  </small>
                  <code>
                    ${escapeHTML(username)}
                  </code>
                </div>
              </div>
            </td>
            <td>
              <span class="campus-text">
                ${escapeHTML(campus)}
              </span>
            </td>
            <td>
              <span class="department-text">
                ${escapeHTML(department)}
              </span>
            </td>
            <td>
              ${statusHTML}
            </td>
            <td>
              <span class="last-active">
                ${escapeHTML(lastLogin)}
              </span>
            </td>
            <td>
              <span class="joined">
                ${escapeHTML(createdAt)}
              </span>
            </td>
          </tr>
        `;
      })
      .join("");
  updateRecordInfo(
    filteredUsers.length
  );
}
/* =========================================================
   STATUS
========================================================= */
function getAccountStatus(user) {
  const raw =user.status ??user.accountStatus ??user.state ??"";
  const status = normalize(raw);
  /*
   * Các trạng thái đang hoạt động
   */
  if (status === "active" ||status === "activated" ||status === "online" ||status === "enabled" || status === "dang hoat dong" ||status === "đang hoạt động") {
    return "active";
  }
  /*
   * Pending
   */
  if (status === "pending" || status === "inactive" ||status === "disabled" ||status === "chua kich hoat" ||status === "chưa kích hoạt") {
    return "pending";
  }
  /*
   * Kiểm tra passwordCreated
   */
  if (user.passwordCreated === false) {
    return "pending";
  }
  /*
   * Nếu có lastLogin thì coi là active.
   */
  const lastLogin =
    getTimestampValue(user.lastLoginAt ||user.lastLogin ||user.lastActive);
  if (lastLogin > 0) {
    return "active";
  }
  return "pending";
}
function renderStatus(status) {
  if (status === "active") {
    return `
      <span class="status status-active">
        <i></i>
        Đang hoạt động
      </span>
    `;
  }
  return `
    <span class="status status-pending">
      <i></i>
      Chưa kích hoạt
    </span>
  `;
}

/*CAMPUS*/

function getCampus(user) {
  return cleanValue(user.campus ??user.campusName ??user["code-campus"] ??user.campusId ??user.codeCampus);
}
/*DEPARTMENT*/
function getDepartment(user) {
  return cleanValue(user.department ??user.departmentName ??user.dept
  );
}

/*USER NAME*/

function getUserName(user) {
  return cleanValue( user.name ??user.fullName ??user.displayName ??user.username ??user.email ??"Không có tên");
}

/*LAST LOGIN*/

function getLastLogin(user) {
  const timestamp =
    user.lastLoginAt ??
    user.lastLogin ??
    user.lastActive ??
    user.lastActiveAt ??
    user.updatedAt;
  const value =
    getTimestampValue(timestamp);
  if (!value) {
    return "Chưa đăng nhập";
  }
  return formatDateTime(value);
}

/*CREATED*/

function getCreatedAt(user) {
  const timestamp =
    user.createdAt ??
    user.created ??
    user.joined ??
    user.created_at;
  const value =
    getTimestampValue(timestamp);
  if (!value) {
    return "—";
  }
  return formatDate(value);
}
/*TIMESTAMP*/
function getTimestampValue(value) {
  if (!value) {
    return 0;
  }
  /*
   * Firestore Timestamp
   */
  if (
    typeof value === "object" &&
    typeof value.toMillis === "function"
  ) {
    return value.toMillis();
  }
  /*
   * JS Date
   */
  if (value instanceof Date) {
    return value.getTime();
  }
  /*
   * Firebase Timestamp object
   */
  if (typeof value === "object" &&typeof value.seconds === "number") {
    return (
      value.seconds * 1000 +
      Math.floor((value.nanoseconds || 0) /1000000)
    );
  }
  /*
   * Number
   */
  if (typeof value === "number") {
    /*
     * Nếu là seconds
     */
    if (value < 10000000000) {
      return value * 1000;
    }
    return value;
  }
  /*
   * String
   */
  if (typeof value === "string") {
    const parsed =
      Date.parse(value);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return 0;
}
/* =========================================================
   DATE FORMAT
========================================================= */
function formatDate(timestamp) {
  const date =
    new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return date.toLocaleDateString(
    "vi-VN",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }
  );
}
function formatDateTime(timestamp) {
  const date =
    new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return date.toLocaleString(
    "vi-VN",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }
  );
}
/* =========================================================
   PERIOD TEXT
========================================================= */
function getPeriodText(period) {
  switch (String(period)) {
    case "7":
      return "7 ngày gần nhất";
    case "30":
      return "30 ngày gần nhất";
    case "90":
      return "90 ngày gần nhất";
    case "all":
      return "Toàn bộ";
    default:
      return "30 ngày gần nhất";
  }
}
function updatePeriodLabel() {
  if (elements.periodLabel) {
    elements.periodLabel.textContent =
      getPeriodText(currentPeriod);
  }
}
/* =========================================================
   CLEAR FILTERS
========================================================= */
function clearFilters() {
  currentPeriod =
    DEFAULT_PERIOD;
  currentCampus = "all";
  currentDepartment = "all";
  currentSearch = "";
  if (elements.periodFilter) {
    elements.periodFilter.value =
      DEFAULT_PERIOD;
  }
  if (elements.campusFilter) {
    elements.campusFilter.value =
      "all";
  }
  if (elements.departmentFilter) {
    elements.departmentFilter.value =
      "all";
  }
  if (elements.searchInput) {
    elements.searchInput.value = "";
  }
  updatePeriodLabel();
  applyFilters();
  showToast(
    "Đã xóa toàn bộ bộ lọc."
  );
}

/*RECORD INFO*/

function updateRecordInfo(count) {
  if (elements.recordBadge) {
    elements.recordBadge.textContent =`${count} hồ sơ`;
  }
  if (elements.entriesNote) {
    if (count === 0) {
      elements.entriesNote.textContent ="Không có hồ sơ";
    } else {
      elements.entriesNote.textContent =`Hiển thị ${count} hồ sơ`;
    }
  }
}

/*ADMIN ACCOUNT*/

function loadAdminAccount() {
  try {
    if (typeof auth === "undefined") {
      return;
    }
    const currentUser =
      auth.currentUser;
    if (!currentUser) {
      return;
    }
    const email =currentUser.email ||"Admin";
    setAdminDisplay(email,email);
    /*
     * Lấy profile admin nếu có.
     */
    if (
      typeof db !== "undefined"
    ) {
      db.collection(USER_COLLECTION)
        .where("email","==",email).limit(1).get().then((snapshot) => {
          if (
            snapshot.empty
          ) {
            return;
          }
          const data =
            snapshot.docs[0].data() ||
            {};
          const name =
            data.name ||
            data.fullName ||
            data.displayName ||
            data.userName ||
            email;
          const campus =
            data.campus ||
            data.campusName ||
            data["code-campus"] ||
            data.campusId ||
            data.codeCampus ||
            "";
          setAdminDisplay(
            name,
            email,
            campus
          );
        })
        .catch((error) => {
          console.warn("Không lấy được profile admin:", error);
        });
    }
  } catch (error) {
    console.warn("Lỗi load admin:",error);
  }
}
function setAdminDisplay(
  name,
  email,
  campus = ""
) {
  const finalName = name || email || "Admin";
  const finalCampus =String(campus || "").trim();

  const adminCampus = document.getElementById("topAdminCampus");
  if (elements.topAdminName) {
    elements.topAdminName.textContent = finalName;
    elements.topAdminName.title = finalName;
  }
  if (adminCampus) {
    adminCampus.textContent = String(campus || "").trim();
  }
  if (elements.topAdminAvatar) {
    elements.topAdminAvatar.textContent =
      getInitials(finalName);
    elements.topAdminAvatar.setAttribute(
      "aria-label",
      `Tài khoản ${elements.topAdminName ? elements.topAdminName.textContent : finalName}`
    );
  }
}

/* =========================================================
   SHARED HEADER - ADMIN PROFILE
   Hiển thị theo logic của trang System:
   Tên Admin Campus
========================================================= */
(() => {
  "use strict";

  const get = (id) => document.getElementById(id);

  function safeText(value) {
    return value === null || value === undefined
      ? ""
      : String(value).trim();
  }

  function getInitials(name) {
    const text = safeText(name) || "Admin";
    const parts = text.split(/\s+/).filter(Boolean);

    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }

    return parts
      .slice(-2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");
  }

  function renderAdmin(name, campus, email) {
  const adminName = get("topAdminName");
    const adminCampus = get("topAdminCampus");
    const finalName = safeText(name) || safeText(email) || "Admin";
    const finalCampus = safeText(campus);

    if (adminName) {
      adminName.textContent = finalName;
      adminName.title = finalName;
    }

    if (adminCampus) {
      adminCampus.textContent = finalCampus;
      adminCampus.title = finalCampus
        ? `Campus ${finalCampus}`
        : "";
    }

    if (adminAvatar) {
      adminAvatar.textContent = getInitials(finalName);
      adminAvatar.setAttribute(
        "aria-label",
        `Tài khoản ${adminName ? adminName.textContent : finalName}${finalCampus ? ` - ${finalCampus}` : ""}`
      );
    }
  }

  async function loadAdminProfile(user) {
    if (!user) {
      renderAdmin("Admin", "", "");
      return;
    }

    let name = user.displayName || user.email || "Admin";
    let campus = "";

    try {
      if (typeof db !== "undefined" && db) {
        const userDoc = await db
          .collection("users")
          .doc(user.uid)
          .get();

        if (userDoc.exists) {
          const data = userDoc.data() || {};

          name =
            data.name ||
            data.fullName ||
            data.displayName ||
            data.userName ||
            name;

          campus =
            data.campus ||
            data.campusName ||
            data["code-campus"] ||
            data.campusId ||
            data.codeCampus ||
            "";
        }
      }
    } catch (error) {
      console.error("Không thể lấy thông tin Admin:", error);
    }

    renderAdmin(name, campus, user.email);
  }

  function initAdminProfile() {
    if (typeof firebase === "undefined" || !firebase.auth) {
      renderAdmin("Admin", "", "");
      return;
    }

    firebase.auth().onAuthStateChanged((user) => {
      loadAdminProfile(user);
    });
  }

  /* Chờ header.html được chèn xong rồi mới tìm topAdminName/avatar. */
  document.addEventListener("sharedheader:loaded", initAdminProfile);

  /* Trường hợp header đã có sẵn khi file này được nạp. */
  if (get("topAdminName")) {
    initAdminProfile();
  }
})();

/*NOTIFICATIONS */

function initNotifications() {
  if (!elements.noticeBtn ||!elements.notificationPanel ) {
    return;
  }
  elements.noticeBtn.addEventListener(
    "click",
    (event) => {
      event.stopPropagation();
      const isHidden =elements.notificationPanel.hidden;
      elements.notificationPanel.hidden =!isHidden; });
  document.addEventListener(
    "click",
    (event) => {
      if (
        !elements.notificationPanel.contains(event.target) &&
        !elements.noticeBtn.contains(event.target))
        {
        elements.notificationPanel.hidden =true;
      }
    }
  );
  if (elements.markAllReadBtn) {
    elements.markAllReadBtn.addEventListener("click",() => 
      {
        clearNotificationBadge();
        if (elements.notificationCount) {
          elements.notificationCount.textContent = "Không có thông báo mới";
        }
        showToast("Đã đánh dấu tất cả là đã đọc.");});}
  renderEmptyNotifications();
}
function renderEmptyNotifications() {
  if (!elements.notificationList) {
    return;
  }
  elements.notificationList.innerHTML = `
    <div class="notification-empty">
      <span class="material-symbols-rounded">
        notifications_none
      </span>
      <p>Không có thông báo mới</p>
    </div>
  `;
  clearNotificationBadge();
}
function clearNotificationBadge() {
  if (elements.noticeBadge) {
    elements.noticeBadge.textContent ="0";
    elements.noticeBadge.classList.add("hidden");
  }
  if (elements.noticeBtn) {
    elements.noticeBtn.classList.remove("has-notice");}
}

/*MOBILE MENU*/

function initMobileMenu() {
  if (!elements.menuBtn) {
    return;
  }
  elements.menuBtn.addEventListener(
    "click",() => {
      const sidebar =document.getElementById("sharedSidebar");
      if (!sidebar) {
        return;
      }
      sidebar.classList.toggle("open");
      document.body.classList.toggle("sidebar-open");});
}

/*EXPORT CSV*/

function exportCSV() {
  if (!filteredUsers.length) {
    showToast("Không có dữ liệu để xuất.");
    return;
  }
  const headers = [
    "ID",
    "Tên",
    "Email",
    "Username",
    "Campus",
    "Phòng ban",
    "Trạng thái",
    "Đăng nhập gần nhất",
    "Ngày tạo"
  ];
  const rows =
    filteredUsers.map((user) => [
      user.id || "",
      getUserName(user),
      user.email || "",
      user.username ||
        user.userName ||
        "",
      getCampus(user),
      getDepartment(user),
      getStatusText(
        getAccountStatus(user)
      ),
      getLastLogin(user),
      getCreatedAt(user)
    ]);
  const csv = [
    headers,
    ...rows
  ]
    .map((row) =>row.map(csvEscape).join(",")).join("\r\n");
  /*
   * BOM để Excel đọc tiếng Việt.
   */
  const blob =new Blob(["\uFEFF" + csv],{type:"text/csv;charset=utf-8;"});
  const url =URL.createObjectURL(blob);
  const link =document.createElement("a");
  link.href = url;
  link.download =`activity-report-${formatFileDate(new Date())}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast("Đã xuất báo cáo CSV.");
}
function getStatusText(status) {
  if (status === "active") {
    return "Đang hoạt động";
  }
  return "Chưa kích hoạt";
}
function csvEscape(value) {
  const text =String(value ?? "");
  return `"${text.replace(/"/g,'""')}"`;
}
function formatFileDate(date) {
  const year =date.getFullYear();
  const month =String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/*TOAST*/

let toastTimer = null;
function showToast(message) {
  if (!elements.toast) {
    return;
  }
  elements.toast.textContent =message;
  elements.toast.hidden =false;
  requestAnimationFrame(() => {
    elements.toast.classList.add(
      "show"
    );
  });
  clearTimeout(toastTimer);
  toastTimer =setTimeout(() => {
      elements.toast.classList.remove("show");
      setTimeout(() => {
        if (elements.toast) {
          elements.toast.hidden =
            true;
        }
      }, 220);
    }, 2600);
}

/*TABLE ERROR */

function showTableError(message) {
  if (!elements.activityBody) {
    return;
  }
  elements.activityBody.innerHTML = `
    <tr>
      <td colspan="6" class="empty-cell">
        ${escapeHTML(message)}
      </td>
    </tr>
  `;
  updateRecordInfo(0);
}

/*UTILITIES*/

function normalize(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"");
}
function cleanValue(value) {
  if (value === null ||value === undefined ) {
    return "";
  }
  if (
    typeof value === "object"
  ) {
    if (typeof value.name ==="string") {
      return value.name.trim();
    }
    if (typeof value.code ==="string") {
      return value.code.trim();
    }
    if (typeof value.id ==="string") {
      return value.id.trim();
    }
    return "";
  }
  return String(value).trim();
}
function uniqueValues(values) {
  return [
    ...new Set(values.map(cleanValue).filter(Boolean))
  ].sort((a, b) =>a.localeCompare(b,"vi"));
}
function getInitials(name) {
  const text =
    cleanValue(name);
  if (!text) {
    return "AD";
  }
  const parts =
    text
      .split(/\s+/)
      .filter(Boolean);
  if (parts.length === 1) {
    return parts[0]
      .slice(0, 2)
      .toUpperCase();
  }
  return (parts[0][0] +parts[parts.length - 1][0]).toUpperCase();
}
function escapeHTML(value) {
  return String(value ?? "")
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );
}

/*CLEANUP*/

window.addEventListener(
  "beforeunload",
  () => {
    if (typeof unsubscribeUsers ==="function") {
      unsubscribeUsers();
    }
  }
);