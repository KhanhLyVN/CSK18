// ======================================================
// PHIEU HO TRO CS
// TẠO TICKET + PHÂN PHÒNG BAN
// ======================================================


// ======================================================
// EMAILJS
// ======================================================

const EMAILJS_PUBLIC_KEY = "dmcYr1M1K9V45Q18B";
const EMAILJS_SERVICE_ID = "service_ts3osyy";
const EMAILJS_TEMPLATE_ID = "template_2bntc3p";

if (window.emailjs) {
  window.emailjs.init({
    publicKey: EMAILJS_PUBLIC_KEY
  });
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
// CẤU TRÚC TICKET
// PHẢI ĐỒNG BỘ VỚI TRANG HỌC VIÊN
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
    // Giữ ID account để đọc ticket cũ
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
// PHÒNG BAN MẶC ĐỊNH
// ======================================================

const CATEGORY_DEFAULT_DEPARTMENT = {
  system: "IT",
  learning: "CS",
  account: "CS",
  other: "CS"
};


// ======================================================
// TÌM CATEGORY
// ======================================================

function getCategory(categoryId) {

  return TICKET_CATEGORIES.find(
    item => item.id === categoryId
  ) || null;

}


// ======================================================
// TÌM ISSUE
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
// XÁC ĐỊNH PHÒNG BAN
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
// HELPER DOM
// ======================================================

function $(id) {

  return document.getElementById(id);

}


// ======================================================
// SAFE VALUE
// QUAN TRỌNG: KHÔNG CÒN LỖI NULL.VALUE
// ======================================================

function getValue(id) {

  const element = $(id);

  if (!element) {
    return "";
  }

  return String(element.value || "").trim();

}


// ======================================================
// SAFE TEXT
// ======================================================

function setText(id, value) {

  const element = $(id);

  if (element) {
    element.textContent = value ?? "";
  }

}


// ======================================================
// ESCAPE HTML
// ======================================================

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
// ELEMENTS
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
// STATE
// ======================================================

let ticketNum = "HV-000000";

let selectedFile = null;

let loggedInUser = null;


// ======================================================
// FIREBASE
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
// TẠO PREFIX
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
// TẠO MÃ TICKET
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
// NGÀY
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


// ======================================================
// ISO TODAY
// ======================================================

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


// ======================================================
// FORMAT DATE
// ======================================================

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
// RENDER ISSUE
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
        <option value="${issue.value}">
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
// RENDER CATEGORY
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
        value="${category.id}"
        data-label="${escapeHTML(category.label)}"
        data-icon="${category.icon}"
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
          item.classList.remove("active");
        });

        chip.classList.add("active");

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
          getCategory(radio.value);

        const categoryLabel =
          category?.label ||
          radio.value ||
          "Khác";

        ticketNum =
          genTicketNum(categoryLabel);

        updateStub();

      }
    );

  });

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
// CHECKBOX KHÓA HỌC
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
// FILE
// ======================================================

function setSelectedFile(file) {

  if (!file) {
    return;
  }

  const maxSize =
    10 * 1024 * 1024;

  if (file.size > maxSize) {

    const errorEl =
      $("errorText");

    if (errorEl) {

      errorEl.textContent =
        "Tệp đính kèm không được vượt quá 10 MB.";

      errorEl.classList.add("show");

    }

    return;

  }

  selectedFile = file;

  if (fileNameEl) {

    fileNameEl.textContent =
      `Đã chọn: ${file.name}`;

  }

  const errorEl =
    $("errorText");

  if (errorEl) {
    errorEl.classList.remove("show");
  }

}


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
    issue && selectedRadio?.value !== "other"
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
// SUBMIT TICKET
// ======================================================

async function submitTicket() {

  const database =
    getDatabase();


  // --------------------------------------------------
  // LẤY DỮ LIỆU FORM AN TOÀN
  // --------------------------------------------------

  const name =
    getValue("fName");

  const email =
    getValue("fEmail");

  /*
   * KHÔNG DÙNG:
   *
   * document.getElementById("fPhone").value
   *
   * vì trang CS hiện tại không có fPhone.
   *
   * Nếu sau này có fPhone thì getValue()
   * vẫn tự động đọc được.
   */

  const phone =
    loggedInUser?.phone ||
    getValue("fPhone") ||
    "";


  const campus =
    loggedInUser?.campus ||
    getValue("fCampus") ||
    "";


  const isStudent =
    chkCourse?.checked || false;


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
    issueSelect?.value || "";


  const errorEl =
    $("errorText");


  const requiresIssue =
    selectedMainType &&
    selectedMainType.value !== "other";


  // --------------------------------------------------
  // CHECK DATABASE
  // --------------------------------------------------

  if (!database) {

    if (errorEl) {

      errorEl.textContent =
        "Chưa kết nối được với hệ thống. Vui lòng tải lại trang và thử lại.";

      errorEl.classList.add("show");

    }

    return;

  }


  // --------------------------------------------------
  // VALIDATE
  // --------------------------------------------------

  if (
    !name ||
    !email ||
    (isStudent && !course) ||
    !selectedMainType ||
    (requiresIssue && !selectedIssue)
  ) {

    if (errorEl) {

      errorEl.textContent =
        "Vui lòng điền đầy đủ các trường bắt buộc (*) và chọn loại yêu cầu.";

      errorEl.classList.add("show");

    }

    return;

  }


  // --------------------------------------------------
  // VALIDATE EMAIL
  // --------------------------------------------------

  const emailRegex =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


  if (!emailRegex.test(email)) {

    if (errorEl) {

      errorEl.textContent =
        "Email không hợp lệ.";

      errorEl.classList.add("show");

    }

    return;

  }


  if (errorEl) {
    errorEl.classList.remove("show");
  }


  // --------------------------------------------------
  // CATEGORY
  // --------------------------------------------------

  const category =
    getCategory(
      selectedMainType.value
    );


  // --------------------------------------------------
  // ISSUE
  // --------------------------------------------------

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


  // --------------------------------------------------
  // PHÒNG BAN
  // --------------------------------------------------

  const departmentCode =
    resolveTicketDepartment(
      selectedMainType.value,
      selectedIssue
    );


  // --------------------------------------------------
  // TICKET NUMBER
  // --------------------------------------------------

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


  // --------------------------------------------------
  // DISABLE BUTTON
  // --------------------------------------------------

  if (submitBtn) {

    submitBtn.disabled =
      true;

    submitBtn.textContent =
      "Đang gửi...";

  }


  try {

    // ==================================================
    // USER AUTH
    // ==================================================

    const auth =
      getAuth();

    const currentUser =
      auth?.currentUser ||
      null;


    // ==================================================
    // LẤY PROFILE FIREBASE
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
          "Không đọc được hồ sơ học viên, tiếp tục dùng thông tin form:",
          profileError
        );

      }

    }


    // ==================================================
    // TICKET DATA
    // ==================================================

    const ticketData = {

      // ----------------------------------------------
      // ID
      // ----------------------------------------------

      ticketNum:


        ticketNum,


      studentId:


        currentUser?.uid ||
        loggedInUser?.uid ||
        "",


      // ----------------------------------------------
      // NGƯỜI GỬI
      // ----------------------------------------------

      name:


        userProfile.name ||
        loggedInUser?.name ||
        name,


      email:


        userProfile.email ||
        loggedInUser?.email ||
        email,


      phone:


        userProfile.phone ||
        loggedInUser?.phone ||
        phone ||
        "",


      // ----------------------------------------------
      // CAMPUS
      // ----------------------------------------------

      campus:


        userProfile.campus ||
        loggedInUser?.campus ||
        campus ||
        "",


      // ----------------------------------------------
      // ROLE
      // ----------------------------------------------

      createdByRole:


        userProfile.role ||
        loggedInUser?.role ||
        "student",


      // ----------------------------------------------
      // KHÓA HỌC
      // ----------------------------------------------

      isStudent:


        isStudent,


      course:


        course,


      // ----------------------------------------------
      // DATE
      // ----------------------------------------------

      date:


        fDateEl?.value ||
        isoToday(),


      // ----------------------------------------------
      // TICKET TYPE
      // ----------------------------------------------

      ticketType:


        selectedIssue ||
        selectedMainType.value,


      // ----------------------------------------------
      // CATEGORY ID
      // ----------------------------------------------

      ticketCategoryId:


        selectedMainType.value,


      // ----------------------------------------------
      // ISSUE ID
      // ----------------------------------------------

      ticketIssueId:


        selectedIssue ||
        "",


      // ----------------------------------------------
      // CATEGORY NAME
      // ----------------------------------------------

      ticketCategory:


        category?.label ||
        selectedMainType.dataset.label ||
        "Khác",


      // ----------------------------------------------
      // ISSUE NAME
      // ----------------------------------------------

      ticketIssue:


        ticketIssueLabel,


      // ----------------------------------------------
      // PHÒNG BAN
      // ----------------------------------------------

      departmentCode:


        departmentCode,


      // ----------------------------------------------
      // SCHEMA VERSION
      // ----------------------------------------------

      ticketSchemaVersion:


        2,


      // ----------------------------------------------
      // CONTENT
      // ----------------------------------------------

      title:


        title,


      description:


        description,


      // ----------------------------------------------
      // FILE
      // ----------------------------------------------

      attachmentName:


        selectedFile?.name ||
        fFile?.files?.[0]?.name ||
        "",


      attachmentType:


        selectedFile?.type ||
        fFile?.files?.[0]?.type ||
        "",


      attachmentSize:


        selectedFile?.size ||
        fFile?.files?.[0]?.size ||
        0,


      // ----------------------------------------------
      // STATUS
      // ----------------------------------------------

      status:


        "open",


      // ----------------------------------------------
      // TIMESTAMP
      // ----------------------------------------------

      createdAt:


        firebase.firestore.FieldValue.serverTimestamp(),


      updatedAt:


        firebase.firestore.FieldValue.serverTimestamp()

    };


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


    // ==================================================
    // LƯU TICKET
    // ==================================================

    await database
      .collection("tickets")
      .doc(ticketNum)
      .set(ticketData);


    // ==================================================
    // MESSAGE ĐẦU TIÊN
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

        createdAt:
          firebase.firestore.FieldValue.serverTimestamp()

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

      errorEl.textContent =
        "Không thể gửi phiếu. Vui lòng kiểm tra kết nối và thử lại.";

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

      /*
       * Nếu đang đăng nhập thì
       * không xóa name/email/campus.
       */

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

  chips().forEach(
    chip => {
      chip.classList.remove(
        "active"
      );
    }
  );


  document
    .querySelectorAll(
      'input[name="ticketMainType"]'
    )
    .forEach(input => {

      input.checked =
        false;

    });


  // --------------------------------------------------
  // ISSUE
  // --------------------------------------------------

  if (issueSelect) {

    issueSelect.innerHTML =
      '<option value="">-- Chọn chi tiết vấn đề --</option>';

    issueSelect.disabled =
      true;

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