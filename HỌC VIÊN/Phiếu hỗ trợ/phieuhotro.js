const EMAILJS_PUBLIC_KEY = "dmcYr1M1K9V45Q18B";
const EMAILJS_SERVICE_ID = "service_ts3osyy";
const EMAILJS_TEMPLATE_ID = "template_2bntc3p";

if (window.emailjs) window.emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });

const ICONS = {
  bug: '<path d="M12 8v8M8 12h8"/><path d="M9 4h6l1 3H8l1-3z"/><rect x="6" y="7" width="12" height="12" rx="4"/><path d="M4 10l2 1M20 10l-2 1M4 17l2-1M20 17l-2-1"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
  wallet: '<path d="M3 7a2 2 0 0 1 2-2h13a1 1 0 0 1 1 1v3"/><path d="M3 7v11a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-6a1 1 0 0 0-1-1h-5a2 2 0 0 0 0 4h6"/>',
  cert: '<circle cx="12" cy="8" r="5"/><path d="M9 12.5L7 21l5-3 5 3-2-8.5"/>',
  book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15z"/><path d="M20 18H6.5A2.5 2.5 0 0 0 4 20.5"/>',
  other: '<circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/>'
};

const TICKET_CATEGORIES = [
  { id: "system", label: "Hệ thống", icon: "bug", issues: [{ value: "system-login", label: "Đăng nhập / xác thực" }, { value: "system-course", label: "Khóa học / lịch học" }, { value: "system-payment", label: "Thanh toán / học phí" }, { value: "system-technical", label: "Lỗi kỹ thuật / trang web" }, { value: "system-other", label: "Khác" }] },
  { id: "learning", label: "Khóa học", icon: "book", issues: [{ value: "learning-schedule", label: "Lịch học / buổi học" }, { value: "learning-material", label: "Tài liệu / bài học" }, { value: "learning-assignment", label: "Bài tập / kiểm tra" }, { value: "learning-mentor", label: "Mentor / giảng viên" }, { value: "learning-other", label: "Khác" }] },
  { id: "account", label: "Tài khoản", icon: "wallet", issues: [{ value: "account-profile", label: "Thông tin tài khoản" }, { value: "account-password", label: "Mật khẩu / truy cập" }, { value: "account-payment", label: "Học phí / thanh toán" }, { value: "account-certificate", label: "Chứng chỉ / hồ sơ" }, { value: "account-other", label: "Khác" }] },
  { id: "other", label: "Khác", icon: "other", issues: [{ value: "other-feedback", label: "Góp ý / phản hồi" }, { value: "other-complaint", label: "Khiếu nại" }, { value: "other-request", label: "Yêu cầu hỗ trợ khác" }] }
];

const $ = id => document.getElementById(id);
const issueField = $("issueField");
const issueSelect = $("issueSelect");
const chipGrid = $("chipGrid");
const chkCourse = $("chkCourse");
const courseBoxWrap = $("courseBoxWrap");
const fCourse = $("fCourse");
const fDateEl = $("fDate");
const fFile = $("fFile");
const fileDrop = $("fileDrop");
const fileNameEl = $("fileName");
const formView = $("formView");
const successView = $("successView");
const layoutContainer = $("layoutContainer");
let ticketNum = "HV-000000";
let selectedFile = null;

function getDatabase() { return typeof db !== "undefined" ? db : null; }
function escapeHTML(value) { const el = document.createElement("div"); el.textContent = value ?? ""; return el.innerHTML; }
function svgIcon(key) { return `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[key] || ICONS.other}</svg>`; }
function getCategory(id) { return TICKET_CATEGORIES.find(item => item.id === id); }
function getSelectedRadio() { return document.querySelector('input[name="ticketMainType"]:checked'); }
function getPrefixFromCategory(label) {
  const normalized = String(label || "HV").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/gi, "d").trim().split(/\s+/);
  return (normalized.length > 1 ? normalized[0][0] + normalized[1][0] : normalized[0].slice(0, 2)).toUpperCase();
}
function genTicketNum(label) { return `${getPrefixFromCategory(label)}-${Math.floor(100000 + Math.random() * 900000)}`; }
function isoToday() { const now = new Date(); return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10); }
function formatDateVN(value) { if (!value) return "—"; const [year, month, day] = value.split("-"); return `${day}/${month}/${year}`; }
function todayLabel() { return new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" }); }
function updateTicketNumber() {
  const radio = getSelectedRadio();
  if (!radio) return;
  const category = getCategory(radio.value);
  const issue = issueSelect.value;
  const label = category?.label || radio.value;
  ticketNum = genTicketNum(issue ? `${radio.value}-${issue}` : label);
}

function renderIssueOptions(categoryId) {
  const category = getCategory(categoryId);
  if (!category || category.id === "other") {
    issueSelect.innerHTML = '<option value="">-- Chọn chi tiết vấn đề --</option>';
    issueSelect.disabled = true;
    issueField.classList.remove("show");
    issueSelect.value = "";
    return;
  }
  issueSelect.innerHTML = `<option value="">-- Chọn chi tiết vấn đề --</option>${category.issues.map(issue => `<option value="${issue.value}">${issue.label}</option>`).join("")}`;
  issueSelect.disabled = false;
  issueField.classList.add("show");
  issueSelect.value = "";
}

function renderCategories() {
  chipGrid.innerHTML = TICKET_CATEGORIES.map(category => `<label class="chip"><input type="radio" name="ticketMainType" value="${category.id}" data-label="${category.label}" data-icon="${category.icon}">${svgIcon(category.icon)}<span>${category.label}</span><span class="mark"></span></label>`).join("");
  chipGrid.querySelectorAll(".chip").forEach(chip => chip.addEventListener("click", () => {
    chipGrid.querySelectorAll(".chip").forEach(item => item.classList.remove("active"));
    chip.classList.add("active");
    const radio = chip.querySelector("input");
    radio.checked = true;
    renderIssueOptions(radio.value);
    updateTicketNumber();
    updateStub();
  }));
}

function updateStub() {
  const radio = getSelectedRadio();
  const category = radio ? getCategory(radio.value) : null;
  const issueLabel = issueSelect.selectedOptions?.[0]?.textContent?.trim() || "";
  const displayLabel = issueLabel && radio?.value !== "other" ? `${category?.label || "Khác"} · ${issueLabel}` : (category?.label || "Chưa chọn loại");
  $("stubNum").textContent = ticketNum;
  $("stubName").textContent = $("fName").value.trim() || "—";
  $("stubTitle").textContent = $("fTitle").value.trim() || "—";
  $("stubDate").textContent = formatDateVN(fDateEl.value);
  $("stubCourseBody").textContent = chkCourse.checked ? (fCourse.value.trim() || "Chưa nhập") : "Không có";
  $("stubCourse").textContent = chkCourse.checked && fCourse.value.trim() ? `Khóa học: ${fCourse.value.trim()}` : "";
  $("stubCat").innerHTML = `${svgIcon(radio?.dataset.icon || "other")}<span>${escapeHTML(displayLabel)}</span>`;
}

function setupForm() {
  $("todayStr").textContent = todayLabel();
  fDateEl.value = isoToday();
  renderCategories();
  updateStub();

  issueSelect.addEventListener("change", () => { updateTicketNumber(); updateStub(); });
  chkCourse.addEventListener("change", () => { courseBoxWrap.classList.toggle("show", chkCourse.checked); if (!chkCourse.checked) fCourse.value = ""; updateStub(); });
  ["fName", "fTitle", "fCourse"].forEach(id => $(id).addEventListener("input", updateStub));
  fileDrop.addEventListener("click", () => fFile.click());
  fileDrop.addEventListener("keydown", event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); fFile.click(); } });
  ["dragenter", "dragover"].forEach(type => fileDrop.addEventListener(type, event => { event.preventDefault(); fileDrop.classList.add("dragover"); }));
  ["dragleave", "drop"].forEach(type => fileDrop.addEventListener(type, event => { event.preventDefault(); fileDrop.classList.remove("dragover"); }));
  fileDrop.addEventListener("drop", event => { const file = event.dataTransfer.files?.[0]; if (file) setSelectedFile(file); });
  fFile.addEventListener("change", () => { if (fFile.files?.[0]) setSelectedFile(fFile.files[0]); });
  $("submitBtn").addEventListener("click", submitTicket);
  $("againBtn").addEventListener("click", resetForm);
}

function setSelectedFile(file) {
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) { $("errorText").textContent = "Tệp đính kèm không được vượt quá 10 MB."; $("errorText").classList.add("show"); return; }
  selectedFile = file;
  fileNameEl.textContent = `Đã chọn: ${file.name} (${Math.ceil(file.size / 1024)} KB)`;
  $("errorText").classList.remove("show");
}

async function submitTicket() {
  const database = getDatabase();
  const name = $("fName").value.trim();
  const email = $("fEmail").value.trim();
  const phone = $("fPhone").value.trim();
  const isStudent = chkCourse.checked;
  const course = isStudent ? fCourse.value.trim() : "Không áp dụng";
  const title = $("fTitle").value.trim();
  const description = $("fDesc").value.trim();
  const selectedMainType = getSelectedRadio();
  const selectedIssue = issueSelect.value;
  const errorEl = $("errorText");
  const requiresIssue = selectedMainType && selectedMainType.value !== "other";
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  if (!database) { errorEl.textContent = "Chưa kết nối được với hệ thống. Vui lòng thử lại sau."; errorEl.classList.add("show"); return; }
  if (!name || !email || (isStudent && !course) || !title || !description || !selectedMainType || (requiresIssue && !selectedIssue)) { errorEl.textContent = "Vui lòng điền đầy đủ thông tin bắt buộc và chọn loại yêu cầu."; errorEl.classList.add("show"); return; }
  if (!emailValid) { errorEl.textContent = "Email không hợp lệ."; errorEl.classList.add("show"); return; }
  errorEl.classList.remove("show");

  const category = getCategory(selectedMainType.value);
  const issueLabel = selectedMainType.value === "other" ? "Khác" : issueSelect.selectedOptions[0]?.textContent?.trim() || "Khác";
  if (ticketNum === "HV-000000") updateTicketNumber();
  const submitButton = $("submitBtn");
  submitButton.disabled = true;
  submitButton.innerHTML = "Đang gửi...";

  const ticketData = {
    ticketNum, name, email, phone, isStudent, course, date: fDateEl.value,
    ticketType: selectedIssue || selectedMainType.value,
    ticketCategory: category?.label || "Khác",
    ticketIssue: issueLabel,
    title, description,
    attachmentName: selectedFile?.name || "",
    attachmentType: selectedFile?.type || "",
    attachmentSize: selectedFile?.size || 0,
    status: "open",
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  try {
    await database.collection("tickets").doc(ticketNum).set(ticketData);
    await database.collection("tickets").doc(ticketNum).collection("messages").add({ sender: "student", senderType: "student", senderName: name, message: description, text: description, createdAt: firebase.firestore.FieldValue.serverTimestamp() });

    if (window.emailjs) {
      try {
        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, { ticket_num: ticketNum, name, email, phone: phone || "Không cung cấp", course, date: formatDateVN(fDateEl.value), ticket_type: `${ticketData.ticketCategory} · ${ticketData.ticketIssue}`, title, message: description });
      } catch (emailError) { console.warn("Không gửi được email thông báo, ticket vẫn đã được lưu:", emailError); }
    }

    $("successText").innerHTML = `Phiếu <strong>${escapeHTML(ticketNum)}</strong> — “<em>${escapeHTML(title)}</em>” đã được ghi nhận. Bạn có thể theo dõi phản hồi trong mục Trao đổi Ticket.`;
    formView.classList.add("hide");
    successView.classList.add("show");
  } catch (error) {
    console.error("Ticket error:", error);
    errorEl.textContent = "Không thể gửi phiếu. Vui lòng kiểm tra kết nối và thử lại.";
    errorEl.classList.add("show");
  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = "Gửi yêu cầu <span>→</span>";
  }
}

function resetForm() {
  document.querySelectorAll("#formView input:not([type=checkbox]), #formView textarea").forEach(input => { input.value = ""; });
  fFile.value = ""; selectedFile = null; fileNameEl.textContent = "";
  chkCourse.checked = false; courseBoxWrap.classList.remove("show");
  chipGrid.querySelectorAll(".chip").forEach(chip => chip.classList.remove("active"));
  chipGrid.querySelectorAll("input").forEach(input => { input.checked = false; });
  issueSelect.innerHTML = '<option value="">-- Chọn chi tiết vấn đề --</option>'; issueSelect.disabled = true; issueField.classList.remove("show");
  fDateEl.value = isoToday(); ticketNum = "HV-000000"; $("errorText").classList.remove("show"); updateStub();
  successView.classList.remove("show"); formView.classList.remove("hide");
}

setupForm();
