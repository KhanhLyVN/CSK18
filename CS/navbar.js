/* Shared Customer Success Navbar — inject một shell, không lặp topbar/sidebar giữa các trang CS. */
(function () {
  "use strict";

  const COLLAPSE_KEY = "cs-navbar-collapsed";
  const MOBILE_BREAKPOINT = 860;
  const icons = {
    home: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><path d="M9 22V12h6v10"></path></svg>',
    groups: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
    tickets:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z"></path></svg>',
    create:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9"></path><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg>',
    reports:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3v18h18"></path><path d="m7 16 4-5 3 3 5-7"></path></svg>',
    faq: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"></path><path d="M12 17h.01"></path></svg>',
    email:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"></rect><path d="m3 7 9 6 9-6"></path></svg>',
    account:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6h.1A1.65 1.65 0 0 0 10 3.09V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9v.1A1.65 1.65 0 0 0 20.91 10H21a2 2 0 1 1 0 4h-.09A1.65 1.65 0 0 0 19.4 15Z"></path></svg>',
  };

  const links = [
    ["home", "/CS/homepageCS/trangchu-cs.html", "Trang chủ"],
    ["groups", "/CS/Groups/group.html", "Groups"],
    ["tickets", "/CS/TicketManagement/cs-ticket.html", "Quản lý ticket"],
    ["create", "/CS/PhieuHoTroCS/phieuhotro-cs.html", "Tạo phiếu hỗ trợ"],
    ["email", "/CS/tao_email_HV.html", "Cấp tài khoản HV"],
    ["reports", "/CS/Dashboard/cs-dashboard.html", "Báo cáo thống kê"],
    ["faq", "/FAQs/CS-FAQ.html", "FAQs"],
    ["account", "/CS/account-CS.html", "Cài đặt hệ thống"],
  ];

  function safeGet(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  function safeSet(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* storage unavailable */
    }
  }
  function isMobile() {
    return window.innerWidth <= MOBILE_BREAKPOINT;
  }
  function resolveContent(app) {
    return (
      app.querySelector(":scope > main") ||
      app.querySelector(":scope > .main") ||
      app.querySelector(":scope > .page") ||
      app.querySelector(":scope > .wrap") ||
      app.querySelector(":scope > [data-page-content]")
    );
  }
  function prepareLegacyShell(app) {
    let content = resolveContent(app);
    if (content) return content;
    const legacyBody = app.querySelector(":scope > .body");
    content = legacyBody?.querySelector(
      ":scope > main, :scope > .main, :scope > .page, :scope > .wrap, :scope > [data-page-content]",
    );
    if (!content) return null;
    app.querySelector(":scope > .topbar")?.remove();
    app.appendChild(content);
    legacyBody.remove();
    return content;
  }
  function menuMarkup() {
    return links
      .map(
        ([page, href, label]) =>
          `<a data-nav-page="${page}" href="${href}">${icons[page]}<span>${label}</span></a>`,
      )
      .join("");
  }
  function setActive(sidebar) {
    const page =
      document.body.dataset.navPage ||
      links.find(([, href]) => window.location.pathname.endsWith(href))?.[0] ||
      "";
    sidebar.querySelectorAll("[data-nav-page]").forEach((link) => {
      const active = link.dataset.navPage === page;
      link.classList.toggle("active", active);
      if (active) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }

  function initNavbar() {
    let app = document.querySelector(".app");
    if (!app) {
      const standalone = document.querySelector(
        "body > .wrap, body > [data-page-content]",
      );
      if (!standalone) return;
      app = document.createElement("div");
      app.className = "app";
      const main = document.createElement("main");
      main.className = "cs-navbar-standalone";
      document.body.insertBefore(app, standalone);
      app.appendChild(main);
      main.appendChild(standalone);
    }
    if (!app || app.dataset.csNavbarReady === "true") return;
    const content = prepareLegacyShell(app);
    if (!content) return;
    app.dataset.csNavbarReady = "true";
    const topbar = document.createElement("header");
    topbar.className = "cs-navbar-topbar";
    topbar.innerHTML =
      '<button class="cs-navbar-toggle" type="button" aria-label="Mở điều hướng" aria-expanded="false" aria-controls="csNavbarSidebar">☰</button><a class="cs-navbar-brand" href="/CS/homepageCS/trangchu-cs.html" aria-label="Trang chủ Customer Success"><span class="cs-navbar-mark">CS</span><span class="cs-navbar-brand-copy"><strong>Hệ thống Quản lý Hỗ trợ</strong><small>Trung tâm Customer Success</small></span></a>';
    const layout = document.createElement("div");
    layout.className = "cs-navbar-layout";
    const sidebar = document.createElement("aside");
    sidebar.className = "cs-navbar-sidebar";
    sidebar.id = "csNavbarSidebar";
    sidebar.setAttribute("aria-label", "Điều hướng Customer Success");
    sidebar.innerHTML = `<nav class="cs-navbar-menu">${menuMarkup()}</nav><div class="cs-navbar-note"><i></i><span>Customer Success online</span></div>`;
    const overlay = document.createElement("button");
    overlay.type = "button";
    overlay.className = "cs-navbar-overlay";
    overlay.setAttribute("aria-label", "Đóng điều hướng");
    content.classList.add("cs-navbar-content");
    app.insertBefore(topbar, content);
    app.insertBefore(layout, content);
    layout.append(sidebar, content);
    document.body.appendChild(overlay);
    setActive(sidebar);

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
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMobile();
    });
    window.addEventListener("resize", syncLayout, { passive: true });
    syncLayout();
  }

  initNavbar();
})();
