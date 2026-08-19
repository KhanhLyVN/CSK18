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
  
    const ticketBody = document.getElementById("ticketBody");
    const emptyState = document.getElementById("emptyState");
    const entriesNote = document.getElementById("entriesNote");
    const paginationEl = document.getElementById("paginationEl");
    const filterStatus = document.getElementById("filterStatus");
    const filterPriority = document.getElementById("filterPriority");
    const filterCategory = document.getElementById("filterCategory");
    const searchInput = document.getElementById("searchInput");
    const statTotal = document.getElementById("statTotal");
    const statOpen = document.getElementById("statOpen");
    const statProgress = document.getElementById("statProgress");
    const statResolved = document.getElementById("statResolved");
    const statClosed = document.getElementById("statClosed");
    const ticketDrawer = document.getElementById("ticketDrawer");
    const drawerBody = document.getElementById("drawerBody");
    const closeDrawerBtn = document.getElementById("closeDrawerBtn");
    const drawerBackdrop = document.getElementById("drawerBackdrop");
    const chatPanel = document.getElementById("chatPanel");
    const chatMessages = document.getElementById("chatMessages");
    const chatInput = document.getElementById("chatInput");
    const sendChatBtn = document.getElementById("sendChatBtn");
    const chatImageInput = document.getElementById("chatImageInput");
    const chatAttachmentPreview = document.getElementById("chatAttachmentPreview");
    const chatAttachmentHint = document.getElementById("chatAttachmentHint");
    const aiSuggestBtn = document.getElementById("aiSuggestBtn");
    const chatAiSuggestions = document.getElementById("chatAiSuggestions");
    let pendingImage = null;
    let chatConversationMessages = [];
      let aiDraftText = "";
    let aiSuggestionsVisible = false;
    let aiSuggestionRequestId = 0;
    let aiSuggestionAbortController = null;
    const AI_WEB_APP_URL =  "https://script.google.com/macros/s/AKfycbx7s9ofHRp2Lwrb_wzvq-tI_nvHTqT5Eqy-4ypH1p1S41VxNGR54nFhEMPjRIw_Lp3iUw/exec";
  
    const closeChatBtn = document.getElementById("closeChatBtn");
    const chatTicketContext = document.getElementById("chatTicketContext");
  
    let statusResizeCleanup = null;
    let chatResizeCleanup = null;
  
    /* =========================================================
       STATUS
    ========================================================= */
  
    const STATUS_META = {
      open: { label: "Đang mở", shortLabel: "Mới nhận", color: "#B08A4E", icon: "○" },
      pending: { label: "Đang chờ", shortLabel: "Chờ học viên", color: "#B08A4E", icon: "◐" },
      in_progress: { label: "Đang xử lý", shortLabel: "Đang xử lý", color: "#5D0703", icon: "●" },
      resolved: { label: "Đã giải quyết", shortLabel: "Đã giải quyết", color: "#4C6B3C", icon: "✓" },
      closed: { label: "Đã đóng", shortLabel: "Đã đóng", color: "#8A7A6D", icon: "×" }
    };
  
    const STATUS_ORDER = ["open", "in_progress", "pending", "resolved", "closed"];
  
    function normalizeStatus(status) {
      if (!status) {
        return "open";
      }
      const value = String(status).trim().toLowerCase();
      if (STATUS_META[value]) {
        return value;
      }
      return "open";
    }
  
    function getStatusLabel(status) {
      const key = normalizeStatus(status);
      return STATUS_META[key]?.label || "Đang mở";
    }
  
    /* =========================================================
       PRIORITY
    ========================================================= */
  
    const PRIORITY_META = {
      high: { label: "Cao" },
      medium: { label: "Trung bình" },
      low: { label: "Thấp" }
    };
  
    function normalizePriority(priority) {
      if (!priority) {
        return "medium";
      }
      const value = String(priority).trim().toLowerCase();
      if (value === "cao") {
        return "high";
      }
      if (value === "trung bình" || value === "trungbinh") {
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
      const key = normalizePriority(priority);
      return PRIORITY_META[key]?.label || "Trung bình";
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
      "system-login": "Đăng nhập / xác thực",
      "system-password": "Mật khẩu",
      "system-account": "Tài khoản học viên",
      "system-website-access": "Website không truy cập được",
      "system-page-error": "Một trang bị lỗi",
      "system-browser-device": "Lỗi thiết bị / trình duyệt",
      "system-video-playback": "Lỗi phát video",
      "system-file-upload": "Không tải được tệp",
      "system-notification": "Email / thông báo",
      "system-data-sync": "Dữ liệu chưa đồng bộ",
      "system-security": "Bảo mật tài khoản",
      "system-technical": "Lỗi kỹ thuật / trang web",
      "learning-registration": "Đăng ký khóa học",
      "learning-course-access": "Quyền truy cập khóa học",
      "learning-fee": "Học phí",
      "learning-payment-method": "Phương thức thanh toán",
      "learning-payment-confirmation": "Xác nhận thanh toán",
      "learning-invoice": "Hóa đơn / biên nhận",
      "learning-refund": "Hoàn tiền / hủy đăng ký",
      "learning-promotion": "Mã giảm giá / ưu đãi",
      "learning-certificate": "Chứng chỉ",
      "learning-result": "Kết quả học tập",
      "account-schedule": "Lịch học",
      "account-qualities": "Chất lượng hình ảnh / video",
      "account-mentor": "Mentor / giáo viên",
      "account-support": "Hỗ trợ trong quá trình học",
      "operations-schedule": "Lịch học",
      "operations-attendance": "Điểm danh và vắng học",
      "operations-mentor": "Mentor / giáo viên",
      "operations-mentor-feedback": "Phản hồi về mentor",
      "operations-video-quality": "Chất lượng hình ảnh / video",
      "operations-video-access": "Không xem được bài giảng",
      "operations-material": "Tài liệu và bài giảng",
      "operations-assignment": "Bài tập và hỗ trợ bài giảng",
      "operations-classroom": "Phòng học và buổi học",
      "operations-support": "Hỗ trợ trong quá trình học",
      "other-feedback": "Góp ý / phản hồi",
      "other-complaint": "Khiếu nại",
      "other-request": "Yêu cầu hỗ trợ khác"
    };
  
    function resolveTicketLabel(value) {
      if (value === undefined || value === null || value === "") {
        return "Khác";
      }
      const normalized = String(value).trim();
      return TICKET_CATEGORY_LABELS[normalized] || normalized;
    }
  
    function getTicketType(ticket) {
      if (ticket.ticketType && TICKET_CATEGORY_LABELS[ticket.ticketType]) {
        return TICKET_CATEGORY_LABELS[ticket.ticketType];
      }
      const category = resolveTicketLabel(ticket.ticketCategory || ticket.category || "");
      const issue = resolveTicketLabel(ticket.ticketIssue || ticket.issue || ticket.detail || "");
      if (issue && issue !== category && issue !== "Khác") {
        return `${category} · ${issue}`;
      }
      return category || "Khác";
    }
  
    function getCategoryKey(ticket) {
      return String(
        ticket.ticketType || ticket.ticketIssue || ticket.ticketCategory || ticket.category || "other"
      ).trim();
    }
  
    /* =========================================================
       BASIC HELPERS
    ========================================================= */
  
    function escapeHtml(value) {
      const div = document.createElement("div");
      div.textContent = value === undefined || value === null ? "" : String(value);
      return div.innerHTML;
    }
  
    function getTicketNum(ticket) {
      return ticket.ticketNum || ticket.ticket_num || ticket.ticketId || ticket.id || "—";
    }
  
    function getTicketTitle(ticket) {
      return ticket.title || ticket.subject || ticket.question || "Không có tiêu đề";
    }
  
    function getStudentName(ticket) {
      return ticket.name || ticket.studentName || ticket.fullName || ticket.displayName || "Học viên";
    }
  
    function getStudentEmail(ticket) {
      return ticket.email || ticket.studentEmail || "";
    }
  
    function getTicketDescription(ticket) {
      return ticket.description || ticket.content || ticket.message || ticket.detail || ticket.question || "";
    }
  
    function getTicketAttachmentMeta(ticket) {
      const data = ticket || {};
      return {
        name: data.attachmentName || data.imageName || data.fileName || "Hình ảnh học viên",
        type: data.attachmentType || data.imageType || data.fileType || "image/*",
        size: Number(data.attachmentSize || data.imageSize || data.fileSize || 0),
        dataUrl: data.attachmentDataUrl || data.imageDataUrl || "",
        directUrl: data.attachmentUrl || data.imageUrl || data.downloadUrl || data.fileUrl || "",
        path: data.storagePath || data.attachmentPath || data.filePath || ""
      };
    }
  
    function renderTicketAttachmentPlaceholder(ticket) {
      const meta = getTicketAttachmentMeta(ticket);
      // Nếu ticket không có thông tin tệp thì không tạo placeholder.
      if (!meta.directUrl && !meta.path) {
        return "";
      }
      const sizeLabel = meta.size > 0 ? `${Math.max(1, Math.round(meta.size / 1024))} KB` : "";
      return `
        <div class="detail-attachment-loading" id="ticketAttachmentDetail" data-ticket-id="${escapeHtml(ticket.id || "")}">
          <span class="material-symbols-rounded">attach_file</span>
          <span>Đang tải tệp đính kèm: ${escapeHtml(meta.name)}${sizeLabel ? ` · ${escapeHtml(sizeLabel)}` : ""}</span>
        </div>
      `;
    }
  
    async function resolveTicketAttachmentUrl(ticket) {
      if (!ticket) {
        return "";
      }
      const directUrl = String(
        ticket.attachmentUrl || ticket.imageUrl || ticket.downloadUrl || ticket.fileUrl || ""
      ).trim();
      if (directUrl) {
        console.log("Attachment URL from ticket:", directUrl);
        return directUrl;
      }
      const storagePath = String(ticket.storagePath || ticket.attachmentPath || ticket.filePath || "").trim();
      if (storagePath && typeof firebase.storage === "function") {
        try {
          const url = await firebase.storage().ref().child(storagePath).getDownloadURL();
          console.log("Attachment URL from storagePath:", url);
          return url;
        } catch (error) {
          console.error("Không thể lấy URL từ storagePath:", storagePath, error);
        }
      }
      // Tìm ảnh trong messages của chính ticket.
      const ticketId = ticket.id || ticket.ticketNum;
      if (ticketId && db) {
        try {
          const snapshot = await db.collection("tickets").doc(ticketId).collection("messages").get();
          for (const messageDoc of snapshot.docs) {
            const message = messageDoc.data() || {};
            const messageUrl = String(
              message.imageUrl || message.attachmentUrl || message.downloadUrl || message.fileUrl || ""
            ).trim();
            if (messageUrl) {
              console.log("Attachment URL from message:", messageUrl);
              return messageUrl;
            }
          }
        } catch (error) {
          console.error("Không thể đọc messages để tìm ảnh:", error);
        }
      }
      console.warn("Ticket không có URL hoặc Storage path:", ticket);
      return "";
    }
  
    async function hydrateTicketAttachment(ticket) {
      const holder = document.getElementById("ticketAttachmentDetail");
      if (!holder) {
        return;
      }
      const meta = getTicketAttachmentMeta(ticket);
      const url = await resolveTicketAttachmentUrl(ticket);
      if (!url) {
        holder.outerHTML = `
          <div class="detail-attachment-unavailable">
            <span class="material-symbols-rounded">image_not_supported</span>
            <span>Không tìm thấy URL tệp đính kèm.</span>
          </div>
        `;
        return;
      }
      const isImage =
        String(meta.type || "").toLowerCase().startsWith("image/") ||
        String(url).startsWith("data:image/") ||
        /\.(jpg|jpeg|png|gif|webp|bmp|svg)(?:[?#]|$)/i.test(url);
      if (!isImage) {
        holder.outerHTML = `
          <a class="detail-attachment-link" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">
            <span class="detail-attachment-caption" style="margin:0;padding:10px 12px;border:1px solid var(--line);border-radius:9px;background:#fff;">
              <span class="material-symbols-rounded">attach_file</span>
              ${escapeHtml(meta.name)} · Mở tệp
            </span>
          </a>
        `;
        return;
      }
      holder.outerHTML = `
        <figure class="detail-attachment-figure">
          <a class="detail-attachment-link" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" title="Mở ảnh học viên">
            <img class="detail-attachment-full-image" src="${escapeHtml(url)}" alt="${escapeHtml(meta.name)}" loading="eager">
          </a>
          <figcaption class="detail-attachment-caption">
            <span class="material-symbols-rounded">open_in_new</span>
            ${escapeHtml(meta.name)}
          </figcaption>
        </figure>
      `;
      const image = document.querySelector(".detail-attachment-figure img");
      if (image) {
        image.addEventListener(
          "error",
          () => {
            image.closest(".detail-attachment-figure").outerHTML = `
              <div class="detail-attachment-unavailable">
                <span class="material-symbols-rounded">broken_image</span>
                <span>
                  Không tải được ảnh. Hãy kiểm tra URL Firebase Storage,
                  Storage Rules và quyền truy cập bucket.
                </span>
              </div>
            `;
          },
          { once: true }
        );
      }
    }
  
    async function resolveTicketAttachmentUrl(ticket) {
      const meta = getTicketAttachmentMeta(ticket);
      if (meta.dataUrl && String(meta.dataUrl).startsWith("data:")) {
        return String(meta.dataUrl);
      }
      if (meta.directUrl) return String(meta.directUrl);
      if (meta.path && typeof firebase !== "undefined" && firebase.storage) {
        try {
          return await firebase.storage().ref().child(meta.path).getDownloadURL();
        } catch (error) {
          console.error("Không lấy được ảnh từ Storage path:", meta.path, error);
        }
      }
  
      const ticketId = ticket?.id || ticket?.docId || ticket?.firestoreId || "";
      if (db && ticketId) {
        try {
          const snapshot = await db
            .collection(TICKET_COLLECTION)
            .doc(ticketId)
            .collection(CHAT_SUBCOLLECTION)
            .orderBy("createdAt", "asc")
            .get();
          for (const docSnap of snapshot.docs) {
            const message = docSnap.data() || {};
            const directUrl = String(
              message.imageUrl || message.attachmentUrl || message.downloadUrl || message.fileUrl ||
              message.imageDataUrl || message.attachmentDataUrl || ""
            ).trim();
            if (directUrl) return directUrl;
            const messagePath = String(
              message.storagePath || message.attachmentPath || message.imagePath || ""
            ).trim();
            if (messagePath && firebase.storage) {
              try {
                return await firebase.storage().ref().child(messagePath).getDownloadURL();
              } catch (error) {
                console.error("Không lấy được ảnh message từ Storage path:", messagePath, error);
              }
            }
          }
        } catch (error) {
          console.error("Không đọc được messages để tìm ảnh:", error);
        }
      }
      return "";
    }
  
    function renderTicketAttachmentPlaceholder(ticket) {
      const meta = getTicketAttachmentMeta(ticket);
      if (!meta.name || (!meta.dataUrl && !meta.directUrl && !meta.path)) return "";
      const sizeLabel = meta.size > 0 ? ` · ${Math.max(1, Math.round(meta.size / 1024))} KB` : "";
      return `<div class="detail-attachment-loading" id="ticketAttachmentDetail">
        <span class="material-symbols-rounded">attach_file</span>
        <span>Đang tải tệp đính kèm: ${escapeHtml(meta.name)}${escapeHtml(sizeLabel)}</span>
      </div>`;
    }
  
    async function hydrateTicketAttachment(ticket) {
      const holder = document.getElementById("ticketAttachmentDetail");
      if (!holder) return;
      const meta = getTicketAttachmentMeta(ticket);
      const url = await resolveTicketAttachmentUrl(ticket);
      if (!url) {
        holder.outerHTML = `<div class="detail-attachment-unavailable">
          <span class="material-symbols-rounded">image_not_supported</span>
          <span>Không tìm thấy URL hoặc Storage path của tệp đính kèm.</span>
        </div>`;
        return;
      }
      const isImage = String(meta.type || "").toLowerCase().startsWith("image/") ||
        /^data:image\//i.test(url) ||
        /\.(jpg|jpeg|jpe|jfif|png|apng|gif|webp|avif|bmp|dib|svg|svgz|ico|cur|tif|tiff|heic|heif|jp2|j2k|jpf|jpx|jpm|mj2|jxl|raw|dng|cr2|cr3|nef|nrw|arw|orf|rw2|raf|pef|srw|psd|psb)(?:[?#]|$)/i.test(url);
      if (!isImage) {
        holder.outerHTML = `<a class="detail-attachment-link" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">
          <span class="detail-attachment-caption"><span class="material-symbols-rounded">attach_file</span>${escapeHtml(meta.name)} · Mở tệp</span>
        </a>`;
        return;
      }
      holder.outerHTML = `<figure class="detail-attachment-figure">
        <a class="detail-attachment-link" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" title="Mở ảnh học viên">
          <img class="detail-attachment-full-image" src="${escapeHtml(url)}" alt="${escapeHtml(meta.name)}" loading="eager">
        </a>
        <figcaption class="detail-attachment-caption"><span class="material-symbols-rounded">open_in_new</span>${escapeHtml(meta.name)}</figcaption>
      </figure>`;
      document.querySelector(".detail-attachment-figure img")?.addEventListener("error", (event) => {
        event.currentTarget.closest(".detail-attachment-figure").outerHTML = `<div class="detail-attachment-unavailable">
          <span class="material-symbols-rounded">broken_image</span>
          <span>Không tải được ảnh. Hãy kiểm tra Firebase Storage Rules và URL tệp.</span>
        </div>`;
      }, { once: true });
    }
  
    function getStudentMessageCount(ticket) {
      const count = Number(ticket?.studentMessageCount || 0);
      return Number.isFinite(count) && count > 0 ? Math.floor(count) : 0;
    }
  
    function syncStudentMessageCount(ticket, messageDocs) {
      if (!ticket?.id) return;
  
      const count = messageDocs.reduce((total, docSnap) => {
        const message = docSnap.data();
        const isStudent = message?.senderType === "student" || message?.sender === "student";
        return total + (isStudent ? 1 : 0);
      }, 0);
  
      if (count === getStudentMessageCount(ticket)) return;
  
      db.collection(TICKET_COLLECTION)
        .doc(ticket.id)
        .update({ studentMessageCount: count })
        .catch((error) => console.warn("Không thể đồng bộ bộ đếm tin nhắn học viên:", error));
    }
  
    /* =========================================================
       STUDENT NOTIFICATIONS
       CS tạo notification cùng transaction với status/message.
    ========================================================= */
  
    function getTicketStudentId(ticket) {
      return String(ticket?.studentId || ticket?.studentUid || ticket?.userId || "").trim();
    }
  
    function notificationPreview(value) {
      return String(value || "").replace(/\s+/g, " ").trim().slice(0, 160);
    }
  
    function createNotificationData(ticket, options) {
      const status = normalizeStatus(ticket.status);
  
      return {
        id: `${ticket.id}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
        type: options.type,
        studentId: getTicketStudentId(ticket),
        ticketId: ticket.id,
        ticketNum: getTicketNum(ticket),
        title: getTicketTitle(ticket),
        campus: getTicketCampus(ticket),
        status,
        statusLabel: getStatusLabel(status),
        preview: notificationPreview(options.preview),
        createdAt: firebase.firestore.Timestamp.now(),
        createdByUid: currentCSUser?.uid || "",
        createdByEmail: currentCSUser?.email || "",
        createdByName: currentCSProfile?.name || currentCSUser?.displayName || "Customer Success"
      };
    }
  
    function appendNotificationHistory(ticketData, notification) {
      const history = Array.isArray(ticketData?.notificationHistory) ? ticketData.notificationHistory : [];
      return [...history, notification].slice(-50);
    }
  
    /* =========================================================
       DATE
    ========================================================= */
  
    function getTimestampMillis(value) {
      if (!value) {
        return 0;
      }
      if (typeof value.toMillis === "function") {
        return value.toMillis();
      }
      if (value instanceof Date) {
        return value.getTime();
      }
      if (typeof value.seconds === "number") {
        return value.seconds * 1000;
      }
      const parsed = new Date(value).getTime();
      return isNaN(parsed) ? 0 : parsed;
    }
  
    function formatDate(value) {
      const millis = getTimestampMillis(value);
      if (!millis) {
        return "—";
      }
      return new Date(millis).toLocaleDateString("vi-VN");
    }
  
    function formatDateTime(value) {
      const millis = getTimestampMillis(value);
      if (!millis) {
        return "—";
      }
      return new Date(millis).toLocaleString("vi-VN");
    }
  
    function formatTicketDate(ticket) {
      if (ticket.date) {
        return String(ticket.date);
      }
      if (ticket.createdAt) {
        return formatDate(ticket.createdAt);
      }
      return "—";
    }
  
    /* =========================================================
       CAMPUS
    ========================================================= */
  
    function normalizeCampus(value) {
      if (value === undefined || value === null) {
        return "";
      }
      const campus = String(value).trim();
      if (!campus) {
        return "";
      }
      const lower = campus.toLowerCase();
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
      if (lower === "hn" || lower === "hà nội" || lower === "ha noi") {
        return "Hà Nội";
      }
      return campus;
    }
  
    function campusFromCampusId(campusId) {
      if (!campusId) {
        return "";
      }
      const value = String(campusId).trim();
      if (value.includes("-")) {
        const parts = value.split("-");
        return normalizeCampus(parts[parts.length - 1]);
      }
      return normalizeCampus(value);
    }
  
    function getTicketCampus(ticket) {
      if (ticket.campus) {
        return normalizeCampus(ticket.campus);
      }
      if (ticket.campusName) {
        return normalizeCampus(ticket.campusName);
      }
      if (ticket.campusId) {
        return campusFromCampusId(ticket.campusId);
      }
      return "";
    }
  
    /* =========================================================
       DEPARTMENT
    ========================================================= */
  
    function normalizeDepartmentCode(value) {
      if (value === undefined || value === null) {
        return "";
      }
      return String(value).trim().toUpperCase();
    }
  
    function getTicketDepartment(ticket) {
      if (ticket.departmentCode) {
        return normalizeDepartmentCode(ticket.departmentCode);
      }
      if (ticket.department) {
        if (typeof ticket.department === "object") {
          return normalizeDepartmentCode(ticket.department.code || ticket.department.departmentCode || "");
        }
        return normalizeDepartmentCode(ticket.department);
      }
      return "";
    }
  
    /* =========================================================
       CS PROFILE
    ========================================================= */
  
    async function loadCSProfile(uid) {
      try {
        const docSnap = await db.collection(USER_COLLECTION).doc(uid).get();
  
        if (!docSnap.exists) {
          console.error("❌ Không tìm thấy users/" + uid);
          return null;
        }
  
        const data = docSnap.data() || {};
  
        return {
          uid,
          department: normalizeDepartmentCode(data.departmentCode || data.department || DEFAULT_DEPARTMENT_CODE),
          campus: normalizeCampus(data.campus || data.campusName || data.campusId || ""),
          name: data.name || data.fullName || data.displayName || "",
          email: data.email || ""
        };
      } catch (error) {
        console.error("❌ Lỗi load profile:", error);
        return null;
      }
    }
  
    /* =========================================================
       LOAD TICKETS
       CS chỉ nhận: campus của CS + department của CS
    ========================================================= */
  
    function loadTicketsForCurrentCS(profile) {
      if (ticketUnsubscribe) {
        ticketUnsubscribe();
        ticketUnsubscribe = null;
      }
  
      if (!profile || !profile.department || !profile.campus) {
        renderEmptyProfileError();
        return;
      }
  
      ticketUnsubscribe = db
        .collection(TICKET_COLLECTION)
        .where("departmentCode", "==", profile.department)
        .where("campus", "==", profile.campus)
        .onSnapshot(
          (snapshot) => {
            allTickets = [];
  
            snapshot.forEach((docSnap) => {
              allTickets.push({ id: docSnap.id, ...docSnap.data() });
            });
  
            allTickets.sort((a, b) => getTimestampMillis(b.createdAt) - getTimestampMillis(a.createdAt));
  
            buildCategoryFilter();
            currentPage = 1;
            applyFilters();
          },
          (error) => {
            console.error("❌ Lỗi lấy ticket:", error);
            showFirestoreError(error);
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
              <small>${escapeHtml(error?.message || "Lỗi Firestore")}</small>
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
            <div class="empty-note">Tài khoản CS chưa được cấu hình campus hoặc phòng ban.</div>
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
  
      const currentValue = filterCategory.value;
      const categories = new Map();
  
      allTickets.forEach((ticket) => {
        const key = getCategoryKey(ticket);
        const label = getTicketType(ticket);
        if (!categories.has(key)) {
          categories.set(key, label);
        }
      });
  
      filterCategory.innerHTML = `<option value="all">Tất cả</option>`;
  
      [...categories.entries()]
        .sort((a, b) => a[1].localeCompare(b[1], "vi"))
        .forEach(([key, label]) => {
          const option = document.createElement("option");
          option.value = key;
          option.textContent = label;
          filterCategory.appendChild(option);
        });
  
      if ([...filterCategory.options].some((option) => option.value === currentValue)) {
        filterCategory.value = currentValue;
      }
    }
  
    /* =========================================================
       FILTER
    ========================================================= */
  
    function applyFilters() {
      const status = filterStatus?.value || "all";
      const priority = filterPriority?.value || "all";
      const category = filterCategory?.value || "all";
      const search = (searchInput?.value || "").trim().toLowerCase();
  
      filteredTickets = allTickets.filter((ticket) => {
        if (status !== "all" && normalizeStatus(ticket.status) !== status) {
          return false;
        }
        if (priority !== "all" && normalizePriority(ticket.priority) !== priority) {
          return false;
        }
        if (category !== "all" && getCategoryKey(ticket) !== category) {
          return false;
        }
        if (search) {
          const searchable = [
            getTicketNum(ticket),
            getStudentName(ticket),
            getStudentEmail(ticket),
            getTicketTitle(ticket),
            getTicketDescription(ticket),
            getTicketType(ticket),
            ticket.campus,
            ticket.departmentCode
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
  
          if (!searchable.includes(search)) {
            return false;
          }
        }
        return true;
      });
  
      currentPage = 1;
      renderStats(allTickets);
      renderTable();
    }
  
    /* =========================================================
       STATS
    ========================================================= */
  
    function renderStats(tickets) {
      const counts = { open: 0, pending: 0, in_progress: 0, resolved: 0, closed: 0 };
  
      tickets.forEach((ticket) => {
        const status = normalizeStatus(ticket.status);
        if (counts[status] !== undefined) {
          counts[status]++;
        }
      });
  
      if (statTotal) statTotal.textContent = tickets.length;
      if (statOpen) statOpen.textContent = counts.open + counts.pending;
      if (statProgress) statProgress.textContent = counts.in_progress;
      if (statResolved) statResolved.textContent = counts.resolved;
      if (statClosed) statClosed.textContent = counts.closed;
    }
  
    /* =========================================================
       STATUS PILL
    ========================================================= */
  
    function statusPill(status) {
      const key = normalizeStatus(status);
      const meta = STATUS_META[key] || STATUS_META.open;
  
      return `
        <span class="status-tag" style="background:${meta.color}22;color:${meta.color};">
          <span class="dot" style="background:${meta.color};"></span>
          ${escapeHtml(meta.label)}
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
            ${STATUS_ORDER.map((status) => renderStatusStep(ticket, status, currentStatus)).join("")}
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
      const key = normalizePriority(priority);
      return `<span class="priority-tag priority-${key}">${escapeHtml(getPriorityLabel(priority))}</span>`;
    }
  
    /* =========================================================
       RENDER TABLE
    ========================================================= */
  
    function renderTable() {
      if (!ticketBody) {
        return;
      }
  
      const total = filteredTickets.length;
      const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  
      if (currentPage > totalPages) {
        currentPage = totalPages;
      }
  
      const start = (currentPage - 1) * PAGE_SIZE;
      const end = start + PAGE_SIZE;
      const pageTickets = filteredTickets.slice(start, end);
  
      if (pageTickets.length === 0) {
        ticketBody.innerHTML = "";
        if (emptyState) {
          emptyState.hidden = false;
        }
      } else {
        if (emptyState) {
          emptyState.hidden = true;
        }
        ticketBody.innerHTML = pageTickets.map(renderTicketRow).join("");
      }
  
      renderEntriesNote(total, start, pageTickets.length);
      renderPagination(totalPages);
    }
  
    /* =========================================================
       TICKET ROW
    ========================================================= */
  
    function renderTicketRow(ticket) {
      const ticketNum = getTicketNum(ticket);
      const studentName = getStudentName(ticket);
      const title = getTicketTitle(ticket);
      const type = getTicketType(ticket);
      const studentMessageCount = getStudentMessageCount(ticket);
  
      return `
        <tr class="ticket-row" data-ticket-id="${escapeHtml(ticket.id)}" tabindex="0" role="button" aria-label="Mở ticket ${escapeHtml(ticketNum)}">
          <td>
            <span class="ticket-code">${escapeHtml(ticketNum)}</span>
          </td>
          <td>
            <div class="student-cell">
              <strong>${escapeHtml(studentName)}</strong>
              ${getStudentEmail(ticket) ? `<small>${escapeHtml(getStudentEmail(ticket))}</small>` : ""}
            </div>
          </td>
          <td>
            <div class="content-cell"><strong class="content-title-only">${escapeHtml(title || "Không có tiêu đề")}</strong></div>
          </td>
          <td>
            <span class="category-text">${escapeHtml(type)}</span>
          </td>
          <td>
            ${statusPill(ticket.status)}
          </td>
          <td>
            ${priorityPill(ticket.priority)}
          </td>
          <td>
            <span class="student-message-count" title="Số tin nhắn học viên đã gửi" aria-label="${studentMessageCount} tin nhắn học viên">
              ${studentMessageCount}
            </span>
          </td>
          <td>
            <span class="date-text">${escapeHtml(formatTicketDate(ticket))}</span>
          </td>
          <td>
            <button type="button" class="ticket-more-btn" data-ticket-id="${escapeHtml(ticket.id)}" title="Xem chi tiết" aria-label="Xem chi tiết">⋯</button>
          </td>
        </tr>
      `;
    }
  
    /* =========================================================
       EVENT DELEGATION TABLE
  
       QUAN TRỌNG:
       BẤM BẤT CỨ ĐÂU TRONG ROW → MỞ DRAWER
  
       Nhưng:
       - bấm button không mở 2 lần
       - bấm link/button/input không bị click row ngoài ý muốn
    ========================================================= */
  
    if (ticketBody) {
      ticketBody.addEventListener("click", (event) => {
        const button = event.target.closest("button");
  
        if (button) {
          const ticketId = button.dataset.ticketId;
  
          if (button.classList.contains("ticket-more-btn") && ticketId) {
            event.stopPropagation();
            openTicket(ticketId);
          }
  
          return;
        }
  
        const row = event.target.closest("tr[data-ticket-id]");
        if (!row) {
          return;
        }
  
        const ticketId = row.dataset.ticketId;
        if (!ticketId) {
          return;
        }
  
        openTicket(ticketId);
      });
  
      /* =============================================
         KEYBOARD
         Enter / Space cũng mở ticket
      ============================================= */
  
      ticketBody.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") {
          return;
        }
  
        const row = event.target.closest("tr[data-ticket-id]");
        if (!row) {
          return;
        }
  
        event.preventDefault();
        openTicket(row.dataset.ticketId);
      });
    }
  
    /* =========================================================
       PAGINATION
    ========================================================= */
  
    function renderEntriesNote(total, start, count) {
      if (!entriesNote) {
        return;
      }
  
      if (total === 0) {
        entriesNote.textContent = "Hiển thị 0 / 0 ticket";
        return;
      }
  
      entriesNote.textContent = `Hiển thị ${start + 1}–${start + count} / ${total} ticket`;
    }
  
    function renderPagination(totalPages) {
      if (!paginationEl) {
        return;
      }
  
      if (totalPages <= 1) {
        paginationEl.innerHTML = "";
        return;
      }
  
      let html = "";
  
      html += `
        <button type="button" class="page-btn" data-page="${currentPage - 1}" ${currentPage === 1 ? "disabled" : ""}>‹</button>
      `;
  
      const maxButtons = 7;
  
      let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
      let endPage = Math.min(totalPages, startPage + maxButtons - 1);
  
      if (endPage - startPage + 1 < maxButtons) {
        startPage = Math.max(1, endPage - maxButtons + 1);
      }
  
      for (let page = startPage; page <= endPage; page++) {
        html += `
          <button type="button" class="page-btn ${page === currentPage ? "active" : ""}" data-page="${page}">${page}</button>
        `;
      }
  
      html += `
        <button type="button" class="page-btn" data-page="${currentPage + 1}" ${currentPage === totalPages ? "disabled" : ""}>›</button>
      `;
  
      paginationEl.innerHTML = html;
    }
  
    if (paginationEl) {
      paginationEl.addEventListener("click", (event) => {
        const button = event.target.closest(".page-btn");
        if (!button) {
          return;
        }
  
        const page = Number(button.dataset.page);
        if (!page || button.disabled) {
          return;
        }
  
        currentPage = page;
        renderTable();
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }
  
    /* =========================================================
       FILTER EVENTS
    ========================================================= */
  
    if (filterStatus) {
      filterStatus.addEventListener("change", applyFilters);
    }
  
    if (filterPriority) {
      filterPriority.addEventListener("change", applyFilters);
    }
  
    if (filterCategory) {
      filterCategory.addEventListener("change", applyFilters);
    }
  
    if (searchInput) {
      searchInput.addEventListener("input", () => {
        currentPage = 1;
        applyFilters();
      });
    }
  
    /* =========================================================
       OPEN TICKET
    ========================================================= */
  
    function openTicket(ticketId) {
      if (!ticketId) {
        return;
      }
  
      const ticket = allTickets.find((item) => item.id === ticketId);
  
      if (!ticket) {
        console.warn("Không tìm thấy ticket:", ticketId);
        return;
      }
  
      selectedTicket = ticket;
      closeChat();
      renderDrawer(ticket);
  
      if (ticketDrawer) {
        ticketDrawer.classList.add("open");
        ticketDrawer.setAttribute("aria-hidden", "false");
      }
  
      if (drawerBackdrop) {
        drawerBackdrop.hidden = false;
        requestAnimationFrame(() => {
          drawerBackdrop.classList.add("show");
        });
      }
    }
  
    /* =========================================================
       DRAWER
    ========================================================= */
  
    function renderDrawer(ticket) {
      if (!drawerBody) {
        return;
      }
  
      const ticketNum = getTicketNum(ticket);
      const title = getTicketTitle(ticket);
      const student = getStudentName(ticket);
      const email = getStudentEmail(ticket);
      const campus = getTicketCampus(ticket) || "—";
      const department = getTicketDepartment(ticket) || "—";
  
      drawerBody.innerHTML = `
        <div class="ticket-detail">
          <div class="detail-top">
            <div>
              <span class="drawer-kicker">${escapeHtml(ticketNum)}</span>
              <h3>${escapeHtml(title)}</h3>
            </div>
            ${statusPill(ticket.status)}
          </div>
  
          <div class="detail-grid">
            <div class="detail-item">
              <span>HỌC VIÊN</span>
              <strong>${escapeHtml(student)}</strong>
            </div>
  
            <div class="detail-item">
              <span>EMAIL</span>
              <strong>${escapeHtml(email || "—")}</strong>
            </div>
  
            <div class="detail-item">
              <span>CAMPUS</span>
              <strong>${escapeHtml(campus)}</strong>
            </div>
  
            <div class="detail-item">
              <span>PHÒNG BAN</span>
              <strong>${escapeHtml(department)}</strong>
            </div>
  
            <div class="detail-item">
              <span>LOẠI YÊU CẦU</span>
              <strong>${escapeHtml(getTicketType(ticket))}</strong>
            </div>
  
            <div class="detail-item priority-detail-item">
              <span>MỨC ĐỘ ƯU TIÊN</span>
              <strong>${priorityPill(ticket.priority)}</strong>
              ${ticket.priorityReason ? `<small class="priority-reason">${escapeHtml(ticket.priorityReason)}</small>` : ""}
            </div>
  
            <div class="detail-item">
              <span>NGÀY GỬI</span>
              <strong>${escapeHtml(formatDateTime(ticket.createdAt))}</strong>
            </div>
          </div>
  
          <div class="detail-section">
            <span class="detail-section-title">NỘI DUNG YÊU CẦU</span>
            <div class="detail-description">${escapeHtml(getTicketDescription(ticket) || "Không có nội dung.")}</div>
            ${renderTicketAttachmentPlaceholder(ticket)}
          </div>
  
          ${renderInlineStatusEditor(ticket)}
  
          <div class="detail-actions">
            <button type="button" class="drawer-action-btn" id="openChatFromDrawer">Trao đổi với học viên</button>
            <button type="button" class="drawer-action-btn" id="focusStatusBtn">Đến khu vực trạng thái</button>
          </div>
        </div>
      `;
  
      hydrateTicketAttachment(ticket);
  
      const openChatButton = document.getElementById("openChatFromDrawer");
      if (openChatButton) {
        openChatButton.addEventListener("click", () => {
          openChat(ticket);
        });
      }
  
      const focusStatusButton = document.getElementById("focusStatusBtn");
      if (focusStatusButton) {
        focusStatusButton.addEventListener("click", () => showStatusEditor(ticket));
      }
  
      bindStatusEditor(ticket);
      bindStatusResize();
    }
  
    /* =========================================================
       CLOSE DRAWER
    ========================================================= */
  
    function closeDrawer() {
      if (ticketDrawer) {
        ticketDrawer.classList.remove("open");
        ticketDrawer.setAttribute("aria-hidden", "true");
      }
  
      if (drawerBackdrop) {
        drawerBackdrop.classList.remove("show");
        setTimeout(() => {
          drawerBackdrop.hidden = true;
        }, 200);
      }
  
      closeChat();
      selectedTicket = null;
    }
  
    if (closeDrawerBtn) {
      closeDrawerBtn.addEventListener("click", closeDrawer);
    }
  
    if (drawerBackdrop) {
      drawerBackdrop.addEventListener("click", closeDrawer);
    }
  
    /* =========================================================
       ESC
    ========================================================= */
  
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeDrawer();
      }
    });
  
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
      buttons.forEach((button) => {
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
  
      statusButtons.forEach((button) => {
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
          setStatusEditorFeedback(`Đang lưu trạng thái "${label}"…`, "loading");
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
  
      const setWidth = (width) => {
        const bounds = getBounds();
        editor.style.setProperty("--status-inline-width", `${clampResize(width, bounds.minimum, bounds.maximum)}px`);
      };
  
      const onPointerDown = (event) => {
        if (event.pointerType === "mouse" && event.button !== 0) {
          return;
        }
  
        event.preventDefault();
  
        const startX = event.clientX;
        const startWidth = editor.getBoundingClientRect().width;
  
        editor.classList.add("is-resizing");
        handle.setPointerCapture?.(event.pointerId);
  
        const onPointerMove = (moveEvent) => {
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
  
      const onKeyDown = (event) => {
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
  
    function renderStatusStep(ticket, status, currentStatus) {
      const meta = STATUS_META[status];
      const isCurrent = status === currentStatus;
  
      const currentIndex = STATUS_ORDER.indexOf(currentStatus);
      const statusIndex = STATUS_ORDER.indexOf(status);
  
      const isDone = statusIndex < currentIndex;
      const isNext = statusIndex === currentIndex + 1;
  
      let stateClass = "";
  
      if (isCurrent) {
        stateClass = "current";
      } else if (isDone) {
        stateClass = "done";
      } else if (isNext) {
        stateClass = "next";
      }
  
      return `
        <button type="button" class="status-step ${stateClass}" data-new-status="${status}" style="--status-color:${meta.color};" ${isCurrent ? "disabled" : ""}>
          <span class="status-step-icon">${meta.icon}</span>
          <span class="status-step-text">
            <strong>${escapeHtml(meta.shortLabel)}</strong>
            <small>${escapeHtml(meta.label)}</small>
          </span>
        </button>
      `;
    }
  
    /* =========================================================
       STATUS CONFIRMATION
    ========================================================= */
  
    function confirmStatusChange(ticket, newStatus) {
      const normalizedStatus = normalizeStatus(newStatus);
      const meta = STATUS_META[normalizedStatus];
  
      return showConfirmDialog({
        ticketId: getTicketNum(ticket),
        nextStatusLabel: meta.label,
        isClosing: normalizedStatus === "closed"
      });
    }
  
    /* =========================================================
       UPDATE STATUS
    ========================================================= */
  
    /* =========================================================
       ADMIN NOTIFICATIONS / SYSTEM LOGS
    ========================================================= */
    async function notifyAdminFromCS({ action, actionLabel, ticket, detail = "", severity = "info", type = "update" }) {
      try {
        const ticketNum = getTicketNum(ticket);
        const actorName = currentCSProfile?.name || currentCSUser?.displayName || currentCSUser?.email || "Customer Success";
        const actorUid = currentCSUser?.uid || "";
        const actorEmail = currentCSUser?.email || "";
        const message = detail || `${actorName} đã ${actionLabel} ticket ${ticketNum}.`;
        const timestamp = firebase.firestore.FieldValue.serverTimestamp();
        const notification = {
          type,
          action,
          actionLabel,
          title: message,
          message,
          detail: message,
          severity,
          isRead: false,
          read: false,
          recipientRole: "admin",
          targetRole: "admin",
          actorRole: "cs",
          actorUid,
          actorEmail,
          actorName,
          ticketId: ticket?.id || ticket?.ticketNum || "",
          ticketNum,
          ticketTitle: getTicketTitle(ticket),
          studentName: getStudentName(ticket),
          departmentCode: ticket?.departmentCode || currentCSProfile?.department || "",
          campus: ticket?.campus || currentCSProfile?.campus || "",
          createdAt: timestamp,
          updatedAt: timestamp
        };
        await Promise.all([
          db.collection("adminNotifications").add(notification),
          db.collection("systemLogs").add({
            ...notification,
            logType: type,
            objectType: "ticket",
            objectId: ticket?.id || ticket?.ticketNum || "",
            actor: actorName,
            action: message,
            timestamp,
            createdAt: timestamp
          })
        ]);
      } catch (error) {
        console.warn("Không thể gửi thông báo cho admin:", error);
      }
    }
  
    async function updateTicketStatus(ticket, newStatus) {
      if (!ticket?.id) {
        return;
      }
  
      const normalizedStatus = normalizeStatus(newStatus);
  
      try {
        const ticketRef = db.collection(TICKET_COLLECTION).doc(ticket.id);
  
        const notification = createNotificationData(
          { ...ticket, status: normalizedStatus },
          {
            type: "status",
            preview: `Customer Success đã cập nhật trạng thái thành ${getStatusLabel(normalizedStatus)}.`
          }
        );
  
        await db.runTransaction(async (transaction) => {
          const snapshot = await transaction.get(ticketRef);
          const latestTicket = snapshot.exists ? snapshot.data() : {};
  
          const statusUpdate = {
            status: normalizedStatus,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedByUid: currentCSUser?.uid || "",
            updatedByEmail: currentCSUser?.email || "",
            notificationHistory: appendNotificationHistory(latestTicket, notification)
          };
          if (normalizedStatus === "closed" && latestTicket.status !== "closed") {
            const satisfactionAttemptCount = Number(latestTicket.satisfactionAttemptCount) || 0;
            statusUpdate.closedAt = firebase.firestore.FieldValue.serverTimestamp();
            if (latestTicket.satisfactionStatus === "unsatisfied" && satisfactionAttemptCount < 2) {
              statusUpdate.satisfactionAttemptCount = satisfactionAttemptCount + 1;
              statusUpdate.satisfactionRound = satisfactionAttemptCount + 1;
              statusUpdate.satisfactionStatus = "awaiting";
              statusUpdate.satisfactionAskedAt = firebase.firestore.FieldValue.serverTimestamp();
              statusUpdate.satisfactionRespondedAt = null;
            }
          } else if (normalizedStatus !== "closed" && latestTicket.status === "closed") {
            statusUpdate.closedAt = null;
          }
          transaction.update(ticketRef, statusUpdate);
        });
        const previousStatus = ticket.status || "open";
        await notifyAdminFromCS({
          action:
            normalizedStatus === "in_progress"
              ? "claim_ticket"
              : normalizedStatus === "resolved" || normalizedStatus === "closed"
              ? "complete_ticket"
              : "update_status",
          actionLabel:
            normalizedStatus === "in_progress"
              ? "nhận xử lý"
              : normalizedStatus === "resolved" || normalizedStatus === "closed"
              ? "hoàn thành/cập nhật hoàn tất"
              : "cập nhật trạng thái",
          ticket,
          detail: `${currentCSProfile?.name || currentCSUser?.displayName || "CS"} đã chuyển ticket ${getTicketNum(
            ticket
          )} từ ${getStatusLabel(previousStatus)} sang ${getStatusLabel(normalizedStatus)}.`,
          severity: "info",
          type: "update"
        });
  
        ticket.status = normalizedStatus;
  
        const index = allTickets.findIndex((item) => item.id === ticket.id);
        if (index !== -1) {
          allTickets[index] = { ...allTickets[index], status: normalizedStatus };
        }
  
        const filteredIndex = filteredTickets.findIndex((item) => item.id === ticket.id);
        if (filteredIndex !== -1) {
          filteredTickets[filteredIndex] = { ...filteredTickets[filteredIndex], status: normalizedStatus };
        }
  
        renderStats(allTickets);
        renderTable();
  
        selectedTicket = ticket;
        renderDrawer(ticket);
  
        console.log("✅ Đã cập nhật trạng thái:", ticket.id, normalizedStatus);
  
        return true;
      } catch (error) {
        console.error("❌ Không thể cập nhật trạng thái:", error);
  
        setStatusEditorFeedback("Không thể cập nhật trạng thái. Vui lòng thử lại.", "error");
  
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
  
          hideAiSuggestions();
      selectedTicket = ticket;
  
      chatPanel.classList.add("open");
  
      chatPanel.setAttribute("aria-hidden", "false");
  
      if (chatTicketContext) {
        chatTicketContext.textContent = `${getTicketNum(ticket)} · ${getStudentName(ticket)}`;
      }
  
      fitChatPanelToMessages();
      bindChatResize();
  
      loadChatMessages(ticket);
    }
  
      function closeChat() {
      hideAiSuggestions();
  
      if (chatUnsubscribe) {
  
        chatUnsubscribe();
        chatUnsubscribe = null;
      }
  
      if (chatPanel) {
        chatPanel.classList.remove("open");
        chatPanel.setAttribute("aria-hidden", "true");
        chatPanel.style.removeProperty("--chat-message-height");
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
  
        chatPanel.style.setProperty("--chat-message-height", `${desiredHeight}px`);
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
        return { minimum: 96, maximum };
      };
  
      const setHeight = (height) => {
        const bounds = getBounds();
        const nextHeight = clampResize(height, bounds.minimum, bounds.maximum);
  
        chatPanel.style.setProperty("--chat-message-height", `${nextHeight}px`);
        chatPanel.dataset.manualChatHeight = "true";
      };
  
      const onPointerDown = (event) => {
        if (event.pointerType === "mouse" && event.button !== 0) {
          return;
        }
  
        event.preventDefault();
  
        const startY = event.clientY;
        const startHeight = chatMessages?.getBoundingClientRect().height || 96;
  
        chatPanel.classList.add("is-resizing");
        handle.setPointerCapture?.(event.pointerId);
  
        const onPointerMove = (moveEvent) => {
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
  
      const onKeyDown = (event) => {
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
      closeChatBtn.addEventListener("click", closeChat);
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
        chatUnsubscribe = null;
      }
  
      chatMessages.innerHTML = `
        <div class="thread-empty">Đang tải tin nhắn...</div>
      `;
  
      chatUnsubscribe = db
        .collection(TICKET_COLLECTION)
        .doc(ticket.id)
        .collection(CHAT_SUBCOLLECTION)
        .orderBy("createdAt", "asc")
        .onSnapshot(
          (snapshot) => {
            syncStudentMessageCount(ticket, snapshot.docs);
  
            chatConversationMessages = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
            if (snapshot.empty) {
              chatMessages.innerHTML = `
                <div class="thread-empty">Chưa có tin nhắn.</div>
              `;
  
              fitChatPanelToMessages();
              return;
            }
  
            chatMessages.innerHTML = snapshot.docs.map((docSnap) => renderChatMessage(docSnap.data())).join("");
  
            chatMessages.scrollTop = chatMessages.scrollHeight;
  
            fitChatPanelToMessages();
          },
          (error) => {
            console.error("❌ Lỗi tải chat:", error);
  
            chatMessages.innerHTML = `
              <div class="thread-empty">Không thể tải cuộc trao đổi.</div>
            `;
  
            fitChatPanelToMessages();
          }
        );
    }
  
    /* =========================================================
       RENDER CHAT MESSAGE
    ========================================================= */
  
    function renderChatMessage(message) {
      const senderUid = message.senderUid || message.senderId || message.uid || "";
      const isCS = senderUid === currentCSUser?.uid;
      const senderName = message.senderName || message.name || (isCS ? "Customer Success" : "Học viên");
      const text = message.text || message.message || "";
  
      return `
        <div class="chat-message ${isCS ? "from-cs" : "from-student"}">
          <div class="chat-message-name">${escapeHtml(senderName)}</div>
          <div class="chat-message-content">
            ${escapeHtml(text)}
            ${
              message.imageDataUrl || message.attachmentDataUrl || message.imageUrl
                ? `<a class="chat-message-image-link" href="${escapeHtml(
                    message.imageDataUrl || message.attachmentDataUrl || message.imageUrl
                  )}" target="_blank" rel="noopener" title="Mở ảnh học viên"><img class="chat-message-image" src="${escapeHtml(
                    message.imageDataUrl || message.attachmentDataUrl || message.imageUrl
                  )}" alt="${escapeHtml(
                    message.imageName || "Ảnh đính kèm"
                  )}"><span class="chat-message-image-caption"><span class="material-symbols-rounded">image</span>${escapeHtml(
                    message.imageName || "Ảnh đính kèm"
                  )}</span></a>`
                : ""
            }
          </div>
          <div class="chat-message-time">${escapeHtml(formatDateTime(message.createdAt))}</div>
        </div>
      `;
    }
  
      // Một số trình duyệt/hệ điều hành trả về MIME rỗng hoặc application/octet-stream
    // cho các định dạng ảnh ít phổ biến. Khi đó kiểm tra thêm phần mở rộng tệp.
    const IMAGE_FILE_EXTENSIONS = new Set([
      "jpg", "jpeg", "jpe", "jfif", "png", "apng", "gif", "webp", "avif", "bmp", "dib",
      "svg", "svgz", "ico", "cur", "tif", "tiff", "heic", "heif", "heics", "heifs",
      "jp2", "j2k", "jpf", "jpx", "jpm", "mj2", "jxl", "raw", "dng", "cr2", "cr3",
      "nef", "nrw", "arw", "orf", "rw2", "raf", "pef", "srw", "3fr", "erf", "kdc",
      "mos", "mrw", "rwl", "x3f", "psd", "psb"
    ]);
  
    function getFileExtension(fileName) {
      const name = String(fileName || "").toLowerCase().split(/[?#]/, 1)[0];
      const lastDot = name.lastIndexOf(".");
      return lastDot >= 0 ? name.slice(lastDot + 1) : "";
    }
  
    function isImageFile(file) {
      const mimeType = String(file?.type || "").toLowerCase();
      return mimeType.startsWith("image/") || IMAGE_FILE_EXTENSIONS.has(getFileExtension(file?.name));
    }
  
    function getImageMimeType(file) {
      const mimeType = String(file?.type || "").toLowerCase();
      if (mimeType.startsWith("image/")) return mimeType;
      const extensionMimeTypes = {
        jpg: "image/jpeg", jpeg: "image/jpeg", jpe: "image/jpeg", jfif: "image/jpeg",
        png: "image/png", apng: "image/apng", gif: "image/gif", webp: "image/webp",
        avif: "image/avif", bmp: "image/bmp", dib: "image/bmp", svg: "image/svg+xml",
        svgz: "image/svg+xml", ico: "image/x-icon", cur: "image/x-icon", tif: "image/tiff",
        tiff: "image/tiff", heic: "image/heic", heif: "image/heif", heics: "image/heic",
        heifs: "image/heif", jp2: "image/jp2", j2k: "image/jp2", jpf: "image/jpx",
        jpx: "image/jpx", jpm: "image/jpm", mj2: "image/mj2", jxl: "image/jxl",
        psd: "image/vnd.adobe.photoshop", psb: "image/vnd.adobe.photoshop"
      };
      return extensionMimeTypes[getFileExtension(file?.name)] || "image/*";
    }
  
    function clearPendingImage() {
  
      pendingImage = null;
      if (chatImageInput) chatImageInput.value = "";
      if (chatAttachmentPreview) {
        chatAttachmentPreview.hidden = true;
        chatAttachmentPreview.innerHTML = "";
      }
      if (chatAttachmentHint) chatAttachmentHint.textContent = "Tệp ảnh tối đa 700 KB";
    }
  
    function renderPendingImage(file, dataUrl) {
      if (!chatAttachmentPreview) return;
      chatAttachmentPreview.hidden = false;
      chatAttachmentPreview.innerHTML = `<span class="attachment-file-icon"><span class="material-symbols-rounded">image</span></span><span class="attachment-file-meta"><strong>${escapeHtml(
        file.name
      )}</strong><small>Hình ảnh · ${Math.round(file.size / 1024)} KB</small></span><button type="button" id="removeChatImage" aria-label="Xóa tệp hình ảnh" title="Xóa tệp">close</button>`;
      document.getElementById("removeChatImage")?.addEventListener("click", clearPendingImage);
      if (chatAttachmentHint) chatAttachmentHint.textContent = "Ảnh đã sẵn sàng để gửi";
    }
  
    chatImageInput?.addEventListener("change", (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      if (!isImageFile(file)) {
        alert("Vui lòng chọn tệp hình ảnh hợp lệ.");
        clearPendingImage();
        return;
      }
      if (file.size > 700 * 1024) {
        alert("Ảnh quá lớn. Vui lòng chọn ảnh không vượt quá 700 KB.");
        clearPendingImage();
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        pendingImage = {
          file,
          name: file.name,
          type: getImageMimeType(file),
          size: file.size,
          dataUrl: String(reader.result)
        };
        renderPendingImage(file, pendingImage.dataUrl);
      };
      reader.readAsDataURL(file);
    });
  
    function getStudentConversationText() {
      return chatConversationMessages
        .filter((message) => {
          const sender = message.senderUid || message.senderId || message.uid || "";
          return sender !== currentCSUser?.uid;
        })
        .map((message) => message.text || message.message || "")
        .filter(Boolean)
        .join("\n");
    }
  
    function getLocalAiDraft(ticket, conversation) {
      const title = getTicketTitle(ticket) || "yêu cầu của bạn";
      const excerpt = conversation ? conversation.slice(-320) : "";
      return `Chào bạn, mình đã tiếp nhận yêu cầu "${title}". ${
        excerpt ? `Mình đã đọc nội dung trao đổi của bạn và ghi nhận: "${excerpt}". ` : ""
      }Mình sẽ kiểm tra với bộ phận phụ trách và phản hồi bạn sớm nhất. Nếu có ảnh chụp màn hình hoặc thông báo lỗi, bạn có thể gửi thêm để mình hỗ trợ chính xác hơn nhé.`;
    }
  
    let faqAiCache = null;
    let faqAiCachePromise = null;
  
    function removeVietnameseTones(value) {
      return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/gi, "d")
        .toLowerCase();
    }
  
    async function loadFaqAiContext() {
      if (faqAiCache) return faqAiCache;
      if (faqAiCachePromise) return faqAiCachePromise;
      faqAiCachePromise = db
        .collection("faqs")
        .limit(80)
        .get()
        .then((snapshot) => {
          faqAiCache = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          return faqAiCache;
        })
        .catch((error) => {
          console.warn("Không tải được FAQ cho AI:", error);
          faqAiCache = [];
          return faqAiCache;
        });
      return faqAiCachePromise;
    }
  
    function findRelatedFaqs(question, faqData) {
      const words = removeVietnameseTones(question)
        .split(/\s+/)
        .filter((word) => word.length >= 3);
      if (!words.length) return [];
      return faqData
        .map((item) => {
          const text = removeVietnameseTones(`${item.question || ""} ${item.answer || ""} ${item.category || ""}`);
          let score = 0;
          words.forEach((word) => {
            if (text.includes(word)) score += 1;
          });
          return { item, score };
        })
        .filter((row) => row.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 8)
        .map((row) => ({
          category: row.item.category || "",
          question: row.item.question || "",
          answer: row.item.answer || ""
        }));
    }
  
      async function createAiDraft(signal) {
      if (signal?.aborted) {
        throw new DOMException("AI request đã bị hủy.", "AbortError");
      }
  
  
      const conversation = chatConversationMessages
        .map((message) => ({
          role:
            (message.senderUid || message.senderId || message.uid || "") === currentCSUser?.uid
              ? "assistant"
              : String(message.sender || message.senderType || "").toLowerCase() === "cs"
              ? "assistant"
              : "user",
          text: message.text || message.message || "",
          imageName: message.imageName || ""
        }))
        .filter((message) => message.text || message.imageName)
        .slice(-20);
  
      const latestStudentMessage =
        [...conversation].reverse().find((message) => message.role === "user")?.text ||
        getTicketDescription(selectedTicket) ||
        getTicketTitle(selectedTicket) ||
        "Yêu cầu của học viên";
  
          const faqData = await loadFaqAiContext();
      if (signal?.aborted) {
        throw new DOMException("AI request đã bị hủy.", "AbortError");
      }
  
      const relatedFaqs = findRelatedFaqs(latestStudentMessage, faqData);
  
      const ticketContext = [
        {
          category: selectedTicket?.ticketCategory || selectedTicket?.category || selectedTicket?.ticketType || "",
          question: getTicketTitle(selectedTicket) || "",
          answer: getTicketDescription(selectedTicket) || ""
        }
      ];
      const faqContext = [...relatedFaqs, ...ticketContext].filter((item) => item.question || item.answer).slice(0, 12);
  
      const aiInstruction = [
        "Bạn là trợ lý Customer Success của Học Viện.",
        "Hãy đọc toàn bộ lịch sử trao đổi trong history, câu hỏi mới nhất, thông tin ticket và FAQ liên quan trước khi trả lời.",
        "Ưu tiên câu trả lời trong FAQ khi phù hợp; không được bịa chính sách, học phí, thời hạn, kết quả xử lý hoặc cam kết chắc chắn.",
        "Nếu FAQ và dữ liệu ticket không đủ, hãy nói rõ để CS kiểm tra thêm thay vì đoán.",
        "Viết tiếng Việt lịch sự, rõ ràng, ngắn gọn, xưng mình và gọi người nhận là bạn.",
        "Chỉ trả về nội dung bản nháp gửi cho học viên, không giải thích quá trình suy luận."
      ].join(" ");
  
          const response = await fetch(AI_WEB_APP_URL, {
        method: "POST",
        signal,
  
        headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
        body: new URLSearchParams({
          question: `${aiInstruction}\n\nCâu hỏi mới nhất của học viên:\n${latestStudentMessage}`,
          history: JSON.stringify(conversation),
          faqContext: JSON.stringify(faqContext)
        })
      });
      if (!response.ok) throw new Error(`Gemini gateway HTTP ${response.status}`);
      const data = await response.json();
      if (!data?.success || !data?.answer) throw new Error(data?.error || "Gemini không trả về câu trả lời hợp lệ.");
      return String(data.answer).trim();
    }
  
    function ensureAiSuggestButtonIcon() {
      if (!aiSuggestBtn || aiSuggestBtn.querySelector(".material-symbols-rounded")) return;
  
      aiSuggestBtn.insertAdjacentHTML(
        "afterbegin",
        '<span class="material-symbols-rounded" aria-hidden="true">auto_awesome</span>'
      );
    }
  
    function updateAiSuggestButton() {
      if (!aiSuggestBtn) return;
  
      aiSuggestBtn.classList.toggle("ai-suggest-active", aiSuggestionsVisible);
      aiSuggestBtn.setAttribute("aria-pressed", String(aiSuggestionsVisible));
      aiSuggestBtn.setAttribute(
        "aria-label",
        aiSuggestionsVisible ? "Tắt gợi ý trả lời AI" : "Bật gợi ý trả lời AI"
      );
      aiSuggestBtn.setAttribute(
        "title",
        aiSuggestionsVisible ? "Tắt gợi ý trả lời AI" : "Bật gợi ý trả lời AI"
      );
    }
  
    function hideAiSuggestions() {
      aiSuggestionsVisible = false;
      aiSuggestionRequestId += 1;
  
      if (aiSuggestionAbortController) {
        aiSuggestionAbortController.abort();
        aiSuggestionAbortController = null;
      }
  
      if (chatAiSuggestions) {
        chatAiSuggestions.hidden = true;
        chatAiSuggestions.setAttribute("aria-hidden", "true");
        chatAiSuggestions.innerHTML = "";
      }
  
      updateAiSuggestButton();
    }
  
    async function generateAiSuggestions() {
      if (!chatAiSuggestions || !selectedTicket) return;
  
      if (aiSuggestionAbortController) {
        aiSuggestionAbortController.abort();
      }
  
      const requestId = ++aiSuggestionRequestId;
      const abortController = new AbortController();
      aiSuggestionAbortController = abortController;
      aiSuggestionsVisible = true;
      chatAiSuggestions.hidden = false;
      chatAiSuggestions.setAttribute("aria-hidden", "false");
      updateAiSuggestButton();
  
      chatAiSuggestions.innerHTML = `<div class="ai-panel-head"><button class="ai-panel-close" id="closeAiSuggestions" type="button" aria-label="Đóng ô gợi ý AI" title="Đóng ô gợi ý AI"><span class="material-symbols-rounded">close</span></button><span class="material-symbols-rounded">auto_awesome</span>AI đang phân tích</div><p class="ai-panel-status">Đang đọc toàn bộ nội dung trao đổi của học viên...</p>`;
      document.getElementById("closeAiSuggestions")?.addEventListener("click", hideAiSuggestions);
  
      try {
        aiDraftText = await createAiDraft(abortController.signal);
  
        if (!aiSuggestionsVisible || requestId !== aiSuggestionRequestId || abortController.signal.aborted) return;
  
        chatAiSuggestions.innerHTML = `<div class="ai-panel-head"><button class="ai-panel-close" id="closeAiSuggestions" type="button" aria-label="Đóng ô gợi ý AI" title="Đóng ô gợi ý AI"><span class="material-symbols-rounded">close</span></button><span class="material-symbols-rounded">auto_awesome</span>Gợi ý trả lời AI</div><p class="ai-panel-status">Bản nháp chỉ hiển thị cho CS và chưa được gửi cho học viên.</p><textarea class="ai-draft" id="aiDraftText">${escapeHtml(
          aiDraftText
        )}</textarea><div class="ai-panel-actions"><button class="ai-panel-action" id="refreshAiDraft" type="button"><span class="material-symbols-rounded">refresh</span>Tạo lại</button><button class="ai-panel-action primary" id="insertAiDraft" type="button"><span class="material-symbols-rounded">content_paste</span>Dùng câu trả lời</button></div>`;
  
        document.getElementById("closeAiSuggestions")?.addEventListener("click", hideAiSuggestions);
        document.getElementById("insertAiDraft")?.addEventListener("click", () => {
          const draft = document.getElementById("aiDraftText")?.value || aiDraftText;
          if (chatInput) {
            chatInput.value = draft;
            chatInput.focus();
          }
        });
        document.getElementById("refreshAiDraft")?.addEventListener("click", generateAiSuggestions);
      } catch (error) {
        if (error?.name === "AbortError" || abortController.signal.aborted) return;
        if (!aiSuggestionsVisible || requestId !== aiSuggestionRequestId) return;
  
        chatAiSuggestions.innerHTML = `<div class="ai-panel-head"><button class="ai-panel-close" id="closeAiSuggestions" type="button" aria-label="Đóng ô gợi ý AI" title="Đóng ô gợi ý AI"><span class="material-symbols-rounded">close</span></button><span class="material-symbols-rounded">error</span>Không thể tạo gợi ý</div><p class="ai-panel-status">${escapeHtml(error?.message || "Vui lòng thử lại sau.")}</p><div class="ai-panel-actions"><button class="ai-panel-action primary" id="retryAiDraft" type="button"><span class="material-symbols-rounded">refresh</span>Thử lại</button></div>`;
        document.getElementById("closeAiSuggestions")?.addEventListener("click", hideAiSuggestions);
        document.getElementById("retryAiDraft")?.addEventListener("click", generateAiSuggestions);
      } finally {
        if (aiSuggestionAbortController === abortController) {
          aiSuggestionAbortController = null;
        }
      }
    }
  
    function toggleAiSuggestions() {
      if (aiSuggestionsVisible) {
        hideAiSuggestions();
        return;
      }
      generateAiSuggestions();
    }
  
    ensureAiSuggestButtonIcon();
    aiSuggestBtn?.addEventListener("click", toggleAiSuggestions);
    updateAiSuggestButton();
  
    /* =========================================================
       SEND CHAT
    ========================================================= */
  
    if (sendChatBtn) {
      sendChatBtn.addEventListener("click", sendChatMessage);
    }
  
    if (chatInput) {
      chatInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          sendChatMessage();
        }
      });
    }
  
      async function uploadPendingImageToStorage(ticketId, messageId) {
      if (!pendingImage?.file) return {};
      if (typeof firebase === "undefined" || typeof firebase.storage !== "function") {
        throw new Error("Firebase Storage chưa được khởi tạo.");
      }
      const safeName = String(pendingImage.name || "image").replace(/[^a-zA-Z0-9._-]/g, "_");
      const storagePath = `tickets/${ticketId}/messages/${messageId}-${safeName}`;
      const storageRef = firebase.storage().ref().child(storagePath);
      await storageRef.put(pendingImage.file, {
        contentType: pendingImage.type || "image/*",
        customMetadata: {
          originalName: String(pendingImage.name || ""),
          uploadedBy: String(currentCSUser?.uid || "")
        }
      });
      const imageUrl = await storageRef.getDownloadURL();
      return {
        imageUrl,
        attachmentUrl: imageUrl,
        storagePath,
        attachmentPath: storagePath,
        imageName: pendingImage.name || safeName,
        imageType: pendingImage.type || "image/*",
        imageSize: Number(pendingImage.size || pendingImage.file.size || 0)
      };
    }
  
    async function sendChatMessage() {
  
      if (!chatInput) {
        console.warn("⚠️ Không tìm thấy #chatInput");
        return;
      }
  
      if (!selectedTicket) {
        alert("Vui lòng chọn ticket trước.");
        return;
      }
  
      const text = chatInput.value.trim();
  
      if (!text && !pendingImage) {
        return;
      }
  
      if (!currentCSUser) {
        alert("Phiên đăng nhập đã hết.");
        return;
      }
  
      try {
        sendChatBtn.disabled = true;
  
        const ticketRef = db.collection(TICKET_COLLECTION).doc(selectedTicket.id);
        const messageRef = ticketRef.collection(CHAT_SUBCOLLECTION).doc();
        const notification = createNotificationData(selectedTicket, {
          type: "message",
          preview: text || "Đã gửi một hình ảnh"
        });
        const uploadedImage = await uploadPendingImageToStorage(selectedTicket.id, messageRef.id);
  
        await db.runTransaction(async (transaction) => {
          const snapshot = await transaction.get(ticketRef);
          const latestTicket = snapshot.exists ? snapshot.data() : {};
          const satisfactionAttemptCount = Number(latestTicket.satisfactionAttemptCount) || 0;
          const shouldAskAfterReply =
            latestTicket.status !== "closed" && satisfactionAttemptCount === 0 && latestTicket.satisfactionStatus !== "awaiting";
  
          transaction.set(messageRef, {
            text,
            ...uploadedImage,
            senderUid: currentCSUser.uid,
            senderId: currentCSUser.uid,
            senderEmail: currentCSUser.email || "",
            senderName: currentCSProfile?.name || currentCSUser.displayName || "Customer Success",
            senderRole: "cs",
            senderType: "cs",
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          });
  
          const messageUpdate = {
            lastMessage: text || "Đã gửi một hình ảnh",
            lastCSReply: text || "Đã gửi một hình ảnh",
            lastCSReplyAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            notificationHistory: appendNotificationHistory(latestTicket, notification)
          };
          if (shouldAskAfterReply) {
            messageUpdate.satisfactionAttemptCount = 1;
            messageUpdate.satisfactionRound = 1;
            messageUpdate.satisfactionStatus = "awaiting";
            messageUpdate.satisfactionAskedAt = firebase.firestore.FieldValue.serverTimestamp();
            messageUpdate.satisfactionRespondedAt = null;
          }
          transaction.update(ticketRef, messageUpdate);
        });
        await notifyAdminFromCS({
          action: "reply_ticket",
          actionLabel: "phản hồi ticket",
          ticket: selectedTicket,
          detail: `${currentCSProfile?.name || currentCSUser?.displayName || "CS"} đã phản hồi ticket ${getTicketNum(
            selectedTicket
          )} của ${getStudentName(selectedTicket)}.`,
          severity: "info",
          type: "message"
        });
  
        chatInput.value = "";
        clearPendingImage();
              if (chatAiSuggestions) {
          hideAiSuggestions();
        }
  
      } catch (error) {
        console.error("❌ Không thể gửi tin nhắn:", error);
  
        alert("Không thể gửi tin nhắn.\n\n" + (error.message || ""));
      } finally {
        sendChatBtn.disabled = false;
      }
    }
  
    /* =========================================================
       AUTH
    ========================================================= */
  
    auth.onAuthStateChanged(async (user) => {
      if (!user) {
        console.warn("⚠️ Chưa đăng nhập.");
  
        if (ticketUnsubscribe) {
          ticketUnsubscribe();
          ticketUnsubscribe = null;
        }
  
        /*
         * Giữ hành vi cũ:
         * chỉ trang CS khi chưa đăng nhập
         * mới quay về login.
         */
  
        window.location.href = "/CS/login/login.html";
  
        return;
      }
  
      currentCSUser = user;
  
      console.log("👤 CS đăng nhập:", { uid: user.uid, email: user.email });
  
      currentCSProfile = await loadCSProfile(user.uid);
  
      if (!currentCSProfile) {
        renderEmptyProfileError();
        return;
      }
  
      loadTicketsForCurrentCS(currentCSProfile);
    });
  
    /* =========================================================
       CONNECTION STATUS
    ========================================================= */
  
    const connDot = document.getElementById("connDot");
    const connLabel = document.getElementById("connLabel");
  
    if (connLabel) {
      connLabel.textContent = "Đang kết nối...";
    }
  
    if (typeof firebase !== "undefined") {
      db.collection(TICKET_COLLECTION)
        .limit(1)
        .onSnapshot(
          () => {
            if (connDot) {
              connDot.classList.add("online");
            }
  
            if (connLabel) {
              connLabel.textContent = "Đã kết nối";
            }
          },
          (error) => {
            console.error("Firestore connection error:", error);
  
            if (connDot) {
              connDot.classList.remove("online");
            }
  
            if (connLabel) {
              connLabel.textContent = "Mất kết nối";
            }
          }
        );
    }
  
    /* =========================================================
       TODAY
    ========================================================= */
  
    const todayStr = document.getElementById("todayStr");
  
    if (todayStr) {
      todayStr.textContent = new Date().toLocaleDateString("vi-VN", {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      });
    }
  
    /* =========================================================
       GLOBAL DEBUG
    ========================================================= */
  
    window.CSTicketManagement = {
      getTickets: () => allTickets,
      getFilteredTickets: () => filteredTickets,
      getCurrentUser: () => currentCSUser,
      getCurrentProfile: () => currentCSProfile,
      getSelectedTicket: () => selectedTicket,
      reload: () => {
        if (currentCSProfile) {
          loadTicketsForCurrentCS(currentCSProfile);
        }
      },
      applyFilters,
      openTicket,
      closeDrawer,
      openChat,
      closeChat,
      updateTicketStatus,
      notifyAdminFromCS
    };
  
    console.log("==========================================");
    console.log("CS TICKET MANAGEMENT ĐÃ KHỞI ĐỘNG");
    console.log("Có thể bấm bất cứ đâu trong ticket để mở Drawer");
    console.log("==========================================");
  })();
  
  
  function showConfirmDialog({ ticketId, nextStatusLabel, isClosing = false }) {
    const modal = document.getElementById("confirmModal");
    const message = document.getElementById("confirmDialogMessage");
    const acceptButton = document.getElementById("confirmAcceptBtn");
    const title = document.getElementById("confirmDialogTitle");
  
    const fallbackMessage = isClosing
      ? `Đóng ticket ${ticketId}?\n\nSau khi đóng, ticket sẽ được đánh dấu là đã kết thúc.`
      : `Chuyển ticket ${ticketId} sang "${nextStatusLabel}"?`;
  
    if (!modal || !message || !acceptButton) {
      return Promise.resolve(window.confirm(fallbackMessage));
    }
  
    if (title) {
      title.textContent = isClosing
        ? "Đóng ticket này?"
        : "Chuyển trạng thái ticket?";
    }
  
    message.textContent = isClosing
      ? `Bạn có chắc muốn đóng ticket ${ticketId} không? Sau khi đóng, ticket sẽ được đánh dấu là đã kết thúc.`
      : `Bạn có chắc muốn chuyển ticket ${ticketId} sang trạng thái "${nextStatusLabel}" không?`;
  
    modal.hidden = false;
    document.body.classList.add("modal-open");
  
    return new Promise((resolve) => {
      let settled = false;
  
      const cleanup = (result) => {
        if (settled) return;
        settled = true;
        modal.hidden = true;
        document.body.classList.remove("modal-open");
        acceptButton.removeEventListener("click", onAccept);
        modal.querySelectorAll("[data-confirm-cancel]").forEach((button) => {
          button.removeEventListener("click", onCancel);
        });
        document.removeEventListener("keydown", onKeydown);
        resolve(result);
      };
  
      const onAccept = () => cleanup(true);
      const onCancel = () => cleanup(false);
      const onKeydown = (event) => {
        if (event.key === "Escape") cleanup(false);
      };
  
      acceptButton.addEventListener("click", onAccept);
      modal.querySelectorAll("[data-confirm-cancel]").forEach((button) => {
        button.addEventListener("click", onCancel);
      });
      document.addEventListener("keydown", onKeydown);
      requestAnimationFrame(() => acceptButton.focus());
    });
  }