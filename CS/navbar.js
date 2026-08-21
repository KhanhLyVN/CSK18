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
    reports:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3v18h18"></path><path d="m7 16 4-5 3 3 5-7"></path></svg>',
    faq: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"></path><path d="M12 17h.01"></path></svg>',
    account: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6h.1A1.65 1.65 0 0 0 10 3.09V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9v.1A1.65 1.65 0 0 0 20.91 10H21a2 2 0 1 1 0 4h-.09A1.65 1.65 0 0 0 19.4 15Z"></path></svg>',
  };

  const links = [
    { page: "home", href: HOME_URL, label: "Trang chủ" },
    { page: "groups", href: "/CS/Groups/group.html", label: "Nhóm của tôi" },
    { page: "tickets", href: "/CS/TicketManagement/cs-ticket.html", label: "Quản lý ticket" },
    { page: "create", href: "/CS/PhieuHoTroCS/phieuhotro-cs.html", label: "Tạo phiếu hỗ trợ" },
    { page: "groups", href: "/CS/Groups/group.html", label: "Nhóm của tôi", leaderOnly: true },
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
    const visibleLinks = links.filter((link) => !link.leaderOnly || profile.isLeader);
    const page = activePage(visibleLinks);
    return visibleLinks.map((link) => {
      const active = link.page === page;
      return `<a data-nav-page="${link.page}" href="${link.href}"${active ? ' class="active" aria-current="page"' : ""}>${icons[link.page]}<span>${link.label}</span></a>`;
    }).join("");
  }

  async function getProfile(user) {
    const base = { uid: user.uid, email: user.email || "", name: user.displayName || user.email || "CS", isLeader: false, raw: {} };
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
    topbar.innerHTML = '<button class="cs-navbar-toggle" type="button" aria-label="Mở điều hướng" aria-expanded="false" aria-controls="csNavbarSidebar">☰</button><a class="cs-navbar-brand" href="/CS/homepageCS/trangchu-cs.html" aria-label="Trang chủ Customer Success"><span class="cs-navbar-mark">CS</span><span class="cs-navbar-brand-copy"><strong>Hệ thống Quản lý Hỗ trợ</strong><small id="csNavbarRoleText">Đang kiểm tra quyền truy cập…</small></span></a>';
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

    const applyProfile = (profile) => {
      if (enforceLeaderPage(profile)) return;
      document.body.dataset.csRole = profile.isLeader ? "leader" : "member";
      document.body.dataset.csRoleReady = "true";
      window.csCurrentProfile = profile;
      sidebar.innerHTML = `<nav class="cs-navbar-menu">${menuMarkup(profile)}</nav><div class="cs-navbar-note"><i></i><span>${profile.isLeader ? "CS Leader · sẵn sàng phân công" : "Customer Success online"}</span></div>`;
      topbar.querySelector("#csNavbarRoleText").textContent = profile.isLeader ? "CS Leader · Điều phối nhóm" : "Trung tâm Customer Success";
      document.dispatchEvent(new CustomEvent("cs:role-ready", { detail: profile }));
    };

    const auth = typeof firebase !== "undefined" && firebase.auth ? firebase.auth() : null;
    if (!auth) {
      applyProfile({ isLeader: false, name: "CS", email: "", uid: "", raw: {} });
      return;
    }
    auth.onAuthStateChanged(async (user) => {
      if (!user) {
        applyProfile({ isLeader: false, name: "CS", email: "", uid: "", raw: {} });
        return;
      }
      applyProfile(await getProfile(user));
    });
  }

  initNavbar();
})();
