const EMAILJS_PUBLIC_KEY  = "dmcYr1M1K9V45Q18B";
const EMAILJS_SERVICE_ID  = "service_ts3osyy";
const EMAILJS_TEMPLATE_ID = "template_2bntc3p";
emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });

const ICONS = {
  bug: '<path d="M12 8v8M8 12h8"/><path d="M9 4h6l1 3H8l1-3z"/><rect x="6" y="7" width="12" height="12" rx="4"/><path d="M4 10l2 1M20 10l-2 1M4 17l2-1M20 17l-2-1"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
  wallet: '<path d="M3 7a2 2 0 0 1 2-2h13a1 1 0 0 1 1 1v3"/><path d="M3 7v11a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-6a1 1 0 0 0-1-1h-5a2 2 0 0 0 0 4h6"/>',
  cert: '<circle cx="12" cy="8" r="5"/><path d="M9 12.5L7 21l5-3 5 3-2-8.5"/>',
  swap: '<path d="M7 4v10M7 4L4 7M7 4l3 3"/><path d="M17 20V10M17 20l3-3M17 20l-3-3"/>',
  chat: '<path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5H4l1.6-3.8A8.5 8.5 0 1 1 21 11.5z"/><path d="M12 9v4M12 15.5h.01"/>',
  scale: '<path d="M12 3v18M5 8l-3 6a4 4 0 0 0 6 0zM19 8l-3 6a4 4 0 0 0 6 0zM5 8h14M9 3h6"/>',
  mentor: '<circle cx="9" cy="8" r="3"/><path d="M4 20c0-3.3 2.7-5.5 5-5.5s5 2.2 5 5.5"/><path d="M15 8h6M18 5v6"/>',
  book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15z"/><path d="M20 18H6.5A2.5 2.5 0 0 0 4 20.5"/>',
  other: '<circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/>'
};

const TYPES = [
  {label:"Báo lỗi hệ thống", icon:"bug"},
  {label:"Hỏi về lịch học", icon:"calendar"},
  {label:"Hỏi về học phí", icon:"wallet"},
  {label:"Chứng chỉ", icon:"cert"},
  {label:"Bảo lưu / Chuyển lớp", icon:"swap"},
  {label:"Góp ý", icon:"chat"},
  {label:"Khiếu nại", icon:"scale"},
  {label:"Phản hồi về Mentor", icon:"mentor"},
  {label:"Phản hồi về khóa học", icon:"book"},
  {label:"Khác", icon:"other"}
];

const svgIcon = (key) => `<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[key]}</svg>`;

// Render loại yêu cầu
const chipGrid = document.getElementById('chipGrid');
TYPES.forEach((t) => {
  const el = document.createElement('label');
  el.className = 'chip';
  el.innerHTML = `
    <input type="radio" name="ticketType" value="${t.label}" data-icon="${t.icon}">
    ${svgIcon(t.icon)}
    <span>${t.label}</span>
    <span class="mark"></span>
  `;
  chipGrid.appendChild(el);
});

const chips = () => Array.from(document.querySelectorAll('.chip'));
chips().forEach(c => {
  c.addEventListener('click', () => {
    chips().forEach(x => x.classList.remove('active'));
    c.classList.add('active');
    c.querySelector('input').checked = true;
    updateStub();
  });
});

// Checkbox khóa học
const chkCourse = document.getElementById('chkCourse');
const courseBoxWrap = document.getElementById('courseBoxWrap');
const fCourse = document.getElementById('fCourse');

chkCourse.addEventListener('change', () => {
  if (chkCourse.checked) {
    courseBoxWrap.classList.add('show');
  } else {
    courseBoxWrap.classList.remove('show');
    fCourse.value = '';
  }
  updateStub();
});

// Upload tệp
const fileDrop = document.getElementById('fileDrop');
const fFile = document.getElementById('fFile');
fileDrop.addEventListener('click', () => fFile.click());
fFile.addEventListener('change', () => {
  document.getElementById('fileName').textContent = fFile.files[0] ? "Đã chọn: " + fFile.files[0].name : "";
});

function getPrefixFromCategory(label) {
  if (!label) return 'HV';
  const cleanStr = label.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");
  const words = cleanStr.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return cleanStr.substring(0, 2).toUpperCase();
}

let ticketNum = 'HV-000000';
function genTicketNum(typeLabel){
  const prefix = getPrefixFromCategory(typeLabel);
  const n = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}-${n}`;
}

function todayLabel(){
  const d = new Date();
  return d.toLocaleDateString('vi-VN', { weekday:'long', day:'2-digit', month:'2-digit', year:'numeric' });
}
document.getElementById('todayStr').textContent = todayLabel();

const fDateEl = document.getElementById('fDate');
function isoToday(){
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off*60000).toISOString().slice(0,10);
}
fDateEl.value = isoToday();

function formatDateVN(isoStr){
  if(!isoStr) return '—';
  const [y,m,d] = isoStr.split('-');
  return `${d}/${m}/${y}`;
}

function updateStub(){
  const selectedChip = document.querySelector('.chip.active');
  const catLabel = selectedChip ? selectedChip.querySelector('span').textContent : "";
  
  if (selectedChip) {
    ticketNum = genTicketNum(catLabel);
  }

  document.getElementById('stubNum').textContent = ticketNum;

  const name = document.getElementById('fName').value.trim();
  document.getElementById('stubName').textContent = name || '—';

  const course = (chkCourse.checked) ? fCourse.value.trim() : '';
  document.getElementById('stubCourse').textContent = course ? `Khóa học: ${course}` : '';
  document.getElementById('stubCourseBody').textContent = course || 'Không có';

  const title = document.getElementById('fTitle').value.trim();
  document.getElementById('stubTitle').textContent = title || '—';

  const catIconKey = selectedChip ? selectedChip.querySelector('input').dataset.icon : "other";
  document.getElementById('stubCat').innerHTML = svgIcon(catIconKey) + `<span>${catLabel || 'Chưa chọn loại'}</span>`;

  document.getElementById('stubDate').textContent = formatDateVN(fDateEl.value);
}

['fName','fTitle','fCourse'].forEach(id => {
  document.getElementById(id).addEventListener('input', updateStub);
});

updateStub();

// Submit ticket
const submitBtn = document.getElementById('submitBtn');
const layoutContainer = document.getElementById('layoutContainer');

submitBtn.addEventListener('click', () => {
  const name = document.getElementById('fName').value.trim();
  const email = document.getElementById('fEmail').value.trim();
  const phone = document.getElementById('fPhone').value.trim();
  const isStudent = chkCourse.checked;
  const course = isStudent ? fCourse.value.trim() : 'Không áp dụng (Giáo viên / Khác)';
  const title = document.getElementById('fTitle').value.trim();
  const desc = document.getElementById('fDesc').value.trim();
  const type = document.querySelector('input[name="ticketType"]:checked');
  const errEl = document.getElementById('errorText');

  if(!name || !email || (isStudent && !fCourse.value.trim()) || !title || !desc || !type ){
    errEl.textContent = 'Vui lòng điền đầy đủ các trường bắt buộc (*) và chọn loại yêu cầu.';
    errEl.classList.add('show');
    return;
  }
  errEl.classList.remove('show');

  const templateParams = {
    ticket_num: ticketNum,
    name: name,
    email: email,
    phone: phone || 'Không cung cấp',
    course: course,
    date: formatDateVN(fDateEl.value),
    ticket_type: type.value,
    title: title,
    message: desc
  };

  submitBtn.disabled = true;
  submitBtn.textContent = 'Đang gửi...';

  emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams)
    .then(() => {
      document.getElementById('successText').innerHTML =
        `Phiếu <strong>${ticketNum}</strong> — "<em>${title}</em>" đã được gửi qua email cho bộ phận hỗ trợ. Chúng tôi sẽ phản hồi lại <strong>${email}</strong> trong thời gian sớm nhất.`;
      
      document.getElementById('formView').classList.add('hide');
      document.getElementById('successView').classList.add('show');
      if (layoutContainer) layoutContainer.classList.add('has-submitted');
    })
    .catch((err) => {
      console.error('EmailJS error:', err);
      errEl.textContent = 'Gửi yêu cầu thất bại. Vui lòng kiểm tra kết nối và thử lại.';
      errEl.classList.add('show');
    })
    .finally(() => {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Gửi yêu cầu';
    });
});

document.getElementById('againBtn').addEventListener('click', () => {
  document.querySelectorAll('input[type=text], input[type=email], input[type=tel], textarea').forEach(i => i.value = '');
  document.getElementById('fileName').textContent = '';
  chkCourse.checked = false;
  courseBoxWrap.classList.remove('show');
  chips().forEach(c => c.classList.remove('active'));
  document.querySelectorAll('input[name=ticketType]').forEach(i => i.checked = false);
  fDateEl.value = isoToday();

  ticketNum = 'HV-000000';
  updateStub();

  if (layoutContainer) layoutContainer.classList.remove('has-submitted');
  document.getElementById('successView').classList.remove('show');
  document.getElementById('formView').classList.remove('hide');
});