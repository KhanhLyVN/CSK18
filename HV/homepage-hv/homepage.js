document.addEventListener("DOMContentLoaded", () => {

  const openTicketsEl = document.getElementById("openTicketsCount");
  const progressTicketsEl = document.getElementById("progressTicketsCount");
  const resolvedTicketsEl = document.getElementById("resolvedTicketsCount");
  const totalTicketsEl = document.getElementById("totalTicketsCount");
  const recentListEl = document.getElementById("recentTicketList");
  const connectionDotEl = document.getElementById("connectionDot");
  const connectionLabelEl = document.getElementById("connectionLabel");
  const todayLabelEl = document.getElementById("todayLabel");
  const welcomeNameEl = document.getElementById("welcomeName");

  // ======================================================
  // STATUS
  // ======================================================

  const STATUS_META = {
    open: {
      label: "Đang mở",
      className: "status-open"
    },

    in_progress: {
      label: "Đang xử lý",
      className: "status-in_progress"
    },

    resolved: {
      label: "Đã giải quyết",
      className: "status-resolved"
    },

    closed: {
      label: "Đã đóng",
      className: "status-closed"
    }
  };


  // ======================================================
  // FIREBASE
  // ======================================================

  function getDatabase() {

    if (typeof db !== "undefined" && db) {
      return db;
    }

    return window.db || null;
  }

  function getAuth() {

    if (typeof auth !== "undefined" && auth) {
      return auth;
    }

    return window.auth || null;
  }


  // ======================================================
  // HELPER
  // ======================================================

  function firstValue(ticket, ...keys) {

    for (const key of keys) {

      if (
        ticket[key] !== undefined &&
        ticket[key] !== null &&
        String(ticket[key]).trim()
      ) {

        return ticket[key];

      }

    }

    return "";

  }


  function normalizeStatus(status) {

    if (
      status === "pending" ||
      !STATUS_META[status]
    ) {

      return "open";

    }

    return status;

  }


  function getMillis(value) {

    if (!value) {
      return 0;
    }

    if (typeof value.toMillis === "function") {
      return value.toMillis();
    }

    if (typeof value.toDate === "function") {
      return value.toDate().getTime();
    }

    if (typeof value.seconds === "number") {
      return value.seconds * 1000;
    }

    const valueMillis =
      new Date(value).getTime();

    return Number.isNaN(valueMillis)
      ? 0
      : valueMillis;

  }


  function formatDate(value) {

    const millis = getMillis(value);

    return millis
      ? new Date(millis).toLocaleDateString("vi-VN")
      : (value || "—");

  }


  function escapeHTML(value) {

    const element =
      document.createElement("div");

    element.textContent =
      value == null
        ? ""
        : String(value);

    return element.innerHTML;

  }


  function setText(element, value) {

    if (element) {
      element.textContent = value;
    }

  }


  // ======================================================
  // NGÀY HIỆN TẠI
  // ======================================================

  setText(
    todayLabelEl,
    new Date().toLocaleDateString(
      "vi-VN",
      {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      }
    )
  );


  // ======================================================
  // TÊN HỌC VIÊN
  // ======================================================

  function updateWelcomeName(name) {

    if (!welcomeNameEl) {
      return;
    }

    const displayName =
      (name || "Học viên").trim();

    welcomeNameEl.textContent =
      displayName || "Học viên";

  }


  // ======================================================
  // RENDER TICKET
  // ======================================================

  function renderRecentTickets(tickets) {

    if (!recentListEl) {
      return;
    }

    if (!tickets.length) {

      recentListEl.innerHTML = `
        <div class="empty-state">
          Bạn chưa có ticket nào.
          Hãy tạo yêu cầu đầu tiên.
        </div>
      `;

      return;
    }


    recentListEl.innerHTML =
      tickets
        .slice(0, 5)
        .map(ticket => {

          const status =
            normalizeStatus(ticket.status);

          const meta =
            STATUS_META[status];

          const number =
            firstValue(
              ticket,
              "ticketNum",
              "ticket_num",
              "id"
            );

          const title =
            firstValue(
              ticket,
              "title",
              "subject"
            ) ||
            "Không có tiêu đề";

          const category =
            firstValue(
              ticket,
              "ticketCategory",
              "ticketCategoryId",
              "category"
            );

          const issue =
            firstValue(
              ticket,
              "ticketIssue",
              "ticketIssueId",
              "ticketType",
              "ticket_type"
            );

          const type =
            category &&
            issue &&
            category !== issue

              ? `${category} · ${issue}`

              : issue ||
                category ||
                "Khác";


          const query =
            encodeURIComponent(number);


          return `

            <a
              class="recent-item"
              href="/HV/chat-hv/trao-doi-ticket.html?ticket=${query}"
            >

              <span class="recent-code">
                ${escapeHTML(number)}
              </span>

              <span class="recent-title-wrap">

                <span
                  class="recent-title"
                  title="${escapeHTML(title)}"
                >
                  ${escapeHTML(title)}
                </span>

                <span class="recent-type">
                  ${escapeHTML(type)}
                </span>

              </span>

              <span
                class="status-badge ${meta.className}"
              >
                ${meta.label}
              </span>

              <span class="recent-date">
                ${escapeHTML(
                  firstValue(ticket, "date") ||
                  formatDate(ticket.createdAt)
                )}
              </span>

            </a>

          `;

        })
        .join("");

  }


  // ======================================================
  // FIREBASE
  // ======================================================

  const database =
    getDatabase();

  const authInstance =
    getAuth();


  if (!database) {

    setText(
      connectionLabelEl,
      "Chưa kết nối"
    );

    if (recentListEl) {

      recentListEl.innerHTML = `
        <div class="empty-state">
          Chưa cấu hình kết nối dữ liệu.
        </div>
      `;

    }

    return;

  }


  if (!authInstance) {

    setText(
      connectionLabelEl,
      "Chưa đăng nhập"
    );

    if (recentListEl) {

      recentListEl.innerHTML = `
        <div class="empty-state">
          Vui lòng đăng nhập để xem ticket.
        </div>
      `;

    }

    return;

  }


  // ======================================================
  // ĐỢI FIREBASE AUTH
  // ======================================================

  authInstance.onAuthStateChanged(async user => {

    // ----------------------------------------------------
    // CHƯA ĐĂNG NHẬP
    // ----------------------------------------------------

    if (!user) {

      updateWelcomeName("Học viên");

      setText(
        connectionLabelEl,
        "Chưa đăng nhập"
      );

      connectionDotEl?.classList.remove("live");


      setText(openTicketsEl, "0");
      setText(progressTicketsEl, "0");
      setText(resolvedTicketsEl, "0");
      setText(totalTicketsEl, "0");


      if (recentListEl) {

        recentListEl.innerHTML = `
          <div class="empty-state">
            Vui lòng đăng nhập để xem ticket của bạn.
          </div>
        `;

      }

      return;

    }


    // ----------------------------------------------------
    // ĐÃ ĐĂNG NHẬP
    // ----------------------------------------------------

    const currentUid =
      user.uid;


    console.log(
      "Học viên hiện tại:",
      currentUid
    );


    // ====================================================
    // LẤY PROFILE
    // ====================================================

    try {

      const userDoc =
        await database
          .collection("users")
          .doc(currentUid)
          .get();


      const userData =
        userDoc.exists
          ? userDoc.data()
          : {};


      const displayName =
        userData.name ||
        user.displayName ||
        "Học viên";


      updateWelcomeName(displayName);


    } catch (error) {

      console.error(
        "Không thể lấy thông tin học viên:",
        error
      );


      updateWelcomeName(
        user.displayName ||
        "Học viên"
      );

    }


    // ====================================================
    // CHỈ LẤY TICKET CỦA USER ĐANG ĐĂNG NHẬP
    // ====================================================

    let ticketQuery;


    try {

      ticketQuery =
        database
          .collection("tickets")
          .where(
            "studentId",
            "==",
            currentUid
          );


    } catch (error) {

      console.error(
        "Không thể tạo truy vấn ticket:",
        error
      );

      return;

    }


    // ====================================================
    // REALTIME TICKET
    // ====================================================

    ticketQuery.onSnapshot(

      snapshot => {

        connectionDotEl?.classList.add("live");

        setText(
          connectionLabelEl,
          "Realtime"
        );


        // ----------------------------------------------
        // CHỈ CÁC TICKET CỦA USER HIỆN TẠI
        // ----------------------------------------------

        const tickets =
          snapshot.docs
            .map(doc => ({
              id: doc.id,
              ...doc.data()
            }))
            .sort(
              (a, b) =>
                getMillis(b.createdAt) -
                getMillis(a.createdAt)
            );


        // ----------------------------------------------
        // ĐẾM STATUS
        // ----------------------------------------------

        const counts = {

          open: 0,

          in_progress: 0,

          resolved: 0,

          closed: 0

        };


        tickets.forEach(ticket => {

          const status =
            normalizeStatus(
              ticket.status
            );

          counts[status]++;

        });


        // ----------------------------------------------
        // HIỂN THỊ THỐNG KÊ
        // ----------------------------------------------

        setText(
          openTicketsEl,
          counts.open +
          counts.in_progress +
          counts.resolved
        );


        setText(
          progressTicketsEl,
          counts.in_progress
        );


        setText(
          resolvedTicketsEl,
          counts.resolved
        );


        setText(
          totalTicketsEl,
          tickets.length
        );


        // Tương thích giao diện cũ
        setText(
          document.getElementById(
            "completedTicketsCount"
          ),
          counts.closed +
          counts.resolved
        );


        // ----------------------------------------------
        // RENDER
        // ----------------------------------------------

        renderRecentTickets(
          tickets
        );


        console.log(
          `Đã tải ${tickets.length} ticket của user ${currentUid}`
        );

      },


      error => {

        console.error(
          "Không thể tải ticket của học viên:",
          error
        );


        connectionDotEl?.classList.remove(
          "live"
        );


        setText(
          connectionLabelEl,
          "Mất kết nối"
        );


        if (recentListEl) {

          recentListEl.innerHTML = `
            <div class="empty-state">
              Không thể tải ticket.
              Vui lòng kiểm tra kết nối và thử lại.
            </div>
          `;

        }

      }

    );

  });

});