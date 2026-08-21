"use strict";

/* =========================================================
   EMAILJS
========================================================= */

const EMAILJS_PUBLIC_KEY = "dmcYr1M1K9V45Q18B";
const EMAILJS_SERVICE_ID = "service_ts3osyy";
const EMAILJS_TEMPLATE_ID = "template_2bntc3p";

if (window.emailjs) {
  try {
    window.emailjs.init({
      publicKey: EMAILJS_PUBLIC_KEY,
    });
  } catch (error) {
    console.warn("EmailJS init error:", error);
  }
}

/* =========================================================
   ICONS
========================================================= */

const ICONS = {
  bug: `
    <path d="M12 8v8M8 12h8"/>
    <path d="M9 4h6l1 3H8l1-3z"/>
    <rect x="6" y="7" width="12" height="12" rx="4"/>
    <path d="M4 10l2 1M20 10l-2 1M4 17l2-1M20 17l-2-1"/>
  `,

  calendar: `
    <rect x="3" y="5" width="18" height="16" rx="2"/>
    <path d="M16 3v4M8 3v4M3 10h18"/>
  `,

  wallet: `
    <path d="M3 7a2 2 0 0 1 2-2h13a1 1 0 0 1 1 1v3"/>
    <path d="M3 7v11a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-6a1 1 0 0 0-1-1h-5a2 2 0 0 0 0 4h6"/>
  `,

  cert: `
    <circle cx="12" cy="8" r="5"/>
    <path d="M9 12.5L7 21l5-3 5 3-2-8.5"/>
  `,

  book: `
    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15z"/>
    <path d="M20 18H6.5A2.5 2.5 0 0 0 4 20.5"/>
  `,

  work: `
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
    <circle cx="12" cy="12" r="3"/>
  `,

  other: `
    <circle cx="5" cy="12" r="1.4"/>
    <circle cx="12" cy="12" r="1.4"/>
    <circle cx="19" cy="12" r="1.4"/>
  `,
};

/* =========================================================
   TICKET CATEGORIES
========================================================= */

const TICKET_CATEGORIES = [
  {
    id: "system",
    label: "Hệ thống",
    icon: "bug",
    issues: [
      {
        value: "system-login",
        label: "Đăng nhập",
      },
      {
        value: "account",
        label: "Tài khoản học viên",
      },
      {
        value: "system-web",
        label: "Trang web không truy cập được",
      },
      {
        value: "system-technical",
        label: "Lỗi kỹ thuật",
      },
      {
        value: "system-other",
        label: "Khác",
      },
    ],
  },

  {
    id: "learning",
    label: "Khóa học",
    icon: "book",
    issues: [
      {
        value: "learning-class",
        label: "Đăng ký khóa học",
      },
      {
        value: "learning-cost",
        label: "Học phí",
      },
      {
        value: "learning-paymentmentol",
        label: "Phương thức thanh toán",
      },
      {
        value: "learning-confirm",
        label: "Xác nhận thanh toán",
      },
      {
        value: "learning-other",
        label: "Khác",
      },
    ],
  },

  {
    id: "account",
    label: "Vận hành",
    icon: "work",
    issues: [
      {
        value: "account-schedule",
        label: "Lịch học",
      },
      {
        value: "account-qualities",
        label: "Chất lượng hình ảnh và video",
      },
      {
        value: "account-mentor",
        label: "Giáo viên",
      },
      {
        value: "account-certificate",
        label: "Hỗ trợ bài",
      },
      {
        value: "account-other",
        label: "Khác",
      },
    ],
  },

  {
    id: "other",
    label: "Khác",
    icon: "other",
    issues: [
      {
        value: "other-feedback",
        label: "Góp ý / phản hồi",
      },
      {
        value: "other-complaint",
        label: "Khiếu nại",
      },
      {
        value: "other-request",
        label: "Yêu cầu hỗ trợ khác",
      },
    ],
  },
];

/* =========================================================
   HELPERS
========================================================= */

const $ = (id) => document.getElementById(id);

function getValue(id) {
  const element = $(id);

  return element
    ? String(element.value || "").trim()
    : "";
}

function getDatabase() {
  return typeof db !== "undefined"
    ? db
    : null;
}

function normalizeFaqText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase();
}

async function getStudentSupportRoute(database, uid) {
  if (!database || !uid) {
    return {};
  }

  try {
    const snapshot = await database.collection("users").doc(uid).get();
    const profile = snapshot.exists ? snapshot.data() || {} : {};

    return {
      supportGroupId: profile.supportGroupId || "",
      supportGroupName: profile.supportGroupName || "",
      supportClassId: profile.supportClassId || "",
      supportClassName: profile.supportClassName || "",
      supportLeaderUid: profile.supportLeaderUid || "",
      supportLeaderName: profile.supportLeaderName || ""
    };
  } catch (error) {
    console.warn("Không thể lấy tuyến hỗ trợ của học viên:", error);
    return {};
  }
}

function escapeHTML(value) {
  const element =
    document.createElement("div");

  element.textContent =
    value ?? "";

  return element.innerHTML;
}

function svgIcon(key) {
  return `
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      ${ICONS[key] || ICONS.other}
    </svg>
  `;
}

/* =========================================================
   DOM
========================================================= */

const issueField =
  $("issueField");

const issueSelect =
  $("issueSelect");

const chipGrid =
  $("chipGrid");

const chkCourse =
  $("chkCourse");

const courseBoxWrap =
  $("courseBoxWrap");

const fCourse =
  $("fCourse");

const fDateEl =
  $("fDate");

const fFile =
  $("fFile");

const fileDrop =
  $("fileDrop");

const fileNameEl =
  $("fileName");

const formView =
  $("formView");

const successView =
  $("successView");

const layoutContainer =
  $("layoutContainer");

const fTitle =
  $("fTitle");

const relatedFaq =
  $("relatedFaq");

const relatedFaqTitle =
  $("relatedFaqTitle");

const relatedFaqIntro =
  $("relatedFaqIntro");

const relatedFaqList =
  $("relatedFaqList");

const relatedFaqLink =
  $("relatedFaqLink");

let relatedFaqData =
  [];

/* =========================================================
   AI CONFIG
========================================================= */

const TITLE_AI_WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbx7s9ofHRp2Lwrb_wzvq-tI_nvHTqT5Eqy-4ypH1p1S41VxNGR54nFhEMPjRIw_Lp3iUw/exec";

const AI_TITLE_MIN_LENGTH = 15;
const AI_TITLE_DEBOUNCE = 1800;
const AI_QUOTA_COOLDOWN = 45000;

/* =========================================================
   AI DOM
========================================================= */

const titleAiSuggestion =
  $("titleAiSuggestion");

const titleAiSuggestionBody =
  $("titleAiSuggestionBody");

const closeTitleAiSuggestion =
  $("closeTitleAiSuggestion");

const titleAiLoading =
  $("titleAiLoading");

const titleAiProgressBar =
  $("titleAiProgressBar");

const titleAiLoadingPercent =
  $("titleAiLoadingPercent");

const titleAiLoadingStatus =
  $("titleAiLoadingStatus");

/* =========================================================
   AI STATE
========================================================= */

let aiProgressTimer =
  null;

let aiProgress =
  0;

let titleAiDebounceTimer =
  null;

let titleAiRequestId =
  0;

let titleAiManuallyClosed =
  false;

let titleAiQuotaBlockedUntil =
  0;

const titleAiCache =
  new Map();

/* =========================================================
   AI QUOTA ERROR
========================================================= */

class TitleAIQuotaError extends Error {
  constructor(
    message = "AI đang hết quota."
  ) {
    super(message);

    this.name =
      "TitleAIQuotaError";

    this.code =
      429;
  }
}

/* =========================================================
   AI SHOW
========================================================= */

function showTitleAiSuggestion(
  text,
  options = {}
) {
  if (
    !titleAiSuggestion ||
    !titleAiSuggestionBody
  ) {
    return;
  }

  titleAiSuggestionBody.textContent =
    text || "";

  titleAiSuggestion.classList.toggle(
    "is-error",
    Boolean(options.error)
  );

  titleAiSuggestion.classList.add(
    "is-visible"
  );

  titleAiSuggestion.setAttribute(
    "aria-hidden",
    "false"
  );
}

function hideTitleAiSuggestion() {
  if (
    !titleAiSuggestion ||
    !titleAiSuggestionBody
  ) {
    return;
  }

  titleAiSuggestion.classList.remove(
    "is-visible",
    "is-error"
  );

  titleAiSuggestion.setAttribute(
    "aria-hidden",
    "true"
  );

  titleAiSuggestionBody.textContent =
    "";
}

function formatTitleAiAnswer(
  answer
) {
  const cleanAnswer =
    String(answer || "").trim();

  if (!cleanAnswer) {
    return (
      "AI chưa tìm được hướng dẫn phù hợp. " +
      "Bạn có thể bổ sung mô tả chi tiết ở ô bên dưới."
    );
  }

  return cleanAnswer;
}

/* =========================================================
   AI PROGRESS
========================================================= */

function updateAIProgress(
  percent
) {
  if (
    !titleAiProgressBar ||
    !titleAiLoadingPercent
  ) {
    return;
  }

  const value =
    Math.round(
      Math.max(
        0,
        Math.min(
          100,
          percent
        )
      )
    );

  titleAiProgressBar.style.width =
    `${value}%`;

  titleAiLoadingPercent.textContent =
    `${value}%`;
}

/* =========================================================
   START AI LOADING
========================================================= */

function startAITitleLoading() {
  if (!titleAiLoading) {
    return;
  }

  clearInterval(
    aiProgressTimer
  );

  aiProgress = 0;

  titleAiLoading.classList.add(
    "is-visible"
  );

  titleAiLoading.setAttribute(
    "aria-hidden",
    "false"
  );

  updateAIProgress(0);

  if (titleAiLoadingStatus) {
    titleAiLoadingStatus.textContent =
      "Đang chuẩn bị dữ liệu...";
  }

  aiProgressTimer =
    setInterval(() => {
      if (
        aiProgress >= 95
      ) {
        clearInterval(
          aiProgressTimer
        );

        return;
      }

      let step =
        1;

      if (
        aiProgress < 20
      ) {
        step = 4;

        if (
          titleAiLoadingStatus
        ) {
          titleAiLoadingStatus.textContent =
            "Đang chuẩn bị dữ liệu...";
        }
      }

      else if (
        aiProgress < 50
      ) {
        step = 2;

        if (
          titleAiLoadingStatus
        ) {
          titleAiLoadingStatus.textContent =
            "Đang phân tích nội dung tiêu đề...";
        }
      }

      else if (
        aiProgress < 75
      ) {
        step = 1.5;

        if (
          titleAiLoadingStatus
        ) {
          titleAiLoadingStatus.textContent =
            "Đang đối chiếu với các vấn đề thường gặp...";
        }
      }

      else if (
        aiProgress < 90
      ) {
        step = 1;

        if (
          titleAiLoadingStatus
        ) {
          titleAiLoadingStatus.textContent =
            "Đang xây dựng hướng xử lý phù hợp...";
        }
      }

      else {
        step = 0.3;

        if (
          titleAiLoadingStatus
        ) {
          titleAiLoadingStatus.textContent =
            "Đang chờ kết quả từ hệ thống AI...";
        }
      }

      aiProgress =
        Math.min(
          95,
          aiProgress +
            step
        );

      updateAIProgress(
        aiProgress
      );
    }, 350);
}

/* =========================================================
   FINISH AI LOADING
========================================================= */

function finishAITitleLoading() {
  if (!titleAiLoading) {
    return;
  }

  clearInterval(
    aiProgressTimer
  );

  aiProgress =
    100;

  updateAIProgress(
    100
  );

  if (
    titleAiLoadingStatus
  ) {
    titleAiLoadingStatus.textContent =
      "Đã phân tích xong yêu cầu.";
  }

  setTimeout(() => {
    if (!titleAiLoading) {
      return;
    }

    titleAiLoading.classList.remove(
      "is-visible"
    );

    titleAiLoading.setAttribute(
      "aria-hidden",
      "true"
    );
  }, 350);
}

/* =========================================================
   HIDE AI LOADING
========================================================= */

function hideAITitleLoading() {
  if (!titleAiLoading) {
    return;
  }

  clearInterval(
    aiProgressTimer
  );

  titleAiLoading.classList.remove(
    "is-visible"
  );

  titleAiLoading.setAttribute(
    "aria-hidden",
    "true"
  );

  updateAIProgress(
    0
  );

  aiProgress =
    0;

  if (
    titleAiLoadingStatus
  ) {
    titleAiLoadingStatus.textContent =
      "Đang chuẩn bị phân tích...";
  }
}

/* =========================================================
   AI QUOTA CHECK
========================================================= */

function isAIQuotaBlocked() {
  return (
    Date.now() <
    titleAiQuotaBlockedUntil
  );
}

/* =========================================================
   ANALYZE TITLE WITH AI
========================================================= */

async function analyzeTitleWithAI(
  title,
  requestId
) {
  const cleanTitle =
    String(title || "").trim();

  if (!cleanTitle) {
    return null;
  }

  /* Cache */
  if (
    titleAiCache.has(
      cleanTitle
    )
  ) {
    return titleAiCache.get(
      cleanTitle
    );
  }

  /* Quota */
  if (
    isAIQuotaBlocked()
  ) {
    throw new TitleAIQuotaError();
  }

  const selectedRadio =
    document.querySelector(
      'input[name="ticketMainType"]:checked'
    );

  const category =
    selectedRadio
      ? getCategory(
          selectedRadio.value
        )
      : null;

  const issue =
    category?.issues?.find(
      (item) =>
        item.value ===
        (
          issueSelect?.value ||
          ""
        )
    ) || null;

  let response;

  try {
    response =
      await fetch(
        TITLE_AI_WEB_APP_URL,
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/x-www-form-urlencoded;charset=UTF-8",
          },

          body:
            new URLSearchParams({
              question:
                cleanTitle,

              history:
                JSON.stringify(
                  []
                ),

              faqContext:
                JSON.stringify([
                  {
                    category:
                      category?.label ||
                      "",

                    question:
                      issue?.label ||
                      "",

                    answer:
                      "Hãy phân tích tiêu đề, xác định vấn đề chính và hướng dẫn học viên các bước xử lý an toàn.",
                  },
                ]),

              mode:
                "title-suggestion",
            }),
        }
      );
  }

  catch (error) {
    throw new Error(
      "Không thể kết nối tới hệ thống AI."
    );
  }

  if (
    requestId !==
    titleAiRequestId
  ) {
    return null;
  }

  if (
    !response.ok
  ) {
    if (
      response.status ===
      429
    ) {
      titleAiQuotaBlockedUntil =
        Date.now() +
        AI_QUOTA_COOLDOWN;

      throw new TitleAIQuotaError();
    }

    throw new Error(
      `AI HTTP ${response.status}`
    );
  }

  let data;

  try {
    data =
      await response.json();
  }

  catch (error) {
    throw new Error(
      "AI trả về dữ liệu không hợp lệ."
    );
  }

  if (
    !data.success
  ) {
    const errorText =
      String(
        data.error ||
          ""
      );

    if (
      errorText.includes(
        "429"
      ) ||
      errorText
        .toLowerCase()
        .includes(
          "quota"
        ) ||
      errorText
        .toLowerCase()
        .includes(
          "resource_exhausted"
        )
    ) {
      titleAiQuotaBlockedUntil =
        Date.now() +
        AI_QUOTA_COOLDOWN;

      throw new TitleAIQuotaError();
    }

    throw new Error(
      data.error ||
        "AI không thể phân tích tiêu đề."
    );
  }

  const answer =
    formatTitleAiAnswer(
      data.answer
    );

  titleAiCache.set(
    cleanTitle,
    answer
  );

  return answer;
}

/* =========================================================
   REQUEST AI
========================================================= */

function requestTitleAiSuggestion() {
  const title =
    getValue(
      "fTitle"
    );

  titleAiManuallyClosed =
    false;

  clearTimeout(
    titleAiDebounceTimer
  );

  titleAiRequestId += 1;

  const currentRequestId =
    titleAiRequestId;

  /*
   * Tối thiểu 15 ký tự
   */
  if (
    title.length <
    AI_TITLE_MIN_LENGTH
  ) {
    hideTitleAiSuggestion();

    hideAITitleLoading();

    return;
  }

  /*
   * Đang bị quota
   */
  if (
    isAIQuotaBlocked()
  ) {
    hideAITitleLoading();

    showTitleAiSuggestion(
      "AI đang tạm hết lượt sử dụng. Bạn vẫn có thể tiếp tục gửi yêu cầu bình thường.",
      {
        error: true,
      }
    );

    return;
  }

  /*
   * Có cache
   */
  if (
    titleAiCache.has(
      title
    )
  ) {
    hideTitleAiSuggestion();

    startAITitleLoading();

    setTimeout(() => {
      if (
        currentRequestId !==
        titleAiRequestId
      ) {
        return;
      }

      finishAITitleLoading();

      showTitleAiSuggestion(
        titleAiCache.get(
          title
        )
      );
    }, 250);

    return;
  }

  hideTitleAiSuggestion();

  startAITitleLoading();

  titleAiDebounceTimer =
    setTimeout(
      async () => {
        try {
          const aiAnswer =
            await analyzeTitleWithAI(
              title,
              currentRequestId
            );

          if (
            currentRequestId !==
            titleAiRequestId
          ) {
            return;
          }

          finishAITitleLoading();

          if (aiAnswer) {
            showTitleAiSuggestion(
              aiAnswer
            );
          }
        }

        catch (error) {
          console.error(
            "TITLE AI ERROR:",
            error
          );

          if (
            currentRequestId !==
            titleAiRequestId
          ) {
            return;
          }

          finishAITitleLoading();

          if (
            error instanceof
            TitleAIQuotaError
          ) {
            showTitleAiSuggestion(
              "AI đang tạm hết lượt sử dụng. Bạn vẫn có thể tiếp tục gửi yêu cầu bình thường.",
              {
                error: true,
              }
            );
          }

          else {
            showTitleAiSuggestion(
              "Chưa thể tải gợi ý AI lúc này. Bạn vẫn có thể gửi mô tả chi tiết để bộ phận hỗ trợ kiểm tra.",
              {
                error: true,
              }
            );
          }
        }
      },
      AI_TITLE_DEBOUNCE
    );
}

/* =========================================================
   AI EVENTS
========================================================= */

if (fTitle) {
  fTitle.addEventListener(
    "input",
    () => {
      updateStub();

      requestTitleAiSuggestion();
    }
  );

  fTitle.addEventListener(
    "blur",
    () => {
      setTimeout(() => {
        if (
          document.activeElement !==
          fTitle
        ) {
          hideTitleAiSuggestion();
        }
      }, 120);
    }
  );
}

if (
  closeTitleAiSuggestion
) {
  closeTitleAiSuggestion.addEventListener(
    "click",
    () => {
      titleAiManuallyClosed =
        true;

      titleAiRequestId +=
        1;

      clearTimeout(
        titleAiDebounceTimer
      );

      hideTitleAiSuggestion();

      hideAITitleLoading();
    }
  );
}

if (chipGrid) {
  chipGrid.addEventListener(
    "click",
    () => {
      hideTitleAiSuggestion();
      hideAITitleLoading();
    }
  );
}

if (issueSelect) {
  issueSelect.addEventListener(
    "change",
    () => {
      hideTitleAiSuggestion();
      hideAITitleLoading();
    }
  );
}

/* =========================================================
   TICKET STATE
========================================================= */

let ticketNum =
  "HV-000000";

let selectedFile =
  null;

let loggedInUser =
  null;

/* =========================================================
   CATEGORY
========================================================= */

function getCategory(
  id
) {
  return TICKET_CATEGORIES.find(
    (item) =>
      item.id === id
  );
}

function getIssue(
  categoryId,
  issueValue
) {
  const category =
    getCategory(
      categoryId
    );

  return (
    category?.issues?.find(
      (issue) =>
        issue.value ===
        issueValue
    ) || null
  );
}

function getSelectedRadio() {
  return document.querySelector(
    'input[name="ticketMainType"]:checked'
  );
}

/* =========================================================
   TICKET NUMBER
========================================================= */

function getPrefixFromCategory(
  label
) {
  const normalized =
    String(
      label || "HV"
    )
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        ""
      )
      .replace(
        /đ/gi,
        "d"
      )
      .trim()
      .split(/\s+/);

  return (
    normalized.length > 1
      ? normalized[0][0] +
        normalized[1][0]
      : normalized[0].slice(
          0,
          2
        )
  ).toUpperCase();
}

function genTicketNum(
  label
) {
  return `${getPrefixFromCategory(
    label
  )}-${Math.floor(
    100000 +
      Math.random() *
        900000
  )}`;
}

/* =========================================================
   DATE
========================================================= */

function isoToday() {
  const now =
    new Date();

  return new Date(
    now.getTime() -
      now.getTimezoneOffset() *
        60000
  )
    .toISOString()
    .slice(0, 10);
}

function formatDateVN(
  value
) {
  if (!value) {
    return "—";
  }

  const [
    year,
    month,
    day,
  ] = value.split("-");

  return `${day}/${month}/${year}`;
}

function todayLabel() {
  return new Date()
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
          "numeric",
      }
    );
}

/* =========================================================
   UPDATE TICKET NUMBER
========================================================= */

function updateTicketNumber() {
  const radio =
    getSelectedRadio();

  if (!radio) {
    return;
  }

  const category =
    getCategory(
      radio.value
    );

  const issue =
    issueSelect.value;

  const label =
    category?.label ||
    radio.value;

  ticketNum =
    genTicketNum(
      issue
        ? `${radio.value}-${issue}`
        : label
    );
}

/* =========================================================
   ISSUE OPTIONS
========================================================= */

function renderIssueOptions(
  categoryId
) {
  const category =
    getCategory(
      categoryId
    );

  if (
    !category ||
    category.id ===
      "other"
  ) {
    issueSelect.innerHTML =
      `
        <option value="">
          -- Chọn chi tiết vấn đề --
        </option>
      `;

    issueSelect.disabled =
      true;

    issueField.classList.remove(
      "show"
    );

    issueSelect.value =
      "";

    renderRelatedFaqs();

    return;
  }

  issueSelect.innerHTML =
    `
      <option value="">
        -- Chọn chi tiết vấn đề --
      </option>

      ${category.issues
        .map(
          (issue) =>
            `
              <option value="${escapeHTML(
                issue.value
              )}">
                ${escapeHTML(
                  issue.label
                )}
              </option>
            `
        )
        .join("")}
    `;

  issueSelect.disabled =
    false;

  issueField.classList.add(
    "show"
  );

  issueSelect.value =
    "";

  renderRelatedFaqs();
}

function getRelatedFaqContext() {
  const selectedRadio =
    getSelectedRadio();

  const category = selectedRadio
    ? getCategory(selectedRadio.value)
    : null;

  const issueLabel = issueSelect
    ?.selectedOptions?.[0]
    ?.textContent
    ?.trim() || "";

  return {
    categoryLabel: category?.label || "",
    issueLabel,
    issueValue: issueSelect?.value || ""
  };
}

function getRelatedFaqs(context) {
  const stopWords = new Set(["cho", "voi", "cac", "cua", "the", "trong", "nhung", "khi", "mot", "nhu"]);
  const query = normalizeFaqText(`${context.categoryLabel} ${context.issueLabel}`);
  const terms = [...new Set(query.split(/\s+/).filter(word => word.length >= 3 && !stopWords.has(word)))];

  return relatedFaqData
    .map(item => {
      const text = normalizeFaqText(`${item.category || ""} ${item.question || ""} ${item.answer || ""}`);
      let score = 0;

      if (normalizeFaqText(item.category) === normalizeFaqText(context.categoryLabel)) {
        score += 4;
      }

      terms.forEach(term => {
        if (text.includes(term)) {
          score += 1;
        }
      });

      return { item, score };
    })
    .filter(result => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(result => result.item);
}

function renderRelatedFaqs() {
  if (!relatedFaq || !relatedFaqList || !relatedFaqLink) {
    return;
  }

  const context = getRelatedFaqContext();

  if (!context.issueValue) {
    relatedFaq.hidden = true;
    relatedFaqList.innerHTML = "";
    return;
  }

  const search = `${context.categoryLabel} ${context.issueLabel}`.trim();
  const matches = getRelatedFaqs(context);

  relatedFaq.hidden = false;
  relatedFaqLink.href = `/FAQs/faq.html?q=${encodeURIComponent(search)}`;

  if (relatedFaqTitle) {
    relatedFaqTitle.textContent = `FAQ cho: ${context.issueLabel}`;
  }

  if (relatedFaqIntro) {
    relatedFaqIntro.textContent = matches.length
      ? "Bạn có thể mở các câu hỏi dưới đây để xem hướng dẫn trước khi gửi phiếu."
      : "Chưa có câu hỏi trùng khớp trực tiếp. Bạn vẫn có thể tìm trong kho FAQ hoặc tiếp tục gửi phiếu.";
  }

  relatedFaqList.innerHTML = matches.length
    ? matches.map((item, index) => `<article class="related-faq-item"><button type="button" class="related-faq-question" data-related-faq="${index}" aria-expanded="false"><span>${escapeHTML(item.question || "Câu hỏi thường gặp")}</span><span aria-hidden="true">+</span></button><div class="related-faq-answer">${escapeHTML(item.answer || "")}</div></article>`).join("")
    : '<div class="related-faq-empty">Không tìm thấy FAQ phù hợp trong dữ liệu hiện có.</div>';
}

function watchRelatedFaqs() {
  const database = getDatabase();

  if (!database || !relatedFaqList) {
    return;
  }

  database.collection("faqs").onSnapshot(
    snapshot => {
      relatedFaqData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      renderRelatedFaqs();
    },
    error => {
      console.warn("Không thể tải FAQ liên quan:", error);
      relatedFaqData = [];
      renderRelatedFaqs();
    }
  );
}

function bindRelatedFaqAccordion() {
  if (!relatedFaqList) {
    return;
  }

  relatedFaqList.addEventListener(
    "click",
    event => {
      const button = event.target.closest(
        ".related-faq-question"
      );

      if (!button) {
        return;
      }

      const item = button.closest(
        ".related-faq-item"
      );

      if (!item) {
        return;
      }

      const willOpen = !item.classList.contains(
        "is-open"
      );

      relatedFaqList
        .querySelectorAll(
          ".related-faq-item"
        )
        .forEach(
          faqItem => {
            faqItem.classList.remove(
              "is-open"
            );

            faqItem
              .querySelector(
                ".related-faq-question"
              )
              ?.setAttribute(
                "aria-expanded",
                "false"
              );
          }
        );

      if (willOpen) {
        item.classList.add(
          "is-open"
        );

        button.setAttribute(
          "aria-expanded",
          "true"
        );
      }
    }
  );
}

/* =========================================================
   RENDER CATEGORIES
========================================================= */

function renderCategories() {
  if (!chipGrid) {
    return;
  }

  chipGrid.innerHTML =
    TICKET_CATEGORIES.map(
      (category) =>
        `
          <label class="chip">

            <input
              type="radio"
              name="ticketMainType"
              value="${escapeHTML(
                category.id
              )}"
              data-label="${escapeHTML(
                category.label
              )}"
              data-icon="${escapeHTML(
                category.icon
              )}"
            >

            ${svgIcon(
              category.icon
            )}

            <span>
              ${escapeHTML(
                category.label
              )}
            </span>

            <span class="mark"></span>

          </label>
        `
    ).join("");

  chipGrid
    .querySelectorAll(
      ".chip"
    )
    .forEach(
      (chip) => {
        chip.addEventListener(
          "click",
          () => {
            chipGrid
              .querySelectorAll(
                ".chip"
              )
              .forEach(
                (item) =>
                  item.classList.remove(
                    "active"
                  )
              );

            chip.classList.add(
              "active"
            );

            const radio =
              chip.querySelector(
                "input"
              );

            if (!radio) {
              return;
            }

            radio.checked =
              true;

            renderIssueOptions(
              radio.value
            );

            updateTicketNumber();

            updateStub();
          }
        );
      }
    );
}

/* =========================================================
   STUB
========================================================= */

function updateStub() {
  const radio =
    getSelectedRadio();

  const category =
    radio
      ? getCategory(
          radio.value
        )
      : null;

  const issueLabel =
    issueSelect
      ?.selectedOptions?.[0]
      ?.textContent
      ?.trim() || "";

  const displayLabel =
    issueLabel &&
    radio?.value !==
      "other"
      ? `${
          category?.label ||
          "Khác"
        } · ${issueLabel}`
      : category?.label ||
        "Chưa chọn loại";

  if ($("stubNum")) {
    $("stubNum").textContent =
      ticketNum;
  }

  if ($("stubName")) {
    $("stubName").textContent =
      $("fName")
        ?.value
        ?.trim() ||
      "—";
  }

  if ($("stubTitle")) {
    $("stubTitle").textContent =
      $("fTitle")
        ?.value
        ?.trim() ||
      "—";
  }

  if ($("stubDate")) {
    $("stubDate").textContent =
      formatDateVN(
        fDateEl?.value
      );
  }

  if ($("stubCourseBody")) {
    $("stubCourseBody").textContent =
      chkCourse?.checked
        ? fCourse?.value?.trim() ||
          "Chưa nhập"
        : "Không có";
  }

  if ($("stubCourse")) {
    $("stubCourse").textContent =
      chkCourse?.checked &&
      fCourse?.value?.trim()
        ? `Khóa học: ${fCourse.value.trim()}`
        : "";
  }

  if ($("stubCat")) {
    $("stubCat").innerHTML =
      `
        ${svgIcon(
          radio?.dataset?.icon ||
            "other"
        )}

        <span>
          ${escapeHTML(
            displayLabel
          )}
        </span>
      `;
  }
}

/* =========================================================
   IMAGE VALIDATION
========================================================= */

const IMAGE_FILE_EXTENSIONS =
  new Set([
    "jpg",
    "jpeg",
    "jpe",
    "jfif",
    "png",
    "apng",
    "gif",
    "webp",
    "avif",
    "bmp",
    "dib",
    "svg",
    "svgz",
    "ico",
    "cur",
    "tif",
    "tiff",
    "heic",
    "heif",
    "heics",
    "heifs",
    "jp2",
    "j2k",
    "jpf",
    "jpx",
    "jpm",
    "mj2",
    "jxl",
    "raw",
    "dng",
    "cr2",
    "cr3",
    "nef",
    "nrw",
    "arw",
    "orf",
    "rw2",
    "raf",
    "pef",
    "srw",
    "3fr",
    "erf",
    "kdc",
    "mos",
    "mrw",
    "rwl",
    "x3f",
    "psd",
    "psb",
  ]);

function getFileExtension(
  fileName
) {
  const name =
    String(
      fileName || ""
    )
      .toLowerCase()
      .split(
        /[?#]/,
        1
      )[0];

  const lastDot =
    name.lastIndexOf(
      "."
    );

  return lastDot >=
    0
    ? name.slice(
        lastDot + 1
      )
    : "";
}

function isImageFile(
  file
) {
  const mimeType =
    String(
      file?.type ||
        ""
    ).toLowerCase();

  return (
    mimeType.startsWith(
      "image/"
    ) ||
    IMAGE_FILE_EXTENSIONS.has(
      getFileExtension(
        file?.name
      )
    )
  );
}

/* =========================================================
   BASE64 IMAGE PROCESSING
========================================================= */

const MAX_IMAGE_WIDTH =
  1600;

const MAX_IMAGE_HEIGHT =
  1600;

const INITIAL_IMAGE_QUALITY =
  0.75;

const MAX_BASE64_LENGTH =
  650000;

/*
 * File → Data URL
 */
function readFileAsDataURL(
  file
) {
  return new Promise(
    (
      resolve,
      reject
    ) => {
      const reader =
        new FileReader();

      reader.onload =
        () => {
          resolve(
            reader.result
          );
        };

      reader.onerror =
        () => {
          reject(
            new Error(
              "Không thể đọc tệp hình ảnh."
            )
          );
        };

      reader.readAsDataURL(
        file
      );
    }
  );
}

/*
 * Data URL → Image
 */
function loadImage(
  dataURL
) {
  return new Promise(
    (
      resolve,
      reject
    ) => {
      const image =
        new Image();

      image.onload =
        () => {
          resolve(
            image
          );
        };

      image.onerror =
        () => {
          reject(
            new Error(
              "Không thể đọc hình ảnh."
            )
          );
        };

      image.src =
        dataURL;
    }
  );
}

/*
 * Nén ảnh thành JPEG Base64
 */
async function compressImageToBase64(
  file
) {
  const originalDataURL =
    await readFileAsDataURL(
      file
    );

  const image =
    await loadImage(
      originalDataURL
    );

  let width =
    image.naturalWidth;

  let height =
    image.naturalHeight;

  if (
    !width ||
    !height
  ) {
    throw new Error(
      "Không xác định được kích thước hình ảnh."
    );
  }

  /*
   * Resize
   */
  const scale =
    Math.min(
      1,
      MAX_IMAGE_WIDTH /
        width,
      MAX_IMAGE_HEIGHT /
        height
    );

  width =
    Math.max(
      1,
      Math.round(
        width * scale
      )
    );

  height =
    Math.max(
      1,
      Math.round(
        height * scale
      )
    );

  const canvas =
    document.createElement(
      "canvas"
    );

  canvas.width =
    width;

  canvas.height =
    height;

  const ctx =
    canvas.getContext(
      "2d",
      {
        alpha: false,
      }
    );

  if (!ctx) {
    throw new Error(
      "Trình duyệt không hỗ trợ xử lý hình ảnh."
    );
  }

  /*
   * Background trắng
   */
  ctx.fillStyle =
    "#ffffff";

  ctx.fillRect(
    0,
    0,
    width,
    height
  );

  /*
   * Chất lượng ảnh
   */
  ctx.imageSmoothingEnabled =
    true;

  ctx.imageSmoothingQuality =
    "high";

  ctx.drawImage(
    image,
    0,
    0,
    width,
    height
  );

  let quality =
    INITIAL_IMAGE_QUALITY;

  let dataURL =
    canvas.toDataURL(
      "image/jpeg",
      quality
    );

  /*
   * Giảm quality nếu ảnh quá lớn
   */
  while (
    dataURL.length >
      MAX_BASE64_LENGTH &&
    quality >
      0.4
  ) {
    quality -=
      0.05;

    dataURL =
      canvas.toDataURL(
        "image/jpeg",
        quality
      );
  }

  /*
   * Nếu vẫn quá lớn
   * → thu nhỏ canvas
   */
  if (
    dataURL.length >
    MAX_BASE64_LENGTH
  ) {
    const smallWidth =
      Math.max(
        600,
        Math.round(
          width * 0.75
        )
      );

    const smallHeight =
      Math.max(
        600,
        Math.round(
          height * 0.75
        )
      );

    const smallCanvas =
      document.createElement(
        "canvas"
      );

    smallCanvas.width =
      smallWidth;

    smallCanvas.height =
      smallHeight;

    const smallCtx =
      smallCanvas.getContext(
        "2d"
      );

    smallCtx.fillStyle =
      "#ffffff";

    smallCtx.fillRect(
      0,
      0,
      smallWidth,
      smallHeight
    );

    smallCtx.drawImage(
      image,
      0,
      0,
      smallWidth,
      smallHeight
    );

    dataURL =
      smallCanvas.toDataURL(
        "image/jpeg",
        0.62
      );

    width =
      smallWidth;

    height =
      smallHeight;
  }

  /*
   * Đổi Base64 length thành byte gần đúng
   */
  const base64Part =
    dataURL.split(
      ","
    )[1] || "";

  const compressedSize =
    Math.round(
      base64Part.length *
        0.75
    );

  return {
    dataURL,

    contentType:
      "image/jpeg",

    width,

    height,

    quality,

    originalSize:
      Number(
        file.size ||
          0
      ),

    compressedSize,
  };
}

/* =========================================================
   PREPARE ATTACHMENT
   Không dùng Firebase Storage
========================================================= */

async function uploadSelectedFile(
  ticketId
) {
  /*
   * Không có file
   */
  if (!selectedFile) {
    return {};
  }

  /*
   * Validate
   */
  if (
    !isImageFile(
      selectedFile
    )
  ) {
    throw new Error(
      "Tệp đính kèm không phải hình ảnh hợp lệ."
    );
  }

  try {
    const result =
      await compressImageToBase64(
        selectedFile
      );

    const base64 =
      result.dataURL.split(
        ","
      )[1] || "";

    return {
      /*
       * Data URL có thể gắn trực tiếp vào img
       */
      attachmentUrl:
        result.dataURL,

      imageUrl:
        result.dataURL,

      /*
       * Không còn Firebase Storage
       */
      storagePath:
        "",

      attachmentPath:
        "",

      /*
       * File info
       */
      attachmentName:
        selectedFile.name ||
        "image.jpg",

      attachmentType:
        result.contentType,

      attachmentSize:
        result.compressedSize,

      attachmentOriginalSize:
        result.originalSize,

      attachmentWidth:
        result.width,

      attachmentHeight:
        result.height,

      /*
       * Raw Base64
       */
      attachmentBase64:
        base64,

      /*
       * Ticket ID để tiện truy xuất
       */
      attachmentTicketId:
        ticketId,
    };
  }

  catch (error) {
    console.error(
      "IMAGE BASE64 ERROR:",
      error
    );

    throw new Error(
      "Không thể xử lý hình ảnh. Vui lòng thử ảnh khác."
    );
  }
}

/* =========================================================
   SELECT FILE
========================================================= */

function setSelectedFile(
  file
) {
  const maxSize =
    10 * 1024 * 1024;

  if (
    !isImageFile(file)
  ) {
    $("errorText").textContent =
      "Vui lòng chọn tệp hình ảnh hợp lệ.";

    $("errorText").classList.add(
      "show"
    );

    return;
  }

  if (
    file.size >
    maxSize
  ) {
    $("errorText").textContent =
      "Tệp đính kèm không được vượt quá 10 MB.";

    $("errorText").classList.add(
      "show"
    );

    return;
  }

  selectedFile =
    file;

  if (fileNameEl) {
    fileNameEl.textContent =
      `Đã chọn: ${file.name} (${Math.ceil(
        file.size / 1024
      )} KB)`;
  }

  $("errorText").classList.remove(
    "show"
  );
}

/* =========================================================
   FIREBASE AUTH
========================================================= */

function getCurrentUser() {
  try {
    if (
      typeof firebase ===
        "undefined" ||
      !firebase.auth
    ) {
      return null;
    }

    return (
      firebase
        .auth()
        .currentUser ||
      null
    );
  }

  catch (error) {
    console.warn(
      "Không thể kiểm tra Auth:",
      error
    );

    return null;
  }
}

/* =========================================================
   SETUP FORM
========================================================= */

function setupForm() {
  if ($("todayStr")) {
    $("todayStr").textContent =
      todayLabel();
  }

  if (fDateEl) {
    fDateEl.value =
      isoToday();
  }

  renderCategories();

  watchRelatedFaqs();

  bindRelatedFaqAccordion();

  updateStub();

  /* =======================================================
     AUTH STATE
  ======================================================= */

  if (
    typeof auth !==
      "undefined" &&
    auth &&
    typeof auth.onAuthStateChanged ===
      "function"
  ) {
    auth.onAuthStateChanged(
      async (
        user
      ) => {
        if (!user) {
          loggedInUser =
            null;

          if ($("fName")) {
            $("fName").readOnly =
              false;
          }

          if ($("fEmail")) {
            $("fEmail").readOnly =
              false;
          }

          if ($("fCampus")) {
            $("fCampus").readOnly =
              false;
          }

          return;
        }

        try {
          const database =
            getDatabase();

          if (!database) {
            throw new Error(
              "Firestore chưa sẵn sàng."
            );
          }

          const doc =
            await database
              .collection(
                "users"
              )
              .doc(
                user.uid
              )
              .get();

          const data =
            doc.exists
              ? doc.data()
              : {};

          const name =
            data.name ||
            user.displayName ||
            "";

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
            "";

          const classOrCourse =
            data.class ||
            data.className ||
            data.clazz ||
            data.grade ||
            data.course ||
            data.courseName ||
            data.supportClassName ||
            "";

          const accountType =
            String(
              data.accountType ||
              role ||
              ""
            )
              .trim()
              .toLowerCase();

          const isStudentAccount =
            [
              "student",
              "student_account",
              "hocvien",
              "học viên",
              "learner",
              "hv"
            ].includes(accountType) ||
            Boolean(classOrCourse) ||
            !accountType;

          loggedInUser =
            {
              uid:
                user.uid,

              name,

              email,

              phone,

              campus,

              role,

              classOrCourse,
            };

          if ($("fName")) {
            $("fName").value =
              name;

            $("fName").readOnly =
              true;
          }

          if ($("fEmail")) {
            $("fEmail").value =
              email;

            $("fEmail").readOnly =
              true;
          }

          if ($("fCampus")) {
            $("fCampus").value =
              campus;

            $("fCampus").readOnly =
              true;
          }

          if (chkCourse && isStudentAccount) {
            chkCourse.checked =
              true;

            courseBoxWrap.classList.add(
              "show"
            );
          }

          if (fCourse && isStudentAccount) {
            fCourse.value =
              classOrCourse;

            fCourse.dataset.profileCourse =
              classOrCourse;

            fCourse.dataset.profileAutofill =
              "true";

            fCourse.readOnly =
              Boolean(classOrCourse);
          }

          updateStub();
        }

        catch (error) {
          console.error(
            "Không thể lấy thông tin người dùng:",
            error
          );
        }
      }
    );
  }

  /* =======================================================
     ISSUE
  ======================================================= */

  if (issueSelect) {
    issueSelect.addEventListener(
      "change",
      () => {
        updateTicketNumber();

        updateStub();

        hideTitleAiSuggestion();

        hideAITitleLoading();

        renderRelatedFaqs();
      }
    );
  }

  /* =======================================================
     COURSE
  ======================================================= */

  if (chkCourse) {
    chkCourse.addEventListener(
      "change",
      () => {
        courseBoxWrap.classList.toggle(
          "show",
          chkCourse.checked
        );

        if (
          !chkCourse.checked
        ) {
          fCourse.value =
            "";
        }

        if (
          chkCourse.checked &&
          !fCourse.value &&
          fCourse.dataset.profileCourse
        ) {
          fCourse.value =
            fCourse.dataset.profileCourse;
        }

        updateStub();
      }
    );
  }

  /* =======================================================
     STUB
  ======================================================= */

  [
    "fName",
    "fTitle",
    "fCourse",
  ].forEach(
    (id) => {
      const element =
        $(id);

      if (!element) {
        return;
      }

      element.addEventListener(
        "input",
        updateStub
      );
    }
  );

  /* =======================================================
     FILE DROP
  ======================================================= */

  if (
    fileDrop &&
    fFile
  ) {
    fileDrop.addEventListener(
      "click",
      () => {
        fFile.click();
      }
    );

    fileDrop.addEventListener(
      "keydown",
      (
        event
      ) => {
        if (
          event.key ===
            "Enter" ||
          event.key ===
            " "
        ) {
          event.preventDefault();

          fFile.click();
        }
      }
    );

    [
      "dragenter",
      "dragover",
    ].forEach(
      (
        type
      ) => {
        fileDrop.addEventListener(
          type,
          (
            event
          ) => {
            event.preventDefault();

            fileDrop.classList.add(
              "dragover"
            );
          }
        );
      }
    );

    [
      "dragleave",
      "drop",
    ].forEach(
      (
        type
      ) => {
        fileDrop.addEventListener(
          type,
          (
            event
          ) => {
            event.preventDefault();

            fileDrop.classList.remove(
              "dragover"
            );
          }
        );
      }
    );

    fileDrop.addEventListener(
      "drop",
      (
        event
      ) => {
        const file =
          event
            .dataTransfer
            .files?.[0];

        if (file) {
          setSelectedFile(
            file
          );
        }
      }
    );

    fFile.addEventListener(
      "change",
      () => {
        if (
          fFile.files?.[0]
        ) {
          setSelectedFile(
            fFile.files[0]
          );
        }
      }
    );
  }

  /* =======================================================
     BUTTON
  ======================================================= */

  if ($("submitBtn")) {
    $("submitBtn").addEventListener(
      "click",
      submitTicket
    );
  }

  if ($("againBtn")) {
    $("againBtn").addEventListener(
      "click",
      resetForm
    );
  }
}

/* =========================================================
   SUBMIT TICKET
========================================================= */

async function submitTicket() {
  const database =
    getDatabase();

  const name =
    $("fName")
      .value
      .trim();

  const email =
    $("fEmail")
      .value
      .trim();

  const campus =
    $("fCampus")
      .value
      .trim();

  const phone =
    loggedInUser?.phone ||
    "";

  const isStudent =
    chkCourse.checked;

  const course =
    isStudent
      ? fCourse.value.trim()
      : "Không áp dụng";

  const isAutoFilledStudentProfile =
    fCourse?.dataset?.profileAutofill ===
    "true";

  const title =
    $("fTitle")
      .value
      .trim();

  const description =
    $("fDesc")
      .value
      .trim();

  const selectedMainType =
    getSelectedRadio();

  const selectedIssue =
    issueSelect.value;

  const errorEl =
    $("errorText");

  const requiresIssue =
    selectedMainType &&
    selectedMainType.value !==
      "other";

  const emailValid =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      email
    );

  /* =======================================================
     VALIDATE DATABASE
  ======================================================= */

  if (!database) {
    errorEl.textContent =
      "Chưa kết nối được với hệ thống. Vui lòng thử lại sau.";

    errorEl.classList.add(
      "show"
    );

    return;
  }

  /* =======================================================
     VALIDATE INPUT
  ======================================================= */

  if (
    !name ||
    !email ||
    (isStudent &&
      !course &&
      !isAutoFilledStudentProfile) ||
    !selectedMainType ||
    (
      requiresIssue &&
      !selectedIssue
    )
  ) {
    errorEl.textContent =
      "Vui lòng điền đầy đủ thông tin bắt buộc và chọn loại yêu cầu.";

    errorEl.classList.add(
      "show"
    );

    return;
  }

  if (!emailValid) {
    errorEl.textContent =
      "Email không hợp lệ.";

    errorEl.classList.add(
      "show"
    );

    return;
  }

  errorEl.classList.remove(
    "show"
  );

  /* =======================================================
     CATEGORY
  ======================================================= */

  const category =
    getCategory(
      selectedMainType.value
    );

  const issueLabel =
    selectedMainType.value ===
      "other"
      ? "Khác"
      : (
          issueSelect
            .selectedOptions?.[0]
            ?.textContent
            ?.trim() ||
          "Khác"
        );

  /* =======================================================
     PRIORITY
  ======================================================= */

  const automaticPriority =
    typeof window
      .automaticTicketPriority ===
    "function"
      ? window.automaticTicketPriority({
          categoryId:
            selectedMainType.value,

          issueId:
            selectedIssue,

          title,

          description,
        })
      : {
          level:
            "medium",

          label:
            "Trung bình",

          reason:
            "Không tải được bộ phân loại tự động.",

          source:
            "fallback",
        };

  const supportRoute = await getStudentSupportRoute(
    database,
    loggedInUser?.uid || ""
  );

  /* =======================================================
     TICKET NUMBER
  ======================================================= */

  if (
    ticketNum ===
    "HV-000000"
  ) {
    updateTicketNumber();
  }

  const submitButton =
    $("submitBtn");

  submitButton.disabled =
    true;

  submitButton.innerHTML =
    "Đang xử lý...";

  /* =======================================================
     BASE TICKET DATA
  ======================================================= */

  const ticketData =
    {
      ticketNum,

      /*
       * User
       */
      studentId:
        loggedInUser?.uid ||
        "",

      name,

      email,

      campus:
        loggedInUser?.campus ||
        campus,

      createdByRole:
        loggedInUser?.role ||
        "student",

      /*
       * Student
       */
      isStudent,

      course,

      /* Tuyến xử lý: Group → Lớp → CS Leader */
      groupId: supportRoute.supportGroupId || "",
      groupName: supportRoute.supportGroupName || "",
      classId: supportRoute.supportClassId || "",
      className: supportRoute.supportClassName || "",
      supportLeaderUid: supportRoute.supportLeaderUid || "",
      supportLeaderName: supportRoute.supportLeaderName || "",
      routingStatus: supportRoute.supportLeaderUid ? "waiting_leader_assignment" : "unrouted",

      date:
        fDateEl.value,

      /*
       * Ticket
       */
      ticketType:
        selectedIssue ||
        selectedMainType.value,

      ticketCategory:
        category?.label ||
        "Khác",

      ticketIssue:
        issueLabel,

      /*
       * Priority
       */
      priority:
        automaticPriority.level,

      priorityLabel:
        automaticPriority.label,

      priorityReason:
        automaticPriority.reason,

      prioritySource:
        automaticPriority.source,

      /*
       * Content
       */
      title,

      description,

      /*
       * Attachment info
       * Base64 sẽ được thêm
       * sau khi nén ảnh.
       */
      attachmentName:
        selectedFile?.name ||
        "",

      attachmentType:
        selectedFile
          ? "image/jpeg"
          : "",

      attachmentSize:
        selectedFile?.size ||
        0,

      /*
       * Status
       */
      status:
        "open",

      /*
       * Timestamp
       */
      createdAt:
        firebase.firestore
          .FieldValue
          .serverTimestamp(),

      updatedAt:
        firebase.firestore
          .FieldValue
          .serverTimestamp(),
    };

  try {
    /* =====================================================
       PROCESS IMAGE
    ===================================================== */

    submitButton.innerHTML =
      selectedFile
        ? "Đang xử lý ảnh..."
        : "Đang lưu phiếu...";

    const uploadedAttachment =
      await uploadSelectedFile(
        ticketNum
      );

    Object.assign(
      ticketData,
      uploadedAttachment
    );

    /* =====================================================
       CHECK DOCUMENT SIZE
    ===================================================== */

    if (
      ticketData.attachmentBase64
        ?.length >
      650000
    ) {
      throw new Error(
        "Hình ảnh sau khi nén vẫn quá lớn. Vui lòng chọn ảnh nhỏ hơn."
      );
    }

    /* =====================================================
       SAVE TICKET
    ===================================================== */

    submitButton.innerHTML =
      "Đang lưu phiếu...";

    const ticketRef =
      database
        .collection(
          "tickets"
        )
        .doc(
          ticketNum
        );

    await ticketRef.set(
      ticketData
    );

    /* =====================================================
       FIRST MESSAGE
    ===================================================== */

    const messageData =
      {
        sender:
          "student",

        senderType:
          "student",

        senderName:
          name,

        message:
          description,

        text:
          description,

        /*
         * Attachment
         */
        attachmentName:
          uploadedAttachment
            .attachmentName ||
          "",

        attachmentType:
          uploadedAttachment
            .attachmentType ||
          "",

        attachmentSize:
          uploadedAttachment
            .attachmentSize ||
          0,

        attachmentOriginalSize:
          uploadedAttachment
            .attachmentOriginalSize ||
          0,

        attachmentWidth:
          uploadedAttachment
            .attachmentWidth ||
          0,

        attachmentHeight:
          uploadedAttachment
            .attachmentHeight ||
          0,

        attachmentBase64:
          uploadedAttachment
            .attachmentBase64 ||
          "",

        attachmentUrl:
          uploadedAttachment
            .attachmentUrl ||
          "",

        imageUrl:
          uploadedAttachment
            .imageUrl ||
          "",

        createdAt:
          firebase.firestore
            .FieldValue
            .serverTimestamp(),
      };

    try {
      await ticketRef
        .collection(
          "messages"
        )
        .add(
          messageData
        );
    }

    catch (messageError) {
      /*
       * Ticket đã được lưu thành công. Không để lỗi quyền
       * của subcollection messages làm cả thao tác gửi thất bại.
       */
      console.warn(
        "Không thể tạo tin nhắn mở đầu, nhưng ticket đã được lưu:",
        messageError
      );
    }

    /* =====================================================
       EMAILJS
    ===================================================== */

    if (
      window.emailjs
    ) {
      try {
        await window.emailjs.send(
          EMAILJS_SERVICE_ID,
          EMAILJS_TEMPLATE_ID,
          {
            ticket_num:
              ticketNum,

            name,

            email,

            phone:
              phone ||
              "Không cung cấp",

            course,

            date:
              formatDateVN(
                fDateEl.value
              ),

            ticket_type:
              `${ticketData.ticketCategory} · ${ticketData.ticketIssue}`,

            title,

            message:
              description,
          }
        );
      }

      catch (
        emailError
      ) {
        console.warn(
          "EmailJS lỗi, nhưng ticket đã được lưu:",
          emailError
        );
      }
    }

    /* =====================================================
       SUCCESS
    ===================================================== */

    $("successText").innerHTML =
      `
        Phiếu
        <strong>
          ${escapeHTML(
            ticketNum
          )}
        </strong>
        —
        “<em>
          ${escapeHTML(
            title ||
              "Không có tiêu đề"
          )}
        </em>”
        đã được ghi nhận.
        Bạn có thể theo dõi phản hồi
        trong mục Trao đổi Ticket.
      `;

    formView.classList.add(
      "hide"
    );

    successView.classList.add(
      "show"
    );
  }

  catch (error) {
    console.error(
      "Ticket error:",
      error
    );

    let message =
      "Không thể gửi phiếu. Vui lòng kiểm tra kết nối và thử lại.";

    const rawMessage =
      String(
        error?.message ||
          ""
      );

    if (
      rawMessage
    ) {
      message =
        rawMessage;
    }

    errorEl.textContent =
      message;

    errorEl.classList.add(
      "show"
    );
  }

  finally {
    submitButton.disabled =
      false;

    submitButton.innerHTML =
      "Gửi yêu cầu <span>→</span>";
  }
}

/* =========================================================
   RESET
========================================================= */

function resetForm() {
  document
    .querySelectorAll(
      "#formView input:not([type=checkbox]), #formView textarea"
    )
    .forEach(
      (
        input
      ) => {
        /*
         * Giữ thông tin user
         */
        if (
          loggedInUser &&
          (
            input.id ===
              "fName" ||
            input.id ===
              "fEmail" ||
            input.id ===
              "fCampus"
          )
        ) {
          return;
        }

        input.value =
          "";
      }
    );

  /* =======================================================
     FILE
  ======================================================= */

  if (fFile) {
    fFile.value =
      "";
  }

  selectedFile =
    null;

  if (fileNameEl) {
    fileNameEl.textContent =
      "";
  }

  /* =======================================================
     COURSE
  ======================================================= */

  chkCourse.checked =
    Boolean(
      fCourse?.dataset?.profileAutofill ===
      "true"
    );

  courseBoxWrap.classList.toggle(
    "show",
    chkCourse.checked
  );

  fCourse.value =
    chkCourse.checked
      ? fCourse.dataset.profileCourse || ""
      : "";

  /* =======================================================
     CATEGORY
  ======================================================= */

  chipGrid
    .querySelectorAll(
      ".chip"
    )
    .forEach(
      (
        chip
      ) =>
        chip.classList.remove(
          "active"
        )
    );

  chipGrid
    .querySelectorAll(
      "input"
    )
    .forEach(
      (
        input
      ) => {
        input.checked =
          false;
      }
    );

  /* =======================================================
     ISSUE
  ======================================================= */

  issueSelect.innerHTML =
    `
      <option value="">
        -- Chọn chi tiết vấn đề --
      </option>
    `;

  issueSelect.disabled =
    true;

  issueField.classList.remove(
    "show"
  );

  renderRelatedFaqs();

  /* =======================================================
     DATE
  ======================================================= */

  fDateEl.value =
    isoToday();

  /* =======================================================
     TICKET NUMBER
  ======================================================= */

  ticketNum =
    "HV-000000";

  /* =======================================================
     ERROR
  ======================================================= */

  $("errorText").classList.remove(
    "show"
  );

  /* =======================================================
     AI
  ======================================================= */

  titleAiRequestId +=
    1;

  clearTimeout(
    titleAiDebounceTimer
  );

  hideTitleAiSuggestion();

  hideAITitleLoading();

  /* =======================================================
     SUCCESS
  ======================================================= */

  successView.classList.remove(
    "show"
  );

  formView.classList.remove(
    "hide"
  );

  updateStub();
}

/* =========================================================
   INIT
========================================================= */

setupForm();
