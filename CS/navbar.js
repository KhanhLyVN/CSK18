(function () {
  "use strict";
  /* =========================================================
     CS NAVBAR
     ========================================================= */
  const COLLAPSE_KEY = "cs-navbar-collapsed";
  const MOBILE_BREAKPOINT = 860;
  const HOME_URL = "/CS/homepageCS/trangchu-cs.html";
  const LEADER_ROLES = new Set([
    "leader",
    "cs_leader",
    "team_leader",
    "group_leader",
    "manager",
    "cs_manager",
  ]);
  /* =========================================================
     ICONS
  ========================================================= */
  const icons = {
    home:
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
      '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>' +
      '<path d="M9 22V12h6v10"></path>' +
      "</svg>",
    tickets:
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
      '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z"></path>' +
      "</svg>",
    create:
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
      '<path d="M12 20h9"></path>' +
      '<path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"></path>' +
      "</svg>",
    groups:
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
      '<circle cx="9" cy="7" r="4"></circle>' +
      '<path d="M17 11a4 4 0 1 0-2.7-7"></path>' +
      '<path d="M2 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2"></path>' +
      '<path d="M17 15a4 4 0 0 1 4 4v2"></path>' +
      "</svg>",
    membergroups:
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
      '<path d="M17 20.5c1.4-.6 2.6-1.6 3.5-2.8V5.5A2.5 2.5 0 0 0 18 3H6A2.5 2.5 0 0 0 3.5 5.5v12A2.5 2.5 0 0 0 6 20h8.7"></path>' +
      '<path d="M7 8h10M7 12h6"></path>' +
      '<path d="M15 18h6"></path>' +
      '<path d="M18 15v6"></path>' +
      "</svg>",
    reports:
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
      '<path d="M3 3v18h18"></path>' +
      '<path d="m7 16 4-5 3 3 5-7"></path>' +
      "</svg>",
    faq:
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
      '<circle cx="12" cy="12" r="10"></circle>' +
      '<path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"></path>' +
      '<path d="M12 17h.01"></path>' +
      "</svg>",
    account:
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
      '<circle cx="12" cy="12" r="3"></circle>' +
      '<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6h.1A1.65 1.65 0 0 0 10 3.09V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9v.1A1.65 1.65 0 0 0 20.91 10H21a2 2 0 1 1 0 4h-.09A1.65 1.65 0 0 0 19.4 15Z"></path>' +
      "</svg>",
  };
  /* =========================================================
     MENU
  ========================================================= */
  const links = [
    {
      page: "home",
      href: HOME_URL,
      label: "Trang chủ",
    },
    {
      page: "tickets",
      href: "/CS/TicketManagement/cs-ticket.html",
      label: "Quản lý ticket",
    },
    {
      page: "create",
      href: "/CS/PhieuHoTroCS/phieuhotro-cs.html",
      label: "Tạo phiếu hỗ trợ",
    },
    {
      page: "groups",
      href: "/CS/Groups/group.html",
      label: "Nhóm của tôi",
      leaderOnly: true,
    },
    {
      page: "membergroups",
      href: "/CS/Groups/group-member.html",
      label: "Nhóm trao đổi",
      memberOnly: true,
    },
    {
      page: "reports",
      href: "/CS/Dashboard/cs-dashboard.html",
      label: "Báo cáo thống kê",
      leaderOnly: true,
    },
    {
      page: "faq",
      href: "/FAQs/CS-FAQ.html",
      label: "FAQs",
    },
    {
      page: "account",
      href: "/CS/account-CS.html",
      label: "Cài đặt hệ thống",
    },
  ];
  /* =========================================================
     HELPERS
  ========================================================= */
  const safeGet = (key) => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  };
  const safeSet = (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* ignore */
    }
  };
  const isMobile = () => {
    return window.innerWidth <= MOBILE_BREAKPOINT;
  };
  const normalizeRole = (value) => {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[\s-]+/g, "_");
  };
  const escapeHTML = (value) => {
    const node = document.createElement("div");
    node.textContent = value == null ? "" : String(value);
    return node.innerHTML;
  };
  const notificationTime = (value) => {
    const date = value?.toDate
      ? value.toDate()
      : value?.seconds
        ? new Date(value.seconds * 1000)
        : null;
    return date
      ? date.toLocaleString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
          day: "2-digit",
          month: "2-digit",
        })
      : "Vừa xong";
  };
  const getInitials = (name) => {
    const text = String(name || "U").trim();
    if (!text) return "U";
    const parts = text.split(/\s+/).filter(Boolean);
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };
  const timestampToDate = (value) => {
    if (!value) return null;
    if (typeof value.toDate === "function") {
      return value.toDate();
    }
    if (value.seconds) {
      return new Date(value.seconds * 1000);
    }
    if (value instanceof Date) {
      return value;
    }
    return null;
  };
  /* =========================================================
     CONTENT
  ========================================================= */
  function resolveContent(app) {
    return app.querySelector(
      ":scope > main, " +
        ":scope > .main, " +
        ":scope > .page, " +
        ":scope > .wrap, " +
        ":scope > [data-page-content]",
    );
  }
  function prepareLegacyShell(app) {
    let content = resolveContent(app);
    if (content) {
      return content;
    }
    const legacyBody = app.querySelector(":scope > .body");
    content = legacyBody?.querySelector(
      ":scope > main, " +
        ":scope > .main, " +
        ":scope > .page, " +
        ":scope > .wrap, " +
        ":scope > [data-page-content]",
    );
    if (!content) {
      return null;
    }
    app.querySelector(":scope > .topbar")?.remove();
    app.appendChild(content);
    legacyBody.remove();
    return content;
  }
  /* =========================================================
     ACTIVE PAGE
  ========================================================= */
  function activePage(visibleLinks) {
    return (
      document.body.dataset.navPage ||
      visibleLinks.find((link) =>
        window.location.pathname.endsWith(link.href.split("#")[0]),
      )?.page ||
      ""
    );
  }
  function menuMarkup(profile) {
    const visibleLinks = links.filter(
      (link) =>
        (!link.leaderOnly || profile.isLeader) &&
        (!link.memberOnly || (!profile.isLeader && profile.isGroupMember)),
    );
    const page = activePage(visibleLinks);
    return visibleLinks
      .map((link) => {
        const active = link.page === page;
        return `
          <a
            data-nav-page="${link.page}"
            href="${link.href}"
            ${active ? 'class="active" aria-current="page"' : ""}
          >
            ${icons[link.page]}
            <span>${link.label}</span>
          </a>
        `;
      })
      .join("");
  }
  /* =========================================================
     FIREBASE PROFILE
  ========================================================= */
  async function getProfile(user) {
    const base = {
      uid: user.uid,
      email: user.email || "",
      name: user.displayName || user.email || "CS",
      isLeader: false,
      isGroupMember: false,
      raw: {},
    };
    if (typeof firebase === "undefined" || !firebase.firestore) {
      return base;
    }
    const database = firebase.firestore();
    const users = database.collection("users");
    try {
      let snapshot = await users.doc(user.uid).get();
      if (!snapshot.exists) {
        const byUid = await users.where("uid", "==", user.uid).limit(1).get();
        snapshot = byUid.docs[0] || snapshot;
      }
      const data = snapshot.exists ? snapshot.data() || {} : {};
      const values = [
        data.role,
        data.accountType,
        data.leaderRole,
        data.teamRole,
        data.position,
      ].map(normalizeRole);
      const profile = {
        ...base,
        name: data.name || data.displayName || base.name,
        raw: data,
      };
      profile.isLeader = Boolean(
        data.isLeader ||
        data.isCSLeader ||
        values.some((value) => LEADER_ROLES.has(value)),
      );
      if (!profile.isLeader) {
        const groups = await database
          .collection("groups")
          .where("leaderUid", "==", user.uid)
          .limit(1)
          .get();
        profile.isLeader = !groups.empty;
      }
      if (!profile.isLeader) {
        const memberGroups = await database
          .collection("groups")
          .where("memberIds", "array-contains", user.uid)
          .limit(1)
          .get();
        profile.isGroupMember = !memberGroups.empty;
      }
      return profile;
    } catch (error) {
      console.warn("Không thể tải quyền Customer Success:", error);
      return base;
    }
  }
  /* =========================================================
     PAGE PERMISSION
  ========================================================= */
  function enforceLeaderPage(profile) {
    if (document.body.dataset.csLeaderOnly === "true" && !profile.isLeader) {
      window.location.replace(HOME_URL);
      return true;
    }
    return false;
  }
  function enforceMemberPage(profile) {
    if (
      document.body.dataset.csMemberOnly === "true" &&
      (profile.isLeader || !profile.isGroupMember)
    ) {
      window.location.replace(HOME_URL);
      return true;
    }
    return false;
  }
  /* =========================================================
     INIT NAVBAR
  ========================================================= */
  function initNavbar() {
    let app = document.querySelector(".app");
    if (!app) {
      const standalone = document.querySelector(
        "body > main, " + "body > .wrap, " + "body > [data-page-content]",
      );
      if (!standalone) {
        return;
      }
      app = document.createElement("div");
      app.className = "app";
      const main = document.createElement("main");
      main.className = "cs-navbar-standalone";
      document.body.insertBefore(app, standalone);
      app.appendChild(main);
      main.appendChild(standalone);
    }
    if (app.dataset.csNavbarReady === "true") {
      return;
    }
    const content = prepareLegacyShell(app);
    if (!content) {
      return;
    }
    app.dataset.csNavbarReady = "true";
    /* =====================================================
       TOPBAR
    ===================================================== */
    const topbar = document.createElement("header");
    topbar.className = "cs-navbar-topbar";
    topbar.innerHTML = `
      <button
        class="cs-navbar-toggle"
        type="button"
        aria-label="Mở điều hướng"
        aria-expanded="false"
        aria-controls="csNavbarSidebar"
      >☰</button>
      <a
        class="cs-navbar-brand"
        href="/CS/homepageCS/trangchu-cs.html"
        aria-label="Trang chủ Customer Success"
      >
        <span class="cs-navbar-mark">
          CS
        </span>
        <span class="cs-navbar-brand-copy">
          <strong>
            Hệ thống Quản lý Hỗ trợ
          </strong>
          <small id="csNavbarRoleText">
            Đang kiểm tra quyền truy cập…
          </small>
        </span>
      </a>
      <div class="cs-navbar-actions">
        <!-- CHAT -->
        <div class="cs-chat-wrap">
          <button
            class="cs-navbar-chat-button"
            id="csChatButton"
            type="button"
            aria-label="Mở tin nhắn"
            aria-expanded="false"
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                d="M21 11.5a8 8 0 0 1-8 8H8l-5 3v-11a8 8 0 0 1 8-8h2a8 8 0 0 1 8 8Z"
              ></path>
            </svg>
            <span
              class="cs-navbar-chat-count"
              id="csChatCount"
              hidden
            >0</span>
          </button>
        </div>
        <!-- NOTIFICATION -->
        <button
          class="cs-navbar-notification-button"
          id="csNotificationButton"
          type="button"
          aria-label="Mở thông báo"
          aria-expanded="false"
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"
            ></path>
            <path
              d="M10 21h4"
            ></path>
          </svg>
          <span
            class="cs-navbar-notification-count"
            id="csNotificationCount"
            hidden
          >0</span>
        </button>
      </div>
    `;
    /* =====================================================
       LAYOUT
    ===================================================== */
    const layout = document.createElement("div");
    layout.className = "cs-navbar-layout";
    const sidebar = document.createElement("aside");
    sidebar.className = "cs-navbar-sidebar";
    sidebar.id = "csNavbarSidebar";
    sidebar.setAttribute("aria-label", "Điều hướng Customer Success");
    const overlay = document.createElement("button");
    overlay.type = "button";
    overlay.className = "cs-navbar-overlay";
    overlay.setAttribute("aria-label", "Đóng điều hướng");
    content.classList.add("cs-navbar-content");
    app.insertBefore(topbar, content);
    app.insertBefore(layout, content);
    layout.append(sidebar, content);
    document.body.appendChild(overlay);
    /* =====================================================
       NOTIFICATION PANEL
    ===================================================== */
    const notificationPanel = document.createElement("aside");
    notificationPanel.className = "cs-notification-panel";
    notificationPanel.id = "csNotificationPanel";
    notificationPanel.setAttribute("aria-hidden", "true");
    notificationPanel.innerHTML = `
      <div class="cs-notification-head">
        <div>
          <span>
            CS CẬP NHẬT
          </span>
          <h2>
            Thông báo
          </h2>
          <p>
            Phân công ticket và trao đổi nhóm mới.
          </p>
        </div>
        <button
          id="csNotificationClose"
          type="button"
          aria-label="Đóng thông báo"
        >
          ×
        </button>
      </div>
      <div class="cs-notification-toolbar">
        <strong id="csNotificationUnreadLabel">
          Chưa có thông báo
        </strong>
        <button
          id="csNotificationReadAll"
          type="button"
          disabled
        >
          Đọc tất cả
        </button>
      </div>
      <div
        class="cs-notification-list"
        id="csNotificationList"
      ></div>
      <div
        class="cs-notification-empty"
        id="csNotificationEmpty"
      >
        Khi Leader phân công ticket hoặc thành viên Group nhắn tin,
        thông báo sẽ xuất hiện tại đây.
      </div>
    `;
    document.body.appendChild(notificationPanel);
    const notificationBackdrop = document.createElement("button");
    notificationBackdrop.type = "button";
    notificationBackdrop.className = "cs-notification-backdrop";
    notificationBackdrop.id = "csNotificationBackdrop";
    notificationBackdrop.setAttribute("aria-label", "Đóng thông báo");
    notificationBackdrop.hidden = true;
    document.body.appendChild(notificationBackdrop);
    /* =====================================================
       CHAT PANEL
    ===================================================== */
    const chatPanel = document.createElement("aside");
    chatPanel.className = "cs-chat-panel";
    chatPanel.id = "csChatPanel";
    chatPanel.setAttribute("aria-hidden", "true");
    chatPanel.innerHTML = `
      <div class="cs-chat-panel-head">
        <div>
          <strong>
            Tin nhắn
          </strong>
          <small id="csChatStatus">
            Chọn người để bắt đầu trò chuyện
          </small>
        </div>
        <button
          class="cs-chat-close"
          id="csChatClose"
          type="button"
          aria-label="Đóng tin nhắn"
        >
          ×
        </button>
      </div>
      <div
        class="cs-chat-list-view"
        id="csChatListView"
      >
        <label class="cs-chat-search">
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              cx="11"
              cy="11"
              r="6"
            ></circle>
            <path
              d="m20 20-4-4"
            ></path>
          </svg>
          <input
            id="csChatSearch"
            type="search"
            placeholder="Tìm tên hoặc email..."
            autocomplete="off"
          >
        </label>
        <div
          class="cs-chat-user-list"
          id="csChatUserList"
        >
          <p class="cs-chat-state">
            Đang tải danh sách người dùng...
          </p>
        </div>
      </div>
      <div
        class="cs-chat-conversation"
        id="csChatConversation"
        hidden
      >
        <div class="cs-chat-conversation-head">
          <button
            class="cs-chat-back"
            id="csChatBack"
            type="button"
            aria-label="Quay lại"
          >
            ←
          </button>
          <span
            class="cs-chat-avatar"
            id="csChatAvatar"
          >
            U
          </span>
          <div>
            <strong id="csChatName">
              Trò chuyện
            </strong>
            <small id="csChatRole">
              Đang hoạt động
            </small>
          </div>
        </div>
        <div
          class="cs-chat-messages"
          id="csChatMessages"
        >
          <p class="cs-chat-state">
            Hãy gửi tin nhắn đầu tiên.
          </p>
        </div>
        <form
          class="cs-chat-composer"
          id="csChatForm"
        >
          <textarea
            id="csChatInput"
            rows="1"
            maxlength="2000"
            placeholder="Nhập tin nhắn..."
            required
          ></textarea>
          <button
            class="cs-chat-send"
            type="submit"
            aria-label="Gửi tin nhắn"
          >
            ➤
          </button>
        </form>
      </div>
    `;
    document.body.appendChild(chatPanel);
    const chatBackdrop = document.createElement("button");
    chatBackdrop.type = "button";
    chatBackdrop.className = "cs-chat-backdrop";
    chatBackdrop.id = "csChatBackdrop";
    chatBackdrop.setAttribute("aria-label", "Đóng tin nhắn");
    chatBackdrop.hidden = true;
    document.body.appendChild(chatBackdrop);
    /* =====================================================
       MOBILE NAV
    ===================================================== */
    const toggle = topbar.querySelector(".cs-navbar-toggle");
    const closeMobile = () => {
      layout.classList.remove("is-mobile-open");
      overlay.classList.remove("is-visible");
      toggle.setAttribute("aria-expanded", "false");
    };
    const syncLayout = () => {
      if (isMobile()) {
        layout.classList.remove("is-collapsed");
        closeMobile();
      } else {
        layout.classList.toggle(
          "is-collapsed",
          safeGet(COLLAPSE_KEY) === "true",
        );
        toggle.setAttribute(
          "aria-expanded",
          String(!layout.classList.contains("is-collapsed")),
        );
      }
    };
    toggle.addEventListener("click", () => {
      if (isMobile()) {
        const opening = !layout.classList.contains("is-mobile-open");
        layout.classList.toggle("is-mobile-open", opening);
        overlay.classList.toggle("is-visible", opening);
        toggle.setAttribute("aria-expanded", String(opening));
      } else {
        const collapsed = !layout.classList.contains("is-collapsed");
        layout.classList.toggle("is-collapsed", collapsed);
        safeSet(COLLAPSE_KEY, String(collapsed));
        toggle.setAttribute("aria-expanded", String(!collapsed));
      }
    });
    overlay.addEventListener("click", closeMobile);
    sidebar.addEventListener("click", (event) => {
      if (event.target.closest("a")) {
        closeMobile();
      }
    });
    window.addEventListener("resize", syncLayout, {
      passive: true,
    });
    syncLayout();
    /* =====================================================
       NOTIFICATION
    ===================================================== */
    const notificationButton = topbar.querySelector("#csNotificationButton");
    const notificationCount = topbar.querySelector("#csNotificationCount");
    const notificationList = notificationPanel.querySelector(
      "#csNotificationList",
    );
    const notificationEmpty = notificationPanel.querySelector(
      "#csNotificationEmpty",
    );
    const notificationUnreadLabel = notificationPanel.querySelector(
      "#csNotificationUnreadLabel",
    );
    const notificationReadAll = notificationPanel.querySelector(
      "#csNotificationReadAll",
    );
    const notificationClose = notificationPanel.querySelector(
      "#csNotificationClose",
    );
    let notificationRecords = [];
    let notificationUid = "";
    let unsubscribeNotifications = null;
    const closeNotifications = () => {
      notificationPanel.classList.remove("open");
      notificationPanel.setAttribute("aria-hidden", "true");
      notificationButton.setAttribute("aria-expanded", "false");
      notificationBackdrop.classList.remove("show");
      window.setTimeout(() => {
        notificationBackdrop.hidden = true;
      }, 180);
    };
    const openNotifications = () => {
      closeChat();
      notificationPanel.classList.add("open");
      notificationPanel.setAttribute("aria-hidden", "false");
      notificationButton.setAttribute("aria-expanded", "true");
      notificationBackdrop.hidden = false;
      requestAnimationFrame(() => {
        notificationBackdrop.classList.add("show");
      });
    };
    const renderNotifications = () => {
      const unread = notificationRecords.filter((item) => !item.read);
      notificationCount.hidden = unread.length === 0;
      notificationCount.textContent =
        unread.length > 99 ? "99+" : String(unread.length);
      notificationUnreadLabel.textContent = unread.length
        ? `${unread.length} chưa đọc`
        : notificationRecords.length
          ? "Đã đọc tất cả"
          : "Chưa có thông báo";
      notificationReadAll.disabled = unread.length === 0;
      notificationEmpty.classList.toggle(
        "show",
        notificationRecords.length === 0,
      );
      notificationList.innerHTML = notificationRecords
        .map(
          (item) => `
              <button
                class="cs-notification-item${item.read ? " is-read" : ""}"
                type="button"
                data-notification-id="${escapeHTML(item.id)}"
                data-notification-link="${escapeHTML(item.link || "")}"
              >
                <span class="cs-notification-icon">
                  ${item.type === "group_message" ? "✦" : "✓"}
                </span>
                <span class="cs-notification-copy">
                  <strong>
                    ${escapeHTML(item.title || "Thông báo Customer Success")}
                  </strong>
                  <b>
                    ${escapeHTML(item.preview || "Có cập nhật mới.")}
                  </b>
                  <small>
                    ${escapeHTML(notificationTime(item.createdAt))}
                  </small>
                </span>
              </button>
            `,
        )
        .join("");
    };
    const markNotificationRead = async (id) => {
      if (
        !notificationUid ||
        !id ||
        typeof firebase === "undefined" ||
        !firebase.firestore
      ) {
        return;
      }
      const item = notificationRecords.find((record) => record.id === id);
      if (!item || item.read) {
        return;
      }
      try {
        await firebase
          .firestore()
          .collection("csNotifications")
          .doc(notificationUid)
          .collection("items")
          .doc(id)
          .set(
            {
              read: true,
              readAt: firebase.firestore.FieldValue.serverTimestamp(),
            },
            {
              merge: true,
            },
          );
      } catch (error) {
        console.warn("Không thể đánh dấu thông báo đã đọc:", error);
      }
    };
    const bindNotifications = (profile) => {
      notificationUid = profile?.uid || "";
      if (unsubscribeNotifications) {
        unsubscribeNotifications();
        unsubscribeNotifications = null;
      }
      notificationRecords = [];
      renderNotifications();
      if (
        !notificationUid ||
        typeof firebase === "undefined" ||
        !firebase.firestore
      ) {
        return;
      }
      unsubscribeNotifications = firebase
        .firestore()
        .collection("csNotifications")
        .doc(notificationUid)
        .collection("items")
        .orderBy("createdAt", "desc")
        .limit(50)
        .onSnapshot(
          (snapshot) => {
            notificationRecords = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
            renderNotifications();
          },
          (error) => {
            console.warn("Không thể đồng bộ thông báo CS:", error);
          },
        );
    };
    notificationButton.addEventListener("click", () => {
      if (notificationPanel.classList.contains("open")) {
        closeNotifications();
      } else {
        openNotifications();
      }
    });
    notificationClose.addEventListener("click", closeNotifications);
    notificationBackdrop.addEventListener("click", closeNotifications);
    notificationList.addEventListener("click", async (event) => {
      const item = event.target.closest("[data-notification-id]");
      if (!item) {
        return;
      }
      const id = item.dataset.notificationId;
      const link = item.dataset.notificationLink;
      await markNotificationRead(id);
      if (link) {
        window.location.href = link;
      }
    });
    notificationReadAll.addEventListener("click", async () => {
      const unread = notificationRecords.filter((item) => !item.read);
      if (
        !unread.length ||
        !notificationUid ||
        typeof firebase === "undefined" ||
        !firebase.firestore
      ) {
        return;
      }
      notificationReadAll.disabled = true;
      try {
        const database = firebase.firestore();
        const batch = database.batch();
        unread.forEach((item) => {
          batch.set(
            database
              .collection("csNotifications")
              .doc(notificationUid)
              .collection("items")
              .doc(item.id),
            {
              read: true,
              readAt: firebase.firestore.FieldValue.serverTimestamp(),
            },
            {
              merge: true,
            },
          );
        });
        await batch.commit();
      } catch (error) {
        console.warn("Không thể đánh dấu toàn bộ thông báo đã đọc:", error);
      }
    });
    /* =====================================================
       CHAT
    ===================================================== */
    const chatButton = topbar.querySelector("#csChatButton");
    const chatCount = topbar.querySelector("#csChatCount");
    const chatClose = chatPanel.querySelector("#csChatClose");
    const chatListView = chatPanel.querySelector("#csChatListView");
    const chatConversation = chatPanel.querySelector("#csChatConversation");
    const chatBack = chatPanel.querySelector("#csChatBack");
    const chatSearch = chatPanel.querySelector("#csChatSearch");
    const chatUserList = chatPanel.querySelector("#csChatUserList");
    const chatAvatar = chatPanel.querySelector("#csChatAvatar");
    const chatName = chatPanel.querySelector("#csChatName");
    const chatRole = chatPanel.querySelector("#csChatRole");
    const chatMessages = chatPanel.querySelector("#csChatMessages");
    const chatForm = chatPanel.querySelector("#csChatForm");
    const chatInput = chatPanel.querySelector("#csChatInput");
    const chatStatus = chatPanel.querySelector("#csChatStatus");

    let chatUid = "";
    let chatProfile = null;
    let chatUsers = [];
    let selectedChatUser = null;
    let unsubscribeChatMessages = null;
    let unsubscribeChatRooms = null;
    let unreadChatCount = 0;
    
    const makeChatRoomId = (uidA, uidB) => {
      return [String(uidA), String(uidB)].sort().join("_");
    };
    
    function isFirestoreReady() {
      return typeof firebase !== "undefined" && Boolean(firebase.firestore);
    }
    
    function getChatDatabase() {
      return isFirestoreReady() ? firebase.firestore() : null;
    }
    
    function getTimestampDate(value) {
      if (!value) return null;
    
      if (typeof value.toDate === "function") {
        return value.toDate();
      }
    
      if (typeof value.seconds === "number") {
        return new Date(value.seconds * 1000);
      }
    
      if (value instanceof Date) {
        return value;
      }
    
      return null;
    }
    
    function closeChatConversation() {
      if (unsubscribeChatMessages) {
        unsubscribeChatMessages();
        unsubscribeChatMessages = null;
      }
    
      selectedChatUser = null;
      chatConversation.hidden = true;
      chatListView.hidden = false;
      chatMessages.innerHTML = `
        <p class="cs-chat-state">Hãy gửi tin nhắn đầu tiên.</p>
      `;
    }
    
    function closeChat() {
      chatPanel.setAttribute("aria-hidden", "true");
      chatButton.setAttribute("aria-expanded", "false");
      chatBackdrop.hidden = true;
      chatBackdrop.classList.remove("show");
      closeChatConversation();
    }
    
    function openChat() {
      closeNotifications();
      chatPanel.setAttribute("aria-hidden", "false");
      chatButton.setAttribute("aria-expanded", "true");
      chatBackdrop.hidden = false;
    
      requestAnimationFrame(() => {
        chatBackdrop.classList.add("show");
      });
    
      loadChatUsers();
    }
    
    /* =====================================================
       LOAD CHAT USERS
       Không dùng orderBy cùng array-contains để tránh composite index.
       Dữ liệu được sắp xếp bằng chatUsers.sort() phía trình duyệt.
    ===================================================== */
    async function loadChatUsers() {
      if (!isFirestoreReady()) {
        chatUserList.innerHTML = `
          <p class="cs-chat-state">Firebase chưa được khởi tạo.</p>
        `;
        return;
      }
    
      if (!chatUid) {
        chatUserList.innerHTML = `
          <p class="cs-chat-state">Chưa xác định tài khoản CS.</p>
        `;
        return;
      }
    
      chatUserList.innerHTML = `
        <p class="cs-chat-state">Đang tải cuộc trò chuyện...</p>
      `;
    
      const database = getChatDatabase();
    
      try {
        /*
         * Không đặt orderBy("updatedAt") ở đây.
         * Query này chỉ dùng array-contains, không cần composite index.
         */
        const chatSnapshot = await database
          .collection("chats")
          .where("participants", "array-contains", chatUid)
          .limit(100)
          .get();
    
        const userSnapshot = await database
          .collection("users")
          .limit(300)
          .get();
    
        const userMap = new Map();
    
        userSnapshot.docs.forEach((doc) => {
          const data = doc.data() || {};
          const uid = String(data.uid || doc.id);
    
          if (!uid || uid === String(chatUid)) {
            return;
          }
    
          userMap.set(uid, {
            uid,
            id: doc.id,
            name:
              data.name ||
              data.displayName ||
              data.fullName ||
              data.email ||
              "Người dùng",
            email: data.email || "",
            role:
              data.role ||
              data.accountType ||
              data.position ||
              "CS",
            avatar:
              data.avatar ||
              data.photoURL ||
              data.photoUrl ||
              "",
          });
        });
    
        const chatMap = new Map();
    
        chatSnapshot.docs.forEach((doc) => {
          const data = doc.data() || {};
          const participants = Array.isArray(data.participants)
            ? data.participants.map(String)
            : [];
    
          const otherUid = participants.find(
            (uid) => uid !== String(chatUid),
          );
    
          if (!otherUid) {
            return;
          }
    
          const participantNames = data.participantNames || {};
          const roomName = participantNames[otherUid] || "";
          const user = userMap.get(otherUid);
    
          chatMap.set(otherUid, {
            uid: otherUid,
            id: user?.id || otherUid,
            name:
              roomName ||
              user?.name ||
              user?.email ||
              "Người dùng",
            email:
              user?.email ||
              (roomName && roomName.includes("@") ? roomName : ""),
            role: user?.role || "Customer Success",
            avatar: user?.avatar || "",
            lastMessage: data.lastMessage || "",
            lastMessageBy:
              data.lastMessageBy ||
              data.lastMessageSenderId ||
              "",
            updatedAt: data.updatedAt || null,
            roomId: doc.id,
            hasRoom: true,
          });
        });
    
        userMap.forEach((user, uid) => {
          if (chatMap.has(uid)) {
            return;
          }
    
          chatMap.set(uid, {
            ...user,
            lastMessage: "",
            lastMessageBy: "",
            updatedAt: null,
            roomId: makeChatRoomId(chatUid, uid),
            hasRoom: false,
          });
        });
    
        chatUsers = Array.from(chatMap.values());
    
        chatUsers.sort((a, b) => {
          if (a.hasRoom && !b.hasRoom) return -1;
          if (!a.hasRoom && b.hasRoom) return 1;
    
          const dateA = getTimestampDate(a.updatedAt);
          const dateB = getTimestampDate(b.updatedAt);
    
          return (
            (dateB?.getTime() || 0) -
            (dateA?.getTime() || 0)
          );
        });
    
        renderChatUsers();
      } catch (error) {
        console.error("Không thể tải danh sách chat:", error);
    
        /* Fallback: vẫn tải danh sách users nếu query chats gặp lỗi. */
        try {
          const userSnapshot = await database
            .collection("users")
            .limit(300)
            .get();
    
          chatUsers = userSnapshot.docs
            .map((doc) => {
              const data = doc.data() || {};
              const uid = String(data.uid || doc.id);
    
              return {
                uid,
                id: doc.id,
                name:
                  data.name ||
                  data.displayName ||
                  data.fullName ||
                  data.email ||
                  "Người dùng",
                email: data.email || "",
                role:
                  data.role ||
                  data.accountType ||
                  data.position ||
                  "CS",
                avatar:
                  data.avatar ||
                  data.photoURL ||
                  data.photoUrl ||
                  "",
                lastMessage: "",
                lastMessageBy: "",
                updatedAt: null,
                roomId: makeChatRoomId(chatUid, uid),
                hasRoom: false,
              };
            })
            .filter((user) => user.uid !== String(chatUid));
    
          renderChatUsers();
        } catch (fallbackError) {
          console.error(
            "Không thể tải danh sách người dùng:",
            fallbackError,
          );
    
          chatUserList.innerHTML = `
            <p class="cs-chat-state">
              Không thể tải danh sách người dùng.
            </p>
          `;
        }
      }
    }
    
    function renderChatUsers() {
      const keyword = String(chatSearch.value || "")
        .trim()
        .toLowerCase();
    
      const filtered = chatUsers.filter((user) => {
        if (!keyword) return true;
    
        return (
          String(user.name || "")
            .toLowerCase()
            .includes(keyword) ||
          String(user.email || "")
            .toLowerCase()
            .includes(keyword)
        );
      });
    
      if (!filtered.length) {
        chatUserList.innerHTML = `
          <p class="cs-chat-state">Không tìm thấy người dùng.</p>
        `;
        return;
      }
    
      chatUserList.innerHTML = filtered
        .map((user) => {
          const initials = getInitials(user.name);
          const lastMessage = String(user.lastMessage || "");
          const preview =
            lastMessage.length > 45
              ? `${lastMessage.slice(0, 45)}...`
              : lastMessage;
          const isMine = user.lastMessageBy === chatUid;
    
          return `
            <button
              type="button"
              class="cs-chat-user ${user.hasRoom ? "has-chat" : ""}"
              data-chat-user-id="${escapeHTML(user.uid)}"
            >
              <span class="cs-chat-avatar">
                ${
                  user.avatar
                    ? `<img src="${escapeHTML(user.avatar)}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;">`
                    : escapeHTML(initials)
                }
              </span>
              <span class="cs-chat-user-info">
                <strong>${escapeHTML(user.name)}</strong>
                <small>
                  ${
                    preview
                      ? `${isMine ? "Bạn: " : ""}${escapeHTML(preview)}`
                      : escapeHTML(
                          user.email || user.role || "Customer Success",
                        )
                  }
                </small>
              </span>
              ${
                user.hasRoom
                  ? `<span class="cs-chat-user-status" title="Đã có cuộc trò chuyện"></span>`
                  : ""
              }
            </button>
          `;
        })
        .join("");
    }
    
    /* =====================================================
       OPEN CONVERSATION
       Đọc cả room ID cũ (_) và room ID mới (__)
    ===================================================== */
    async function openConversation(user) {
      if (!user || !chatUid || !isFirestoreReady()) {
        return;
      }

      selectedChatUser = user;
      chatListView.hidden = true;
      chatConversation.hidden = false;
      chatName.textContent = user.name || "Trò chuyện";
      chatRole.textContent = user.role || user.email || "Customer Success";
      chatAvatar.textContent = getInitials(user.name);
      chatStatus.textContent = `Đang trò chuyện với ${user.name}`;
      chatMessages.innerHTML = `
        <p class="cs-chat-state">Đang tải tin nhắn...</p>
      `;

      if (unsubscribeChatMessages) {
        unsubscribeChatMessages();
        unsubscribeChatMessages = null;
      }

      const database = getChatDatabase();
      const roomIds = Array.from(new Set([
        makeChatRoomId(chatUid, user.uid),
        [String(chatUid), String(user.uid)].sort().join("__"),
        [String(chatUid), String(user.uid)].sort().join("_"),
      ]));

      const messageMap = new Map();
      const unsubscribers = [];

      const getMillis = (value) => {
        if (!value) return 0;
        if (typeof value.toMillis === "function") return value.toMillis();
        if (typeof value.toDate === "function") return value.toDate().getTime();
        if (typeof value.seconds === "number") return value.seconds * 1000;
        return value instanceof Date ? value.getTime() : 0;
      };

      const renderAllMessages = () => {
        const rows = Array.from(messageMap.values()).sort(
          (a, b) => getMillis(a.createdAt) - getMillis(b.createdAt),
        );

        chatMessages.innerHTML = "";

        if (!rows.length) {
          chatMessages.innerHTML = `
            <p class="cs-chat-state">Hãy gửi tin nhắn đầu tiên.</p>
          `;
          return;
        }

        rows.forEach((data) => {
          const senderId =
            data.senderId ||
            data.senderUID ||
            data.from ||
            data.sender ||
            "";
          const text = data.text || data.message || data.content || "";
          const bubble = document.createElement("div");

          bubble.className = "cs-chat-bubble";
          if (String(senderId) === String(chatUid)) {
            bubble.classList.add("mine");
          }
          bubble.textContent = String(text);
          chatMessages.appendChild(bubble);
        });

        requestAnimationFrame(() => {
          chatMessages.scrollTop = chatMessages.scrollHeight;
        });
      };

      const subscribeRoom = (roomId) => {
        const messagesRef = database
          .collection("chats")
          .doc(roomId)
          .collection("messages");

        const unsubscribe = messagesRef
          .orderBy("createdAt", "asc")
          .onSnapshot(
            (snapshot) => {
              snapshot.forEach((doc) => {
                messageMap.set(`${roomId}/${doc.id}`, doc.data() || {});
              });
              renderAllMessages();
            },
            (error) => {
              console.warn(
                `[CHAT] Không đọc được room ${roomId} bằng orderBy:`,
                error,
              );

              /* Dữ liệu cũ có thể thiếu createdAt. */
              messagesRef
                .get()
                .then((snapshot) => {
                  snapshot.forEach((doc) => {
                    messageMap.set(`${roomId}/${doc.id}`, doc.data() || {});
                  });
                  renderAllMessages();
                })
                .catch((fallbackError) => {
                  console.error(
                    `[CHAT] Không đọc được messages/${roomId}:`,
                    fallbackError,
                  );
                  renderAllMessages();
                });
            },
          );

        unsubscribers.push(unsubscribe);
      };

      roomIds.forEach(subscribeRoom);

      unsubscribeChatMessages = () => {
        unsubscribers.forEach((unsubscribe) => {
          try {
            unsubscribe();
          } catch (error) {
            console.warn("[CHAT] Không thể hủy listener:", error);
          }
        });
      };

      try {
        await database
          .collection("chats")
          .doc(makeChatRoomId(chatUid, user.uid))
          .set(
            {
              participants: firebase.firestore.FieldValue.arrayUnion(
                chatUid,
                user.uid,
              ),
              participantNames: {
                [chatUid]: chatProfile?.name || chatProfile?.email || "CS",
                [user.uid]: user.name || user.email || "Người dùng",
              },
              lastMessageReadBy: chatUid,
              lastMessageReadAt:
                firebase.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true },
          );
      } catch (error) {
        console.warn("[CHAT] Không thể cập nhật trạng thái đã đọc:", error);
      }
    }

    function renderChatMessages(snapshot) {
      if (!snapshot || snapshot.empty) {
        chatMessages.innerHTML = `
          <p class="cs-chat-state">Hãy gửi tin nhắn đầu tiên.</p>
        `;
        return;
      }

      chatMessages.innerHTML = "";
      snapshot.docs.forEach((doc) => {
        const data = doc.data() || {};
        const senderId =
          data.senderId || data.senderUID || data.from || data.sender || "";
        const text = data.text || data.message || data.content || "";
        const bubble = document.createElement("div");

        bubble.className = "cs-chat-bubble";
        if (String(senderId) === String(chatUid)) {
          bubble.classList.add("mine");
        }
        bubble.textContent = String(text);
        chatMessages.appendChild(bubble);
      });

      requestAnimationFrame(() => {
        chatMessages.scrollTop = chatMessages.scrollHeight;
      });
    }

    /* =====================================================
       SEND MESSAGE
    ===================================================== */
    chatForm.addEventListener("submit", async (event) => {
      event.preventDefault();
    
      const text = String(chatInput.value || "").trim();
    
      if (!text || !chatUid || !selectedChatUser || !isFirestoreReady()) {
        return;
      }
    
      const database = getChatDatabase();
      const roomId = makeChatRoomId(chatUid, selectedChatUser.uid);
      const roomRef = database.collection("chats").doc(roomId);
      const sendButton = chatForm.querySelector(".cs-chat-send");
    
      if (sendButton) {
        sendButton.disabled = true;
      }
    
      chatInput.value = "";
    
      try {
        await roomRef.set(
          {
            participants: firebase.firestore.FieldValue.arrayUnion(
              chatUid,
              selectedChatUser.uid,
            ),
            participantIds: [chatUid, selectedChatUser.uid],
            participantNames: {
              [chatUid]:
                chatProfile?.name ||
                chatProfile?.email ||
                "CS",
              [selectedChatUser.uid]:
                selectedChatUser.name ||
                selectedChatUser.email ||
                "Người dùng",
            },
            lastMessage: text,
            lastMessageBy: chatUid,
            lastMessageSenderId: chatUid,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastMessageReadBy: chatUid,
          },
          { merge: true },
        );
    
        await roomRef.collection("messages").add({
          text,
          senderId: chatUid,
          senderName: chatProfile?.name || "CS",
          receiverId: selectedChatUser.uid,
          receiverName: selectedChatUser.name || "",
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          read: false,
        });
    
        try {
          const notificationId = `${roomId}_${Date.now()}`;
    
          await database
            .collection("csNotifications")
            .doc(selectedChatUser.uid)
            .collection("items")
            .doc(notificationId)
            .set({
              type: "chat_message",
              title: chatProfile?.name || "Customer Success",
              preview:
                text.length > 100
                  ? `${text.slice(0, 100)}...`
                  : text,
              link: window.location.pathname,
              read: false,
              createdAt:
                firebase.firestore.FieldValue.serverTimestamp(),
              senderId: chatUid,
              roomId,
            });
        } catch (notificationError) {
          console.warn(
            "Không thể tạo notification chat:",
            notificationError,
          );
        }
      } catch (error) {
        console.error("Không thể gửi tin nhắn:", error);
        chatInput.value = text;
      } finally {
        if (sendButton) {
          sendButton.disabled = false;
        }
        chatInput.focus();
      }
    });
    
    /* =====================================================
       EVENTS
    ===================================================== */
    chatUserList.addEventListener("click", (event) => {
      const button = event.target.closest("[data-chat-user-id]");
      if (!button) return;
    
      const uid = button.dataset.chatUserId;
      const user = chatUsers.find(
        (item) => String(item.uid) === String(uid),
      );
    
      if (user) {
        openConversation(user);
      }
    });
    
    chatSearch.addEventListener("input", renderChatUsers);
    
    chatBack.addEventListener("click", () => {
      closeChatConversation();
      loadChatUsers();
    });
    
    chatButton.addEventListener("click", () => {
      const isOpen = chatPanel.getAttribute("aria-hidden") === "false";
    
      if (isOpen) {
        closeChat();
      } else {
        openChat();
      }
    });
    
    chatClose.addEventListener("click", closeChat);
    chatBackdrop.addEventListener("click", closeChat);
    
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeMobile();
        closeNotifications();
        closeChat();
      }
    });
    
    /* =====================================================
       UNREAD CHAT BADGE
       Query này chỉ dùng array-contains, không cần composite index.
    ===================================================== */
    function bindChatUnread(profile) {
      if (unsubscribeChatRooms) {
        unsubscribeChatRooms();
        unsubscribeChatRooms = null;
      }
    
      if (!profile?.uid || !isFirestoreReady()) {
        return;
      }
    
      const database = getChatDatabase();
    
      unsubscribeChatRooms = database
        .collection("chats")
        .where("participants", "array-contains", profile.uid)
        .limit(100)
        .onSnapshot(
          (snapshot) => {
            let count = 0;
    
            snapshot.forEach((doc) => {
              const data = doc.data() || {};
              const senderId =
                data.lastMessageBy ||
                data.lastMessageSenderId ||
                "";
    
              if (
                senderId &&
                String(senderId) !== String(profile.uid) &&
                String(data.lastMessageReadBy || "") !==
                  String(profile.uid)
              ) {
                count += 1;
              }
            });
    
            unreadChatCount = count;
            updateChatBadge();
          },
          (error) => {
            console.warn("Không thể đồng bộ badge chat:", error);
          },
        );
    }
    
    function updateChatBadge() {
      chatCount.hidden = unreadChatCount <= 0;
      chatCount.textContent =
        unreadChatCount > 99 ? "99+" : String(unreadChatCount);
    }
    
    async function markCurrentRoomRead() {
      if (
        !chatUid ||
        !selectedChatUser ||
        !isFirestoreReady()
      ) {
        return;
      }
    
      try {
        const roomId = makeChatRoomId(
          chatUid,
          selectedChatUser.uid,
        );
    
        await getChatDatabase()
          .collection("chats")
          .doc(roomId)
          .set(
            {
              lastMessageReadBy: chatUid,
              lastMessageReadAt:
                firebase.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true },
          );
      } catch (error) {
        console.warn("Không thể đánh dấu chat đã đọc:", error);
      }
    }
        /* =====================================================
       PROFILE APPLY
    ===================================================== */
    const applyProfile = (profile) => {
      if (enforceLeaderPage(profile)) {
        return;
      }
      if (enforceMemberPage(profile)) {
        return;
      }
      document.body.dataset.csRole = profile.isLeader ? "leader" : "member";
      document.body.dataset.csRoleReady = "true";
      window.csCurrentProfile = profile;
      chatUid = profile.uid || "";
      chatProfile = profile;
      sidebar.innerHTML = `
          <nav class="cs-navbar-menu">
            ${menuMarkup(profile)}
          </nav>
          <div class="cs-navbar-note">
            <i></i>
            <span>
              ${
                profile.isLeader
                  ? "CS Leader · sẵn sàng phân công"
                  : "Customer Success online"
              }
            </span>
          </div>
        `;
      topbar.querySelector("#csNavbarRoleText").textContent = profile.isLeader
        ? "CS Leader · Điều phối nhóm"
        : "Trung tâm Customer Success";
      bindNotifications(profile);
      bindChatUnread(profile);
      document.dispatchEvent(
        new CustomEvent("cs:role-ready", {
          detail: profile,
        }),
      );
    };
    /* =====================================================
       FIREBASE AUTH
    ===================================================== */
    const auth =
      typeof firebase !== "undefined" && firebase.auth ? firebase.auth() : null;
    if (!auth) {
      applyProfile({
        isLeader: false,
        isGroupMember: false,
        name: "CS",
        email: "",
        uid: "",
        raw: {},
      });
      return;
    }
    auth.onAuthStateChanged(async (user) => {
      if (!user) {
        applyProfile({
          isLeader: false,
          isGroupMember: false,
          name: "CS",
          email: "",
          uid: "",
          raw: {},
        });
        return;
      }
      const profile = await getProfile(user);
      applyProfile(profile);
    });
  }
  /* =========================================================
     START
  ========================================================= */
  initNavbar();
})();
