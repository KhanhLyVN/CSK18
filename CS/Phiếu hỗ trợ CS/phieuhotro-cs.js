// ======================================================
// EMAILJS
// ======================================================
const EMAILJS_PUBLIC_KEY = "dmcYr1M1K9V45Q18B";
const EMAILJS_SERVICE_ID = "service_ts3osyy";
const EMAILJS_TEMPLATE_ID = "template_2bntc3p";
emailjs.init({
  publicKey: EMAILJS_PUBLIC_KEY
});
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
const TICKET_CATEGORIES = [
  {
    id: "system",
    label: "Hệ thống",
    icon: "bug",
    issues: [
      { value: "system-login", label: "Đăng nhập / xác thực" },
      { value: "system-course", label: "Khóa học / lịch học" },
      { value: "system-payment", label: "Thanh toán / học phí" },
      { value: "system-technical", label: "Lỗi kỹ thuật / trang web" },
      { value: "system-other", label: "Khác" }
    ]
  },
  {
    id: "learning",
    label: "Khóa học",
    icon: "book",
    issues: [
      { value: "learning-schedule", label: "Lịch học / buổi học" },
      { value: "learning-material", label: "Tài liệu / bài học" },
      { value: "learning-assignment", label: "Bài tập / kiểm tra" },
      { value: "learning-mentor", label: "Mentor / giảng viên" },
      { value: "learning-other", label: "Khác" }
    ]
  },
  {
    id: "account",
    label: "Tài khoản",
    icon: "wallet",
    issues: [
      { value: "account-profile", label: "Thông tin tài khoản" },
      { value: "account-password", label: "Mật khẩu / truy cập" },
      { value: "account-payment", label: "Học phí / thanh toán" },
      { value: "account-certificate", label: "Chứng chỉ / hồ sơ" },
      { value: "account-other", label: "Khác" }
    ]
  },
  {
    id: "other",
    label: "Khác",
    icon: "other",
    issues: [
      { value: "other-feedback", label: "Góp ý / phản hồi" },
      { value: "other-complaint", label: "Khiếu nại" },
      { value: "other-request", label: "Yêu cầu hỗ trợ khác" }
    ]
  }
];
const svgIcon = (key) => {
  return `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round">
      ${ICONS[key]}
    </svg>
  `;
};
const issueField = document.getElementById("issueField");
const issueSelect = document.getElementById("issueSelect");

function renderIssueOptions(categoryId) {
  const category = TICKET_CATEGORIES.find((item) => item.id === categoryId);

  if (!category || category.id === "other") {
    issueSelect.innerHTML = '<option value="">-- Chọn chi tiết vấn đề --</option>';
    issueField.classList.remove("show");
    issueSelect.disabled = true;
    issueSelect.value = "";
    return;
  }

  issueSelect.innerHTML = `
    <option value="">-- Chọn chi tiết vấn đề --</option>
    ${category.issues
      .map(
        (issue) => `<option value="${issue.value}">${issue.label}</option>`
      )
      .join("")}
  `;
  issueField.classList.add("show");
  issueSelect.disabled = false;
  issueSelect.value = "";
}

// ======================================================
// RENDER LOẠI YÊU CẦU
// ======================================================
const chipGrid = document.getElementById("chipGrid");
TICKET_CATEGORIES.forEach((t) => {
  const el = document.createElement("label");
  el.className = "chip";
  el.innerHTML = `
    <input
      type="radio"
      name="ticketMainType"
      value="${t.id}"
      data-label="${t.label}"
      data-icon="${t.icon}">
    ${svgIcon(t.icon)}
    <span>${t.label}</span>
    <span class="mark"></span>
  `;
  chipGrid.appendChild(el);
});

// ======================================================
// CHỌN LOẠI TICKET
// ======================================================
const chips = () => Array.from(document.querySelectorAll(".chip"));
chips().forEach((chip) => {
  chip.addEventListener("click", () => {
    chips().forEach((x) => x.classList.remove("active"));
    chip.classList.add("active");
    const radio = chip.querySelector("input");
    radio.checked = true;
    renderIssueOptions(radio.value);

    const categoryValue = radio.value;
    const categoryLabel = radio.dataset.label;
    const selectedIssueValue = categoryValue === "other" ? "" : issueSelect.value;
    if (categoryValue === "other") {
      ticketNum = genTicketNum(categoryLabel || categoryValue || "other");
    } else if (categoryValue && selectedIssueValue) {
      ticketNum = genTicketNum(`${categoryValue}-${selectedIssueValue}`);
    } else {
      ticketNum = genTicketNum(categoryLabel || categoryValue || "other");
    }
    updateStub();
  });
});

issueSelect.addEventListener("change", () => {
  const selectedRadio = document.querySelector('input[name="ticketMainType"]:checked');
  if (!selectedRadio) return;

  const categoryValue = selectedRadio.value;
  const categoryLabel = selectedRadio.dataset.label;
  const issueValue = issueSelect.value;

  if (categoryValue === "other") {
    ticketNum = genTicketNum(categoryLabel || categoryValue || "other");
  } else {
    ticketNum = issueValue
      ? genTicketNum(`${categoryValue}-${issueValue}`)
      : genTicketNum(categoryLabel || categoryValue || "other");
  }
  updateStub();
});
// ======================================================
// CHECKBOX HỌC VIÊN
// ======================================================
const chkCourse =
  document.getElementById("chkCourse");
const courseBoxWrap =
  document.getElementById("courseBoxWrap");
const fCourse =
  document.getElementById("fCourse");
chkCourse.addEventListener("change", () => {
  if (chkCourse.checked) {
    courseBoxWrap.classList.add("show");
  } else {
    courseBoxWrap.classList.remove("show");
    fCourse.value = "";
  }
  updateStub();
});
// ======================================================
// FILE
// ======================================================
const fileDrop =
  document.getElementById("fileDrop");
const fFile =
  document.getElementById("fFile");
fileDrop.addEventListener("click", () => {
  fFile.click();
});
fFile.addEventListener("change", () => {
  const fileName =
    document.getElementById("fileName");
  fileName.textContent =
    fFile.files[0]
      ? "Đã chọn: " + fFile.files[0].name
      : "";
});
// ======================================================
// TẠO PREFIX
// ======================================================
function getPrefixFromCategory(label) {
  if (!label) {
    return "HV";
  }
  const cleanStr =
    label
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D");
  const words =
    cleanStr
      .trim()
      .split(/\s+/);
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
let ticketNum = "HV-000000";
function genTicketNum(typeLabel) {
  const prefix =
    getPrefixFromCategory(typeLabel);
  const n =
    Math.floor(
      100000 +
      Math.random() * 900000
    );
  return `${prefix}-${n}`;
}
// ======================================================
// NGÀY
// ======================================================
function todayLabel() {
  const d = new Date();
  return d.toLocaleDateString(
    "vi-VN",
    {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }
  );
}
const todayStr =
  document.getElementById("todayStr");
if (todayStr) {
  todayStr.textContent =
    todayLabel();
}
// ======================================================
// DATE INPUT
// ======================================================
const fDateEl =
  document.getElementById("fDate");
function isoToday() {
  const d = new Date();
  const off =
    d.getTimezoneOffset();
  return new Date(
    d.getTime() -
    off * 60000
  )
    .toISOString()
    .slice(0, 10);
}
fDateEl.value =
  isoToday();
// ======================================================
// FORMAT DATE
// ======================================================
function formatDateVN(isoStr) {
  if (!isoStr) {
    return "—";
  }
  const [y, m, d] =
    isoStr.split("-");
  return `${d}/${m}/${y}`;
}
// ======================================================
// UPDATE TICKET STUB
// ======================================================
function updateStub() {
  const selectedChip = document.querySelector(".chip.active");
  const selectedRadio = document.querySelector('input[name="ticketMainType"]:checked');
  const selectedIssue = issueSelect.value;
  const selectedIssueLabel = issueSelect.selectedOptions[0]
    ? issueSelect.selectedOptions[0].textContent.trim()
    : "";
  const catLabel = selectedRadio ? selectedRadio.dataset.label : "";
  const displayLabel = selectedIssueLabel
    ? `${catLabel || "Khác"} · ${selectedIssueLabel}`
    : catLabel || "Chưa chọn loại";

  document.getElementById("stubNum").textContent = ticketNum;

  const name = document.getElementById("fName").value.trim();
  document.getElementById("stubName").textContent = name || "—";

  const course = chkCourse.checked ? fCourse.value.trim() : "";
  document.getElementById("stubCourse").textContent = course ? `Khóa học: ${course}` : "";
  document.getElementById("stubCourseBody").textContent = course || "Không có";

  const title = document.getElementById("fTitle").value.trim();
  document.getElementById("stubTitle").textContent = title || "—";

  const catIconKey = selectedRadio ? selectedRadio.dataset.icon : "other";
  document.getElementById("stubCat").innerHTML =
    svgIcon(catIconKey) + `<span>${displayLabel}</span>`;
  document.getElementById("stubDate").textContent = formatDateVN(fDateEl.value);
}
// ======================================================
// INPUT → UPDATE STUB
// ======================================================
[
  "fName",
  "fTitle",
  "fCourse"
].forEach((id) => {
  const el =
    document.getElementById(id);
  if (el) {
    el.addEventListener(
      "input",
      updateStub
    );
  }
});

if (typeof auth !== "undefined" && auth && typeof auth.onAuthStateChanged === "function") {
  auth.onAuthStateChanged(async (user) => {
    const nameInput = document.getElementById("fName");
    const emailInput = document.getElementById("fEmail");

    if (!user) {
      if (nameInput) nameInput.value = "";
      if (emailInput) emailInput.value = "";
      return;
    }

    try {
      const doc = await db.collection("users").doc(user.uid).get();
      const data = doc.exists ? doc.data() : {};
      const name = data.name || user.displayName || "Học viên";
      const email = data.email || user.email || "";

      if (nameInput) {
        if (!nameInput.value.trim()) nameInput.value = name;
        nameInput.readOnly = true;
      }
      if (emailInput) {
        if (!emailInput.value.trim()) emailInput.value = email;
        emailInput.readOnly = true;
      }
      updateStub();
    } catch (error) {
      console.error("Không thể lấy thông tin tài khoản hiện tại:", error);
    }
  });
}

updateStub();
// ======================================================
// SUBMIT TICKET
// ======================================================
const submitBtn =
  document.getElementById("submitBtn");
const layoutContainer =
  document.getElementById(
    "layoutContainer"
  );
submitBtn.addEventListener(
  "click",
  async () => {
    const name =
      document
        .getElementById("fName")
        .value
        .trim();
    const email =
      document
        .getElementById("fEmail")
        .value
        .trim();
    const phone =
      document
        .getElementById("fPhone")
        .value
        .trim();
    const isStudent =
      chkCourse.checked;
    const course =
      isStudent
        ? fCourse.value.trim()
        : "Không áp dụng";
    const title =
      document
        .getElementById("fTitle")
        .value
        .trim();
    const desc =
      document
        .getElementById("fDesc")
        .value
        .trim();
    const selectedMainType = document.querySelector('input[name="ticketMainType"]:checked');
    const selectedIssue = issueSelect.value;
    const errEl = document.getElementById("errorText");
    const requiresIssue = selectedMainType && selectedMainType.value !== "other";
    // ================================
    // VALIDATE
    // ================================
    if (
      !name ||
      !email ||
      (isStudent && !course) ||
      !title ||
      !desc ||
      !selectedMainType ||
      (requiresIssue && !selectedIssue)
    ) {
      errEl.textContent =
        "Vui lòng điền đầy đủ các trường bắt buộc (*) và chọn loại yêu cầu.";
      errEl.classList.add("show");
      return;
    }
    // ================================
    // EMAIL
    // ================================
    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errEl.textContent =
        "Email không hợp lệ.";
      errEl.classList.add("show");
      return;
    }
    errEl.classList.remove("show");
    // ================================
    // NẾU CHƯA CÓ MÃ TICKET
    // ================================
    const ticketValue =
      selectedMainType.value === "other"
        ? "other"
        : `${selectedMainType.value}-${selectedIssue}`;
    const ticketIssueLabel =
      selectedMainType.value === "other"
        ? "Khác"
        : issueSelect.selectedOptions[0].textContent.trim();
    if (ticketNum === "HV-000000") {
      ticketNum = genTicketNum(ticketValue);
      updateStub();
    }
    submitBtn.disabled = true;
    submitBtn.textContent = "Đang gửi...";
    try {
      // ==================================
      // DATA TICKET
      // ==================================
      const ticketData = {
        ticketNum: ticketNum,
        name: name,
        email: email,
        phone: phone || "",
        isStudent: isStudent,
        course: course,
        date: fDateEl.value,
        ticketType: ticketValue,
        ticketCategory: selectedMainType.dataset.label,
        ticketIssue: ticketIssueLabel,
        title: title,
        description: desc,
        status: "open",
        createdAt:
          firebase.firestore
            .FieldValue
            .serverTimestamp(),
        updatedAt:
          firebase.firestore
            .FieldValue
            .serverTimestamp()
      };
      // ==================================
      // LƯU TICKET
      // ==================================
      await db
        .collection("tickets")
        .doc(ticketNum)
        .set(ticketData);
      // ==================================
      // TẠO MESSAGE ĐẦU TIÊN
      // ==================================
      await db
        .collection("tickets")
        .doc(ticketNum)
        .collection("messages")
        .add({
          sender: "student",
          senderName: name,
          message: desc,
          createdAt:
            firebase.firestore
              .FieldValue
              .serverTimestamp()
        });
      // ==================================
      // EMAILJS
      // ==================================
      const templateParams = {
        ticket_num: ticketNum,
        name: name,
        email: email,
        phone:
          phone ||
          "Không cung cấp",
        course: course,
        date:
          formatDateVN(
            fDateEl.value
          ),
        ticket_type:
          selectedMainType.value === "other"
            ? selectedMainType.dataset.label
            : `${selectedMainType.dataset.label} · ${ticketIssueLabel}`,
        title: title,
        message: desc
      };
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        templateParams
      );
      // ==================================
      // THÀNH CÔNG
      // ==================================
      document.getElementById(
        "successText"
      ).innerHTML =
        `Phiếu <strong>${ticketNum}</strong> —
        "<em>${title}</em>" đã được gửi thành công.
        Chúng tôi sẽ phản hồi lại
        <strong>${email}</strong>
        trong thời gian sớm nhất.`;
      document
        .getElementById("formView")
        .classList.add("hide");
      document
        .getElementById("successView")
        .classList.add("show");
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
      errEl.textContent =
        "Không thể gửi phiếu. Vui lòng kiểm tra kết nối và thử lại.";
      errEl.classList.add("show");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent =
        "Gửi yêu cầu";
    }
  }
);
// ======================================================
// TẠO PHIẾU MỚI
// ======================================================
document
  .getElementById("againBtn")
  .addEventListener("click", () => {
    document
      .querySelectorAll(
        'input[type="text"], input[type="email"], input[type="tel"], textarea'
      )
      .forEach((input) => {
        input.value = "";
      });
    document.getElementById(
      "fileName"
    ).textContent = "";
    if (fFile) {
      fFile.value = "";
    }
    chkCourse.checked = false;
    courseBoxWrap.classList.remove(
      "show"
    );
    chips().forEach((chip) => {
      chip.classList.remove(
        "active"
      );
    });
    document
      .querySelectorAll(
        'input[name="ticketMainType"]'
      )
      .forEach((input) => {
        input.checked = false;
      });
    issueSelect.innerHTML = '<option value="">-- Chọn chi tiết vấn đề --</option>';
    issueField.classList.remove("show");
    issueSelect.disabled = true;
    issueSelect.value = "";
    fDateEl.value =
      isoToday();
    ticketNum =
      "HV-000000";
    updateStub();
    if (layoutContainer) {
      layoutContainer.classList.remove(
        "has-submitted"
      );
    }
    document
      .getElementById("successView")
      .classList.remove("show");
    document
      .getElementById("formView")
      .classList.remove("hide");
  });