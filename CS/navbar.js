(function () {
  "use strict";

  const COLLAPSE_KEY = "cs-navbar-collapsed";
  const MOBILE_BREAKPOINT = 860;
  const HOME_URL = "/CS/homepageCS/trangchu-cs.html";
  const LEADER_ROLES = new Set(["leader", "cs_leader", "team_leader", "group_leader", "manager", "cs_manager"]);
  const icons = {
    home: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><path d="M9 22V12h6v10"></path></svg>',
    tickets:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z"></path></svg>',
    create:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9"></path><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg>',
    groups: 
      '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="7" r="4"></circle><path d="M17 11a4 4 0 1 0-2.7-7"></path><path d="M2 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2"></path><path d="M17 15a4 4 0 0 1 4 4v2"></path></svg>',
    membergroups:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17 20.5c1.4-.6 2.6-1.6 3.5-2.8V5.5A2.5 2.5 0 0 0 18 3H6A2.5 2.5 0 0 0 3.5 5.5v12A2.5 2.5 0 0 0 6 20h8.7"></path><path d="M7 8h10M7 12h6"></path><path d="M15 18h6"></path><path d="M18 15v6"></path></svg>',
    reports:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3v18h18"></path><path d="m7 16 4-5 3 3 5-7"></path></svg>',
    faq: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"></path><path d="M12 17h.01"></path></svg>',
    account: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6h.1A1.65 1.65 0 0 0 10 3.09V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9v.1A1.65 1.65 0 0 0 20.91 10H21a2 2 0 1 1 0 4h-.09A1.65 1.65 0 0 0 19.4 15Z"></path></svg>',
  };

  const links = [
    { page: "home", href: HOME_URL, label: "Trang chủ" },
    { page: "tickets", href: "/CS/TicketManagement/cs-ticket.html", label: "Quản lý ticket" },
    { page: "create", href: "/CS/PhieuHoTroCS/phieuhotro-cs.html", label: "Tạo phiếu hỗ trợ" },
    { page: "groups", href: "/CS/Groups/group.html", label: "Nhóm của tôi", leaderOnly: true },
    { page: "membergroups", href: "/CS/Groups/group-member.html", label: "Nhóm trao đổi", memberOnly: true },
    { page: "reports", href: "/CS/Dashboard/cs-dashboard.html", label: "Báo cáo thống kê", leaderOnly: true },
    { page: "faq", href: "/FAQs/CS-FAQ.html", label: "FAQs" },
    { page: "account", href: "/CS/account-CS.html", label: "Cài đặt hệ thống" },
  ];

  const safeGet = (key) => { try { return localStorage.getItem(key); } catch { return null; } };
  const safeSet = (key, value) => { try { localStorage.setItem(key, value); } catch { /* unavailable */ } };
  const isMobile = () => window.innerWidth <= MOBILE_BREAKPOINT;
  const normalizeRole = (value) => String(value || "").trim().toLowerCase().replace(/[\s-]+/g, "_");

  function resolveContent(app) {
    return app.querySelector(":scope > main, :scope > .main, :scope > .page, :scope > .wrap, :scope > [data-page-content]");
  }

  function prepareLegacyShell(app) {
    let content = resolveContent(app);
    if (content) return content;
    const legacyBody = app.querySelector(":scope > .body");
    content = legacyBody?.querySelector(":scope > main, :scope > .main, :scope > .page, :scope > .wrap, :scope > [data-page-content]");
    if (!content) return null;
    app.querySelector(":scope > .topbar")?.remove();
    app.appendChild(content);
    legacyBody.remove();
    return content;
  }

  function activePage(visibleLinks) {
    return document.body.dataset.navPage || visibleLinks.find((link) => window.location.pathname.endsWith(link.href.split("#")[0]))?.page || "";
  }

  function menuMarkup(profile) {
    const visibleLinks = links.filter((link) => (!link.leaderOnly || profile.isLeader) && (!link.memberOnly || (!profile.isLeader && profile.isGroupMember)));
    const page = activePage(visibleLinks);
    return visibleLinks.map((link) => {
      const active = link.page === page;
      return `<a data-nav-page="${link.page}" href="${link.href}"${active ? ' class="active" aria-current="page"' : ""}>${icons[link.page]}<span>${link.label}</span></a>`;
    }).join("");
  }

  async function getProfile(user) {
    const base = { uid: user.uid, email: user.email || "", name: user.displayName || user.email || "CS", isLeader: false, isGroupMember: false, raw: {} };
    if (typeof firebase === "undefined" || !firebase.firestore) return base;
    const users = firebase.firestore().collection("users");
    try {
      let snapshot = await users.doc(user.uid).get();
      if (!snapshot.exists) {
        const byUid = await users.where("uid", "==", user.uid).limit(1).get();
        snapshot = byUid.docs[0] || snapshot;
      }
      const data = snapshot.exists ? snapshot.data() || {} : {};
      const values = [data.role, data.accountType, data.leaderRole, data.teamRole, data.position].map(normalizeRole);
      const profile = { ...base, name: data.name || data.displayName || base.name, raw: data };
      profile.isLeader = Boolean(data.isLeader || data.isCSLeader || values.some((value) => LEADER_ROLES.has(value)));
      if (!profile.isLeader) {
        const groups = await firebase.firestore().collection("groups").where("leaderUid", "==", user.uid).limit(1).get();
        profile.isLeader = !groups.empty;
      }
      if (!profile.isLeader) {
        const memberGroups = await firebase.firestore().collection("groups").where("memberIds", "array-contains", user.uid).limit(1).get();
        profile.isGroupMember = !memberGroups.empty;
      }
      return profile;
    } catch (error) {
      console.warn("Không thể tải quyền Customer Success:", error);
      return base;
    }
  }

  function enforceLeaderPage(profile) {
    if (document.body.dataset.csLeaderOnly === "true" && !profile.isLeader) {
      window.location.replace(HOME_URL);
      return true;
    }
    return false;
  }

  function enforceMemberPage(profile) {
    if (document.body.dataset.csMemberOnly === "true" && (profile.isLeader || !profile.isGroupMember)) {
      window.location.replace(HOME_URL);
      return true;
    }
    return false;
  }

  const escapeHTML = (value) => {
    const node = document.createElement("div");
    node.textContent = value == null ? "" : String(value);
    return node.innerHTML;
  };

  const notificationTime = (value) => {
    const date = value?.toDate ? value.toDate() : value?.seconds ? new Date(value.seconds * 1000) : null;
    return date ? date.toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" }) : "Vừa xong";
  };

  function initNavbar() {
    let app = document.querySelector(".app");
    if (!app) {
      const standalone = document.querySelector("body > main, body > .wrap, body > [data-page-content]");
      if (!standalone) return;
      app = document.createElement("div");
      app.className = "app";
      const main = document.createElement("main");
      main.className = "cs-navbar-standalone";
      document.body.insertBefore(app, standalone);
      app.appendChild(main);
      main.appendChild(standalone);
    }
    if (app.dataset.csNavbarReady === "true") return;
    const content = prepareLegacyShell(app);
    if (!content) return;
    app.dataset.csNavbarReady = "true";

    const topbar = document.createElement("header");
    topbar.className = "cs-navbar-topbar";
    topbar.innerHTML = '<button class="cs-navbar-toggle" type="button" aria-label="Mở điều hướng" aria-expanded="false" aria-controls="csNavbarSidebar">☰</button><a class="cs-navbar-brand" href="/CS/homepageCS/trangchu-cs.html" aria-label="Trang chủ Customer Success"><span class="cs-navbar-mark">CS</span><span class="cs-navbar-brand-copy"><strong>Hệ thống Quản lý Hỗ trợ</strong><small id="csNavbarRoleText">Đang kiểm tra quyền truy cập…</small></span></a><div class="cs-navbar-actions"><button class="cs-navbar-notification-button" id="csNotificationButton" type="button" aria-label="Mở thông báo" aria-expanded="false"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"></path><path d="M10 21h4"></path></svg><span class="cs-navbar-notification-count" id="csNotificationCount" hidden>0</span></button></div>';
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

    const notificationPanel = document.createElement("aside");
    notificationPanel.className = "cs-notification-panel";
    notificationPanel.id = "csNotificationPanel";
    notificationPanel.setAttribute("aria-hidden", "true");
    notificationPanel.innerHTML = '<div class="cs-notification-head"><div><span>CS CẬP NHẬT</span><h2>Thông báo</h2><p>Phân công ticket và trao đổi nhóm mới.</p></div><button id="csNotificationClose" type="button" aria-label="Đóng thông báo">×</button></div><div class="cs-notification-toolbar"><strong id="csNotificationUnreadLabel">Chưa có thông báo</strong><button id="csNotificationReadAll" type="button" disabled>Đọc tất cả</button></div><div class="cs-notification-list" id="csNotificationList"></div><div class="cs-notification-empty" id="csNotificationEmpty">Khi Leader phân công ticket hoặc thành viên Group nhắn tin, thông báo sẽ xuất hiện tại đây.</div>';
    document.body.appendChild(notificationPanel);

    const notificationBackdrop = document.createElement("button");
    notificationBackdrop.type = "button";
    notificationBackdrop.className = "cs-notification-backdrop";
    notificationBackdrop.id = "csNotificationBackdrop";
    notificationBackdrop.setAttribute("aria-label", "Đóng thông báo");
    notificationBackdrop.hidden = true;
    document.body.appendChild(notificationBackdrop);

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
        layout.classList.toggle("is-collapsed", safeGet(COLLAPSE_KEY) === "true");
        toggle.setAttribute("aria-expanded", String(!layout.classList.contains("is-collapsed")));
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
    sidebar.addEventListener("click", (event) => { if (event.target.closest("a")) closeMobile(); });
    document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeMobile(); });
    window.addEventListener("resize", syncLayout, { passive: true });
    syncLayout();

    const notificationButton = topbar.querySelector("#csNotificationButton");
    const notificationCount = topbar.querySelector("#csNotificationCount");
    const notificationList = notificationPanel.querySelector("#csNotificationList");
    const notificationEmpty = notificationPanel.querySelector("#csNotificationEmpty");
    const notificationUnreadLabel = notificationPanel.querySelector("#csNotificationUnreadLabel");
    const notificationReadAll = notificationPanel.querySelector("#csNotificationReadAll");
    const notificationClose = notificationPanel.querySelector("#csNotificationClose");
    let notificationRecords = [];
    let notificationUid = "";
    let unsubscribeNotifications = null;

    const closeNotifications = () => {
      notificationPanel.classList.remove("open");
      notificationPanel.setAttribute("aria-hidden", "true");
      notificationButton.setAttribute("aria-expanded", "false");
      notificationBackdrop.classList.remove("show");
      window.setTimeout(() => { notificationBackdrop.hidden = true; }, 180);
    };

    const openNotifications = () => {
      notificationPanel.classList.add("open");
      notificationPanel.setAttribute("aria-hidden", "false");
      notificationButton.setAttribute("aria-expanded", "true");
      notificationBackdrop.hidden = false;
      requestAnimationFrame(() => notificationBackdrop.classList.add("show"));
    };

    const renderNotifications = () => {
      const unread = notificationRecords.filter((item) => !item.read);
      notificationCount.hidden = unread.length === 0;
      notificationCount.textContent = unread.length > 99 ? "99+" : String(unread.length);
      notificationUnreadLabel.textContent = unread.length ? `${unread.length} chưa đọc` : notificationRecords.length ? "Đã đọc tất cả" : "Chưa có thông báo";
      notificationReadAll.disabled = unread.length === 0;
      notificationEmpty.classList.toggle("show", notificationRecords.length === 0);
      notificationList.innerHTML = notificationRecords.map((item) => `<button class="cs-notification-item${item.read ? " is-read" : ""}" type="button" data-notification-id="${escapeHTML(item.id)}" data-notification-link="${escapeHTML(item.link || "")}"><span class="cs-notification-icon">${item.type === "group_message" ? "✦" : "✓"}</span><span class="cs-notification-copy"><strong>${escapeHTML(item.title || "Thông báo Customer Success")}</strong><b>${escapeHTML(item.preview || "Có cập nhật mới.")}</b><small>${escapeHTML(notificationTime(item.createdAt))}</small></span></button>`).join("");
    };

    const markNotificationRead = async (id) => {
      if (!notificationUid || !id || typeof firebase === "undefined" || !firebase.firestore) return;
      const item = notificationRecords.find((record) => record.id === id);
      if (!item || item.read) return;
      try {
        await firebase.firestore().collection("csNotifications").doc(notificationUid).collection("items").doc(id).set({ read: true, readAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
      } catch (error) {
        console.warn("Không thể đánh dấu thông báo đã đọc:", error);
      }
    };

    const bindNotifications = (profile) => {
      notificationUid = profile?.uid || "";
      if (unsubscribeNotifications) { unsubscribeNotifications(); unsubscribeNotifications = null; }
      notificationRecords = [];
      renderNotifications();
      if (!notificationUid || typeof firebase === "undefined" || !firebase.firestore) return;
      unsubscribeNotifications = firebase.firestore().collection("csNotifications").doc(notificationUid).collection("items").orderBy("createdAt", "desc").limit(50).onSnapshot((snapshot) => {
        notificationRecords = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        renderNotifications();
      }, (error) => console.warn("Không thể đồng bộ thông báo CS:", error));
    };

    notificationButton.addEventListener("click", () => notificationPanel.classList.contains("open") ? closeNotifications() : openNotifications());
    notificationClose.addEventListener("click", closeNotifications);
    notificationBackdrop.addEventListener("click", closeNotifications);
    notificationList.addEventListener("click", async (event) => {
      const item = event.target.closest("[data-notification-id]");
      if (!item) return;
      const id = item.dataset.notificationId;
      const link = item.dataset.notificationLink;
      await markNotificationRead(id);
      if (link) window.location.href = link;
    });
    notificationReadAll.addEventListener("click", async () => {
      const unread = notificationRecords.filter((item) => !item.read);
      if (!unread.length || !notificationUid || typeof firebase === "undefined" || !firebase.firestore) return;
      notificationReadAll.disabled = true;
      try {
        const database = firebase.firestore();
        const batch = database.batch();
        unread.forEach((item) => batch.set(database.collection("csNotifications").doc(notificationUid).collection("items").doc(item.id), { read: true, readAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true }));
        await batch.commit();
      } catch (error) {
        console.warn("Không thể đánh dấu toàn bộ thông báo đã đọc:", error);
      }
    });
    document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeNotifications(); });

    const applyProfile = (profile) => {
      if (enforceLeaderPage(profile)) return;
      if (enforceMemberPage(profile)) return;
      document.body.dataset.csRole = profile.isLeader ? "leader" : "member";
      document.body.dataset.csRoleReady = "true";
      window.csCurrentProfile = profile;
      sidebar.innerHTML = `<nav class="cs-navbar-menu">${menuMarkup(profile)}</nav><div class="cs-navbar-note"><i></i><span>${profile.isLeader ? "CS Leader · sẵn sàng phân công" : "Customer Success online"}</span></div>`;
      topbar.querySelector("#csNavbarRoleText").textContent = profile.isLeader ? "CS Leader · Điều phối nhóm" : "Trung tâm Customer Success";
      bindNotifications(profile);
      document.dispatchEvent(new CustomEvent("cs:role-ready", { detail: profile }));
    };

    const auth = typeof firebase !== "undefined" && firebase.auth ? firebase.auth() : null;
    if (!auth) {
      applyProfile({ isLeader: false, isGroupMember: false, name: "CS", email: "", uid: "", raw: {} });
      return;
    }
    auth.onAuthStateChanged(async (user) => {
      if (!user) {
        applyProfile({ isLeader: false, isGroupMember: false, name: "CS", email: "", uid: "", raw: {} });
        return;
      }
      applyProfile(await getProfile(user));
    });
  }

  initNavbar();
})();
