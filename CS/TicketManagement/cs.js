(function () {
  "use strict";

  /* =========================================================
     CONFIG
  ========================================================= */

  const TICKET_COLLECTION = "tickets";
  const USER_COLLECTION = "users";
  const CHAT_SUBCOLLECTION = "messages";

  const DEFAULT_DEPARTMENT_CODE = "IT";
  const PAGE_SIZE = 10;


  /* =========================================================
     FIREBASE CHECK
  ========================================================= */

  if (typeof firebase === "undefined") {
      console.error("❌ Firebase chưa được load.");
      return;
  }

  if (typeof db === "undefined" || !db) {
      console.error("❌ Firestore db chưa được khởi tạo.");
      return;
  }

  if (typeof auth === "undefined" || !auth) {
      console.error("❌ Firebase Auth chưa được khởi tạo.");
      return;
  }


  /* =========================================================
     STATE
  ========================================================= */

  let currentCSUser = null;
  let currentCSProfile = null;

  let allTickets = [];
  let filteredTickets = [];

  let currentPage = 1;

  let selectedTicket = null;

  let ticketUnsubscribe = null;
  let chatUnsubscribe = null;


  /* =========================================================
     DOM
  ========================================================= */

  const ticketBody =
      document.getElementById("ticketBody");

  const emptyState =
      document.getElementById("emptyState");

  const entriesNote =
      document.getElementById("entriesNote");

  const paginationEl =
      document.getElementById("paginationEl");

  const filterStatus =
      document.getElementById("filterStatus");

  const filterPriority =
      document.getElementById("filterPriority");

  const filterCategory =
      document.getElementById("filterCategory");

  const searchInput =
      document.getElementById("searchInput");

  const statTotal =
      document.getElementById("statTotal");

  const statOpen =
      document.getElementById("statOpen");

  const statProgress =
      document.getElementById("statProgress");

  const statResolved =
      document.getElementById("statResolved");

  const statClosed =
      document.getElementById("statClosed");

  const ticketDrawer =
      document.getElementById("ticketDrawer");

  const drawerBody =
      document.getElementById("drawerBody");

  const closeDrawerBtn =
      document.getElementById("closeDrawerBtn");

  const drawerBackdrop =
      document.getElementById("drawerBackdrop");

  const chatPanel =
      document.getElementById("chatPanel");

  const chatMessages =
      document.getElementById("chatMessages");

  const chatInput =
      document.getElementById("chatInput");

  const sendChatBtn =
      document.getElementById("sendChatBtn");

  const closeChatBtn =
      document.getElementById("closeChatBtn");

  const chatTicketContext =
      document.getElementById("chatTicketContext");

  let statusResizeCleanup = null;
  let chatResizeCleanup = null;


  /* =========================================================
     STATUS
  ========================================================= */

  const STATUS_META = {
      open: {
          label: "Đang mở",
          shortLabel: "Mới nhận",
          color: "#B08A4E",
          icon: "○"
      },

      pending: {
          label: "Đang chờ",
          shortLabel: "Chờ học viên",
          color: "#B08A4E",
          icon: "◐"
      },

      in_progress: {
          label: "Đang xử lý",
          shortLabel: "Đang xử lý",
          color: "#5D0703",
          icon: "●"
      },

      resolved: {
          label: "Đã giải quyết",
          shortLabel: "Đã giải quyết",
          color: "#4C6B3C",
          icon: "✓"
      },

      closed: {
          label: "Đã đóng",
          shortLabel: "Đã đóng",
          color: "#8A7A6D",
          icon: "×"
      }
  };


  const STATUS_ORDER = [
      "open",
      "in_progress",
      "pending",
      "resolved",
      "closed"
  ];


  function normalizeStatus(status) {
      if (!status) {
          return "open";
      }

      const value =
          String(status)
              .trim()
              .toLowerCase();

      if (STATUS_META[value]) {
          return value;
      }

      return "open";
  }


  function getStatusLabel(status) {
      const key =
          normalizeStatus(status);

      return STATUS_META[key]?.label ||
          "Đang mở";
  }


  /* =========================================================
     PRIORITY
  ========================================================= */

  const PRIORITY_META = {
      high: {
          label: "Cao"
      },

      medium: {
          label: "Trung bình"
      },

      low: {
          label: "Thấp"
      }
  };


  function normalizePriority(priority) {
      if (!priority) {
          return "medium";
      }

      const value =
          String(priority)
              .trim()
              .toLowerCase();

      if (value === "cao") {
          return "high";
      }

      if (
          value === "trung bình" ||
          value === "trungbinh"
      ) {
          return "medium";
      }

      if (value === "thấp") {
          return "low";
      }

      if (PRIORITY_META[value]) {
          return value;
      }

      return "medium";
  }


  function getPriorityLabel(priority) {
      const key =
          normalizePriority(priority);

      return PRIORITY_META[key]?.label ||
          "Trung bình";
  }


  /* =========================================================
     CATEGORY
  ========================================================= */

  const TICKET_CATEGORY_LABELS = {
      system: "Hệ thống",
      learning: "Khóa học",
      account: "Tài khoản",
      operations: "Vận hành",
      other: "Khác",

      "system-login":
          "Đăng nhập / xác thực",

      "system-password":
          "Mật khẩu",

      "system-account":
          "Tài khoản học viên",

      "system-website-access":
          "Website không truy cập được",

      "system-page-error":
          "Một trang bị lỗi",

      "system-browser-device":
          "Lỗi thiết bị / trình duyệt",

      "system-video-playback":
          "Lỗi phát video",

      "system-file-upload":
          "Không tải được tệp",

      "system-notification":
          "Email / thông báo",

      "system-data-sync":
          "Dữ liệu chưa đồng bộ",

      "system-security":
          "Bảo mật tài khoản",

      "system-technical":
          "Lỗi kỹ thuật / trang web",

      "learning-registration":
          "Đăng ký khóa học",

      "learning-course-access":
          "Quyền truy cập khóa học",

      "learning-fee":
          "Học phí",

      "learning-payment-method":
          "Phương thức thanh toán",

      "learning-payment-confirmation":
          "Xác nhận thanh toán",

      "learning-invoice":
          "Hóa đơn / biên nhận",

      "learning-refund":
          "Hoàn tiền / hủy đăng ký",

      "learning-promotion":
          "Mã giảm giá / ưu đãi",

      "learning-certificate":
          "Chứng chỉ",

      "learning-result":
          "Kết quả học tập",

      "account-schedule":
          "Lịch học",

      "account-qualities":
          "Chất lượng hình ảnh / video",

      "account-mentor":
          "Mentor / giáo viên",

      "account-support":
          "Hỗ trợ trong quá trình học",

      "operations-schedule":
          "Lịch học",

      "operations-attendance":
          "Điểm danh và vắng học",

      "operations-mentor":
          "Mentor / giáo viên",

      "operations-mentor-feedback":
          "Phản hồi về mentor",

      "operations-video-quality":
          "Chất lượng hình ảnh / video",

      "operations-video-access":
          "Không xem được bài giảng",

      "operations-material":
          "Tài liệu và bài giảng",

      "operations-assignment":
          "Bài tập và hỗ trợ bài giảng",

      "operations-classroom":
          "Phòng học và buổi học",

      "operations-support":
          "Hỗ trợ trong quá trình học",

      "other-feedback":
          "Góp ý / phản hồi",

      "other-complaint":
          "Khiếu nại",

      "other-request":
          "Yêu cầu hỗ trợ khác"
  };


  function resolveTicketLabel(value) {
      if (
          value === undefined ||
          value === null ||
          value === ""
      ) {
          return "Khác";
      }

      const normalized =
          String(value).trim();

      return (
          TICKET_CATEGORY_LABELS[normalized] ||
          normalized
      );
  }


  function getTicketType(ticket) {
      if (
          ticket.ticketType &&
          TICKET_CATEGORY_LABELS[
              ticket.ticketType
          ]
      ) {
          return TICKET_CATEGORY_LABELS[
              ticket.ticketType
          ];
      }

      const category =
          resolveTicketLabel(
              ticket.ticketCategory ||
              ticket.category ||
              ""
          );

      const issue =
          resolveTicketLabel(
              ticket.ticketIssue ||
              ticket.issue ||
              ticket.detail ||
              ""
          );

      if (
          issue &&
          issue !== category &&
          issue !== "Khác"
      ) {
          return `${category} · ${issue}`;
      }

      return category || "Khác";
  }


  function getCategoryKey(ticket) {
      return String(
          ticket.ticketType ||
          ticket.ticketIssue ||
          ticket.ticketCategory ||
          ticket.category ||
          "other"
      ).trim();
  }


  /* =========================================================
     BASIC HELPERS
  ========================================================= */

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


  function getTicketNum(ticket) {
      return (
          ticket.ticketNum ||
          ticket.ticket_num ||
          ticket.ticketId ||
          ticket.id ||
          "—"
      );
  }


  function getTicketTitle(ticket) {
      return (
          ticket.title ||
          ticket.subject ||
          ticket.question ||
          "Không có tiêu đề"
      );
  }


  function getStudentName(ticket) {
      return (
          ticket.name ||
          ticket.studentName ||
          ticket.fullName ||
          ticket.displayName ||
          "Học viên"
      );
  }


  function getStudentEmail(ticket) {
      return (
          ticket.email ||
          ticket.studentEmail ||
          ""
      );
  }


  function getTicketDescription(ticket) {
      return (
          ticket.description ||
          ticket.content ||
          ticket.message ||
          ticket.detail ||
          ticket.question ||
          ""
      );
  }


  /* =========================================================
     DATE
  ========================================================= */

  function getTimestampMillis(value) {
      if (!value) {
          return 0;
      }

      if (
          typeof value.toMillis ===
          "function"
      ) {
          return value.toMillis();
      }

      if (value instanceof Date) {
          return value.getTime();
      }

      if (
          typeof value.seconds ===
          "number"
      ) {
          return value.seconds * 1000;
      }

      const parsed =
          new Date(value).getTime();

      return isNaN(parsed)
          ? 0
          : parsed;
  }


  function formatDate(value) {
      const millis =
          getTimestampMillis(value);

      if (!millis) {
          return "—";
      }

      return new Date(millis)
          .toLocaleDateString(
              "vi-VN"
          );
  }


  function formatDateTime(value) {
      const millis =
          getTimestampMillis(value);

      if (!millis) {
          return "—";
      }

      return new Date(millis)
          .toLocaleString(
              "vi-VN"
          );
  }


  function formatTicketDate(ticket) {
      if (ticket.date) {
          return String(ticket.date);
      }

      if (ticket.createdAt) {
          return formatDate(
              ticket.createdAt
          );
      }

      return "—";
  }


  /* =========================================================
     CAMPUS
  ========================================================= */

  function normalizeCampus(value) {
      if (
          value === undefined ||
          value === null
      ) {
          return "";
      }

      const campus =
          String(value).trim();

      if (!campus) {
          return "";
      }

      const lower =
          campus.toLowerCase();

      if (
          lower === "hcm" ||
          lower === "tphcm" ||
          lower === "tp hcm" ||
          lower === "tp.hcm" ||
          lower === "tp. hcm" ||
          lower === "hồ chí minh" ||
          lower === "ho chi minh"
      ) {
          return "HCM";
      }

      if (
          lower === "hn" ||
          lower === "hà nội" ||
          lower === "ha noi"
      ) {
          return "Hà Nội";
      }

      return campus;
  }


  function campusFromCampusId(campusId) {
      if (!campusId) {
          return "";
      }

      const value =
          String(campusId).trim();

      if (value.includes("-")) {
          const parts =
              value.split("-");

          return normalizeCampus(
              parts[parts.length - 1]
          );
      }

      return normalizeCampus(value);
  }


  function getTicketCampus(ticket) {
      if (ticket.campus) {
          return normalizeCampus(
              ticket.campus
          );
      }

      if (ticket.campusName) {
          return normalizeCampus(
              ticket.campusName
          );
      }

      if (ticket.campusId) {
          return campusFromCampusId(
              ticket.campusId
          );
      }

      return "";
  }


  /* =========================================================
     DEPARTMENT
  ========================================================= */

  function normalizeDepartmentCode(value) {
      if (
          value === undefined ||
          value === null
      ) {
          return "";
      }

      return String(value)
          .trim()
          .toUpperCase();
  }


  function getTicketDepartment(ticket) {
      if (ticket.departmentCode) {
          return normalizeDepartmentCode(
              ticket.departmentCode
          );
      }

      if (ticket.department) {
          if (
              typeof ticket.department ===
              "object"
          ) {
              return normalizeDepartmentCode(
                  ticket.department.code ||
                  ticket.department.departmentCode ||
                  ""
              );
          }

          return normalizeDepartmentCode(
              ticket.department
          );
      }

      return "";
  }


  /* =========================================================
     CS PROFILE
  ========================================================= */

  async function loadCSProfile(uid) {
      try {
          const docSnap =
              await db
                  .collection(
                      USER_COLLECTION
                  )
                  .doc(uid)
                  .get();

          if (!docSnap.exists) {
              console.error(
                  "❌ Không tìm thấy users/" +
                  uid
              );

              return null;
          }

          const data =
              docSnap.data() || {};

          return {
              uid,

              department:
                  normalizeDepartmentCode(
                      data.departmentCode ||
                      data.department ||
                      DEFAULT_DEPARTMENT_CODE
                  ),

              campus:
                  normalizeCampus(
                      data.campus ||
                      data.campusName ||
                      data.campusId ||
                      ""
                  ),

              name:
                  data.name ||
                  data.fullName ||
                  data.displayName ||
                  "",

              email:
                  data.email ||
                  ""
          };

      } catch (error) {
          console.error(
              "❌ Lỗi load profile:",
              error
          );

          return null;
      }
  }


  /* =========================================================
     LOAD TICKETS
     CS chỉ nhận:
     campus của CS
     +
     department của CS
  ========================================================= */

  function loadTicketsForCurrentCS(profile) {
      if (ticketUnsubscribe) {
          ticketUnsubscribe();
          ticketUnsubscribe = null;
      }

      if (
          !profile ||
          !profile.department ||
          !profile.campus
      ) {
          renderEmptyProfileError();
          return;
      }

      ticketUnsubscribe =
          db
              .collection(
                  TICKET_COLLECTION
              )
              .where(
                  "departmentCode",
                  "==",
                  profile.department
              )
              .where(
                  "campus",
                  "==",
                  profile.campus
              )
              .onSnapshot(
                  snapshot => {
                      allTickets = [];

                      snapshot.forEach(
                          docSnap => {
                              allTickets.push({
                                  id:
                                      docSnap.id,
                                  ...docSnap.data()
                              });
                          }
                      );

                      allTickets.sort(
                          (a, b) => {
                              return (
                                  getTimestampMillis(
                                      b.createdAt
                                  ) -
                                  getTimestampMillis(
                                      a.createdAt
                                  )
                              );
                          }
                      );

                      buildCategoryFilter();

                      currentPage = 1;

                      applyFilters();
                  },

                  error => {
                      console.error(
                          "❌ Lỗi lấy ticket:",
                          error
                      );

                      showFirestoreError(
                          error
                      );
                  }
              );
  }


  /* =========================================================
     FIRESTORE ERROR
  ========================================================= */

  function showFirestoreError(error) {
      if (!ticketBody) {
          return;
      }

      ticketBody.innerHTML = `
          <tr>
              <td colspan="8">
                  <div class="empty-note">
                      Không thể tải ticket.
                      <br>
                      <small>
                          ${escapeHtml(
                              error?.message ||
                              "Lỗi Firestore"
                          )}
                      </small>
                  </div>
              </td>
          </tr>
      `;

      if (emptyState) {
          emptyState.hidden = true;
      }
  }


  function renderEmptyProfileError() {
      if (!ticketBody) {
          return;
      }

      ticketBody.innerHTML = `
          <tr>
              <td colspan="8">
                  <div class="empty-note">
                      Tài khoản CS chưa được cấu hình
                      campus hoặc phòng ban.
                  </div>
              </td>
          </tr>
      `;

      if (emptyState) {
          emptyState.hidden = true;
      }
  }


  /* =========================================================
     CATEGORY FILTER
  ========================================================= */

  function buildCategoryFilter() {
      if (!filterCategory) {
          return;
      }

      const currentValue =
          filterCategory.value;

      const categories =
          new Map();

      allTickets.forEach(
          ticket => {
              const key =
                  getCategoryKey(ticket);

              const label =
                  getTicketType(ticket);

              if (!categories.has(key)) {
                  categories.set(
                      key,
                      label
                  );
              }
          }
      );

      filterCategory.innerHTML = `
          <option value="all">
              Tất cả
          </option>
      `;

      [...categories.entries()]
          .sort(
              (a, b) =>
                  a[1].localeCompare(
                      b[1],
                      "vi"
                  )
          )
          .forEach(
              ([key, label]) => {
                  const option =
                      document.createElement(
                          "option"
                      );

                  option.value = key;
                  option.textContent = label;

                  filterCategory.appendChild(
                      option
                  );
              }
          );

      if (
          [...filterCategory.options]
              .some(
                  option =>
                      option.value ===
                      currentValue
              )
      ) {
          filterCategory.value =
              currentValue;
      }
  }


  /* =========================================================
     FILTER
  ========================================================= */

  function applyFilters() {
      const status =
          filterStatus?.value ||
          "all";

      const priority =
          filterPriority?.value ||
          "all";

      const category =
          filterCategory?.value ||
          "all";

      const search =
          (
              searchInput?.value ||
              ""
          )
              .trim()
              .toLowerCase();

      filteredTickets =
          allTickets.filter(
              ticket => {

                  if (
                      status !== "all" &&
                      normalizeStatus(
                          ticket.status
                      ) !== status
                  ) {
                      return false;
                  }

                  if (
                      priority !== "all" &&
                      normalizePriority(
                          ticket.priority
                      ) !== priority
                  ) {
                      return false;
                  }

                  if (
                      category !== "all" &&
                      getCategoryKey(
                          ticket
                      ) !== category
                  ) {
                      return false;
                  }

                  if (search) {
                      const searchable =
                          [
                              getTicketNum(
                                  ticket
                              ),

                              getStudentName(
                                  ticket
                              ),

                              getStudentEmail(
                                  ticket
                              ),

                              getTicketTitle(
                                  ticket
                              ),

                              getTicketDescription(
                                  ticket
                              ),

                              getTicketType(
                                  ticket
                              ),

                              ticket.campus,

                              ticket.departmentCode
                          ]
                              .filter(Boolean)
                              .join(" ")
                              .toLowerCase();

                      if (
                          !searchable.includes(
                              search
                          )
                      ) {
                          return false;
                      }
                  }

                  return true;
              }
          );

      currentPage = 1;

      renderStats(
          allTickets
      );

      renderTable();
  }


  /* =========================================================
     STATS
  ========================================================= */

  function renderStats(tickets) {
      const counts = {
          open: 0,
          pending: 0,
          in_progress: 0,
          resolved: 0,
          closed: 0
      };

      tickets.forEach(
          ticket => {
              const status =
                  normalizeStatus(
                      ticket.status
                  );

              if (
                  counts[status] !==
                  undefined
              ) {
                  counts[status]++;
              }
          }
      );

      if (statTotal) {
          statTotal.textContent =
              tickets.length;
      }

      if (statOpen) {
          statOpen.textContent =
              counts.open +
              counts.pending;
      }

      if (statProgress) {
          statProgress.textContent =
              counts.in_progress;
      }

      if (statResolved) {
          statResolved.textContent =
              counts.resolved;
      }

      if (statClosed) {
          statClosed.textContent =
              counts.closed;
      }
  }


  /* =========================================================
     STATUS PILL
  ========================================================= */

  function statusPill(status) {
      const key =
          normalizeStatus(status);

      const meta =
          STATUS_META[key] ||
          STATUS_META.open;

      return `
          <span
              class="status-tag"
              style="
                  background:${meta.color}22;
                  color:${meta.color};
              "
          >
              <span
                  class="dot"
                  style="
                      background:${meta.color};
                  "
              ></span>

              ${escapeHtml(
                  meta.label
              )}
          </span>
      `;
  }


  /* =========================================================
     INLINE STATUS UX
     Bộ trạng thái luôn nằm trong drawer chi tiết.
  ========================================================= */

  function renderInlineStatusEditor(ticket) {
      const currentStatus = normalizeStatus(ticket.status);

      return `
          <section class="status-inline" id="statusInlineEditor" aria-labelledby="statusInlineTitle">
              <div class="status-inline-head">
                  <div>
                      <span class="status-inline-kicker">CẬP NHẬT TẠI CHỖ</span>
                      <h4 id="statusInlineTitle">Cập nhật trạng thái</h4>
                      <p class="status-inline-description">Chọn trạng thái mới ngay tại đây. Bạn không cần rời khỏi ticket hoặc mở trang khác.</p>
                  </div>
                  <div class="status-inline-current" aria-label="Trạng thái hiện tại">
                      ${statusPill(currentStatus)}
                  </div>
              </div>

              <div class="status-stepper" role="group" aria-label="Các trạng thái của ticket">
                  ${STATUS_ORDER.map(status => renderStatusStep(ticket, status, currentStatus)).join("")}
              </div>

              <div class="status-inline-feedback" id="statusInlineFeedback" role="status" aria-live="polite">
                  Chọn một trạng thái để cập nhật ticket này.
              </div>

              <button class="status-inline-resize-handle" id="statusInlineResizeHandle" type="button" aria-label="Kéo để thay đổi chiều rộng khu vực trạng thái" title="Kéo để thay đổi chiều rộng khu vực trạng thái"></button>
          </section>
      `;
  }


  /* =========================================================
     PRIORITY PILL
  ========================================================= */

  function priorityPill(priority) {
      const key =
          normalizePriority(
              priority
          );

      return `
          <span
              class="
                  priority-tag
                  priority-${key}
              "
          >
              ${escapeHtml(
                  getPriorityLabel(
                      priority
                  )
              )}
          </span>
      `;
  }


  /* =========================================================
     RENDER TABLE
  ========================================================= */

  function renderTable() {
      if (!ticketBody) {
          return;
      }

      const total =
          filteredTickets.length;

      const totalPages =
          Math.max(
              1,
              Math.ceil(
                  total /
                  PAGE_SIZE
              )
          );

      if (
          currentPage >
          totalPages
      ) {
          currentPage =
              totalPages;
      }

      const start =
          (
              currentPage -
              1
          ) *
          PAGE_SIZE;

      const end =
          start +
          PAGE_SIZE;

      const pageTickets =
          filteredTickets.slice(
              start,
              end
          );

      if (
          pageTickets.length === 0
      ) {
          ticketBody.innerHTML = "";

          if (emptyState) {
              emptyState.hidden =
                  false;
          }
      } else {
          if (emptyState) {
              emptyState.hidden =
                  true;
          }

          ticketBody.innerHTML =
              pageTickets
                  .map(
                      renderTicketRow
                  )
                  .join("");
      }

      renderEntriesNote(
          total,
          start,
          pageTickets.length
      );

      renderPagination(
          totalPages
      );
  }


  /* =========================================================
     TICKET ROW
  ========================================================= */

  function renderTicketRow(ticket) {
      const ticketNum =
          getTicketNum(ticket);

      const studentName =
          getStudentName(ticket);

      const title =
          getTicketTitle(ticket);

      const type =
          getTicketType(ticket);

      return `
          <tr
              class="ticket-row"
              data-ticket-id="${escapeHtml(
                  ticket.id
              )}"
              tabindex="0"
              role="button"
              aria-label="Mở ticket ${escapeHtml(
                  ticketNum
              )}"
          >

              <td>
                  <span class="ticket-code">
                      ${escapeHtml(
                          ticketNum
                      )}
                  </span>
              </td>

              <td>
                  <div class="student-cell">

                      <strong>
                          ${escapeHtml(
                              studentName
                          )}
                      </strong>

                      ${
                          getStudentEmail(ticket)
                              ? `
                                  <small>
                                      ${escapeHtml(
                                          getStudentEmail(
                                              ticket
                                          )
                                      )}
                                  </small>
                              `
                              : ""
                      }

                  </div>
              </td>

              <td>
                  <div class="content-cell">

                      <strong>
                          ${escapeHtml(
                              title
                          )}
                      </strong>

                      <small>
                          ${escapeHtml(
                              getTicketDescription(
                                  ticket
                              )
                          ).slice(
                              0,
                              100
                          )}
                      </small>

                  </div>
              </td>

              <td>
                  <span class="category-text">
                      ${escapeHtml(
                          type
                      )}
                  </span>
              </td>

              <td>
                  ${statusPill(
                      ticket.status
                  )}
              </td>

              <td>
                  ${priorityPill(
                      ticket.priority
                  )}
              </td>

              <td>
                  <span class="date-text">
                      ${escapeHtml(
                          formatTicketDate(
                              ticket
                          )
                      )}
                  </span>
              </td>

              <td>
                  <button
                      type="button"
                      class="ticket-more-btn"
                      data-ticket-id="${escapeHtml(
                          ticket.id
                      )}"
                      title="Xem chi tiết"
                      aria-label="Xem chi tiết"
                  >
                      ⋯
                  </button>
              </td>

          </tr>
      `;
  }


  /* =========================================================
     EVENT DELEGATION TABLE

     QUAN TRỌNG:
     BẤM BẤT CỨ ĐÂU TRONG ROW
     → MỞ DRAWER

     Nhưng:
     - bấm button không mở 2 lần
     - bấm link/button/input không bị
       click row ngoài ý muốn
  ========================================================= */

  if (ticketBody) {

      ticketBody.addEventListener(
          "click",
          event => {

              const button =
                  event.target.closest(
                      "button"
                  );

              if (button) {

                  const ticketId =
                      button.dataset.ticketId;

                  if (
                      button.classList.contains(
                          "ticket-more-btn"
                      ) &&
                      ticketId
                  ) {
                      event.stopPropagation();

                      openTicket(
                          ticketId
                      );
                  }

                  return;
              }


              const row =
                  event.target.closest(
                      "tr[data-ticket-id]"
                  );

              if (!row) {
                  return;
              }


              const ticketId =
                  row.dataset.ticketId;

              if (!ticketId) {
                  return;
              }


              openTicket(
                  ticketId
              );
          }
      );


      /* =============================================
         KEYBOARD
         Enter / Space cũng mở ticket
      ============================================= */

      ticketBody.addEventListener(
          "keydown",
          event => {

              if (
                  event.key !== "Enter" &&
                  event.key !== " "
              ) {
                  return;
              }

              const row =
                  event.target.closest(
                      "tr[data-ticket-id]"
                  );

              if (!row) {
                  return;
              }

              event.preventDefault();

              openTicket(
                  row.dataset.ticketId
              );
          }
      );
  }


  /* =========================================================
     PAGINATION
  ========================================================= */

  function renderEntriesNote(
      total,
      start,
      count
  ) {
      if (!entriesNote) {
          return;
      }

      if (total === 0) {
          entriesNote.textContent =
              "Hiển thị 0 / 0 ticket";

          return;
      }

      entriesNote.textContent =
          `Hiển thị ${
              start + 1
          }–${
              start + count
          } / ${
              total
          } ticket`;
  }


  function renderPagination(
      totalPages
  ) {
      if (!paginationEl) {
          return;
      }

      if (totalPages <= 1) {
          paginationEl.innerHTML =
              "";

          return;
      }

      let html = "";

      html += `
          <button
              type="button"
              class="page-btn"
              data-page="${
                  currentPage - 1
              }"
              ${
                  currentPage === 1
                      ? "disabled"
                      : ""
              }
          >
              ‹
          </button>
      `;


      const maxButtons = 7;

      let startPage =
          Math.max(
              1,
              currentPage -
              Math.floor(
                  maxButtons / 2
              )
          );

      let endPage =
          Math.min(
              totalPages,
              startPage +
              maxButtons -
              1
          );


      if (
          endPage -
          startPage +
          1 <
          maxButtons
      ) {
          startPage =
              Math.max(
                  1,
                  endPage -
                  maxButtons +
                  1
              );
      }


      for (
          let page =
              startPage;
          page <= endPage;
          page++
      ) {

          html += `
              <button
                  type="button"
                  class="
                      page-btn
                      ${
                          page === currentPage
                              ? "active"
                              : ""
                      }
                  "
                  data-page="${page}"
              >
                  ${page}
              </button>
          `;
      }


      html += `
          <button
              type="button"
              class="page-btn"
              data-page="${
                  currentPage + 1
              }"
              ${
                  currentPage === totalPages
                      ? "disabled"
                      : ""
              }
          >
              ›
          </button>
      `;


      paginationEl.innerHTML =
          html;
  }


  if (paginationEl) {

      paginationEl.addEventListener(
          "click",
          event => {

              const button =
                  event.target.closest(
                      ".page-btn"
                  );

              if (!button) {
                  return;
              }

              const page =
                  Number(
                      button.dataset.page
                  );

              if (
                  !page ||
                  button.disabled
              ) {
                  return;
              }

              currentPage =
                  page;

              renderTable();

              window.scrollTo({
                  top: 0,
                  behavior: "smooth"
              });
          }
      );
  }


  /* =========================================================
     FILTER EVENTS
  ========================================================= */

  if (filterStatus) {
      filterStatus.addEventListener(
          "change",
          applyFilters
      );
  }


  if (filterPriority) {
      filterPriority.addEventListener(
          "change",
          applyFilters
      );
  }


  if (filterCategory) {
      filterCategory.addEventListener(
          "change",
          applyFilters
      );
  }


  if (searchInput) {
      searchInput.addEventListener(
          "input",
          () => {
              currentPage = 1;
              applyFilters();
          }
      );
  }


  /* =========================================================
     OPEN TICKET
  ========================================================= */

  function openTicket(ticketId) {

      if (!ticketId) {
          return;
      }

      const ticket =
          allTickets.find(
              item =>
                  item.id ===
                  ticketId
          );


      if (!ticket) {
          console.warn(
              "Không tìm thấy ticket:",
              ticketId
          );

          return;
      }


      selectedTicket =
          ticket;


      closeChat();


      renderDrawer(
          ticket
      );


      if (ticketDrawer) {

          ticketDrawer.classList.add(
              "open"
          );

          ticketDrawer.setAttribute(
              "aria-hidden",
              "false"
          );
      }


      if (drawerBackdrop) {

          drawerBackdrop.hidden =
              false;

          requestAnimationFrame(
              () => {

                  drawerBackdrop.classList.add(
                      "show"
                  );
              }
          );
      }
  }


  /* =========================================================
     DRAWER
  ========================================================= */

  function renderDrawer(ticket) {

      if (!drawerBody) {
          return;
      }


      const ticketNum =
          getTicketNum(ticket);

      const title =
          getTicketTitle(ticket);

      const student =
          getStudentName(ticket);

      const email =
          getStudentEmail(ticket);

      const campus =
          getTicketCampus(ticket) ||
          "—";

      const department =
          getTicketDepartment(ticket) ||
          "—";


      drawerBody.innerHTML = `
          <div class="ticket-detail">

              <div class="detail-top">

                  <div>

                      <span class="drawer-kicker">
                          ${escapeHtml(
                              ticketNum
                          )}
                      </span>

                      <h3>
                          ${escapeHtml(
                              title
                          )}
                      </h3>

                  </div>

                  ${statusPill(
                      ticket.status
                  )}

              </div>


              <div class="detail-grid">

                  <div class="detail-item">
                      <span>
                          HỌC VIÊN
                      </span>

                      <strong>
                          ${escapeHtml(
                              student
                          )}
                      </strong>
                  </div>


                  <div class="detail-item">
                      <span>
                          EMAIL
                      </span>

                      <strong>
                          ${escapeHtml(
                              email ||
                              "—"
                          )}
                      </strong>
                  </div>


                  <div class="detail-item">
                      <span>
                          CAMPUS
                      </span>

                      <strong>
                          ${escapeHtml(
                              campus
                          )}
                      </strong>
                  </div>


                  <div class="detail-item">
                      <span>
                          PHÒNG BAN
                      </span>

                      <strong>
                          ${escapeHtml(
                              department
                          )}
                      </strong>
                  </div>


                  <div class="detail-item">
                      <span>
                          LOẠI YÊU CẦU
                      </span>

                      <strong>
                          ${escapeHtml(
                              getTicketType(
                                  ticket
                              )
                          )}
                      </strong>
                  </div>


                  <div class="detail-item">
                      <span>
                          ƯU TIÊN
                      </span>

                      <strong>
                          ${escapeHtml(
                              getPriorityLabel(
                                  ticket.priority
                              )
                          )}
                      </strong>
                  </div>


                  <div class="detail-item">
                      <span>
                          NGÀY GỬI
                      </span>

                      <strong>
                          ${escapeHtml(
                              formatDateTime(
                                  ticket.createdAt
                              )
                          )}
                      </strong>
                  </div>

              </div>


              <div class="detail-section">

                  <span class="detail-section-title">
                      NỘI DUNG YÊU CẦU
                  </span>

                  <div class="detail-description">
                      ${escapeHtml(
                          getTicketDescription(
                              ticket
                          ) ||
                          "Không có nội dung."
                      )}
                  </div>

              </div>


              ${renderInlineStatusEditor(ticket)}

              <div class="detail-actions">
                  <button
                      type="button"
                      class="drawer-action-btn"
                      id="openChatFromDrawer"
                  >
                      Trao đổi với học viên
                  </button>

                  <button
                      type="button"
                      class="drawer-action-btn"
                      id="focusStatusBtn"
                  >
                      Đến khu vực trạng thái
                  </button>
              </div>

          </div>
      `;


      const openChatButton =
          document.getElementById(
              "openChatFromDrawer"
          );


      if (openChatButton) {

          openChatButton.addEventListener(
              "click",
              () => {
                  openChat(
                      ticket
                  );
              }
          );
      }


      const focusStatusButton =
          document.getElementById(
              "focusStatusBtn"
          );

      if (focusStatusButton) {
          focusStatusButton.addEventListener(
              "click",
              () => showStatusEditor(ticket)
          );
      }

      bindStatusEditor(ticket);
      bindStatusResize();
  }


  /* =========================================================
     CLOSE DRAWER
  ========================================================= */

  function closeDrawer() {

      if (ticketDrawer) {

          ticketDrawer.classList.remove(
              "open"
          );

          ticketDrawer.setAttribute(
              "aria-hidden",
              "true"
          );
      }


      if (drawerBackdrop) {

          drawerBackdrop.classList.remove(
              "show"
          );

          setTimeout(
              () => {
                  drawerBackdrop.hidden =
                      true;
              },
              200
          );
      }


      closeChat();

      selectedTicket =
          null;
  }


  if (closeDrawerBtn) {

      closeDrawerBtn.addEventListener(
          "click",
          closeDrawer
      );
  }


  if (drawerBackdrop) {

      drawerBackdrop.addEventListener(
          "click",
          closeDrawer
      );
  }


  /* =========================================================
     ESC
  ========================================================= */

  document.addEventListener(
      "keydown",
      event => {

          if (
              event.key ===
              "Escape"
          ) {
              closeDrawer();
          }
      }
  );


  /* =========================================================
     STATUS STEPPER
  ========================================================= */

  function showStatusEditor(ticket) {
      const editor = document.getElementById("statusInlineEditor");

      if (!editor) {
          renderDrawer(ticket);
          return;
      }

      editor.classList.add("is-focused");
      editor.scrollIntoView({ behavior: "smooth", block: "center" });

      const firstActionable = editor.querySelector("[data-new-status]:not(:disabled)");
      if (firstActionable) {
          firstActionable.focus({ preventScroll: true });
      }

      window.setTimeout(() => editor.classList.remove("is-focused"), 700);
  }


  function setStatusEditorFeedback(message, tone = "") {
      const feedback = document.getElementById("statusInlineFeedback");
      if (!feedback) {
          return;
      }

      feedback.textContent = message;
      if (tone) {
          feedback.dataset.tone = tone;
      } else {
          delete feedback.dataset.tone;
      }
  }


  function setStatusButtonsDisabled(disabled) {
      const buttons = document.querySelectorAll("#statusInlineEditor [data-new-status]");
      buttons.forEach(button => {
          button.disabled = disabled || button.classList.contains("current");
      });
  }


  function bindStatusEditor(ticket) {
      const editor = document.getElementById("statusInlineEditor");
      if (!editor) {
          return;
      }

      const currentStatus = normalizeStatus(ticket.status);
      const statusButtons = editor.querySelectorAll("[data-new-status]");

      statusButtons.forEach(button => {
          button.addEventListener("click", async () => {
              const newStatus = button.dataset.newStatus;

              if (!newStatus || button.disabled || newStatus === currentStatus) {
                  return;
              }

              const confirmed = await confirmStatusChange(ticket, newStatus);
              if (!confirmed) {
                  return;
              }

              const label = getStatusLabel(newStatus);
              setStatusEditorFeedback(`Đang lưu trạng thái “${label}”…`, "loading");
              setStatusButtonsDisabled(true);

              const updated = await updateTicketStatus(ticket, newStatus);
              if (!updated) {
                  setStatusButtonsDisabled(false);
              }
          });
      });
  }


  function clampResize(value, minimum, maximum) {
      return Math.min(Math.max(value, minimum), maximum);
  }


  function bindStatusResize() {
      const editor = document.getElementById("statusInlineEditor");
      const handle = document.getElementById("statusInlineResizeHandle");

      if (!editor || !handle) {
          return;
      }

      if (statusResizeCleanup) {
          statusResizeCleanup();
      }

      const getBounds = () => {
          const available = Math.max(180, editor.parentElement?.clientWidth - 40 || 180);
          return {
              minimum: Math.min(280, available),
              maximum: available
          };
      };

      const setWidth = width => {
          const bounds = getBounds();
          editor.style.setProperty(
              "--status-inline-width",
              `${clampResize(width, bounds.minimum, bounds.maximum)}px`
          );
      };

      const onPointerDown = event => {
          if (event.pointerType === "mouse" && event.button !== 0) {
              return;
          }

          event.preventDefault();

          const startX = event.clientX;
          const startWidth = editor.getBoundingClientRect().width;

          editor.classList.add("is-resizing");
          handle.setPointerCapture?.(event.pointerId);

          const onPointerMove = moveEvent => {
              setWidth(startWidth + moveEvent.clientX - startX);
          };

          const onPointerUp = () => {
              editor.classList.remove("is-resizing");
              handle.releasePointerCapture?.(event.pointerId);
              document.removeEventListener("pointermove", onPointerMove);
              document.removeEventListener("pointerup", onPointerUp);
              document.removeEventListener("pointercancel", onPointerUp);
          };

          document.addEventListener("pointermove", onPointerMove);
          document.addEventListener("pointerup", onPointerUp);
          document.addEventListener("pointercancel", onPointerUp);
      };

      const onKeyDown = event => {
          const currentWidth = editor.getBoundingClientRect().width;

          if (event.key === "ArrowRight") {
              event.preventDefault();
              setWidth(currentWidth + 16);
          } else if (event.key === "ArrowLeft") {
              event.preventDefault();
              setWidth(currentWidth - 16);
          } else if (event.key === "Home") {
              event.preventDefault();
              const bounds = getBounds();
              setWidth(bounds.minimum);
          } else if (event.key === "End") {
              event.preventDefault();
              const bounds = getBounds();
              setWidth(bounds.maximum);
          }
      };

      handle.addEventListener("pointerdown", onPointerDown);
      handle.addEventListener("keydown", onKeyDown);

      statusResizeCleanup = () => {
          handle.removeEventListener("pointerdown", onPointerDown);
          handle.removeEventListener("keydown", onKeyDown);
          editor.classList.remove("is-resizing");
          statusResizeCleanup = null;
      };
  }


  function renderStatusStep(
      ticket,
      status,
      currentStatus
  ) {

      const meta =
          STATUS_META[status];

      const isCurrent =
          status ===
          currentStatus;


      const currentIndex =
          STATUS_ORDER.indexOf(
              currentStatus
          );

      const statusIndex =
          STATUS_ORDER.indexOf(
              status
          );


      const isDone =
          statusIndex <
          currentIndex;


      const isNext =
          statusIndex ===
          currentIndex + 1;


      let stateClass = "";

      if (isCurrent) {
          stateClass =
              "current";
      } else if (isDone) {
          stateClass =
              "done";
      } else if (isNext) {
          stateClass =
              "next";
      }


      return `

          <button
              type="button"
              class="
                  status-step
                  ${stateClass}
              "
              data-new-status="${status}"
              style="
                  --status-color:${meta.color};
              "
              ${
                  isCurrent
                      ? "disabled"
                      : ""
              }
          >

              <span class="status-step-icon">
                  ${meta.icon}
              </span>

              <span class="status-step-text">

                  <strong>
                      ${escapeHtml(
                          meta.shortLabel
                      )}
                  </strong>

                  <small>
                      ${escapeHtml(
                          meta.label
                      )}
                  </small>

              </span>

          </button>
      `;
  }


  /* =========================================================
     STATUS CONFIRMATION
  ========================================================= */

  function confirmStatusChange(
      ticket,
      newStatus
  ) {

      const meta =
          STATUS_META[
              normalizeStatus(
                  newStatus
              )
          ];


      if (
          normalizeStatus(
              newStatus
          ) === "closed"
      ) {

          return Promise.resolve(
              window.confirm(
                  `Đóng ticket ${getTicketNum(
                      ticket
                  )}?\n\n` +
                  `Sau khi đóng, ticket sẽ được đánh dấu là đã kết thúc.`
              )
          );
      }


      return Promise.resolve(
          window.confirm(
              `Chuyển ticket ${getTicketNum(
                  ticket
              )} sang "${meta.label}"?`
          )
      );
  }


  /* =========================================================
     UPDATE STATUS
  ========================================================= */

  async function updateTicketStatus(
      ticket,
      newStatus
  ) {

      if (!ticket?.id) {
          return;
      }


      const normalizedStatus =
          normalizeStatus(
              newStatus
          );


      try {

          await db
              .collection(
                  TICKET_COLLECTION
              )
              .doc(
                  ticket.id
              )
              .update({

                  status:
                      normalizedStatus,

                  updatedAt:
                      firebase
                          .firestore
                          .FieldValue
                          .serverTimestamp(),

                  updatedByUid:
                      currentCSUser?.uid ||
                      "",

                  updatedByEmail:
                      currentCSUser?.email ||
                      ""
              });


          ticket.status =
              normalizedStatus;


          const index =
              allTickets.findIndex(
                  item =>
                      item.id ===
                      ticket.id
              );


          if (index !== -1) {

              allTickets[index] = {
                  ...allTickets[index],
                  status:
                      normalizedStatus
              };
          }


          const filteredIndex =
              filteredTickets.findIndex(
                  item =>
                      item.id ===
                      ticket.id
              );


          if (filteredIndex !== -1) {

              filteredTickets[
                  filteredIndex
              ] = {
                  ...filteredTickets[
                      filteredIndex
                  ],

                  status:
                      normalizedStatus
              };
          }


          renderStats(
              allTickets
          );

          renderTable();


          selectedTicket =
              ticket;


          renderDrawer(
              ticket
          );


          console.log(
              "✅ Đã cập nhật trạng thái:",
              ticket.id,
              normalizedStatus
          );

          return true;


      } catch (error) {

          console.error(
              "❌ Không thể cập nhật trạng thái:",
              error
          );


          setStatusEditorFeedback(
              "Không thể cập nhật trạng thái. Vui lòng thử lại.",
              "error"
          );

          return false;
      }
  }


  /* =========================================================
     CHAT
  ========================================================= */

  function openChat(ticket) {

      if (!ticket) {
          return;
      }


      if (!chatPanel) {
          return;
      }


      selectedTicket =
          ticket;


      chatPanel.classList.add(
          "open"
      );


      chatPanel.setAttribute(
          "aria-hidden",
          "false"
      );


      if (chatTicketContext) {

          chatTicketContext.textContent =
              `${getTicketNum(
                  ticket
              )} · ${getStudentName(
                  ticket
              )}`;
      }

      fitChatPanelToMessages();
      bindChatResize();


      loadChatMessages(
          ticket
      );
  }


  function closeChat() {

      if (chatUnsubscribe) {

          chatUnsubscribe();

          chatUnsubscribe =
              null;
      }


      if (chatPanel) {

          chatPanel.classList.remove(
              "open"
          );

          chatPanel.setAttribute(
              "aria-hidden",
              "true"
          );

          chatPanel.style.removeProperty(
              "--chat-message-height"
          );

          delete chatPanel.dataset.manualChatHeight;
      }
  }


  function fitChatPanelToMessages() {
      if (!chatPanel || !chatMessages) {
          return;
      }

      if (chatPanel.dataset.manualChatHeight === "true") {
          return;
      }

      window.requestAnimationFrame(() => {
          const viewportCap = window.innerWidth <= 600 ? 240 : 310;
          const contentHeight = chatMessages.scrollHeight;
          const desiredHeight = Math.max(78, Math.min(contentHeight, viewportCap));

          chatPanel.style.setProperty(
              "--chat-message-height",
              `${desiredHeight}px`
          );
      });
  }


  function bindChatResize() {
      const handle = document.getElementById("chatResizeHandle");

      if (!chatPanel || !handle) {
          return;
      }

      if (chatResizeCleanup) {
          chatResizeCleanup();
      }

      const getBounds = () => {
          const maximum = window.innerWidth <= 600 ? 240 : 310;
          return {
              minimum: 96,
              maximum
          };
      };

      const setHeight = height => {
          const bounds = getBounds();
          const nextHeight = clampResize(height, bounds.minimum, bounds.maximum);

          chatPanel.style.setProperty(
              "--chat-message-height",
              `${nextHeight}px`
          );
          chatPanel.dataset.manualChatHeight = "true";
      };

      const onPointerDown = event => {
          if (event.pointerType === "mouse" && event.button !== 0) {
              return;
          }

          event.preventDefault();

          const startY = event.clientY;
          const startHeight = chatMessages?.getBoundingClientRect().height || 96;

          chatPanel.classList.add("is-resizing");
          handle.setPointerCapture?.(event.pointerId);

          const onPointerMove = moveEvent => {
              setHeight(startHeight - (moveEvent.clientY - startY));
          };

          const onPointerUp = () => {
              chatPanel.classList.remove("is-resizing");
              handle.releasePointerCapture?.(event.pointerId);
              document.removeEventListener("pointermove", onPointerMove);
              document.removeEventListener("pointerup", onPointerUp);
              document.removeEventListener("pointercancel", onPointerUp);
          };

          document.addEventListener("pointermove", onPointerMove);
          document.addEventListener("pointerup", onPointerUp);
          document.addEventListener("pointercancel", onPointerUp);
      };

      const onKeyDown = event => {
          const currentHeight = chatMessages?.getBoundingClientRect().height || 96;

          if (event.key === "ArrowUp") {
              event.preventDefault();
              setHeight(currentHeight + 16);
          } else if (event.key === "ArrowDown") {
              event.preventDefault();
              setHeight(currentHeight - 16);
          } else if (event.key === "Home") {
              event.preventDefault();
              const bounds = getBounds();
              setHeight(bounds.minimum);
          } else if (event.key === "End") {
              event.preventDefault();
              const bounds = getBounds();
              setHeight(bounds.maximum);
          }
      };

      handle.addEventListener("pointerdown", onPointerDown);
      handle.addEventListener("keydown", onKeyDown);

      chatResizeCleanup = () => {
          handle.removeEventListener("pointerdown", onPointerDown);
          handle.removeEventListener("keydown", onKeyDown);
          chatPanel.classList.remove("is-resizing");
          chatResizeCleanup = null;
      };
  }


  if (closeChatBtn) {

      closeChatBtn.addEventListener(
          "click",
          closeChat
      );
  }


  /* =========================================================
     CHAT COLLECTION

     tickets/{ticketId}/messages/{messageId}
  ========================================================= */

  function loadChatMessages(ticket) {

      if (!chatMessages) {
          return;
      }


      if (!ticket?.id) {
          return;
      }


      if (chatUnsubscribe) {

          chatUnsubscribe();

          chatUnsubscribe =
              null;
      }


      chatMessages.innerHTML = `
          <div class="thread-empty">
              Đang tải tin nhắn...
          </div>
      `;


      chatUnsubscribe =
          db
              .collection(
                  TICKET_COLLECTION
              )
              .doc(
                  ticket.id
              )
              .collection(
                  CHAT_SUBCOLLECTION
              )
              .orderBy(
                  "createdAt",
                  "asc"
              )
              .onSnapshot(

                  snapshot => {

                      if (
                          snapshot.empty
                      ) {

                          chatMessages.innerHTML = `
                              <div class="thread-empty">
                                  Chưa có tin nhắn.
                              </div>
                          `;

                          fitChatPanelToMessages();

                          return;
                      }


                      chatMessages.innerHTML =
                          snapshot.docs
                              .map(
                                  docSnap =>
                                      renderChatMessage(
                                          docSnap.data()
                                      )
                              )
                              .join("");


                      chatMessages.scrollTop =
                          chatMessages.scrollHeight;

                      fitChatPanelToMessages();
                  },


                  error => {

                      console.error(
                          "❌ Lỗi tải chat:",
                          error
                      );


                      chatMessages.innerHTML = `
                          <div class="thread-empty">
                              Không thể tải cuộc trao đổi.
                          </div>
                      `;

                      fitChatPanelToMessages();
                  }
              );
  }


  /* =========================================================
     RENDER CHAT MESSAGE
  ========================================================= */

  function renderChatMessage(
      message
  ) {

      const senderUid =
          message.senderUid ||
          message.senderId ||
          message.uid ||
          "";


      const isCS =
          senderUid ===
          currentCSUser?.uid;


      const senderName =
          message.senderName ||
          message.name ||
          (
              isCS
                  ? "Customer Success"
                  : "Học viên"
          );


      const text =
          message.text ||
          message.message ||
          "";


      return `
          <div
              class="
                  chat-message
                  ${
                      isCS
                          ? "from-cs"
                          : "from-student"
                  }
              "
          >

              <div class="chat-message-name">
                  ${escapeHtml(
                      senderName
                  )}
              </div>

              <div class="chat-message-content">
                  ${escapeHtml(
                      text
                  )}
              </div>

              <div class="chat-message-time">
                  ${escapeHtml(
                      formatDateTime(
                          message.createdAt
                      )
                  )}
              </div>

          </div>
      `;
  }


  /* =========================================================
     SEND CHAT
  ========================================================= */

  if (sendChatBtn) {

      sendChatBtn.addEventListener(
          "click",
          sendChatMessage
      );
  }


  if (chatInput) {

      chatInput.addEventListener(
          "keydown",
          event => {

              if (
                  event.key === "Enter" &&
                  !event.shiftKey
              ) {

                  event.preventDefault();

                  sendChatMessage();
              }
          }
      );
  }


  async function sendChatMessage() {

      if (!chatInput) {

          console.warn(
              "⚠️ Không tìm thấy #chatInput"
          );

          return;
      }


      if (!selectedTicket) {

          alert(
              "Vui lòng chọn ticket trước."
          );

          return;
      }


      const text =
          chatInput.value.trim();


      if (!text) {
          return;
      }


      if (!currentCSUser) {

          alert(
              "Phiên đăng nhập đã hết."
          );

          return;
      }


      try {

          sendChatBtn.disabled =
              true;


          await db
              .collection(
                  TICKET_COLLECTION
              )
              .doc(
                  selectedTicket.id
              )
              .collection(
                  CHAT_SUBCOLLECTION
              )
              .add({

                  text: text,

                  senderUid:
                      currentCSUser.uid,

                  senderId:
                      currentCSUser.uid,

                  senderEmail:
                      currentCSUser.email ||
                      "",

                  senderName:
                      currentCSProfile?.name ||
                      currentCSUser.displayName ||
                      "Customer Success",

                  senderRole:
                      "cs",

                  senderType:
                      "cs",

                  createdAt:
                      firebase
                          .firestore
                          .FieldValue
                          .serverTimestamp()
              });


          chatInput.value =
              "";


      } catch (error) {

          console.error(
              "❌ Không thể gửi tin nhắn:",
              error
          );


          alert(
              "Không thể gửi tin nhắn.\n\n" +
              (
                  error.message ||
                  ""
              )
          );


      } finally {

          sendChatBtn.disabled =
              false;
      }
  }


  /* =========================================================
     AUTH
  ========================================================= */

  auth.onAuthStateChanged(
      async user => {

          if (!user) {

              console.warn(
                  "⚠️ Chưa đăng nhập."
              );


              if (ticketUnsubscribe) {

                  ticketUnsubscribe();

                  ticketUnsubscribe =
                      null;
              }


              /*
               * Giữ hành vi cũ:
               * chỉ trang CS khi chưa đăng nhập
               * mới quay về login.
               */

              window.location.href =
                  "/CS/login/login.html";

              return;
          }


          currentCSUser =
              user;


          console.log(
              "👤 CS đăng nhập:",
              {
                  uid:
                      user.uid,

                  email:
                      user.email
              }
          );


          currentCSProfile =
              await loadCSProfile(
                  user.uid
              );


          if (
              !currentCSProfile
          ) {

              renderEmptyProfileError();

              return;
          }


          loadTicketsForCurrentCS(
              currentCSProfile
          );
      }
  );


  /* =========================================================
     CONNECTION STATUS
  ========================================================= */

  const connDot =
      document.getElementById(
          "connDot"
      );

  const connLabel =
      document.getElementById(
          "connLabel"
      );


  if (connLabel) {

      connLabel.textContent =
          "Đang kết nối...";
  }


  if (
      typeof firebase !==
      "undefined"
  ) {

      db
          .collection(
              TICKET_COLLECTION
          )
          .limit(1)
          .onSnapshot(

              () => {

                  if (connDot) {

                      connDot.classList.add(
                          "online"
                      );
                  }


                  if (connLabel) {

                      connLabel.textContent =
                          "Đã kết nối";
                  }
              },


              error => {

                  console.error(
                      "Firestore connection error:",
                      error
                  );


                  if (connDot) {

                      connDot.classList.remove(
                          "online"
                      );
                  }


                  if (connLabel) {

                      connLabel.textContent =
                          "Mất kết nối";
                  }
              }
          );
  }


  /* =========================================================
     TODAY
  ========================================================= */

  const todayStr =
      document.getElementById(
          "todayStr"
      );


  if (todayStr) {

      todayStr.textContent =
          new Date()
              .toLocaleDateString(
                  "vi-VN",
                  {
                      weekday:
                          "long",

                      day:
                          "2-digit",

                      month:
                          "2-digit",

                      year:
                          "numeric"
                  }
              );
  }


  /* =========================================================
     GLOBAL DEBUG
  ========================================================= */

  window.CSTicketManagement = {

      getTickets:
          () =>
              allTickets,

      getFilteredTickets:
          () =>
              filteredTickets,

      getCurrentUser:
          () =>
              currentCSUser,

      getCurrentProfile:
          () =>
              currentCSProfile,

      getSelectedTicket:
          () =>
              selectedTicket,

      reload:
          () => {

              if (
                  currentCSProfile
              ) {

                  loadTicketsForCurrentCS(
                      currentCSProfile
                  );
              }
          },

      applyFilters,

      openTicket,

      closeDrawer,

      openChat,

      closeChat,

      updateTicketStatus
  };


  console.log(
      "=========================================="
  );

  console.log(
      "🎫 CS TICKET MANAGEMENT ĐÃ KHỞI ĐỘNG"
  );

  console.log(
      "🖱️ Có thể bấm bất cứ đâu trong ticket để mở Drawer"
  );

  console.log(
      "=========================================="
  );

})();
