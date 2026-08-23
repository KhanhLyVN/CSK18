"use strict";

/* =========================================================
   CS CHAT GLOBAL
   =========================================================
   DÙNG CHUNG CHO:

   - Admin
   - CS Leader
   - CS
   - Các trang khác có navbar chung

   FIRESTORE:

   chats/{roomId}
      participants
      participantIds
      participantNames
      lastMessage
      lastMessageBy
      lastMessageSenderId
      lastMessageReadBy
      lastMessageReadAt
      createdAt
      updatedAt

   chats/{roomId}/messages/{messageId}
      from
      to
      senderId
      senderUID
      senderName
      receiverId
      receiverUID
      receiverName
      text
      message
      createdAt
      timestamp
      read
      readAt
========================================================= */

(function () {

  if (window.__CS_GLOBAL_CHAT_LOADED__) {
    console.warn(
      "[CS CHAT] cs-chat.js đã được load trước đó."
    );
    return;
  }

  window.__CS_GLOBAL_CHAT_LOADED__ = true;

  console.log(
    "[CS CHAT] Global chat loading..."
  );

  /* =====================================================
     STATE
  ===================================================== */

  const state = {

    currentUser: null,

    currentUserData: null,

    users: [],

    groups: [],

    selectedUser: null,

    selectedGroup: null,

    chatMode: "direct",

    groupUnreadUnsubscribe: null,

    roomId: null,

    messagesUnsubscribe: null,

    roomsUnsubscribe: null,

    authUnsubscribe: null,
    notificationsUnsubscribe: null,
    roleResolved: false,
    directUnreadCount: 0,
    groupUnreadCount: 0,

    initialized: false,

    eventsBound: false,

    starting: false,

    sending: false

  };


  /* =====================================================
     FIREBASE
  ===================================================== */

  function getFirebase() {

    if (
      window.CS_FIREBASE &&
      window.CS_FIREBASE.firebase
    ) {
      return window.CS_FIREBASE.firebase;
    }

    if (window.firebase) {
      return window.firebase;
    }

    return null;
  }


  function getAuth() {

    try {

      if (
        window.CS_FIREBASE &&
        window.CS_FIREBASE.auth
      ) {
        return window.CS_FIREBASE.auth;
      }

      const fb = getFirebase();

      if (
        fb &&
        typeof fb.auth === "function"
      ) {
        return fb.auth();
      }

    } catch (error) {

      console.error(
        "[CS CHAT] getAuth error:",
        error
      );

    }

    return null;
  }


  function getDB() {

    try {

      if (
        window.CS_FIREBASE &&
        window.CS_FIREBASE.db
      ) {
        return window.CS_FIREBASE.db;
      }

      const fb = getFirebase();

      if (
        fb &&
        typeof fb.firestore === "function"
      ) {
        return fb.firestore();
      }

    } catch (error) {

      console.error(
        "[CS CHAT] getDB error:",
        error
      );

    }

    return null;
  }


  function serverTimestamp() {

    const fb = getFirebase();

    try {

      if (
        fb &&
        fb.firestore &&
        fb.firestore.FieldValue &&
        fb.firestore.FieldValue.serverTimestamp
      ) {
        return fb.firestore.FieldValue.serverTimestamp();
      }

    } catch (error) {}

    return new Date();
  }


  /* =====================================================
     DOM HELPERS
  ===================================================== */

  function $(selector, root = document) {

    try {
      return root.querySelector(selector);
    } catch (error) {
      return null;
    }

  }

  const CS_NAVIGATION = [
    { key: "home", label: "Trang chủ", icon: "home", href: "/CS/homepageCS/trangchu-cs.html" },
    { key: "tickets", label: "Quản lý ticket", icon: "tickets", href: "/CS/TicketManagement/cs-ticket.html" },
    { key: "create", label: "Tạo phiếu hỗ trợ", icon: "create", href: "/CS/PhieuHoTroCS/phieuhotro-cs.html" },
    { key: "groups", label: "Nhóm của tôi", icon: "groups", href: "/CS/Groups/group.html", leaderOnly: true },
    { key: "member-groups", label: "Nhóm trao đổi", icon: "memberGroups", href: "/CS/Groups/group-member.html", memberOnly: true },
    { key: "faq", label: "FAQs", icon: "faq", href: "/FAQs/CS-FAQ.html" },
    { key: "account", label: "Cài đặt hệ thống", icon: "account", href: "/CS/account-CS.html" }
  ];

  const CS_NAV_ICONS = {
    home: '<svg class="cs-inline-icon cs-navbar-menu-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1Z"></path></svg>',
    tickets: '<svg class="cs-inline-icon cs-navbar-menu-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h9l3 3v15H6Z"></path><path d="M15 3v4h4M9 12h6M9 16h4"></path></svg>',
    create: '<svg class="cs-inline-icon cs-navbar-menu-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"></path><circle cx="12" cy="12" r="9"></circle></svg>',
    groups: '<svg class="cs-inline-icon cs-navbar-menu-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3"></circle><path d="M3 20v-1a6 6 0 0 1 12 0v1M16 5a3 3 0 0 1 0 6M18 20v-1a6 6 0 0 0-3-5.2"></path></svg>',
    memberGroups: '<svg class="cs-inline-icon cs-navbar-menu-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H8l-4 2.5v-10A7.5 7.5 0 0 1 11.5 4h1A7.5 7.5 0 0 1 20 11.5Z"></path><path d="M8.5 12h.01M12 12h.01M15.5 12h.01"></path></svg>',
    reports: '<svg class="cs-inline-icon cs-navbar-menu-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20V4M4 20h16M8 16v-5M12 16V7M16 16v-8"></path></svg>',
    faq: '<svg class="cs-inline-icon cs-navbar-menu-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><path d="M9.7 9a2.45 2.45 0 1 1 4.15 1.78c-.95.87-1.85 1.35-1.85 2.72M12 17h.01"></path></svg>',
    account: '<svg class="cs-inline-icon cs-navbar-menu-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5"></circle><path d="M4.5 21a7.5 7.5 0 0 1 15 0"></path></svg>'
  };

  function navIcon(key) {
    return CS_NAV_ICONS[key] || CS_NAV_ICONS.home;
  }

  function initials(value) {
    const parts = String(value || "CS").trim().split(/\s+/).filter(Boolean);
    return parts.slice(-2).map((part) => part[0]).join("").toUpperCase() || "CS";
  }

  function ensureCSNavbar() {
    if (document.querySelector(".cs-navbar-topbar")) {
      if (!state.roleResolved) hideRestrictedNavigation();
      return true;
    }
    const app = document.querySelector(".app");
    if (!app) return false;

    const content = document.createElement("div");
    content.className = "cs-navbar-content";
    while (app.firstChild) content.appendChild(app.firstChild);

    const topbar = document.createElement("header");
    topbar.className = "cs-navbar-topbar";
    topbar.innerHTML = `
      <div class="cs-navbar-top-left">
        <button id="csNavbarMenuBtn" class="cs-navbar-toggle" type="button" aria-label="Mở điều hướng" aria-expanded="false" aria-controls="csNavbarSidebar">
          <span aria-hidden="true">☰</span>
        </button>
        <a class="cs-navbar-brand" href="/CS/homepageCS/trangchu-cs.html" aria-label="Trang chủ Customer Success">
          <span class="cs-navbar-mark">CS</span>
          <span class="cs-navbar-brand-copy"><strong>Hệ thống Quản lý Hỗ trợ</strong><small>Trung tâm Customer Success</small></span>
        </a>
      </div>
      <div class="cs-navbar-actions" aria-label="Tiện ích tài khoản">
        <div class="cs-navbar-panel-wrap">
          <button id="csNavbarMessengerBtn" class="cs-navbar-icon-btn" type="button" aria-label="Mở tin nhắn" aria-expanded="false" aria-controls="csNavbarMessengerPanel">
            <svg class="cs-inline-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 11.5a8 8 0 0 1-8 8H8l-5 3v-11a8 8 0 0 1 8-8h2a8 8 0 0 1 8 8Z"></path></svg>
            <b id="csNavbarMessengerBadge" class="cs-navbar-badge" hidden>0</b>
          </button>
          <section id="csNavbarMessengerPanel" class="cs-navbar-panel cs-navbar-messenger-panel" hidden aria-hidden="true" aria-label="Tin nhắn trực tiếp"></section>
        </div>
        <div class="cs-navbar-panel-wrap">
          <button id="csNavbarNoticeBtn" class="cs-navbar-icon-btn" type="button" aria-label="Mở thông báo" aria-expanded="false">
            <svg class="cs-inline-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"></path><path d="M10 21h4"></path></svg>
            <b id="csNavbarNoticeBadge" class="cs-navbar-badge" hidden>0</b>
          </button>
        </div>
        <a class="cs-navbar-account-link" href="/CS/account-CS.html" aria-label="Mở cài đặt hệ thống">
          <span id="csNavbarTopAvatar" class="cs-navbar-top-avatar" aria-hidden="true">CS</span>
          <span class="cs-navbar-account-copy"><strong>Tài khoản CS</strong><small>Cài đặt hệ thống</small></span>
        </a>
      </div>`;

    const sidebar = document.createElement("aside");
    sidebar.className = "cs-navbar-sidebar";
    sidebar.id = "csNavbarSidebar";
    sidebar.setAttribute("aria-label", "Điều hướng Customer Success");
    sidebar.innerHTML = `<div class="cs-navbar-sidebar-head"><span>KHÔNG GIAN LÀM VIỆC</span><strong>Customer Success</strong></div><nav class="cs-navbar-menu">${CS_NAVIGATION.map((item) => `<a data-nav-page="${item.key}" href="${item.href}"${item.leaderOnly ? " data-leader-only=\"true\"" : ""}${item.memberOnly ? " data-member-only=\"true\"" : ""}>${navIcon(item.icon)}<span>${item.label}</span></a>`).join("")}</nav><div class="cs-navbar-note"><i></i><span>Customer Success online</span></div>`;

    const layout = document.createElement("div");
    layout.className = "cs-navbar-layout";
    layout.append(sidebar, content);
    const overlay = document.createElement("button");
    overlay.type = "button";
    overlay.className = "cs-navbar-overlay";
    overlay.id = "csNavbarOverlay";
    overlay.setAttribute("aria-label", "Đóng điều hướng");

    app.dataset.csNavbarReady = "true";
    app.append(topbar, layout, overlay);
    hideRestrictedNavigation();
    createNotificationUI();
    bindNavbarLayout();
    return true;
  }

  function bindNavbarLayout() {
    const layout = document.querySelector(".cs-navbar-layout");
    const button = document.querySelector("#csNavbarMenuBtn");
    const overlay = document.querySelector("#csNavbarOverlay");
    if (!layout || !button || button.dataset.csNavbarBound === "true") return;
    const closeMobile = () => {
      layout.classList.remove("is-mobile-open");
      overlay?.classList.remove("is-visible");
      button.setAttribute("aria-expanded", "false");
    };
    button.dataset.csNavbarBound = "true";
    button.addEventListener("click", () => {
      if (window.matchMedia("(max-width: 860px)").matches) {
        const open = layout.classList.toggle("is-mobile-open");
        overlay?.classList.toggle("is-visible", open);
        button.setAttribute("aria-expanded", String(open));
      } else {
        layout.classList.toggle("is-collapsed");
      }
    });
    overlay?.addEventListener("click", closeMobile);
    window.addEventListener("resize", () => {
      if (!window.matchMedia("(max-width: 860px)").matches) closeMobile();
    });
  }

  function normalizeRole(value) {
    return String(value || "").trim().toLowerCase().replace(/[\s-]+/g, "_");
  }

  function isLeaderProfile(profile) {
    const leaderRoles = ["leader", "cs_leader", "team_leader", "group_leader", "manager", "cs_manager", "customer_success_leader", "truong_nhom", "truong_nhom_cs"];
    const profileRoles = [profile?.role, profile?.accountType, profile?.account_type, profile?.position, profile?.userRole].map(normalizeRole);
    return Boolean(profile?.isLeader || profile?.isCSLeader || profile?.isGroupLeader || profile?.isTeamLeader || profileRoles.some((role) => leaderRoles.includes(role)));
  }

  function isMemberProfile(profile) {
    const memberRoles = ["member", "cs_member", "group_member", "customer_success_member", "thanh_vien", "thanh_vien_cs"];
    const profileRoles = [profile?.role, profile?.accountType, profile?.account_type, profile?.position, profile?.userRole].map(normalizeRole);
    return Boolean(profile?.isMember || profile?.isCSMember || profile?.isGroupMember || profileRoles.some((role) => memberRoles.includes(role)));
  }

  function getGroupLeaderUid(group) {
    const leader = group?.leader || {};
    return String(group?.leaderUid || leader.uid || leader.id || "");
  }

  function groupIncludesMember(group, uid) {
    const userId = String(uid || "");
    const memberIds = Array.isArray(group?.memberIds) ? group.memberIds.map(String) : [];
    const members = Array.isArray(group?.members) ? group.members : [];
    return memberIds.includes(userId) || members.some((member) => String(member?.uid || member?.id || "") === userId);
  }

  async function resolveCSGroupRole(database, uid) {
    const result = { isLeader: false, isMember: false };
    if (!database || !uid) return result;
    const userId = String(uid);
    try {
      const [leaderSnapshot, memberSnapshot] = await Promise.all([
        database.collection("groups").where("leaderUid", "==", userId).limit(1).get(),
        database.collection("groups").where("memberIds", "array-contains", userId).limit(1).get()
      ]);
      result.isLeader = !leaderSnapshot.empty;
      result.isMember = !memberSnapshot.empty && !result.isLeader;
    } catch (error) {
      console.warn("[CS NAV] Không thể truy vấn nhanh Group:", error);
    }

    // Bản dữ liệu cũ có thể lưu leader trong object `leader` hoặc chỉ có mảng
    // `members`; vì vậy luôn đối chiếu thêm trước khi quyết định ẩn menu.
    try {
      const groupsSnapshot = await database.collection("groups").get();
      groupsSnapshot.forEach((doc) => {
        const group = doc.data() || {};
        if (getGroupLeaderUid(group) === userId) result.isLeader = true;
        if (!result.isLeader && groupIncludesMember(group, userId)) result.isMember = true;
      });
    } catch (error) {
      console.warn("[CS NAV] Không thể đối chiếu Group legacy:", error);
    }

    if (result.isLeader) result.isMember = false;
    return result;
  }

  function hideRestrictedNavigation() {
    document.querySelectorAll("[data-leader-only], [data-leaderonly], [data-member-only], [data-memberonly]").forEach((item) => {
      item.hidden = true;
      item.setAttribute("aria-hidden", "true");
      item.classList.remove("is-role-visible");
    });
  }

  async function syncCSNavbarProfile() {
    const user = state.currentUser;
    if (!user) return null;
    const profile = { ...(state.currentUserData || {}), uid: user.uid };
    let isLeader = isLeaderProfile(profile);
    let isMember = isMemberProfile(profile);
    const database = getDB();
    if (database) {
      const groupRole = await resolveCSGroupRole(database, user.uid);
      isLeader = isLeader || groupRole.isLeader;
      isMember = !isLeader && (isMember || groupRole.isMember);
    }
    const nextProfile = { ...profile, name: getUserName(profile), isLeader, isCSLeader: isLeader, isGroupMember: isMember && !isLeader };
    state.currentUserData = nextProfile;
    window.csCurrentProfile = nextProfile;
    applyCSNavbarRole(nextProfile);
    state.roleResolved = true;
    listenCSNotifications(user.uid);
    document.dispatchEvent(new CustomEvent("cs:role-ready", { detail: nextProfile }));
    return nextProfile;
  }

  function applyCSNavbarRole(profile) {
    const isLeader = Boolean(profile?.isLeader);
    const isMember = Boolean(profile?.isGroupMember);
    document.querySelectorAll("[data-leader-only], [data-leaderonly]").forEach((item) => {
      item.hidden = !isLeader;
      item.setAttribute("aria-hidden", String(!isLeader));
      item.classList.toggle("is-role-visible", isLeader);
    });
    document.querySelectorAll("[data-member-only], [data-memberonly]").forEach((item) => {
      item.hidden = !isMember;
      item.setAttribute("aria-hidden", String(!isMember));
      item.classList.toggle("is-role-visible", isMember);
    });
    const activePage = document.body?.dataset?.navPage;
    document.querySelectorAll(".cs-navbar-menu [data-nav-page]").forEach((link) => {
      link.classList.toggle("active", link.dataset.navPage === activePage);
    });
    const avatar = document.querySelector("#csNavbarTopAvatar");
    if (avatar) avatar.textContent = initials(getUserName(profile));
    const body = document.body;
    if (body?.dataset?.csLeaderOnly === "true" && !isLeader) window.location.replace("/CS/homepageCS/trangchu-cs.html");
    if (body?.dataset?.csMemberOnly === "true" && (!isMember || isLeader)) window.location.replace("/CS/homepageCS/trangchu-cs.html");
  }

  function createNotificationUI() {
    if (document.querySelector("#csNotificationPanel")) return;
    const backdrop = document.createElement("div");
    backdrop.id = "csNotificationBackdrop";
    backdrop.className = "cs-notification-backdrop";
    backdrop.hidden = true;
    const panel = document.createElement("aside");
    panel.id = "csNotificationPanel";
    panel.className = "cs-notification-panel";
    panel.setAttribute("aria-label", "Thông báo Customer Success");
    panel.innerHTML = `<div class="cs-notification-head"><div><span>CẬP NHẬT THỜI GIAN THỰC</span><h2>Thông báo</h2><p>Phân công ticket và trao đổi nhóm.</p></div><button type="button" id="csNotificationCloseBtn" aria-label="Đóng">×</button></div><div class="cs-notification-toolbar"><span id="csNotificationUnreadText">Không có thông báo mới</span><button type="button" id="csNotificationMarkReadBtn">Đánh dấu đã đọc</button></div><div id="csNotificationList" class="cs-notification-list"></div><div id="csNotificationEmpty" class="cs-notification-empty show">Bạn chưa có thông báo nào.</div>`;
    document.body.append(backdrop, panel);
    const close = () => {
      panel.classList.remove("open");
      backdrop.classList.remove("show");
      setTimeout(() => { backdrop.hidden = true; }, 180);
      document.querySelector("#csNavbarNoticeBtn")?.setAttribute("aria-expanded", "false");
    };
    const open = () => {
      backdrop.hidden = false;
      requestAnimationFrame(() => { panel.classList.add("open"); backdrop.classList.add("show"); });
      document.querySelector("#csNavbarNoticeBtn")?.setAttribute("aria-expanded", "true");
    };
    document.querySelector("#csNavbarNoticeBtn")?.addEventListener("click", open);
    document.querySelector("#csNotificationCloseBtn")?.addEventListener("click", close);
    backdrop.addEventListener("click", close);
    document.querySelector("#csNotificationMarkReadBtn")?.addEventListener("click", markAllNotificationsRead);
  }

  function formatNotificationTime(value) {
    const date = value?.toDate ? value.toDate() : value?.seconds ? new Date(value.seconds * 1000) : null;
    return date ? date.toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" }) : "Vừa xong";
  }

  function renderCSNotifications(items) {
    const list = document.querySelector("#csNotificationList");
    const empty = document.querySelector("#csNotificationEmpty");
    const badge = document.querySelector("#csNavbarNoticeBadge");
    const unread = items.filter((item) => !item.read).length;
    if (badge) { badge.hidden = unread === 0; badge.textContent = unread > 99 ? "99+" : String(unread); }
    const unreadText = document.querySelector("#csNotificationUnreadText");
    if (unreadText) unreadText.textContent = unread ? `${unread} thông báo chưa đọc` : "Không có thông báo chưa đọc";
    const markRead = document.querySelector("#csNotificationMarkReadBtn");
    if (markRead) markRead.disabled = unread === 0;
    if (!list || !empty) return;
    empty.classList.toggle("show", !items.length);
    list.innerHTML = items.map((item) => `<button type="button" class="cs-notification-item${item.read ? " is-read" : ""}" data-notification-id="${escapeHTML(item.id)}" data-notification-link="${escapeHTML(item.link || "")}"><span class="cs-notification-icon">${item.type === "ticket_assigned" ? "T" : "N"}</span><span class="cs-notification-copy"><strong>${escapeHTML(item.title || "Thông báo mới")}</strong><b>${escapeHTML(item.preview || "")}</b><small>${escapeHTML(formatNotificationTime(item.createdAt))}</small></span></button>`).join("");
    list.querySelectorAll("[data-notification-id]").forEach((button) => {
      button.addEventListener("click", async () => {
        const database = getDB();
        const uid = state.currentUser?.uid;
        if (database && uid) await database.collection("csNotifications").doc(uid).collection("items").doc(button.dataset.notificationId).set({ read: true, readAt: serverTimestamp() }, { merge: true });
        if (button.dataset.notificationLink) window.location.href = button.dataset.notificationLink;
      });
    });
  }

  function listenCSNotifications(uid) {
    const database = getDB();
    if (!database || !uid) return;
    try { state.notificationsUnsubscribe?.(); } catch (error) {}
    state.notificationsUnsubscribe = database.collection("csNotifications").doc(uid).collection("items").orderBy("createdAt", "desc").limit(40).onSnapshot((snapshot) => renderCSNotifications(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))), (error) => console.warn("[CS NAV] Không thể tải thông báo:", error));
  }

  async function markAllNotificationsRead() {
    const database = getDB();
    const uid = state.currentUser?.uid;
    if (!database || !uid) return;
    const snapshot = await database.collection("csNotifications").doc(uid).collection("items").where("read", "==", false).get();
    const batch = database.batch();
    snapshot.docs.forEach((doc) => batch.set(doc.ref, { read: true, readAt: serverTimestamp() }, { merge: true }));
    if (!snapshot.empty) await batch.commit();
  }


  function escapeHTML(value) {

    const div =
      document.createElement("div");

    div.textContent =
      value == null
        ? ""
        : String(value);

    return div.innerHTML;

  }


  /* =====================================================
     USER HELPERS
  ===================================================== */

  function getUserName(user) {

    if (!user) {
      return "Người dùng";
    }

    return String(

      user.displayName ||

      user.name ||

      user.fullName ||

      user.full_name ||

      user.username ||

      user.email ||

      "Người dùng"

    ).trim();

  }


  function getUserEmail(user) {

    return String(
      user?.email || ""
    ).trim();

  }


  function getUserRole(user) {

    return String(

      user?.role ||

      user?.accountType ||

      user?.account_type ||

      user?.position ||

      "Thành viên"

    ).trim();

  }


  function getInitials(name) {

    const text =
      String(name || "U").trim();

    if (!text) {
      return "U";
    }

    const parts =
      text.split(/\s+/).filter(Boolean);

    if (parts.length === 1) {

      return parts[0]
        .substring(0, 2)
        .toUpperCase();

    }

    return (

      parts[0][0] +

      parts[parts.length - 1][0]

    ).toUpperCase();

  }


  function timestampValue(value) {

    if (!value) {
      return 0;
    }

    if (
      typeof value.toMillis ===
      "function"
    ) {
      return value.toMillis();
    }

    if (
      typeof value.toDate ===
      "function"
    ) {
      return value.toDate().getTime();
    }

    if (
      typeof value.seconds ===
      "number"
    ) {
      return value.seconds * 1000;
    }

    if (
      typeof value._seconds ===
      "number"
    ) {
      return value._seconds * 1000;
    }

    if (
      value instanceof Date
    ) {
      return value.getTime();
    }

    const parsed =
      Date.parse(value);

    return Number.isNaN(parsed)
      ? 0
      : parsed;

  }

  async function createDirectChatNotification(db, options) {
    const recipientUid = String(options?.recipientUid || "");
    const senderUid = String(options?.senderUid || "");
    const roomId = String(options?.roomId || "");
    if (!db || !recipientUid || !senderUid || !roomId || recipientUid === senderUid) return;
    const senderName = String(options?.senderName || "Người dùng");
    const text = String(options?.text || "").trim();
    try {
      await db.collection("csNotifications").doc(recipientUid).collection("items").add({
        type: "chat_message",
        recipientUid,
        senderId: senderUid,
        senderName,
        roomId,
        chatId: roomId,
        title: `${senderName} đã gửi tin nhắn cho bạn`,
        preview: text.slice(0, 180) || "Bạn có một tin nhắn mới.",
        read: false,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.warn("[CS CHAT] Không thể tạo notification chat:", error);
    }
  }

  async function saveChatContact(target) {
    const db = getDB();
    const currentUser = state.currentUser;
    if (!db || !currentUser || !target?.uid || String(target.uid) === String(currentUser.uid)) return;
    try {
      const batch = db.batch();
      batch.set(db.collection("chatContacts").doc(currentUser.uid).collection("items").doc(String(target.uid)), { contactUid: String(target.uid), name: getUserName(target), email: getUserEmail(target), addedAt: serverTimestamp() }, { merge: true });
      batch.set(db.collection("chatContacts").doc(String(target.uid)).collection("items").doc(currentUser.uid), { contactUid: currentUser.uid, name: getUserName(state.currentUserData || currentUser), email: currentUser.email || "", addedAt: serverTimestamp() }, { merge: true });
      await batch.commit();
    } catch (error) {
      console.warn("[CS CHAT] Không thể lưu danh bạ:", error);
    }
  }

  async function markDirectChatNotificationsRead(roomId) {
    const db = getDB();
    const currentUser = state.currentUser;
    if (!db || !currentUser || !roomId) return;
    try {
      const snapshot = await db.collection("csNotifications").doc(currentUser.uid).collection("items").get();
      const batch = db.batch();
      let changed = false;
      snapshot.forEach((doc) => {
        const item = doc.data() || {};
        if ((String(item.roomId || item.chatId || "") === String(roomId)) && item.read !== true) {
          batch.set(doc.ref, { read: true, readAt: serverTimestamp() }, { merge: true });
          changed = true;
        }
      });
      if (changed) await batch.commit();
    } catch (error) {
      console.warn("[CS CHAT] Không thể đánh dấu notification chat đã đọc:", error);
    }
  }


  /* =====================================================
     ROOM ID
  ===================================================== */

  function makeRoomId(uidA, uidB) {

    const ids = [

      String(uidA || ""),

      String(uidB || "")

    ]

      .filter(Boolean)

      .sort();

    if (ids.length !== 2) {
      return "";
    }

    return ids.join("__");

  }

  /* Contract chat trực tiếp dùng chung với Header Admin. */
  function directMessageSender(message) {
    return String(message?.senderId || message?.senderUID || message?.senderUid || message?.from || message?.uid || "");
  }

  function directMessageReceiver(message) {
    return String(message?.receiverId || message?.receiverUID || message?.receiverUid || message?.recipientId || message?.to || "");
  }

  function directMessageText(message) {
    return String(message?.text ?? message?.message ?? message?.content ?? message?.body ?? "");
  }

  function makeDirectMessage({ senderId, senderName, senderEmail, receiverId, receiverName, text, timestamp }) {
    return {
      from: String(senderId),
      to: String(receiverId),
      senderId: String(senderId),
      senderUID: String(senderId),
      senderUid: String(senderId),
      senderName: String(senderName || ""),
      senderEmail: String(senderEmail || ""),
      receiverId: String(receiverId),
      receiverUID: String(receiverId),
      receiverUid: String(receiverId),
      receiverName: String(receiverName || ""),
      text: String(text),
      message: String(text),
      content: String(text),
      createdAt: timestamp,
      timestamp,
      read: false
    };
  }


  async function resolveDirectRoomId(db, uidA, uidB) {
    const ids = [String(uidA || ""), String(uidB || "")].filter(Boolean);
    const candidates = [...new Set([
      makeRoomId(uidA, uidB),
      ids.slice().sort().join("__")
    ].filter(Boolean))];
    const existingRooms = [];
    for (const candidate of candidates) {
      try {
        const snapshot = await db.collection("chats").doc(candidate).get();
        if (snapshot.exists) existingRooms.push({ id: candidate, data: snapshot.data() || {} });
      } catch (error) {
        console.warn("[CS CHAT] Không đọc được room candidate:", candidate, error);
      }
    }
    if (existingRooms.length) {
      existingRooms.sort((a, b) => {
        const aHasMessage = a.data.lastMessage ? 1 : 0;
        const bHasMessage = b.data.lastMessage ? 1 : 0;
        if (aHasMessage !== bHasMessage) return bHasMessage - aHasMessage;
        return timestampValue(b.data.updatedAt) - timestampValue(a.data.updatedAt);
      });
      return existingRooms[0].id;
    }
    for (const field of ["participantIds", "participants"]) {
      try {
        const snapshot = await db.collection("chats").where(field, "array-contains", String(uidA)).get();
        const found = snapshot.docs.find((doc) => {
          const data = doc.data() || {};
          const participants = Array.isArray(data.participantIds) ? data.participantIds : (Array.isArray(data.participants) ? data.participants : []);
          return participants.map(String).includes(String(uidB));
        });
        if (found) return found.id;
      } catch (error) {
        console.warn("[CS CHAT] Không truy vấn room theo " + field + ":", error);
      }
    }
    return candidates[0] || "";
  }

  /* =====================================================
     FIND NAVBAR BUTTON
  ===================================================== */

  function findChatButton() {

    return (

      document.querySelector(
        "#csNavbarMessengerBtn"
      ) ||

      document.querySelector(
        "#csChatButton"
      ) ||

      document.querySelector(
        "[data-cs-chat-button]"
      )

    );

  }


  /* =====================================================
     CREATE CHAT UI
  ===================================================== */

  function createChatUI() {

    const button =
      findChatButton();

    if (!button) {
      return false;
    }


    let panel =
      document.querySelector(
        "#csNavbarMessengerPanel"
      );


    if (!panel) {

      panel =
        document.createElement("aside");

      panel.id =
        "csNavbarMessengerPanel";

      panel.className =
        "cs-navbar-messenger-panel";

      panel.hidden = true;

      panel.setAttribute(
        "aria-hidden",
        "true"
      );

      document.body.appendChild(panel);

    }


    if (
      document.querySelector(
        "#csSingleChatContainer"
      )
    ) {

      return true;

    }


    const container =
      document.createElement("div");

    container.id =
      "csSingleChatContainer";


    container.innerHTML = `

      <div
        class="cs-single-chat-list"
        id="csSingleChatList"
      >

        <div class="cs-single-chat-header">

          <strong>Tin nhắn</strong>

          <button
            type="button"
            id="csSingleChatClose"
          >
            ×
          </button>

        </div>


        <div class="cs-single-chat-tabs" role="tablist">
          <button type="button" class="cs-single-chat-tab is-active" data-chat-tab="friends" role="tab" aria-selected="true">Bạn bè</button>
          <button type="button" class="cs-single-chat-tab" data-chat-tab="groups" role="tab" aria-selected="false">Nhóm</button>
          <button type="button" class="cs-single-chat-tab" data-chat-tab="create-group" role="tab" aria-selected="false">Tạo nhóm</button>
        </div>

        <div class="cs-single-chat-search">

          <input
            id="csSingleChatSearch"
            type="search"
            placeholder="Tìm tên hoặc email..."
            autocomplete="off"
          >

        </div>


        <div
          id="csSingleChatUsers"
          class="cs-single-chat-users"
        >

          <div class="cs-single-chat-loading">
            Đang tải...
          </div>

        </div>

        <div id="csSingleChatGroups" class="cs-single-chat-users" hidden>
          <div class="cs-single-chat-loading">Đang tải nhóm...</div>
        </div>

        <div id="csSingleChatCreateGroup" hidden>
          <form id="csSingleChatCreateGroupForm" class="cs-single-chat-create-form">
            <label>Tên nhóm<input id="csSingleChatGroupName" type="text" maxlength="80" placeholder="Ví dụ: Nhóm CSO" required></label>
            <p class="cs-single-chat-field-title">Chọn thành viên</p>
            <div id="csSingleChatGroupMembers" class="cs-single-chat-member-list"></div>
            <button type="submit" class="cs-single-chat-primary">Tạo nhóm</button>
          </form>
        </div>

      </div>


      <div
        class="cs-single-chat-conversation"
        id="csSingleChatConversation"
        hidden
      >

        <div class="cs-single-chat-header">

          <button
            type="button"
            id="csSingleChatBack"
          >
            ←
          </button>


          <div
            class="cs-single-chat-avatar"
            id="csSingleChatAvatar"
          >
            U
          </div>


          <div>

            <strong id="csSingleChatName">
              Trò chuyện
            </strong>

            <small id="csSingleChatRole">
              Thành viên
            </small>

          </div>

        </div>


        <div
          id="csSingleChatMessages"
          class="cs-single-chat-messages"
        >

          <div class="cs-single-chat-empty">
            Hãy gửi tin nhắn đầu tiên.
          </div>

        </div>


        <form
          id="csSingleChatForm"
          class="cs-single-chat-form"
        >

          <textarea
            id="csSingleChatInput"
            rows="1"
            maxlength="2000"
            placeholder="Nhập tin nhắn..."
            required
          ></textarea>


          <button
            type="submit"
            id="csSingleChatSend"
          >
            Gửi
          </button>

        </form>

      </div>

    `;


    panel.appendChild(container);

    return true;

  }


  /* =====================================================
     ELEMENTS
  ===================================================== */

  function getElements() {

    return {

      button:
        findChatButton(),

      panel:
        document.querySelector(
          "#csNavbarMessengerPanel"
        ),

      list:
        document.querySelector(
          "#csSingleChatList"
        ),

      users:
        document.querySelector(
          "#csSingleChatUsers"
        ),

      groups:
        document.querySelector(
          "#csSingleChatGroups"
        ),

      createGroup:
        document.querySelector(
          "#csSingleChatCreateGroup"
        ),

      createGroupForm:
        document.querySelector(
          "#csSingleChatCreateGroupForm"
        ),

      groupName:
        document.querySelector(
          "#csSingleChatGroupName"
        ),

      groupMembers:
        document.querySelector(
          "#csSingleChatGroupMembers"
        ),

      tabs:
        document.querySelectorAll(
          "[data-chat-tab]"
        ),

      search:
        document.querySelector(
          "#csSingleChatSearch"
        ),

      conversation:
        document.querySelector(
          "#csSingleChatConversation"
        ),

      close:
        document.querySelector(
          "#csSingleChatClose"
        ),

      back:
        document.querySelector(
          "#csSingleChatBack"
        ),

      avatar:
        document.querySelector(
          "#csSingleChatAvatar"
        ),

      name:
        document.querySelector(
          "#csSingleChatName"
        ),

      role:
        document.querySelector(
          "#csSingleChatRole"
        ),

      messages:
        document.querySelector(
          "#csSingleChatMessages"
        ),

      form:
        document.querySelector(
          "#csSingleChatForm"
        ),

      input:
        document.querySelector(
          "#csSingleChatInput"
        ),

      send:
        document.querySelector(
          "#csSingleChatSend"
        )

    };

  }


  /* =====================================================
     LOAD CURRENT USER DATA
  ===================================================== */

  async function loadCurrentUserData() {

    const db =
      getDB();

    const user =
      state.currentUser;

    if (
      !db ||
      !user
    ) {
      return null;
    }


    try {

      const doc =
        await db
          .collection("users")
          .doc(user.uid)
          .get();


      if (
        doc.exists
      ) {

        state.currentUserData = {

          uid: user.uid,

          ...doc.data()

        };

      } else {

        const profileQuery = await db.collection("users").where("uid", "==", user.uid).limit(1).get();
        if (!profileQuery.empty) {
          state.currentUserData = { uid: user.uid, ...profileQuery.docs[0].data() };
        } else {
          state.currentUserData = {

            uid: user.uid,

            email: user.email || "",

            name:
              user.displayName ||
              user.email ||
              "Người dùng"

          };
        }

      }


      return state.currentUserData;

    } catch (error) {

      console.warn(
        "[CS CHAT] Không đọc được users/current:",
        error
      );

      state.currentUserData = {

        uid: user.uid,

        email: user.email || "",

        name:
          user.displayName ||
          user.email ||
          "Người dùng"

      };

      return state.currentUserData;

    }

  }


  /* =====================================================
     LOAD USERS
  ===================================================== */

  async function loadUsers() {

    const db =
      getDB();

    const currentUser =
      state.currentUser;

    const elements =
      getElements();


    if (
      !db ||
      !currentUser ||
      !elements.users
    ) {

      return;

    }


    elements.users.innerHTML = `

      <div class="cs-single-chat-loading">
        Đang tải danh sách...
      </div>

    `;


    try {

      const snapshot =
        await db
          .collection("users")
          .get();


      const users = [];


      snapshot.forEach(
        (doc) => {

          const data =
            doc.data() || {};


          const uid =
            String(

              data.uid ||

              data.userId ||

              doc.id

            );


          if (
            !uid ||
            uid ===
              String(
                currentUser.uid
              )
          ) {

            return;

          }


          users.push({

            uid,

            id: uid,

            ...data

          });

        }
      );


      state.users =
        users.sort(
          (a, b) =>
            getUserName(a).localeCompare(
              getUserName(b),
              "vi"
            )
        );


      renderUsers();


    } catch (error) {

      console.error(
        "[CS CHAT] LOAD USERS ERROR:",
        error
      );


      elements.users.innerHTML = `

        <div class="cs-single-chat-error">

          Không tải được danh sách người dùng.

          <br>

          <small>
            ${escapeHTML(
              error.message || ""
            )}
          </small>

        </div>

      `;

    }

  }


  /* =====================================================
     LOAD AND RENDER GROUPS
  ===================================================== */

  async function loadGroups() {
    const db = getDB();
    const currentUser = state.currentUser;
    const elements = getElements();
    if (!db || !currentUser || !elements.groups) return;
    elements.groups.innerHTML = '<div class="cs-single-chat-loading">Đang tải nhóm...</div>';
    const groupsById = new Map();
    try {
      const [memberSnapshot, leaderSnapshot, chatGroupSnapshot] = await Promise.all([
        db.collection("groups").where("memberIds", "array-contains", currentUser.uid).get(),
        db.collection("groups").where("leaderUid", "==", currentUser.uid).get(),
        db.collection("chatGroups").where("participants", "array-contains", currentUser.uid).get()
      ]);
      [...memberSnapshot.docs, ...leaderSnapshot.docs].forEach((doc) => groupsById.set(doc.id, { id: doc.id, ...doc.data() }));
      chatGroupSnapshot.docs.forEach((doc) => groupsById.set(`chat:${doc.id}`, { id: doc.id, ...doc.data(), isChatGroup: true }));
    } catch (error) {
      console.warn("[CS CHAT] Không tải nhanh được nhóm, thử tải toàn bộ:", error);
      const snapshot = await db.collection("groups").get();
      snapshot.docs.forEach((doc) => groupsById.set(doc.id, { id: doc.id, ...doc.data() }));
    }
    state.groups = [...groupsById.values()].filter((group) => group.isChatGroup || groupBelongsToCurrentUser(group, currentUser.uid)).sort((a, b) => groupTitle(a).localeCompare(groupTitle(b), "vi"));
    renderGroups();
    renderCreateGroupMembers();
  }

  function groupLeaderId(group) {
    const leader = group?.leader || {};
    return String(group?.leaderUid || leader.uid || leader.id || "");
  }

  function groupTitle(group) {
    return String(group?.name || group?.code || "Nhóm CS");
  }

  function groupParticipants(group) {
    const result = new Map();
    if (group?.isChatGroup) {
      const names = group?.participantNames || {};
      (Array.isArray(group?.participants) ? group.participants : []).forEach((uidValue) => {
        const uid = String(uidValue || "");
        if (uid) result.set(uid, { uid, name: names[uid] || "Thành viên", email: "", role: "member" });
      });
      return [...result.values()];
    }
    const leaderId = groupLeaderId(group);
    const leader = group?.leader || {};
    if (leaderId) result.set(leaderId, { uid: leaderId, name: group.leaderName || leader.name || "CS Leader", email: group.leaderEmail || leader.email || "", role: "leader" });
    (Array.isArray(group?.members) ? group.members : []).forEach((member) => {
      const uid = String(member?.uid || member?.id || "");
      if (uid) result.set(uid, { uid, name: member.name || member.displayName || "CS thành viên", email: member.email || "", role: uid === leaderId ? "leader" : "member" });
    });
    (Array.isArray(group?.memberIds) ? group.memberIds : []).forEach((uidValue) => {
      const uid = String(uidValue || "");
      if (uid && !result.has(uid)) result.set(uid, { uid, name: uid === leaderId ? "CS Leader" : "CS thành viên", email: "", role: uid === leaderId ? "leader" : "member" });
    });
    return [...result.values()];
  }

  function groupBelongsToCurrentUser(group, uid) {
    const id = String(uid || "");
    return groupLeaderId(group) === id || groupParticipants(group).some((member) => String(member.uid) === id);
  }

  function renderGroups() {
    const elements = getElements();
    if (!elements.groups) return;
    const keyword = String(elements.search?.value || "").trim().toLowerCase();
    const groups = state.groups.filter((group) => !keyword || groupTitle(group).toLowerCase().includes(keyword) || String(group.code || "").toLowerCase().includes(keyword));
    if (!groups.length) {
      elements.groups.innerHTML = '<div class="cs-single-chat-empty">Bạn chưa tham gia nhóm nào phù hợp.</div>';
      return;
    }
    elements.groups.innerHTML = groups.map((group) => `<button type="button" class="cs-single-chat-user" data-chat-group="${escapeHTML(group.id)}"><span class="cs-single-chat-avatar">${escapeHTML(getInitials(groupTitle(group)))}</span><span class="cs-single-chat-user-info"><strong>${escapeHTML(groupTitle(group))}</strong><small>${groupParticipants(group).length} thành viên · Trao đổi nội bộ</small></span></button>`).join("");
  }

  function renderCreateGroupMembers() {
    const elements = getElements();
    if (!elements.groupMembers) return;
    const users = state.users || [];
    elements.groupMembers.innerHTML = users.length ? users.map((user) => `<label class="cs-single-chat-member-option"><input type="checkbox" value="${escapeHTML(user.uid)}"><span>${escapeHTML(getUserName(user))}</span></label>`).join("") : '<div class="cs-single-chat-empty">Chưa có người dùng để thêm.</div>';
  }

  async function createGroup(event) {
    event.preventDefault();
    const db = getDB();
    const currentUser = state.currentUser;
    const elements = getElements();
    const name = String(elements.groupName?.value || "").trim();
    const memberIds = [...(elements.groupMembers?.querySelectorAll("input:checked") || [])].map((input) => input.value);
    if (!db || !currentUser || !name) return;
    const allIds = [currentUser.uid, ...memberIds.filter((uid) => uid !== currentUser.uid)];
    try {
      const groupRef = db.collection("chatGroups").doc();
      const participantNames = {};
      allIds.forEach((uid) => {
        const member = uid === currentUser.uid ? (state.currentUserData || currentUser) : state.users.find((user) => String(user.uid) === String(uid));
        participantNames[uid] = getUserName(member || { name: "Thành viên" });
      });
      await groupRef.set({ name, participants: allIds, participantNames, createdBy: currentUser.uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp(), lastMessage: "", lastMessageBy: "" });
      await loadGroups();
      if (elements.groupName) elements.groupName.value = "";
      elements.groupMembers?.querySelectorAll("input:checked").forEach((input) => { input.checked = false; });
      document.querySelector("[data-chat-tab=groups]")?.click();
    } catch (error) {
      console.error("[CS CHAT] CREATE GROUP ERROR:", error);
    }
  }

  /* =====================================================
     RENDER USERS
  ===================================================== */

  function renderUsers() {

    const elements =
      getElements();


    if (
      !elements.users
    ) {
      return;
    }


    const keyword =
      String(
        elements.search?.value || ""
      )
        .trim()
        .toLowerCase();


    const users =
      state.users.filter(
        (user) => {

          if (!keyword) {
            return true;
          }


          const name =
            getUserName(user)
              .toLowerCase();


          const email =
            getUserEmail(user)
              .toLowerCase();


          return (

            name.includes(keyword) ||

            email.includes(keyword)

          );

        }
      );


    if (!users.length) {

      elements.users.innerHTML = `

        <div class="cs-single-chat-empty">
          Không tìm thấy người dùng.
        </div>

      `;

      return;

    }


    elements.users.innerHTML =

      users
        .map(
          (user) => {

            const name =
              getUserName(user);

            const email =
              getUserEmail(user);


            return `

              <button
                type="button"
                class="cs-single-chat-user"
                data-chat-user="${escapeHTML(
                  user.uid
                )}"
              >

                <span
                  class="cs-single-chat-avatar"
                >
                  ${escapeHTML(
                    getInitials(name)
                  )}
                </span>


                <span
                  class="cs-single-chat-user-info"
                >

                  <strong>
                    ${escapeHTML(name)}
                  </strong>

                  <small>
                    ${escapeHTML(
                      email ||
                      getUserRole(user)
                    )}
                  </small>

                </span>

              </button>

            `;

          }
        )
        .join("");

  }


  /* =====================================================
     OPEN PANEL
  ===================================================== */

  async function openPanel() {

    const elements =
      getElements();


    if (!elements.panel) {

      createChatUI();

    }


    const now =
      getElements();


    if (!now.panel) {
      return;
    }


    now.panel.hidden = false;

    now.panel.setAttribute(
      "aria-hidden",
      "false"
    );


    if (
      !state.currentUser
    ) {

      console.warn(
        "[CS CHAT] Chưa đăng nhập."
      );

      return;

    }


    await loadUsers();
    await loadGroups();

  }


  /* =====================================================
     CLOSE PANEL
  ===================================================== */

  function closePanel() {

    const elements =
      getElements();


    if (
      elements.panel
    ) {

      elements.panel.hidden = true;

      elements.panel.setAttribute(
        "aria-hidden",
        "true"
      );

    }


    closeConversation();

  }


  /* =====================================================
     OPEN GROUP CONVERSATION
  ===================================================== */

  async function openGroupConversation(groupId) {
    const group = state.groups.find((item) => String(item.id) === String(groupId));
    if (!group) return;
    stopMessageListener();
    state.chatMode = group.isChatGroup ? "chat-group" : "group";
    state.selectedGroup = group;
    state.selectedUser = null;
    state.roomId = group.id;
    const elements = getElements();
    if (!elements.conversation) return;
    if (elements.list) elements.list.hidden = true;
    elements.conversation.hidden = false;
    if (elements.name) elements.name.textContent = groupTitle(group);
    if (elements.role) elements.role.textContent = group.isChatGroup ? `${groupParticipants(group).length} thành viên · Nhóm chat` : `${groupParticipants(group).length} thành viên · Leader và CS con`;
    if (elements.avatar) elements.avatar.textContent = getInitials(groupTitle(group));
    if (elements.messages) elements.messages.innerHTML = '<div class="cs-single-chat-loading">Đang tải tin nhắn nhóm...</div>';
    if (elements.input) elements.input.placeholder = group.isChatGroup ? "Nhập tin nhắn cho các thành viên..." : "Nhập tin nhắn cho các CS trong nhóm...";
    listenMessages(group.id);
  }

  /* =====================================================
     OPEN CONVERSATION
  ===================================================== */

  async function openConversation(uid) {

    state.chatMode = "direct";
    state.selectedGroup = null;

    const db =
      getDB();

    const currentUser =
      state.currentUser;


    if (
      !db ||
      !currentUser
    ) {

      console.error(
        "[CS CHAT] Firebase/Auth chưa sẵn sàng."
      );

      return;

    }


    const target =
      state.users.find(
        (user) =>
          String(user.uid) ===
          String(uid)
      );


    if (!target) {

      console.error(
        "[CS CHAT] Không tìm thấy user:",
        uid
      );

      return;

    }

    await saveChatContact(target);


    stopMessageListener();


    state.selectedUser =
      target;


    const roomId = await resolveDirectRoomId(db, currentUser.uid, target.uid);


    if (!roomId) {

      console.error(
        "[CS CHAT] Không tạo được roomId."
      );

      return;

    }


    state.roomId =
      roomId;


    const elements =
      getElements();


    if (
      !elements.conversation
    ) {
      return;
    }


    if (elements.list) {
      elements.list.hidden = true;
    }


    elements.conversation.hidden =
      false;


    if (elements.name) {

      elements.name.textContent =
        getUserName(target);

    }


    if (elements.role) {

      elements.role.textContent =
        getUserRole(target);

    }


    if (elements.avatar) {

      elements.avatar.textContent =
        getInitials(
          getUserName(target)
        );

    }


    if (elements.messages) {

      elements.messages.innerHTML = `

        <div class="cs-single-chat-loading">
          Đang tải tin nhắn...
        </div>

      `;

    }


    const roomRef =
      db
        .collection("chats")
        .doc(roomId);

    /* Không để lỗi metadata chặn listener nhận tin nhắn đối phương. */
    listenMessages(roomId);


    try {

      const roomSnapshot =
        await roomRef.get();


      if (
        !roomSnapshot.exists
      ) {

        await roomRef.set({

          participants: [

            currentUser.uid,

            target.uid

          ],


          participantIds: [

            currentUser.uid,

            target.uid

          ],


          participantNames: {

            [currentUser.uid]:
              getUserName(
                state.currentUserData ||
                currentUser
              ),

            [target.uid]:
              getUserName(target)

          },


          lastMessage: "",

          lastMessageBy: "",

          lastMessageSenderId: "",

          lastMessageReadBy: "",

          lastMessageReadAt: null,

          createdAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp()

        });

      }


      await markRoomRead(
        roomId
      );


    } catch (error) {

      console.error(
        "[CS CHAT] ROOM ERROR:",
        error
      );

      if (elements.messages) {

        elements.messages.innerHTML = `

          <div class="cs-single-chat-error">

            Không thể mở cuộc trò chuyện.

            <br>

            <small>
              ${escapeHTML(
                error.message || ""
              )}
            </small>

          </div>

        `;

      }

      /* Listener phía trên vẫn tiếp tục tải lịch sử nếu quyền đọc messages hợp lệ. */

    }

  }


  /* =====================================================
     LISTEN MESSAGES
  ===================================================== */

  function listenMessages(roomId) {

    const db =
      getDB();

    const elements =
      getElements();


    if (
      !db ||
      !roomId ||
      !elements.messages
    ) {
      return;
    }


    stopMessageListener();


    if (state.chatMode === "group") {
      const groupMessagesRef = db.collection("groups").doc(roomId).collection("memberMessages");
      state.messagesUnsubscribe = groupMessagesRef.orderBy("createdAt", "asc").onSnapshot((snapshot) => {
        renderMessages(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        if (state.roomId === roomId) markRoomRead(roomId);
      }, (error) => {
        console.error("[CS CHAT] GROUP MESSAGE LISTENER ERROR:", error);
        if (elements.messages) elements.messages.innerHTML = `<div class="cs-single-chat-error">Không thể tải tin nhắn nhóm.<br><small>${escapeHTML(error.message || "")}</small></div>`;
      });
      return;
    }

    if (state.chatMode === "chat-group") {
      const groupMessagesRef = db.collection("chatGroups").doc(roomId).collection("messages");
      state.messagesUnsubscribe = groupMessagesRef.orderBy("createdAt", "asc").onSnapshot((snapshot) => {
        renderMessages(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      }, (error) => {
        console.error("[CS CHAT] CHAT GROUP MESSAGE LISTENER ERROR:", error);
        if (elements.messages) elements.messages.innerHTML = `<div class="cs-single-chat-error">Không thể tải tin nhắn nhóm.<br><small>${escapeHTML(error.message || "")}</small></div>`;
      });
      return;
    }


    const canonicalRoomId = makeRoomId(state.currentUser?.uid, state.selectedUser?.uid);
    const legacyRoomId = [String(state.currentUser?.uid || ""), String(state.selectedUser?.uid || "")].filter(Boolean).sort().join("_");
    const roomIds = [...new Set([roomId, canonicalRoomId, legacyRoomId].filter(Boolean))];
    const messageMap = new Map();
    const unsubscribers = [];
    const renderCombinedMessages = () => {
      const messages = [...messageMap.values()].sort((a, b) => timestampValue(a.createdAt || a.timestamp) - timestampValue(b.createdAt || b.timestamp));
      renderMessages(messages);
    };
    roomIds.forEach((candidateRoomId) => {
      const messagesRef = db.collection("chats").doc(candidateRoomId).collection("messages");
      const loadFallback = () => messagesRef.get().then((snapshot) => {
        snapshot.docs.forEach((doc) => messageMap.set(`${candidateRoomId}/${doc.id}`, { id: doc.id, ...doc.data() }));
        renderCombinedMessages();
      }).catch((fallbackError) => console.error("[CS CHAT] MESSAGE FALLBACK ERROR:", candidateRoomId, fallbackError));
      loadFallback();
      const unsubscribe = messagesRef.onSnapshot((snapshot) => {
        snapshot.docs.forEach((doc) => messageMap.set(`${candidateRoomId}/${doc.id}`, { id: doc.id, ...doc.data() }));
        renderCombinedMessages();
        if (state.roomId === roomId) {
          roomIds.forEach((id) => markRoomRead(id));
        }
      }, (error) => {
        console.error("[CS CHAT] MESSAGE LISTENER ERROR:", candidateRoomId, error);
        loadFallback();
        if (!messageMap.size && elements.messages) elements.messages.innerHTML = `<div class="cs-single-chat-error">Không thể tải tin nhắn.<br><small>${escapeHTML(error.message || "")}</small></div>`;
      });
      unsubscribers.push(unsubscribe);
    });
    state.messagesUnsubscribe = () => unsubscribers.forEach((unsubscribe) => {
      try { unsubscribe(); } catch (error) { console.warn("[CS CHAT] Không thể hủy listener:", error); }
    });

  }

  /* =====================================================
     STOP MESSAGE LISTENER
  ===================================================== */

  function stopMessageListener() {

    if (
      typeof state.messagesUnsubscribe ===
      "function"
    ) {

      try {

        state.messagesUnsubscribe();

      } catch (error) {}

    }


    state.messagesUnsubscribe =
      null;

  }


  /* =====================================================
     RENDER MESSAGES
  ===================================================== */

  function renderMessages(messages) {

    const elements =
      getElements();

    const currentUser =
      state.currentUser;


    if (
      !elements.messages ||
      !currentUser
    ) {
      return;
    }


    messages.sort(
      (a, b) => {

        const ta =
          timestampValue(
            a.createdAt ||
            a.timestamp
          );

        const tb =
          timestampValue(
            b.createdAt ||
            b.timestamp
          );

        return ta - tb;

      }
    );


    if (!messages.length) {

      elements.messages.innerHTML = `

        <div class="cs-single-chat-empty">
          Hãy gửi tin nhắn đầu tiên.
        </div>

      `;

      return;

    }


    elements.messages.innerHTML =

      messages
        .map(
          (message) => {

            const senderId = directMessageSender(message);


            const isMine =
              senderId ===
              String(
                currentUser.uid
              );


            const text = directMessageText(message);


            const time =
              timestampValue(
                message.createdAt ||
                message.timestamp
              );


            let timeText = "";


            if (time) {

              try {

                timeText =
                  new Date(time)
                    .toLocaleTimeString(
                      "vi-VN",
                      {
                        hour: "2-digit",
                        minute: "2-digit"
                      }
                    );

              } catch (error) {}

            }


            return `

              <div
                class="
                  cs-single-chat-message
                  ${isMine ? "mine" : "other"}
                "
              >

                <div
                  class="cs-single-chat-bubble"
                >

                  ${escapeHTML(text)}

                  ${
                    timeText
                      ? `
                        <small
                          class="cs-single-chat-time"
                        >
                          ${escapeHTML(
                            timeText
                          )}
                        </small>
                      `
                      : ""
                  }

                </div>

              </div>

            `;

          }
        )
        .join("");


    elements.messages.scrollTop =
      elements.messages.scrollHeight;

  }


  async function sendGroupMessage(event) {
    if (event) event.preventDefault();
    if (state.sending || !state.selectedGroup) return;
    const db = getDB();
    const currentUser = state.currentUser;
    const elements = getElements();
    const text = String(elements.input?.value || "").trim();
    if (!db || !currentUser || !text || !elements.input) return;
    state.sending = true;
    if (elements.send) elements.send.disabled = true;
    try {
      const group = state.selectedGroup;
      const isChatGroup = Boolean(group.isChatGroup);
      const groupRef = db.collection(isChatGroup ? "chatGroups" : "groups").doc(group.id);
      const messageRef = groupRef.collection(isChatGroup ? "messages" : "memberMessages").doc();
      const senderName = getUserName(state.currentUserData || currentUser);
      const batch = db.batch();
      batch.set(messageRef, isChatGroup ? { from: currentUser.uid, to: groupParticipants(group).filter((member) => String(member.uid) !== String(currentUser.uid)).map((member) => member.uid), senderId: currentUser.uid, senderUid: currentUser.uid, senderName, senderEmail: currentUser.email || "", text, message: text, createdAt: serverTimestamp(), updatedAt: serverTimestamp(), read: false } : { senderUid: currentUser.uid, senderName, senderEmail: currentUser.email || "", senderType: groupLeaderId(group) === String(currentUser.uid) ? "cs_leader" : "cs_member", text, message: text, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      if (isChatGroup) batch.set(groupRef, { lastMessage: text, lastMessageBy: currentUser.uid, updatedAt: serverTimestamp() }, { merge: true });
      groupParticipants(group).filter((member) => String(member.uid) !== String(currentUser.uid)).forEach((member) => {
        const notice = db.collection("csNotifications").doc(member.uid).collection("items").doc();
        batch.set(notice, isChatGroup ? { type: "chat_group_message", recipientUid: member.uid, senderId: currentUser.uid, senderName, chatGroupId: group.id, groupName: groupTitle(group), messageId: messageRef.id, title: `${senderName} đã gửi tin nhắn trong ${groupTitle(group)}`, preview: text.slice(0, 180), read: false, createdAt: serverTimestamp() } : { type: "group_message", recipientUid: member.uid, groupId: group.id, groupName: groupTitle(group), messageId: messageRef.id, title: `Tin nhắn mới trong ${groupTitle(group)}`, preview: `${senderName}: ${text.slice(0, 180)}`, link: groupLeaderId(group) === String(member.uid) ? `/CS/Groups/group.html?group=${encodeURIComponent(group.id)}` : `/CS/Groups/group-member.html?group=${encodeURIComponent(group.id)}`, read: false, createdAt: serverTimestamp() });
      });
      await batch.commit();
      elements.input.value = "";
      elements.input.focus();
    } catch (error) {
      console.error("[CS CHAT] SEND GROUP MESSAGE ERROR:", error);
    } finally {
      state.sending = false;
      if (elements.send) elements.send.disabled = false;
    }
  }

  /* =====================================================
     SEND MESSAGE
  ===================================================== */

  async function sendMessage(event) {

    if (event) {
      event.preventDefault();
    }


    if (state.sending) {
      return;
    }


    const db =
      getDB();

    const currentUser =
      state.currentUser;

    const target =
      state.selectedUser;

    if (state.chatMode === "group" || state.chatMode === "chat-group") {
      return sendGroupMessage(event);
    }

    const elements =
      getElements();


    if (
      !db ||
      !currentUser ||
      !target ||
      !elements.input
    ) {

      console.error(
        "[CS CHAT] Thiếu dữ liệu gửi."
      );

      return;

    }

    const roomId = state.roomId || makeRoomId(currentUser.uid, target.uid);
    state.roomId = roomId;
    if (!roomId) return;


    const text =
      String(
        elements.input.value || ""
      ).trim();


    if (!text) {
      return;
    }


    state.sending =
      true;


    if (elements.send) {

      elements.send.disabled =
        true;

    }


    try {

      const roomRef =
        db
          .collection("chats")
          .doc(roomId);


      const messagesRef =
        roomRef.collection(
          "messages"
        );


      const now =
        serverTimestamp();


      /*
         Dùng transaction để
         cập nhật room an toàn.
      */

      await roomRef.set(

        {

          participants: [

            currentUser.uid,

            target.uid

          ],


          participantIds: [

            currentUser.uid,

            target.uid

          ],


          participantNames: {

            [currentUser.uid]:
              getUserName(
                state.currentUserData ||
                currentUser
              ),

            [target.uid]:
              getUserName(target)

          },


          lastMessage:
            text,

          lastMessageBy:
            currentUser.uid,

          lastMessageSenderId:
            currentUser.uid,

          lastMessageReadBy:
            currentUser.uid,

          lastMessageReadAt:
            now,

          updatedAt:
            now

        },

        {
          merge: true
        }

      );


      /*
         Tạo message.

         QUAN TRỌNG:
         Dùng cùng roomId.
      */

      await messagesRef.add(makeDirectMessage({
        senderId: currentUser.uid,
        senderName: getUserName(state.currentUserData || currentUser),
        senderEmail: currentUser.email || "",
        receiverId: target.uid,
        receiverName: getUserName(target),
        text,
        timestamp: now
      }));

      await createDirectChatNotification(db, {
        recipientUid: target.uid,
        senderUid: currentUser.uid,
        senderName: getUserName(state.currentUserData || currentUser),
        roomId,
        text
      });


      elements.input.value =
        "";


      elements.input.focus();


      console.log(
        "[CS CHAT] MESSAGE SENT",
        {
          roomId,
          sender:
            currentUser.uid,
          receiver:
            target.uid
        }
      );


    } catch (error) {

      console.error(
        "[CS CHAT] SEND ERROR:",
        error
      );


      alert(
        "Không gửi được tin nhắn:\n" +
        (
          error.message ||
          "Firestore error"
        )
      );


    } finally {

      state.sending =
        false;


      if (elements.send) {

        elements.send.disabled =
          false;

      }

    }

  }


  /* =====================================================
     MARK READ
  ===================================================== */

  async function markRoomRead(roomId) {

    const db =
      getDB();

    const currentUser =
      state.currentUser;


    if (
      !db ||
      !currentUser ||
      !roomId
    ) {
      return;
    }


    try {

      if (state.chatMode === "group") {
        const notifications = db.collection("csNotifications").doc(currentUser.uid).collection("items");
        const notificationSnapshot = await notifications.get();
        const notificationBatch = db.batch();
        let notificationChanged = false;
        notificationSnapshot.forEach((doc) => {
          const data = doc.data() || {};
          if (data.type === "group_message" && String(data.groupId) === String(roomId) && data.read !== true) {
            notificationBatch.update(doc.ref, { read: true, readAt: serverTimestamp() });
            notificationChanged = true;
          }
        });
        if (notificationChanged) await notificationBatch.commit();
        return;
      }

      await markDirectChatNotificationsRead(roomId);

      const messagesRef =
        db
          .collection("chats")
          .doc(roomId)
          .collection("messages");


      const snapshot =
        await messagesRef.get();


      const batch =
        db.batch();


      let changed =
        false;


      snapshot.forEach(
        (doc) => {

          const data =
            doc.data() || {};


          const receiverId = directMessageReceiver(data);


          const senderId = directMessageSender(data);


          if (

            receiverId ===
              String(
                currentUser.uid
              ) &&

            senderId !==
              String(
                currentUser.uid
              ) &&

            data.read !== true

          ) {

            batch.update(
              doc.ref,
              {

                read: true,

                readAt:
                  serverTimestamp()

              }
            );


            changed =
              true;

          }

        }
      );


      if (changed) {

        await batch.commit();

      }


      /*
         Chỉ update lastMessageRead*
         nếu đây là room đang mở.
      */

      if (
        state.roomId === roomId
      ) {

        await db
          .collection("chats")
          .doc(roomId)
          .set(

            {

              lastMessageReadBy:
                currentUser.uid,

              lastMessageReadAt:
                serverTimestamp()

            },

            {
              merge: true
            }

          );

      }


    } catch (error) {

      console.warn(
        "[CS CHAT] MARK READ ERROR:",
        error
      );

    }

  }


  /* =====================================================
     UNREAD
  ===================================================== */

  function bindUnread() {

    const db =
      getDB();

    const currentUser =
      state.currentUser;


    if (
      !db ||
      !currentUser
    ) {
      return;
    }


    if (
      typeof state.roomsUnsubscribe ===
      "function"
    ) {

      state.roomsUnsubscribe();

    }


    /*
       Không where.
       Không orderBy.
       Không composite index.
    */

    state.roomsUnsubscribe =
      db
        .collection("chats")
        .onSnapshot(

          (snapshot) => {

            let unread =
              0;


            snapshot.forEach(
              (doc) => {

                const data =
                  doc.data() || {};


                const participants = [

                  ...(Array.isArray(
                    data.participants
                  )
                    ? data.participants
                    : []),

                  ...(Array.isArray(
                    data.participantIds
                  )
                    ? data.participantIds
                    : [])

                ].map(String);


                if (
                  !participants.includes(
                    String(
                      currentUser.uid
                    )
                  )
                ) {

                  return;

                }


                const sender =
                  String(

                    data.lastMessageBy ||

                    data.lastMessageSenderId ||

                    ""

                  );


                const readBy =
                  String(
                    data.lastMessageReadBy ||
                    ""
                  );


                if (

                  data.lastMessage &&

                  sender !==
                    String(
                      currentUser.uid
                    ) &&

                  readBy !==
                    String(
                      currentUser.uid
                    )

                ) {

                  unread++;

                }

              }
            );


            state.directUnreadCount = unread;
            updateBadge(state.directUnreadCount + state.groupUnreadCount);

          },


          (error) => {

            console.warn(
              "[CS CHAT] UNREAD ERROR:",
              error
            );
            state.directUnreadCount = 0;
            updateBadge(state.groupUnreadCount);

          }

        );

    if (typeof state.groupUnreadUnsubscribe === "function") state.groupUnreadUnsubscribe();
    state.groupUnreadUnsubscribe = db.collection("csNotifications").doc(currentUser.uid).collection("items").onSnapshot((snapshot) => {
      let unreadGroups = 0;
      snapshot.forEach((doc) => {
        const data = doc.data() || {};
        if (data.type === "group_message" && data.read !== true) unreadGroups += 1;
      });
      state.groupUnreadCount = unreadGroups;
      updateBadge(state.directUnreadCount + state.groupUnreadCount);
    }, (error) => console.warn("[CS CHAT] GROUP BADGE ERROR:", error));

  }


  /* =====================================================
     BADGE
  ===================================================== */

  function updateBadge(count) {

    const badges = [

      document.querySelector(
        "#csNavbarMessengerBadge"
      ),

      document.querySelector(
        "#csChatCount"
      ),

      document.querySelector(
        "[data-cs-chat-badge]"
      )

    ].filter(Boolean);


    const total =
      Math.max(
        0,
        Number(count) || 0
      );


    badges.forEach(
      (badge) => {

        badge.textContent =
          total > 99
            ? "99+"
            : String(total);


        badge.hidden =
          total === 0;

      }
    );

  }


  /* =====================================================
     EVENTS
  ===================================================== */

  function bindEvents() {

    if (
      state.eventsBound
    ) {
      return;
    }


    /*
       Dùng document delegation.

       Vì navbar có thể được inject
       sau khi cs-chat.js load.
    */


    document.addEventListener(
      "click",
      async (event) => {

        const tab = event.target.closest("[data-chat-tab]");
        if (tab) {
          const elements = getElements();
          const groups = tab.dataset.chatTab === "groups";
          const createGroup = tab.dataset.chatTab === "create-group";
          elements.tabs?.forEach((item) => {
            const active = item === tab;
            item.classList.toggle("is-active", active);
            item.setAttribute("aria-selected", String(active));
          });
          if (elements.users) elements.users.hidden = groups || createGroup;
          if (elements.groups) elements.groups.hidden = !groups;
          if (elements.createGroup) elements.createGroup.hidden = !createGroup;
          if (elements.search) elements.search.parentElement.hidden = createGroup;
          if (groups) renderGroups();
          if (createGroup) renderCreateGroupMembers();
          return;
        }

        const button =
          event.target.closest(
            "#csNavbarMessengerBtn, #csChatButton, [data-cs-chat-button]"
          );


        if (button) {

          event.preventDefault();

          const elements =
            getElements();


          if (
            elements.panel &&
            !elements.panel.hidden
          ) {

            closePanel();

          } else {

            await openPanel();

          }

          return;

        }


        const groupButton =
          event.target.closest(
            "[data-chat-group]"
          );

        if (groupButton) {
          await openGroupConversation(groupButton.dataset.chatGroup);
          return;
        }

        const userButton =
          event.target.closest(
            "[data-chat-user]"
          );


                if (userButton) {
          const uid =
            userButton.dataset.chatUser;


          if (uid) {

            await openConversation(
              uid
            );

          }

          return;

        }


        if (
          event.target.closest(
            "#csSingleChatClose"
          )
        ) {

          closePanel();

          return;

        }


        if (
          event.target.closest(
            "#csSingleChatBack"
          )
        ) {

          closeConversation();

          return;

        }

      }
    );


    document.addEventListener(
      "input",
      (event) => {

        if (
          event.target?.id ===
          "csSingleChatSearch"
        ) {
          renderUsers();
          renderGroups();
        }

      }
    );


    document.addEventListener(
      "submit",
      (event) => {
        if (event.target?.id === "csSingleChatForm") {
          if (event.__csChatSubmitHandled) return;
          event.__csChatSubmitHandled = true;
          event.preventDefault();
          event.stopImmediatePropagation();
          sendMessage(event);
          return;
        }
        if (event.target?.id === "csSingleChatCreateGroupForm") createGroup(event);
      }
    );


    document.addEventListener(
      "keydown",
      (event) => {

        if (
          event.target?.id ===
          "csSingleChatInput"
        ) {

          if (
            event.key === "Enter" &&
            !event.shiftKey
          ) {

            event.preventDefault();

            const form =
              document.querySelector(
                "#csSingleChatForm"
              );


            if (form) {

              if (
                typeof form.requestSubmit ===
                "function"
              ) {

                form.requestSubmit();

              } else {

                sendMessage({
                  preventDefault() {}
                });

              }

            }

          }

        }


        if (
          event.key === "Escape"
        ) {

          const elements =
            getElements();


          if (
            elements.panel &&
            !elements.panel.hidden
          ) {

            closePanel();

          }

        }

      }
    );


    state.eventsBound =
      true;


    console.log(
      "[CS CHAT] Global events ready."
    );

  }


  /* =====================================================
     CLOSE CONVERSATION
  ===================================================== */

  function closeConversation() {

    stopMessageListener();


    state.selectedUser =
      null;

    state.selectedGroup =
      null;

    state.chatMode = "direct";

    state.roomId =
      null;


    const elements =
      getElements();


    if (
      elements.conversation
    ) {

      elements.conversation.hidden =
        true;

    }


    if (
      elements.list
    ) {

      elements.list.hidden =
        false;

    }

  }


  /* =====================================================
     AUTH
  ===================================================== */

  function bindAuth() {

    const auth =
      getAuth();


    if (!auth) {

      console.warn(
        "[CS CHAT] Firebase Auth chưa sẵn sàng."
      );

      return false;

    }


    if (
      state.authUnsubscribe
    ) {

      try {

        state.authUnsubscribe();

      } catch (error) {}

    }


    state.authUnsubscribe =
      auth.onAuthStateChanged(
        async (user) => {

          console.log(
            "[CS CHAT] Auth:",
            user
              ? user.uid
              : "LOGOUT"
          );


          if (!user) {

            state.currentUser =
              null;

            state.roleResolved = false;
            hideRestrictedNavigation();
            state.directUnreadCount = 0;
            state.groupUnreadCount = 0;

            state.currentUserData =
              null;

            try {
              state.notificationsUnsubscribe?.();
            } catch (error) {}
            state.notificationsUnsubscribe = null;

            state.users =
              [];

            state.selectedUser =
              null;

            state.roomId =
              null;


            stopMessageListener();


            if (
              state.roomsUnsubscribe
            ) {

              try {

                state.roomsUnsubscribe();

              } catch (error) {}

              state.roomsUnsubscribe =
                null;

            }


            updateBadge(
              0
            );


            return;

          }


          state.currentUser =
            user;

          state.roleResolved = false;
          hideRestrictedNavigation();


          await loadCurrentUserData();
          await syncCSNavbarProfile();


          bindUnread();


          /*
             Nếu chat UI đã tồn tại
             thì có thể load user ngay.
          */

          if (
            document.querySelector(
              "#csSingleChatContainer"
            )
          ) {

            loadUsers();

          }

        }
      );


    return true;

  }


  /* =====================================================
     START
  ===================================================== */

  async function start() {

    if (state.starting) {
      return;
    }


    state.starting =
      true;


    try {

      bindEvents();


      /*
         Firebase có thể được load
         sau chat.js.
      */

      const auth =
        getAuth();


      if (auth) {

        bindAuth();

      } else {

        console.warn(
          "[CS CHAT] Đang chờ Firebase..."
        );

      }


      /*
         Navbar có thể được inject
         sau khi DOM ready.
      */

      createChatUI();


      console.log(
        "[CS CHAT] Global chat started."
      );


    } finally {

      state.starting =
        false;

    }

  }


  /* =====================================================
     AUTO INIT
  ===================================================== */

  function boot() {

    ensureCSNavbar();
    start();


    /*
       Kiểm tra navbar xuất hiện
       sau đó vài giây.
    */

    let count =
      0;


    const timer =
      setInterval(
        () => {

          count++;


          createChatUI();

          ensureCSNavbar();


          if (
            getAuth() &&
            !state.authUnsubscribe
          ) {

            bindAuth();

          }


          if (
            count >= 30
          ) {

            clearInterval(
              timer
            );

          }

        },
        500
      );


    /*
       Nếu navbar được render bằng JS
       MutationObserver sẽ bắt được.
    */

    if (
      window.MutationObserver
    ) {

      const observer =
        new MutationObserver(
          () => {

            if (
              !document.querySelector(
                "#csSingleChatContainer"
              )
            ) {

              createChatUI();

            }

          }
        );


      observer.observe(
        document.body,
        {
          childList: true,
          subtree: true
        }
      );


      setTimeout(
        () => {

          try {
            observer.disconnect();
          } catch (error) {}

        },
        15000
      );

    }

  }


  /* =====================================================
     PUBLIC API
  ===================================================== */

  window.csSingleChat = {

    open:
      openPanel,

    close:
      closePanel,

    reload:
      loadUsers,

    openConversation:
      openConversation,

    sendMessage:
      sendMessage,

    makeRoomId:
      makeRoomId,

    markRead:
      markRoomRead,

    getState:
      () => ({
        ...state
      })

  };


  /* =====================================================
     DOM READY
  ===================================================== */

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      boot,
      {
        once: true
      }
    );

  } else {

    boot();

  }


})();
