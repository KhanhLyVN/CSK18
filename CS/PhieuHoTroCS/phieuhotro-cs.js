// ======================================================
// PHIẾU HỖ TRỢ CS
// TẠO TICKET + PHÂN PHÒNG BAN + FILE ATTACHMENT
// ======================================================
// ======================================================
// EMAILJS CONFIG
// ======================================================
const EMAILJS_PUBLIC_KEY = "dmcYr1M1K9V45Q18B";
const EMAILJS_SERVICE_ID = "service_ts3osyy";
const EMAILJS_TEMPLATE_ID = "template_2bntc3p";
if (window.emailjs) {
  try {
    window.emailjs.init({
      publicKey: EMAILJS_PUBLIC_KEY
    });
  } catch (error) {
    console.warn("EmailJS init error:", error);
  }
}
// ======================================================
// ICONS
// ======================================================
const ICONS = {
  bug:
    '<path d="M12 8v8M8 12h8"/>' +
    '<path d="M9 4h6l1 3H8l1-3z"/>' +
    '<rect x="6" y="7" width="12" height="12" rx="4"/>' +
    '<path d="M4 10l2 1M20 10l-2 1M4 17l2-1M20 17l-2-1"/>',
  calendar:
    '<rect x="3" y="5" width="18" height="16" rx="2"/>' +
    '<path d="M16 3v4M8 3v4M3 10h18"/>',
  wallet:
    '<path d="M3 7a2 2 0 0 1 2-2h13a1 1 0 0 1 1 1v3"/>' +
    '<path d="M3 7v11a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-6a1 1 0 0 0-1-1h-5a2 2 0 0 0 0 4h6"/>',
  cert:
    '<circle cx="12" cy="8" r="5"/>' +
    '<path d="M9 12.5L7 21l5-3 5 3-2-8.5"/>',
  swap:
    '<path d="M7 4v10M7 4L4 7M7 4l3 3"/>' +
    '<path d="M17 20V10M17 20l3-3M17 20l-3-3"/>',
  chat:
    '<path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5H4l1.6-3.8A8.5 8.5 0 1 1 21 11.5z"/>' +
    '<path d="M12 9v4M12 15.5h.01"/>',
  scale:
    '<path d="M12 3v18M5 8l-3 6a4 4 0 0 0 6 0zM19 8l-3 6a4 4 0 0 0 6 0zM5 8h14M9 3h6"/>',
  mentor:
    '<circle cx="9" cy="8" r="3"/>' +
    '<path d="M4 20c0-3.3 2.7-5.5 5-5.5s5 2.2 5 5.5"/>' +
    '<path d="M15 8h6M18 5v6"/>',
  book:
    '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15z"/>' +
    '<path d="M20 18H6.5A2.5 2.5 0 0 0 4 20.5"/>',
  other:
    '<circle cx="5" cy="12" r="1.4"/>' +
    '<circle cx="12" cy="12" r="1.4"/>' +
    '<circle cx="19" cy="12" r="1.4"/>'
};
// ======================================================
// TICKET CATEGORIES
// ======================================================
const TICKET_CATEGORIES = [
  {
    id: "system",
    label: "Hệ thống",
    icon: "bug",
    issues: [
      {
        value: "system-login",
        label: "Đăng nhập / xác thực",
        department: "IT"
      },
      {
        value: "system-password",
        label: "Mật khẩu",
        department: "IT"
      },
      {
        value: "system-account",
        label: "Tài khoản học viên",
        department: "IT"
      },
      {
        value: "system-website-access",
        label: "Website không truy cập được",
        department: "IT"
      },
      {
        value: "system-page-error",
        label: "Một trang bị lỗi",
        department: "IT"
      },
      {
        value: "system-browser-device",
        label: "Lỗi thiết bị / trình duyệt",
        department: "IT"
      },
      {
        value: "system-video-playback",
        label: "Lỗi phát video",
        department: "IT"
      },
      {
        value: "system-file-upload",
        label: "Không tải được tệp",
        department: "IT"
      },
      {
        value: "system-notification",
        label: "Email / thông báo",
        department: "IT"
      },
      {
        value: "system-data-sync",
        label: "Dữ liệu chưa đồng bộ",
        department: "IT"
      },
      {
        value: "system-security",
        label: "Bảo mật tài khoản",
        department: "IT"
      },
      {
        value: "system-other",
        label: "Khác",
        department: "IT"
      }
    ]
  },
  {
    id: "learning",
    label: "Khóa học",
    icon: "book",
    issues: [
      {
        value: "learning-registration",
        label: "Đăng ký khóa học",
        department: "CS"
      },
      {
        value: "learning-course-access",
        label: "Quyền truy cập khóa học",
        department: "CS"
      },
      {
        value: "learning-fee",
        label: "Học phí",
        department: "SALE"
      },
      {
        value: "learning-payment-method",
        label: "Phương thức thanh toán",
        department: "SALE"
      },
      {
        value: "learning-payment-confirmation",
        label: "Xác nhận thanh toán",
        department: "SALE"
      },
      {
        value: "learning-invoice",
        label: "Hóa đơn / biên nhận",
        department: "SALE"
      },
      {
        value: "learning-refund",
        label: "Hoàn tiền / hủy đăng ký",
        department: "SALE"
      },
      {
        value: "learning-promotion",
        label: "Mã giảm giá / ưu đãi",
        department: "SALE"
      },
      {
        value: "learning-certificate",
        label: "Chứng chỉ",
        department: "CS"
      },
      {
        value: "learning-result",
        label: "Kết quả học tập",
        department: "CS"
      },
      {
        value: "learning-other",
        label: "Khác",
        department: "CS"
      }
    ]
  },
  {
    id: "account",
    label: "Vận hành",
    icon: "mentor",
    issues: [
      {
        value: "operations-schedule",
        label: "Lịch học",
        department: "CS"
      },
      {
        value: "operations-attendance",
        label: "Điểm danh và vắng học",
        department: "CS"
      },
      {
        value: "operations-mentor",
        label: "Mentor / giáo viên",
        department: "TEACH"
      },
      {
        value: "operations-mentor-feedback",
        label: "Phản hồi về mentor",
        department: "TEACH"
      },
      {
        value: "operations-video-quality",
        label: "Chất lượng hình ảnh / video",
        department: "CS"
      },
      {
        value: "operations-video-access",
        label: "Không xem được bài giảng",
        department: "CS"
      },
      {
        value: "operations-material",
        label: "Tài liệu và bài giảng",
        department: "RND"
      },
      {
        value: "operations-assignment",
        label: "Bài tập và hỗ trợ bài giảng",
        department: "RND"
      },
      {
        value: "operations-classroom",
        label: "Phòng học và buổi học",
        department: "CS"
      },
      {
        value: "operations-support",
        label: "Hỗ trợ trong quá trình học",
        department: "CS"
      },
      {
        value: "operations-other",
        label: "Khác",
        department: "CS"
      }
    ]
  },
  {
    id: "other",
    label: "Khác",
    icon: "other",
    issues: [
      {
        value: "other-feedback",
        label: "Góp ý / phản hồi",
        department: "CS"
      },
      {
        value: "other-complaint",
        label: "Khiếu nại",
        department: "CS"
      },
      {
        value: "other-request",
        label: "Yêu cầu hỗ trợ khác",
        department: "CS"
      }
    ]
  }
];
// ======================================================
// DEFAULT DEPARTMENT
// ======================================================
const CATEGORY_DEFAULT_DEPARTMENT = {
  system: "IT",
  learning: "CS",
  account: "CS",
  other: "CS"
};
// ======================================================
// DOM HELPER
// ======================================================
function $(id) {
  return document.getElementById(id);
}
function getValue(id) {
  const element = $(id);
  if (!element) {
    return "";
  }
  return String(element.value || "").trim();
}
function setText(id, value) {
  const element = $(id);
  if (element) {
    element.textContent = value ?? "";
  }
}
function escapeHTML(value) {
  const div = document.createElement("div");
  div.textContent = value ?? "";
  return div.innerHTML;
}
// ======================================================
// SVG ICON
// ======================================================
function svgIcon(key) {
  return `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true">
      ${ICONS[key] || ICONS.other}
    </svg>
  `;
}
// ======================================================
// GET CATEGORY
// ======================================================
function getCategory(categoryId) {
  return TICKET_CATEGORIES.find(
    item => item.id === categoryId
  ) || null;
}
// ======================================================
// GET ISSUE
// ======================================================
function getIssue(categoryId, issueValue) {
  const category = getCategory(categoryId);
  if (!category) {
    return null;
  }
  return category.issues.find(
    item => item.value === issueValue
  ) || null;
}
// ======================================================
// RESOLVE DEPARTMENT
// ======================================================
function resolveTicketDepartment(
  categoryId,
  issueValue
) {
  const issue = getIssue(
    categoryId,
    issueValue
  );
  if (issue?.department) {
    return issue.department;
  }
  return (
    CATEGORY_DEFAULT_DEPARTMENT[categoryId]
    || "CS"
  );
}
// ======================================================
// GET FIREBASE DATABASE
// ======================================================
function getDatabase() {
  if (
    typeof db !== "undefined" &&
    db
  ) {
    return db;
  }
  if (
    typeof window.db !== "undefined" &&
    window.db
  ) {
    return window.db;
  }
  return null;
}
// ======================================================
// GET FIREBASE AUTH
// ======================================================
function getAuth() {
  if (
    typeof auth !== "undefined" &&
    auth
  ) {
    return auth;
  }
  if (
    typeof window.auth !== "undefined" &&
    window.auth
  ) {
    return window.auth;
  }
  return null;
}
// ======================================================
// GET FIREBASE
// ======================================================
function getFirebase() {
  if (
    typeof firebase !== "undefined" &&
    firebase
  ) {
    return firebase;
  }
  return null;
}
// ======================================================
// TICKET PREFIX
// ======================================================
function getPrefixFromCategory(label) {
  if (!label) {
    return "HV";
  }
  const cleanStr = String(label)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .trim();
  const words = cleanStr.split(/\s+/);
  if (words.length >= 2) {
    return (
      words[0][0] +
      words[1][0]
    ).toUpperCase();
  }
  return cleanStr
    .substring(0, 2)
    .toUpperCase();
}
// ======================================================
// GENERATE TICKET NUMBER
// ======================================================
function genTicketNum(typeLabel) {
  const prefix =
    getPrefixFromCategory(typeLabel);
  const timePart =
    String(Date.now()).slice(-7);
  const randomPart =
    String(
      Math.floor(Math.random() * 100)
    ).padStart(2, "0");
  return `${prefix}-${timePart}${randomPart}`;
}
// ======================================================
// DATE
// ======================================================
function todayLabel() {
  return new Date().toLocaleDateString(
    "vi-VN",
    {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }
  );
}
function isoToday() {
  const now = new Date();
  const offset =
    now.getTimezoneOffset();
  return new Date(
    now.getTime() -
    offset * 60000
  )
    .toISOString()
    .slice(0, 10);
}
function formatDateVN(value) {
  if (!value) {
    return "—";
  }
  const [
    year,
    month,
    day
  ] = value.split("-");
  return `${day}/${month}/${year}`;
}
// ======================================================
// DOM ELEMENTS
// ======================================================
const issueField = $("issueField");
const issueSelect = $("issueSelect");
const chipGrid = $("chipGrid");
const chkCourse = $("chkCourse");
const courseBoxWrap = $("courseBoxWrap");
const fCourse = $("fCourse");
const fDateEl = $("fDate");
const fileDrop = $("fileDrop");
const fFile = $("fFile");
const fileNameEl = $("fileName");
const formView = $("formView");
const successView = $("successView");
const submitBtn = $("submitBtn");
const againBtn = $("againBtn");
const layoutContainer = $("layoutContainer");
// ======================================================
// AI PHÂN TÍCH TIÊU ĐỀ
// ======================================================
const TITLE_AI_WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbzvf35Iys91we_U2Hku2Hoa8755yajrmzCgWgK6s5cKoj7UVc_Lh_kqmOK23L26GhffrQ/exec";

const fTitle = $("fTitle" );
const titleAiSuggestion = $("titleAiSuggestion");
const titleAiSuggestionBody = $("titleAiSuggestionBody");
const closeTitleAiSuggestion = $("closeTitleAiSuggestion");

let titleAiDebounceTimer = null;
let titleAiRequestId = 0;
let titleAiManuallyClosed = false;

function showTitleAiSuggestion(text, options = {}) {
  if (!titleAiSuggestion || !titleAiSuggestionBody) return;

  titleAiSuggestionBody.textContent = text || "";
  titleAiSuggestion.classList.toggle("is-loading", Boolean(options.loading));
  titleAiSuggestion.classList.add("is-visible");
  titleAiSuggestion.setAttribute("aria-hidden", "false");
}

function hideTitleAiSuggestion() {
  if (!titleAiSuggestion || !titleAiSuggestionBody) return;

  titleAiSuggestion.classList.remove("is-visible", "is-loading");
  titleAiSuggestion.setAttribute("aria-hidden", "true");
  titleAiSuggestionBody.textContent = "";
}

function formatTitleAiAnswer(answer) {
  const cleanAnswer = String(answer || "").trim();
  if (!cleanAnswer) {
    return "AI chưa tìm được hướng dẫn phù hợp. Bạn có thể bổ sung mô tả chi tiết ở ô bên dưới.";
  }
  return cleanAnswer;
}

async function analyzeTitleWithAI(title, requestId) {
  const selectedRadio = document.querySelector(
    'input[name="ticketMainType"]:checked'
  );
  const category = selectedRadio
    ? getCategory(selectedRadio.value)
    : null;
  const issue = selectedRadio
    ? getIssue(selectedRadio.value, issueSelect?.value || "")
    : null;

  const response = await fetch(TITLE_AI_WEB_APP_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
    },
    body: new URLSearchParams({
      question: title,
      history: JSON.stringify([]),
      faqContext: JSON.stringify([
        {
          category: category?.label || "",
          question: issue?.label || "",
          answer: "Hãy phân tích tiêu đề, xác định vấn đề chính và hướng dẫn học viên các bước xử lý an toàn."
        }
      ]),
      mode: "title-suggestion"
    })
  });

  if (requestId !== titleAiRequestId) return;
  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || "AI không thể phân tích tiêu đề.");
  }

  showTitleAiSuggestion(formatTitleAiAnswer(data.answer));
}

function requestTitleAiSuggestion() {
  const title = getValue("fTitle");
  titleAiManuallyClosed = false;
  window.clearTimeout(titleAiDebounceTimer);
  titleAiRequestId += 1;
  const currentRequestId = titleAiRequestId;

  if (title.length < 8) {
    hideTitleAiSuggestion();
    return;
  }

  showTitleAiSuggestion("AI đang đọc tiêu đề và tìm hướng xử lý phù hợp…", {
    loading: true
  });

  titleAiDebounceTimer = window.setTimeout(async () => {
    try {
      await analyzeTitleWithAI(title, currentRequestId);
    } catch (error) {
      console.error("TITLE AI ERROR:", error);
      if (currentRequestId === titleAiRequestId) {
        showTitleAiSuggestion(
          "Chưa thể tải gợi ý AI lúc này. Bạn vẫn có thể gửi mô tả chi tiết để bộ phận hỗ trợ kiểm tra."
        );
      }
    }
  }, 700);
}

if (fTitle) {
  fTitle.addEventListener("input", () => {
    updateStub();
    requestTitleAiSuggestion();
  });

  // Khi chuyển sang trường khác, khung tự đóng theo yêu cầu.
  fTitle.addEventListener("blur", () => {
    window.setTimeout(() => {
      if (document.activeElement !== fTitle) {
        hideTitleAiSuggestion();
      }
    }, 120);
  });
}

if (closeTitleAiSuggestion) {
  closeTitleAiSuggestion.addEventListener("click", () => {
    titleAiManuallyClosed = true;
    titleAiRequestId += 1;
    window.clearTimeout(titleAiDebounceTimer);
    hideTitleAiSuggestion();
  });
}

// Khi người dùng chuyển sang loại yêu cầu khác, khung cũng đóng.
if (chipGrid) {
  chipGrid.addEventListener("click", hideTitleAiSuggestion);
}
if (issueSelect) {
  issueSelect.addEventListener("change", hideTitleAiSuggestion);
}
// ======================================================
// STATE
// ======================================================
let ticketNum = "HV-000000";
let selectedFile = null;
let loggedInUser = null;
// ======================================================
// RENDER ISSUE OPTIONS
// ======================================================
function renderIssueOptions(categoryId) {
  if (!issueSelect) {
    return;
  }
  const category =
    getCategory(categoryId);
  if (
    !category ||
    category.id === "other"
  ) {
    issueSelect.innerHTML =
      '<option value="">-- Chọn chi tiết vấn đề --</option>';
    issueSelect.disabled = true;
    if (issueField) {
      issueField.classList.remove("show");
    }
    issueSelect.value = "";
    return;
  }
  issueSelect.innerHTML = `
    <option value="">
      -- Chọn chi tiết vấn đề --
    </option>
    ${category.issues
      .map(issue => `
        <option value="${escapeHTML(issue.value)}">
          ${escapeHTML(issue.label)}
        </option>
      `)
      .join("")}
  `;
  issueSelect.disabled = false;
  if (issueField) {
    issueField.classList.add("show");
  }
  issueSelect.value = "";
}
// ======================================================
// GET CHIPS
// ======================================================
function chips() {
  return Array.from(
    document.querySelectorAll(".chip")
  );
}
// ======================================================
// RENDER CATEGORIES
// ======================================================
function renderCategories() {
  if (!chipGrid) {
    return;
  }
  chipGrid.innerHTML = "";
  TICKET_CATEGORIES.forEach(category => {
    const el =
      document.createElement("label");
    el.className = "chip";
    el.innerHTML = `
      <input
        type="radio"
        name="ticketMainType"
        value="${escapeHTML(category.id)}"
        data-label="${escapeHTML(category.label)}"
        data-icon="${escapeHTML(category.icon)}"
      >
      ${svgIcon(category.icon)}
      <span>
        ${escapeHTML(category.label)}
      </span>
      <span class="mark"></span>
    `;
    chipGrid.appendChild(el);
  });
  chips().forEach(chip => {
    chip.addEventListener(
      "click",
      () => {
        chips().forEach(item => {
          item.classList.remove(
            "active"
          );
        });
        chip.classList.add(
          "active"
        );
        const radio =
          chip.querySelector(
            'input[name="ticketMainType"]'
          );
        if (!radio) {
          return;
        }
        radio.checked = true;
        renderIssueOptions(
          radio.value
        );
        const category =
          getCategory(
            radio.value
          );
        const categoryLabel =
          category?.label ||
          radio.value ||
          "Khác";
        ticketNum =
          genTicketNum(
            categoryLabel
          );
        updateStub();
      }
    );
  });
}
// ======================================================
// ISSUE CHANGE
// ======================================================
if (issueSelect) {
  issueSelect.addEventListener(
    "change",
    () => {
      const selectedRadio =
        document.querySelector(
          'input[name="ticketMainType"]:checked'
        );
      if (!selectedRadio) {
        return;
      }
      const category =
        getCategory(
          selectedRadio.value
        );
      const issue =
        getIssue(
          selectedRadio.value,
          issueSelect.value
        );
      const label =
        issue
          ? `${category?.label || ""}-${issue.value}`
          : category?.label || "Khác";
      ticketNum =
        genTicketNum(label);
      updateStub();
    }
  );
}
// ======================================================
// COURSE CHECKBOX
// ======================================================
if (chkCourse) {
  chkCourse.addEventListener(
    "change",
    () => {
      if (courseBoxWrap) {
        courseBoxWrap.classList.toggle(
          "show",
          chkCourse.checked
        );
      }
      if (
        !chkCourse.checked &&
        fCourse
      ) {
        fCourse.value = "";
      }
      updateStub();
    }
  );
}
// ======================================================
// FILE VALIDATION
// ======================================================
function setSelectedFile(file) {
  const maxSize = 700 * 1024;
  if (!file?.type?.startsWith("image/")) {
    $("errorText").textContent = "Vui lòng chọn tệp hình ảnh JPG, PNG, WEBP hoặc GIF.";
    $("errorText").classList.add("show");
    return;
  }
  if (file.size > maxSize) {
    $("errorText").textContent = "Ảnh không được vượt quá 700 KB khi dùng gói miễn phí.";
    $("errorText").classList.add("show");
    return;
  }
  selectedFile = file;
  fileNameEl.textContent = `Đã chọn: ${file.name} (${Math.ceil(file.size / 1024)} KB)`;
  $("errorText").classList.remove("show");
}
// ======================================================
// FILE DROP
// ======================================================
if (fileDrop && fFile) {
  fileDrop.addEventListener(
    "click",
    () => {
      fFile.click();
    }
  );
  fFile.addEventListener(
    "change",
    () => {
      if (fFile.files?.[0]) {
        setSelectedFile(
          fFile.files[0]
        );
      }
    }
  );
  fileDrop.addEventListener(
    "dragover",
    event => {
      event.preventDefault();
      fileDrop.classList.add(
        "dragover"
      );
    }
  );
  fileDrop.addEventListener(
    "dragleave",
    event => {
      event.preventDefault();
      fileDrop.classList.remove(
        "dragover"
      );
    }
  );
  fileDrop.addEventListener(
    "drop",
    event => {
      event.preventDefault();
      fileDrop.classList.remove(
        "dragover"
      );
      const file =
        event.dataTransfer.files?.[0];
      if (file) {
        setSelectedFile(file);
      }
    }
  );
}
// ======================================================
// UPDATE STUB
// ======================================================
function updateStub() {
  const selectedRadio =
    document.querySelector(
      'input[name="ticketMainType"]:checked'
    );
  const selectedIssue =
    issueSelect?.value || "";
  const category =
    selectedRadio
      ? getCategory(
          selectedRadio.value
        )
      : null;
  const issue =
    selectedRadio
      ? getIssue(
          selectedRadio.value,
          selectedIssue
        )
      : null;
  const displayLabel =
    issue &&
    selectedRadio?.value !== "other"
      ? `${category?.label || "Khác"} · ${issue.label}`
      : category?.label ||
        "Chưa chọn loại";
  setText(
    "stubNum",
    ticketNum
  );
  setText(
    "stubName",
    getValue("fName") || "—"
  );
  setText(
    "stubTitle",
    getValue("fTitle") || "—"
  );
  setText(
    "stubDate",
    formatDateVN(
      fDateEl?.value || ""
    )
  );
  const stubCourse =
    $("stubCourse");
  const stubCourseBody =
    $("stubCourseBody");
  if (chkCourse?.checked) {
    const course =
      getValue("fCourse");
    if (stubCourse) {
      stubCourse.textContent =
        course
          ? `Khóa học: ${course}`
          : "";
    }
    if (stubCourseBody) {
      stubCourseBody.textContent =
        course || "Chưa nhập";
    }
  } else {
    if (stubCourse) {
      stubCourse.textContent = "";
    }
    if (stubCourseBody) {
      stubCourseBody.textContent =
        "Không có";
    }
  }
  const stubCat =
    $("stubCat");
  if (stubCat) {
    stubCat.innerHTML =
      svgIcon(
        selectedRadio?.dataset.icon ||
        "other"
      ) +
      `<span>${escapeHTML(
        displayLabel
      )}</span>`;
  }
}
// ======================================================
// INPUT → UPDATE STUB
// ======================================================
[
  "fName",
  "fTitle",
  "fCourse"
].forEach(id => {
  const element = $(id);
  if (element) {
    element.addEventListener(
      "input",
      updateStub
    );
  }
});
// ======================================================
// FIREBASE AUTH
// ======================================================
const authClient =
  getAuth();
if (
  authClient &&
  typeof authClient.onAuthStateChanged ===
  "function"
) {
  authClient.onAuthStateChanged(
    async user => {
      const nameInput =
        $("fName");
      const emailInput =
        $("fEmail");
      const campusInput =
        $("fCampus");
      if (!user) {
        loggedInUser = null;
        if (nameInput) {
          nameInput.value = "";
          nameInput.readOnly = false;
        }
        if (emailInput) {
          emailInput.value = "";
          emailInput.readOnly = false;
        }
        if (campusInput) {
          campusInput.value = "";
          campusInput.readOnly = false;
        }
        updateStub();
        return;
      }
      const database =
        getDatabase();
      if (!database) {
        return;
      }
      try {
        const profileSnapshot =
          await database
            .collection("users")
            .doc(user.uid)
            .get();
        const data =
          profileSnapshot.exists
            ? profileSnapshot.data()
            : {};
        const name =
          data.name ||
          user.displayName ||
          "Học viên";
        const email =
          data.email ||
          user.email ||
          "";
        const phone =
          data.phone ||
          "";
        const campus =
          data.campus ||
          "";
        const role =
          data.role ||
          "student";
        loggedInUser = {
          uid: user.uid,
          name,
          email,
          phone,
          campus,
          role
        };
        if (nameInput) {
          nameInput.value =
            name;
          nameInput.readOnly =
            true;
        }
        if (emailInput) {
          emailInput.value =
            email;
          emailInput.readOnly =
            true;
        }
        if (campusInput) {
          campusInput.value =
            campus;
          campusInput.readOnly =
            Boolean(campus);
        }
        updateStub();
      } catch (error) {
        console.error(
          "Không thể lấy thông tin tài khoản hiện tại:",
          error
        );
      }
    }
  );
}
// ======================================================
// DATE INIT
// ======================================================
if ($("todayStr")) {
  $("todayStr").textContent =
    todayLabel();
}
if (fDateEl) {
  fDateEl.value =
    isoToday();
}
// ======================================================
// FIREBASE STORAGE
// UPLOAD ATTACHMENT
// ======================================================
function compressImageToDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve("");
    if (!file.type?.startsWith("image/")) {
      reject(new Error("Tệp đính kèm phải là hình ảnh."));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Không thể đọc tệp hình ảnh."));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("Ảnh không hợp lệ hoặc không thể giải mã."));
      image.onload = () => {
        const maxDataUrlLength = 820000;
        const canvas = document.createElement("canvas");
        let maxSide = 1280;
        let quality = 0.72;
        let dataUrl = "";
        for (let attempt = 0; attempt < 6; attempt += 1) {
          const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
          canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
          canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
          const context = canvas.getContext("2d", { alpha: false });
          context.fillStyle = "#ffffff";
          context.fillRect(0, 0, canvas.width, canvas.height);
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          dataUrl = canvas.toDataURL("image/jpeg", quality);
          if (dataUrl.length <= maxDataUrlLength) break;
          maxSide = Math.round(maxSide * 0.82);
          quality = Math.max(0.45, quality - 0.06);
        }
        if (!dataUrl || dataUrl.length > maxDataUrlLength) {
          reject(new Error("Ảnh vẫn quá lớn sau khi nén. Hãy chọn ảnh nhỏ hơn."));
          return;
        }
        resolve(dataUrl);
      };
      image.src = String(reader.result || "");
    };
    reader.readAsDataURL(file);
  });
}
// ======================================================
// SUBMIT TICKET
// ======================================================
async function submitTicket() {
  const database =
    getDatabase();
  const errorEl =
    $("errorText");
  // ====================================================
  // FORM DATA
  // ====================================================
  const name =
    getValue("fName");
  const email =
    getValue("fEmail");
  const phone =
    loggedInUser?.phone ||
    getValue("fPhone") ||
    "";
  const campus =
    loggedInUser?.campus ||
    getValue("fCampus") ||
    "";
  const isStudent =
    chkCourse?.checked ||
    false;
  const course =
    isStudent
      ? getValue("fCourse")
      : "Không áp dụng";
  const title =
    getValue("fTitle");
  const description =
    getValue("fDesc");
  const selectedMainType =
    document.querySelector(
      'input[name="ticketMainType"]:checked'
    );
  const selectedIssue =
    issueSelect?.value ||
    "";
  const requiresIssue =
    selectedMainType &&
    selectedMainType.value !== "other";
  // ====================================================
  // DATABASE CHECK
  // ====================================================
  if (!database) {
    if (errorEl) {
      errorEl.textContent =
        "Chưa kết nối được với hệ thống. Vui lòng tải lại trang và thử lại.";
      errorEl.classList.add(
        "show"
      );
    }
    return;
  }
  // ====================================================
  // VALIDATION
  // ====================================================
  if (
    !name ||
    !email ||
    !title ||
    !description ||
    (isStudent && !course) ||
    !selectedMainType ||
    (requiresIssue && !selectedIssue)
  ) {
    if (errorEl) {
      errorEl.textContent =
        "Vui lòng điền đầy đủ các trường bắt buộc (*) và chọn loại yêu cầu.";
      errorEl.classList.add(
        "show"
      );
    }
    return;
  }
  // ====================================================
  // EMAIL VALIDATION
  // ====================================================
  const emailRegex =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    if (errorEl) {
      errorEl.textContent =
        "Email không hợp lệ.";
      errorEl.classList.add(
        "show"
      );
    }
    return;
  }
  if (errorEl) {
    errorEl.classList.remove(
      "show"
    );
  }
  // ====================================================
  // CATEGORY
  // ====================================================
  const category =
    getCategory(
      selectedMainType.value
    );
  // ====================================================
  // ISSUE
  // ====================================================
  const issue =
    getIssue(
      selectedMainType.value,
      selectedIssue
    );
  const ticketIssueLabel =
    selectedMainType.value === "other"
      ? "Khác"
      : issue?.label ||
        issueSelect
          ?.selectedOptions?.[0]
          ?.textContent
          ?.trim() ||
        "Khác";
  // ====================================================
  // DEPARTMENT
  // ====================================================
  const departmentCode =
    resolveTicketDepartment(
      selectedMainType.value,
      selectedIssue
    );
  // ====================================================
  // TICKET NUMBER
  // ====================================================
  if (
    ticketNum ===
    "HV-000000"
  ) {
    const ticketValue =
      selectedMainType.value === "other"
        ? "other"
        : `${selectedMainType.value}-${selectedIssue}`;
    ticketNum =
      genTicketNum(
        ticketValue
      );
    updateStub();
  }
  // ====================================================
  // DISABLE BUTTON
  // ====================================================
  if (submitBtn) {
    submitBtn.disabled =
      true;
    submitBtn.textContent =
      "Đang gửi...";
  }
  try {
    // ==================================================
    // AUTH
    // ==================================================
    const auth =
      getAuth();
    const currentUser =
      auth?.currentUser ||
      null;
    // ==================================================
    // USER PROFILE
    // ==================================================
    let userProfile = {};
    if (
      currentUser?.uid &&
      database
    ) {
      try {
        const profileSnapshot =
          await database
            .collection("users")
            .doc(currentUser.uid)
            .get();
        if (
          profileSnapshot.exists
        ) {
          userProfile =
            profileSnapshot.data() ||
            {};
        }
      } catch (profileError) {
        console.warn(
          "Không đọc được hồ sơ học viên:",
          profileError
        );
      }
    }
    // ==================================================
    // READ ATTACHMENT AS BASE64 (FIRESTORE SPARK)
    // ==================================================
    let attachmentDataUrl = "";
    if (selectedFile) {
      attachmentDataUrl = await compressImageToDataUrl(selectedFile);
    }
    // ==================================================
    // TICKET DATA
    // ==================================================
    const ticketData = {
    ticketNum,
    ticketSchemaVersion: 2,
    // Người tạo ticket
    studentId: currentUser?.uid || loggedInUser?.uid || "",
    name: userProfile.name || loggedInUser?.name || name,
    email: userProfile.email || loggedInUser?.email || email,
    phone: userProfile.phone || loggedInUser?.phone || getValue("fPhone") || "",
    createdByRole: loggedInUser?.role || userProfile.role || "CS",
    isStudent,
    course,
    campus: loggedInUser?.campus || userProfile.campus || campus || "",
    date: fDateEl.value,
    // Phân loại để trang quản lý truy vấn đúng phòng ban/cơ sở
    ticketType: selectedIssue || selectedMainType.value,
    ticketCategoryId: selectedMainType.value,
    ticketCategory: category?.label || "Khác",
    ticketIssueId: selectedIssue || "",
    ticketIssue: ticketIssueLabel,
    departmentCode,
    title,
    description,
    // Ảnh nhỏ lưu Firestore Base64, không dùng Storage
    attachmentName: selectedFile?.name || "",
    attachmentType: selectedFile?.type || "",
    attachmentSize: selectedFile?.size || 0,
    attachmentCompressed: Boolean(attachmentDataUrl),
    attachmentDataUrl,
    status: "open",
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
};
console.log("DATA SAVED TO FIRESTORE:", ticketData);
    // ==================================================
    // DEBUG
    // ==================================================
    console.log(
      "========== TICKET DATA =========="
    );
    console.log(
      ticketData
    );
    console.log(
      "Department:",
      departmentCode
    );
    console.log("Attachment Base64:", {
      name: selectedFile?.name || "",
      type: selectedFile?.type || "",
      size: selectedFile?.size || 0,
      hasData: Boolean(attachmentDataUrl)
    });
    // ==================================================
    // SAVE TICKET
    // ==================================================
    await database
      .collection("tickets")
      .doc(ticketNum)
      .set(ticketData);
    // ==================================================
    // FIRST MESSAGE
    // ==================================================
    await database
      .collection("tickets")
      .doc(ticketNum)
      .collection("messages")
      .add({
        sender:
          "student",
        senderType:
          "student",
        senderName:
          ticketData.name,
        message:
          description,
        text:
          description,
        imageDataUrl: attachmentDataUrl,
        imageName:
          selectedFile?.name ||
          "",
        imageType:
          selectedFile?.type ||
          "",
        imageSize:
          selectedFile?.size ||
          0,
        
        createdAt:
          firebase.firestore.FieldValue
            .serverTimestamp()
      });
    // ==================================================
    // EMAILJS
    // ==================================================
    const templateParams = {
      ticket_num:
        ticketNum,
      name:
        ticketData.name,
      email:
        ticketData.email,
      phone:
        ticketData.phone ||
        "Không cung cấp",
      course:
        course,
      date:
        formatDateVN(
          ticketData.date
        ),
      ticket_type:
        selectedMainType.value === "other"
          ? ticketData.ticketCategory
          : `${ticketData.ticketCategory} · ${ticketIssueLabel}`,
      title:
        title,
      message:
        description
    };
    if (window.emailjs) {
      try {
        await window.emailjs.send(
          EMAILJS_SERVICE_ID,
          EMAILJS_TEMPLATE_ID,
          templateParams
        );
      } catch (emailError) {
        console.warn(
          "Ticket đã lưu nhưng EmailJS không gửi được:",
          emailError
        );
      }
    }
    // ==================================================
    // SUCCESS
    // ==================================================
    const successText =
      $("successText");
    if (successText) {
      successText.innerHTML = `
        Phiếu
        <strong>
          ${escapeHTML(ticketNum)}
        </strong>
        —
        "<em>
          ${escapeHTML(title)}
        </em>"
        đã được gửi thành công.
        Chúng tôi sẽ phản hồi lại
        <strong>
          ${escapeHTML(email)}
        </strong>
        trong thời gian sớm nhất.
      `;
    }
    if (formView) {
      formView.classList.add(
        "hide"
      );
    }
    if (successView) {
      successView.classList.add(
        "show"
      );
    }
    if (layoutContainer) {
      layoutContainer.classList.add(
        "has-submitted"
      );
    }
  } catch (error) {
    console.error(
      "Ticket error:",
      error
    );
    if (errorEl) {
      let message =
        "Không thể gửi phiếu. Vui lòng kiểm tra kết nối và thử lại.";
      if (
        error?.message?.includes(
          "Firebase Storage"
        )
      ) {
        message =
          error.message;
      }
      if (
        error?.code ===
        "storage/unauthorized"
      ) {
        message =
          "Bạn không có quyền tải tệp lên Firebase Storage.";
      }
      if (
        error?.code ===
        "storage/canceled"
      ) {
        message =
          "Upload tệp đã bị hủy.";
      }
      if (
        error?.code ===
        "storage/quota-exceeded"
      ) {
        message =
          "Firebase Storage đã vượt quá dung lượng cho phép.";
      }
      errorEl.textContent =
        message;
      errorEl.classList.add(
        "show"
      );
    }
  } finally {
    if (submitBtn) {
      submitBtn.disabled =
        false;
      submitBtn.textContent =
        "Gửi yêu cầu";
    }
  }
}
// ======================================================
// SUBMIT EVENT
// ======================================================
if (submitBtn) {
  submitBtn.addEventListener(
    "click",
    submitTicket
  );
}
// ======================================================
// RESET FORM
// ======================================================
function resetForm() {
  document
    .querySelectorAll(
      "#formView input:not([type=checkbox]):not([type=radio]), #formView textarea"
    )
    .forEach(input => {
      if (
        loggedInUser &&
        (
          input.id === "fName" ||
          input.id === "fEmail" ||
          input.id === "fCampus"
        )
      ) {
        return;
      }
      input.value = "";
    });
  // --------------------------------------------------
  // FILE
  // --------------------------------------------------
  if (fFile) {
    fFile.value = "";
  }
  selectedFile = null;
  if (fileNameEl) {
    fileNameEl.textContent = "";
  }
  // --------------------------------------------------
  // COURSE
  // --------------------------------------------------
  if (chkCourse) {
    chkCourse.checked = false;
  }
  if (courseBoxWrap) {
    courseBoxWrap.classList.remove(
      "show"
    );
  }
  // --------------------------------------------------
  // CATEGORY
  // --------------------------------------------------
  chips().forEach(chip => {
    chip.classList.remove(
      "active"
    );
  });
  document
    .querySelectorAll(
      'input[name="ticketMainType"]'
    )
    .forEach(input => {
      input.checked = false;
    });
  // --------------------------------------------------
  // ISSUE
  // --------------------------------------------------
  if (issueSelect) {
    issueSelect.innerHTML =
      '<option value="">-- Chọn chi tiết vấn đề --</option>';
    issueSelect.disabled = true;
    issueSelect.value = "";
  }
  if (issueField) {
    issueField.classList.remove(
      "show"
    );
  }
  // --------------------------------------------------
  // DATE
  // --------------------------------------------------
  if (fDateEl) {
    fDateEl.value =
      isoToday();
  }
  // --------------------------------------------------
  // TICKET NUMBER
  // --------------------------------------------------
  ticketNum =
    "HV-000000";
  // --------------------------------------------------
  // ERROR
  // --------------------------------------------------
  const errorEl =
    $("errorText");
  if (errorEl) {
    errorEl.classList.remove(
      "show"
    );
  }
  // --------------------------------------------------
  // LAYOUT
  // --------------------------------------------------
  if (layoutContainer) {
    layoutContainer.classList.remove(
      "has-submitted"
    );
  }
  // --------------------------------------------------
  // VIEW
  // --------------------------------------------------
  if (successView) {
    successView.classList.remove(
      "show"
    );
  }
  if (formView) {
    formView.classList.remove(
      "hide"
    );
  }
  updateStub();
}
// ======================================================
// AGAIN BUTTON
// ======================================================
if (againBtn) {
  againBtn.addEventListener(
    "click",
    resetForm
  );
}
// ======================================================
// INIT
// ======================================================
renderCategories();
updateStub();
console.log(
  "phieuhotro-cs.js đã khởi tạo thành công."
);